import axios from 'axios';
import configService from './config.service';
import logger from './logger.service';

export interface OAuth2Token {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
  scope?: string;
}

class OAuth2Service {
  private static instance: OAuth2Service;
  private storedToken: StoredToken | null = null;

  private constructor() {}

  public static getInstance(): OAuth2Service {
    if (!OAuth2Service.instance) {
      OAuth2Service.instance = new OAuth2Service();
    }
    return OAuth2Service.instance;
  }

  /**
   * Získá authorization URL pro OAuth2 Authorization Code flow
   */
  public getAuthorizationUrl(state?: string): string {
    const config = configService.config.eway;
    
    if (!config.oauth) {
      throw new Error('OAuth2 konfigurace není k dispozici');
    }

    // Azure AD OAuth2 endpoint
    const baseUrl = config.apiUrl.replace('/API.svc', '').replace('/api.svc', '');
    const authUrl = new URL(`${baseUrl}/auth/connect/authorize`);
    
    // Parametry pro Authorization Code flow
    authUrl.searchParams.append('client_id', config.oauth.clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', config.oauth.redirectUri);
    authUrl.searchParams.append('scope', 'api offline_access');
    authUrl.searchParams.append('response_mode', 'query');
    
    if (state) {
      authUrl.searchParams.append('state', state);
    }

    logger.info('📝 OAuth2: Vytvořena authorization URL', {
      authUrl: authUrl.toString(),
      clientId: config.oauth.clientId,
      redirectUri: config.oauth.redirectUri
    });

    return authUrl.toString();
  }

  /**
   * Vymění authorization code za access token
   */
  public async exchangeCodeForToken(code: string): Promise<StoredToken> {
    const config = configService.config.eway;
    
    if (!config.oauth) {
      throw new Error('OAuth2 konfigurace není k dispozici');
    }

    const baseUrl = config.apiUrl.replace('/API.svc', '').replace('/api.svc', '');
    const tokenUrl = `${baseUrl}/auth/connect/token`;

    try {
      logger.info('🔄 OAuth2: Výměna authorization code za access token', {
        tokenUrl,
        clientId: config.oauth.clientId,
        code: code.substring(0, 10) + '...'
      });

      // Připravíme data pro token endpoint
      const tokenData = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.oauth.redirectUri,
        client_id: config.oauth.clientId,
        client_secret: config.oauth.clientSecret
      });

      // Zavoláme token endpoint
      const response = await axios.post<OAuth2Token>(tokenUrl, tokenData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      logger.info('✅ OAuth2: Access token úspěšně získán', {
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        hasRefreshToken: !!response.data.refresh_token,
        scope: response.data.scope
      });

      // Uložíme token
      this.storedToken = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000),
        tokenType: response.data.token_type,
        scope: response.data.scope
      };

      return this.storedToken;
    } catch (error: any) {
      logger.error('❌ OAuth2: Chyba při výměně code za token', {
        error: error.message,
        response: error.response?.data
      });
      
      if (error.response?.data) {
        throw new Error(`OAuth2 token exchange failed: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Obnoví access token pomocí refresh tokenu
   */
  public async refreshAccessToken(): Promise<StoredToken> {
    if (!this.storedToken?.refreshToken) {
      throw new Error('Není dostupný refresh token');
    }

    const config = configService.config.eway;
    
    if (!config.oauth) {
      throw new Error('OAuth2 konfigurace není k dispozici');
    }

    const baseUrl = config.apiUrl.replace('/API.svc', '').replace('/api.svc', '');
    const tokenUrl = `${baseUrl}/auth/connect/token`;

    try {
      logger.info('🔄 OAuth2: Obnovuji access token pomocí refresh tokenu');

      const tokenData = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.storedToken.refreshToken,
        client_id: config.oauth.clientId,
        client_secret: config.oauth.clientSecret
      });

      const response = await axios.post<OAuth2Token>(tokenUrl, tokenData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      logger.info('✅ OAuth2: Access token úspěšně obnoven', {
        expiresIn: response.data.expires_in
      });

      // Aktualizujeme uložený token
      this.storedToken = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || this.storedToken.refreshToken,
        expiresAt: Date.now() + (response.data.expires_in * 1000),
        tokenType: response.data.token_type,
        scope: response.data.scope
      };

      return this.storedToken;
    } catch (error: any) {
      logger.error('❌ OAuth2: Chyba při obnově tokenu', {
        error: error.message,
        response: error.response?.data
      });
      
      // Pokud refresh selhal, vymažeme uložený token
      this.storedToken = null;
      
      throw error;
    }
  }

  /**
   * Získá aktuální platný access token
   */
  public async getValidAccessToken(): Promise<string> {
    // Pokud nemáme token, musíme projít authorization flow
    if (!this.storedToken) {
      throw new Error('Není dostupný OAuth2 token. Nejdříve proveďte autorizaci.');
    }

    // Zkontrolujeme, zda token není expirovaný
    const now = Date.now();
    const bufferTime = 60 * 1000; // 1 minuta buffer před expirací
    
    if (this.storedToken.expiresAt <= now + bufferTime) {
      logger.info('🔄 OAuth2: Token brzy expiruje, obnovuji...');
      await this.refreshAccessToken();
    }

    return this.storedToken.accessToken;
  }

  /**
   * Vrátí aktuální uložený token
   */
  public getStoredToken(): StoredToken | null {
    return this.storedToken;
  }

  /**
   * Nastaví token (např. z externího zdroje)
   */
  public setStoredToken(token: StoredToken): void {
    this.storedToken = token;
    logger.info('✅ OAuth2: Token byl nastaven', {
      hasRefreshToken: !!token.refreshToken,
      expiresAt: new Date(token.expiresAt).toISOString()
    });
  }

  /**
   * Vymaže uložený token
   */
  public clearToken(): void {
    this.storedToken = null;
    logger.info('🗑️ OAuth2: Token byl vymazán');
  }

  /**
   * Zkontroluje, zda máme platný token
   */
  public hasValidToken(): boolean {
    if (!this.storedToken) {
      return false;
    }
    
    const now = Date.now();
    return this.storedToken.expiresAt > now;
  }
}

export const oauth2Service = OAuth2Service.getInstance();
export default oauth2Service;