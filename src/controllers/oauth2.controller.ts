import { Request, Response } from 'express';
import oauth2Service from '../services/oauth2.service';
import ewayConnector from '../connectors/eway-http.connector';
import logger from '../services/logger.service';
import { v4 as uuidv4 } from 'uuid';

// Uložení stavů pro CSRF ochranu
const stateStore = new Map<string, { timestamp: number }>();

// Vyčištění starých stavů každých 10 minut
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minut
  
  for (const [state, data] of stateStore.entries()) {
    if (now - data.timestamp > maxAge) {
      stateStore.delete(state);
    }
  }
}, 10 * 60 * 1000);

export class OAuth2Controller {
  /**
   * Inicializace OAuth2 autorizace
   * GET /api/v1/oauth2/authorize
   */
  public async initializeAuthorization(req: Request, res: Response): Promise<void> {
    try {
      // Zkontrolujeme, zda chce uživatel JSON odpověď (např. pro API klienty)
      const returnJson = req.query.json === 'true' || req.headers.accept === 'application/json';
      
      // Generujeme state pro CSRF ochranu
      const state = uuidv4();
      stateStore.set(state, { timestamp: Date.now() });

      // Získáme authorization URL
      const authUrl = oauth2Service.getAuthorizationUrl(state);

      logger.info('🔐 OAuth2: Inicializace autorizace', {
        state,
        authUrl,
        returnJson
      });

      // Pokud klient chce JSON odpověď (např. Postman, API klienty)
      if (returnJson) {
        res.json({
          status: 'success',
          message: 'Navštivte authorization URL pro získání authorization code',
          authorizationUrl: authUrl,
          state,
          instructions: [
            '1. Otevřete authorization URL v prohlížeči',
            '2. Přihlaste se pomocí Azure AD',
            '3. Udělte aplikaci požadovaná oprávnění',
            '4. Budete přesměrováni na redirect URI s authorization code',
            '5. Použijte code pro výměnu za access token'
          ]
        });
      } else {
        // Přímé přesměrování na authorization URL (výchozí chování)
        logger.info('🔄 OAuth2: Přesměrování na authorization URL');
        res.redirect(authUrl);
      }
    } catch (error: any) {
      logger.error('❌ OAuth2: Chyba při inicializaci autorizace', error);
      res.status(500).json({
        status: 'error',
        message: 'Chyba při inicializaci OAuth2 autorizace',
        error: error.message
      });
    }
  }

  /**
   * OAuth2 callback endpoint
   * GET /api/v1/oauth2/callback
   */
  public async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state, error, error_description } = req.query;

      // Zkontrolujeme chyby z authorization serveru
      if (error) {
        logger.error('❌ OAuth2: Authorization server vrátil chybu', {
          error,
          error_description
        });
        
        // HTML stránka pro chybu
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Chyba autorizace</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 50px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #d32f2f; }
              .error { background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .error-code { font-family: monospace; color: #c62828; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ Chyba autorizace</h1>
              <div class="error">
                <p><strong>Chyba:</strong> <span class="error-code">${error}</span></p>
                ${error_description ? `<p><strong>Popis:</strong> ${error_description}</p>` : ''}
              </div>
              <p>Autorizace se nezdařila. Zkuste to prosím znovu.</p>
              <a href="/api/v1/oauth2/authorize">🔄 Zkusit znovu</a>
            </div>
          </body>
          </html>
        `;
        res.status(400).send(errorHtml);
        return;
      }

      // Ověříme, že máme code
      if (!code || typeof code !== 'string') {
        res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Chyba</title></head>
          <body>
            <h1>Chybí authorization code</h1>
            <p>Neplatný callback požadavek.</p>
          </body>
          </html>
        `);
        return;
      }

      // Ověříme state pro CSRF ochranu
      if (state && typeof state === 'string') {
        if (!stateStore.has(state)) {
          logger.warn('⚠️ OAuth2: Neplatný state parameter', { state });
          res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Bezpečnostní chyba</title></head>
            <body>
              <h1>Neplatný state parameter</h1>
              <p>Možný CSRF útok detekován. Začněte znovu.</p>
              <a href="/api/v1/oauth2/authorize">Začít znovu</a>
            </body>
            </html>
          `);
          return;
        }
        
        // Odstraníme použitý state
        stateStore.delete(state);
      }

      logger.info('📥 OAuth2: Přijat authorization code', {
        code: code.substring(0, 10) + '...',
        state
      });

      // Vyměníme code za access token
      const token = await oauth2Service.exchangeCodeForToken(code);

      // Přihlásíme se k eWay API s access tokenem
      const loginResult = await oauth2Controller.loginToEwayWithToken(token.accessToken);

      // Úspěšná HTML stránka
      const successHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Autorizace úspěšná</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #4caf50; }
            .success { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .token-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; font-size: 14px; }
            .api-links { margin-top: 30px; }
            .api-links a { display: inline-block; margin: 10px 10px 10px 0; padding: 10px 20px; background: #2196f3; color: white; text-decoration: none; border-radius: 5px; }
            .api-links a:hover { background: #1976d2; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Autorizace úspěšná!</h1>
            <div class="success">
              <p><strong>OAuth2 autorizace byla úspěšně dokončena.</strong></p>
              <p>Aplikace je nyní připravena používat eWay-CRM API.</p>
            </div>
            
            <h2>Informace o tokenu</h2>
            <div class="token-info">
              <p><strong>Typ:</strong> ${token.tokenType}</p>
              <p><strong>Platnost do:</strong> ${new Date(token.expiresAt).toLocaleString('cs-CZ')}</p>
              <p><strong>Refresh token:</strong> ${token.refreshToken ? '✅ Ano' : '❌ Ne'}</p>
              <p><strong>Scope:</strong> ${token.scope || 'N/A'}</p>
              <p><strong>eWay Session ID:</strong> ${loginResult.sessionId ? loginResult.sessionId.substring(0, 12) + '...' : 'N/A'}</p>
            </div>
            
            <div class="api-links">
              <h2>Nyní můžete používat API:</h2>
              <a href="/api/v1/companies">📊 Společnosti</a>
              <a href="/api/v1/contacts">👥 Kontakty</a>
              <a href="/api/v1/deals">💼 Obchody</a>
              <a href="/api/v1/oauth2/status">🔍 Status</a>
              <a href="/api-docs" target="_blank">📚 API Dokumentace</a>
            </div>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Token se automaticky obnoví před vypršením. Pro manuální obnovení použijte endpoint <code>/api/v1/oauth2/refresh</code>
            </p>
          </div>
        </body>
        </html>
      `;
      
      res.send(successHtml);
    } catch (error: any) {
      logger.error('❌ OAuth2: Chyba při zpracování callback', error);
      
      // HTML stránka pro chybu
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Chyba při zpracování</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 50px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #d32f2f; }
            .error { background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Chyba při zpracování callback</h1>
            <div class="error">
              <p>${error.message}</p>
            </div>
            <details>
              <summary>Technické detaily</summary>
              <pre>${JSON.stringify(error, null, 2)}</pre>
            </details>
            <p style="margin-top: 20px;">
              <a href="/api/v1/oauth2/authorize">🔄 Zkusit znovu</a>
            </p>
          </div>
        </body>
        </html>
      `;
      res.status(500).send(errorHtml);
    }
  }

  /**
   * Výměna authorization code za token (manuální)
   * POST /api/v1/oauth2/exchange-code
   */
  public async exchangeCode(req: Request, res: Response): Promise<void> {
    try {
      const { code, state } = req.body;

      if (!code) {
        res.status(400).json({
          status: 'error',
          message: 'Chybí authorization code v těle požadavku'
        });
        return;
      }

      // Ověříme state pokud byl poskytnut
      if (state) {
        if (!stateStore.has(state)) {
          logger.warn('⚠️ OAuth2: Neplatný state parameter', { state });
          res.status(400).json({
            status: 'error',
            message: 'Neplatný state parameter'
          });
          return;
        }
        stateStore.delete(state);
      }

      logger.info('📤 OAuth2: Výměna authorization code', {
        code: code.substring(0, 10) + '...'
      });

      // Vyměníme code za access token
      const token = await oauth2Service.exchangeCodeForToken(code);

      // Přihlásíme se k eWay API s access tokenem
      const loginResult = await oauth2Controller.loginToEwayWithToken(token.accessToken);

      res.json({
        status: 'success',
        message: 'Authorization code úspěšně vyměněn za access token',
        token: {
          type: token.tokenType,
          expiresAt: new Date(token.expiresAt).toISOString(),
          hasRefreshToken: !!token.refreshToken,
          scope: token.scope
        },
        ewaySession: loginResult
      });
    } catch (error: any) {
      logger.error('❌ OAuth2: Chyba při výměně code', error);
      res.status(500).json({
        status: 'error',
        message: 'Chyba při výměně authorization code',
        error: error.message
      });
    }
  }

  /**
   * Obnovení access tokenu
   * POST /api/v1/oauth2/refresh
   */
  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      logger.info('🔄 OAuth2: Obnovuji access token');

      const token = await oauth2Service.refreshAccessToken();

      // Přihlásíme se znovu k eWay API s novým tokenem
      const loginResult = await oauth2Controller.loginToEwayWithToken(token.accessToken);

      res.json({
        status: 'success',
        message: 'Access token úspěšně obnoven',
        token: {
          type: token.tokenType,
          expiresAt: new Date(token.expiresAt).toISOString(),
          hasRefreshToken: !!token.refreshToken,
          scope: token.scope
        },
        ewaySession: loginResult
      });
    } catch (error: any) {
      logger.error('❌ OAuth2: Chyba při obnově tokenu', error);
      res.status(500).json({
        status: 'error',
        message: 'Chyba při obnově access tokenu',
        error: error.message
      });
    }
  }

  /**
   * Získání aktuálního stavu OAuth2 autentizace
   * GET /api/v1/oauth2/status
   */
  public async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const hasToken = oauth2Service.hasValidToken();
      const token = oauth2Service.getStoredToken();
      const authStatus = ewayConnector.getAuthStatus();

      res.json({
        status: 'success',
        oauth2: {
          hasValidToken: hasToken,
          tokenDetails: token ? {
            expiresAt: new Date(token.expiresAt).toISOString(),
            hasRefreshToken: !!token.refreshToken,
            scope: token.scope,
            isExpired: token.expiresAt <= Date.now()
          } : null
        },
        eway: authStatus
      });
    } catch (error: any) {
      logger.error('❌ OAuth2: Chyba při získávání statusu', error);
      res.status(500).json({
        status: 'error',
        message: 'Chyba při získávání OAuth2 statusu',
        error: error.message
      });
    }
  }

  /**
   * Přihlášení k eWay API pomocí access tokenu
   */
  private async loginToEwayWithToken(accessToken: string): Promise<any> {
    try {
      logger.info('🔐 Přihlašuji se k eWay API s OAuth2 access tokenem');

      // Použijeme logInWithAccessToken metodu z konektoru
      await ewayConnector.logInWithAccessToken(accessToken);

      // Získáme session info
      const authStatus = ewayConnector.getAuthStatus();

      logger.info('✅ Úspěšné přihlášení k eWay API pomocí OAuth2', {
        sessionId: authStatus.sessionId ? authStatus.sessionId.substring(0, 8) + '...' : null
      });

      return {
        sessionId: authStatus.sessionId,
        description: 'OAuth2 login successful'
      };
    } catch (error: any) {
      logger.error('❌ Chyba při přihlašování k eWay API', error);
      throw error;
    }
  }

  /**
   * Odhlášení
   * POST /api/v1/oauth2/logout
   */
  public async logout(req: Request, res: Response): Promise<void> {
    try {
      logger.info('👋 OAuth2: Odhlašuji uživatele');

      // Vymažeme uložený token
      oauth2Service.clearToken();

      // Odhlásíme se z eWay API
      await ewayConnector.logOut();

      res.json({
        status: 'success',
        message: 'Úspěšně odhlášeno'
      });
    } catch (error: any) {
      logger.error('❌ OAuth2: Chyba při odhlašování', error);
      res.status(500).json({
        status: 'error',
        message: 'Chyba při odhlašování',
        error: error.message
      });
    }
  }
}

export const oauth2Controller = new OAuth2Controller();
export default oauth2Controller;