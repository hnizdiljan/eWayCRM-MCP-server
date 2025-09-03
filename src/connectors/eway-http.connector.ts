import axios, { AxiosInstance } from 'axios';
import configService from '../services/config.service';
import logger from '../services/logger.service';
import oauth2Service from '../services/oauth2.service';

export interface EwayApiResult {
  ReturnCode: string;
  Description: string;
  Data?: any[];
  TotalCount?: number;
  ErrorMessage?: string;
  
  // Pro SaveResponse formát
  Guid?: string;
  IsUserMessageOptionalError?: boolean;
  UserMessage?: string;
}


/**
 * HTTP konektor pro eWay-CRM API
 * Podporuje OAuth2 a legacy (username/password) autentizaci
 */
export class EwayHttpConnector {
  private static instance: EwayHttpConnector;
  private axiosInstance: AxiosInstance;
  private sessionId: string | null = null;
  private isLoggedIn: boolean = false;

  private constructor() {
    const config = configService.config.eway;
    
    // Vytvoření axios instance pro HTTP volání
    this.axiosInstance = axios.create({
      baseURL: `${config.apiUrl}/API.svc`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Přidáme request interceptor pro detailní logování
    this.axiosInstance.interceptors.request.use(
      (config) => {
        logger.info('🔷 HTTP REQUEST:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          fullURL: `${config.baseURL}${config.url}`,
          headers: config.headers,
          params: config.params,
          data: config.data ? JSON.stringify(config.data, null, 2) : undefined
        });
        return config;
      },
      (error) => {
        logger.error('🔴 HTTP REQUEST ERROR:', error);
        return Promise.reject(error);
      }
    );

    // Přidáme response interceptor pro detailní logování
    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.info('🔶 HTTP RESPONSE:', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: JSON.stringify(response.data, null, 2),
          request: {
            method: response.config.method?.toUpperCase(),
            url: response.config.url
          }
        });
        return response;
      },
      (error) => {
        if (error.response) {
          logger.error('🔴 HTTP RESPONSE ERROR:', {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data ? JSON.stringify(error.response.data, null, 2) : undefined,
            request: {
              method: error.config?.method?.toUpperCase(),
              url: error.config?.url,
              data: error.config?.data ? JSON.stringify(error.config.data, null, 2) : undefined
            }
          });
        } else {
          logger.error('🔴 HTTP ERROR:', {
            message: error.message,
            code: error.code
          });
        }
        return Promise.reject(error);
      }
    );

    logger.info('🌐 HTTP konektor pro eWay-CRM byl inicializován', {
      baseURL: `${config.apiUrl}/API.svc`,
      authMethod: config.authMethod
    });
  }

  public static getInstance(): EwayHttpConnector {
    if (!EwayHttpConnector.instance) {
      EwayHttpConnector.instance = new EwayHttpConnector();
    }
    return EwayHttpConnector.instance;
  }

  /**
   * Získání OAuth2 access tokenu z OAuth2 service
   */
  private async getOAuth2Token(): Promise<string> {
    try {
      // Získáme platný access token z OAuth2 service
      const accessToken = await oauth2Service.getValidAccessToken();
      return accessToken;
    } catch (error: any) {
      // Pokud OAuth2 service nemá token, zkusíme fallback na starý způsob
      logger.warn('⚠️ OAuth2 Service nemá platný token, používám fallback', {
        error: error.message
      });
      
      const config = configService.config.eway;
      if (!config.oauth) {
        throw new Error('OAuth2 konfigurace není k dispozici');
      }

      // Fallback na Client Secret jako Bearer token
      logger.info('💡 Používám fallback: Client Secret jako Bearer token');
      throw new Error('OAuth2 Authorization Code flow není inicializován. Použijte /api/v1/oauth2/authorize endpoint.');
    }
  }

  /**
   * Přihlášení - rozhodne mezi OAuth2 a legacy metodou
   */
  public async logIn(): Promise<void> {
    if (this.isLoggedIn) {
      logger.debug('Již přihlášen');
      return;
    }

    const config = configService.config.eway;

    if (config.authMethod === 'oauth2') {
      await this.logInOAuth2();
    } else {
      await this.logInLegacy();
    }
  }

  /**
   * Přihlášení pomocí OAuth2
   */
  private async logInOAuth2(): Promise<void> {
    const startTime = Date.now();
    const config = configService.config.eway;

    try {
      logger.info('🔑 OAuth2 Login: Přihlašuji se k eWay-CRM API...');

      // Zkusíme získat access token z OAuth2 service
      let accessToken: string | null = null;
      
      try {
        // Pokusíme se získat platný OAuth2 token
        accessToken = await oauth2Service.getValidAccessToken();
        logger.info('✅ OAuth2: Používám access token z OAuth2 service');
      } catch (tokenError: any) {
        logger.warn('⚠️ OAuth2 Service nemá platný token, používám Client Secret fallback', {
          error: tokenError.message
        });
        
        // Fallback na Client Secret jako Bearer token
        if (config.oauth?.clientSecret) {
          logger.info('🔄 Fallback: Používám Client Secret jako Bearer token');
          await this.logInWithBearerToken(config.oauth.clientSecret);
          return;
        } else {
          throw new Error('OAuth2 autorizace není inicializována. Použijte /api/v1/oauth2/authorize endpoint.');
        }
      }

      // Máme platný OAuth2 access token
      logger.info('📤 OAuth2: Přihlašuji se s OAuth2 access tokenem');
      
      // Nastavíme Bearer token do hlavičky
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Připravíme login data s userName a appVersion
      const loginData = {
        userName: configService.config.eway.username,
        appVersion: configService.config.app.version || 'MCP-Server-1.0'
      };
      
      const response = await this.axiosInstance.post('/LogIn', loginData);
      const duration = Date.now() - startTime;

      if (response.data && response.data.ReturnCode === 'rcSuccess') {
        this.sessionId = response.data.SessionId;
        this.isLoggedIn = true;

        logger.info('✅ OAuth2 Login: Úspěšné přihlášení s OAuth2 access tokenem', {
          sessionId: this.sessionId?.substring(0, 8) + '...',
          duration
        });
      } else {
        throw new Error(`OAuth2 login selhalo: ${response.data?.Description || response.data?.ReturnCode}`);
      }
    } catch (error: any) {
      this.isLoggedIn = false;
      const duration = Date.now() - startTime;
      
      logger.error('❌ OAuth2 Login: Chyba při přihlašování', {
        error: error.message,
        duration
      });
      throw error;
    }
  }

  /**
   * Alternativní přihlášení s Client Secret jako Bearer token
   * (Fallback řešení pro server-to-server komunikaci)
   */
  private async logInWithBearerToken(clientSecret: string): Promise<void> {
    try {
      logger.info('🔑 Fallback: Zkouším přihlášení s Client Secret jako Bearer token...');

      // Nastavíme Client Secret jako Bearer token do hlavičky
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${clientSecret}`;
      
      // Zkusíme se přihlásit přes /LogIn endpoint s Bearer tokenem
      const loginData = {
        appVersion: configService.config.app.version,
        clientMachineIdentifier: configService.config.app.clientMachineId,
        clientMachineName: configService.config.app.clientMachineName
      };

      const response = await this.axiosInstance.post('/LogIn', loginData);

      if (response.data && response.data.ReturnCode === 'rcSuccess') {
        this.sessionId = response.data.SessionId;
        this.isLoggedIn = true;

        logger.info('✅ Fallback: Úspěšné přihlášení s Client Secret Bearer token', {
          sessionId: this.sessionId?.substring(0, 8) + '...'
        });
      } else {
        // Pokud /LogIn selhal, zkusíme prázdný session ID - Bearer token v hlavičce by měl stačit
        logger.warn('⚠️ Fallback LogIn selhal, zkouším pouze Bearer token bez session ID');
        this.sessionId = null;
        this.isLoggedIn = true;
        
        logger.info('✅ Fallback: Pouze Bearer token, žádný session ID');
      }

      logger.info('📝 Poznámka: Toto je fallback řešení. Pro plnou OAuth2 podporu použijte Authorization Code flow');
    } catch (error: any) {
      logger.warn('⚠️ Fallback LogIn endpoint selhal, zkouším pouze Bearer token', {
        error: error.message
      });
      
      // Fallback fallback - použij pouze Bearer token v hlavičce
      this.sessionId = null;
      this.isLoggedIn = true;
      
      logger.info('✅ Fallback: Pouze Bearer token bez session ID (poslední možnost)');
    }
  }

  /**
   * Legacy přihlášení pomocí username/password
   */
  private async logInLegacy(): Promise<void> {
    const config = configService.config.eway;
    
    if (!config.legacy) {
      throw new Error('Legacy konfigurace není k dispozici');
    }

    const startTime = Date.now();

    try {
      logger.info('🔑 Legacy Login: Pokouším se přihlásit k eWay-CRM API...');

      const loginData = {
        userName: config.legacy.username,
        passwordHash: config.legacy.passwordHash,
        appVersion: configService.config.app.version,
        clientMachineIdentifier: configService.config.app.clientMachineId,
        clientMachineName: configService.config.app.clientMachineName,
        createSessionCookie: false
      };

      const response = await this.axiosInstance.post('/LogIn', loginData);
      const duration = Date.now() - startTime;

      if (response.data && response.data.ReturnCode === 'rcSuccess') {
        this.sessionId = response.data.SessionId;
        this.isLoggedIn = true;

        logger.info('✅ Legacy Login: Úspěšné přihlášení k eWay-CRM', {
          sessionId: this.sessionId?.substring(0, 8) + '...',
          duration
        });
      } else {
        this.isLoggedIn = false;
        logger.error('❌ Legacy Login: Chyba při přihlašování', {
          returnCode: response.data?.ReturnCode,
          description: response.data?.Description,
          duration
        });
        
        throw new Error(`Legacy Login selhalo: ${response.data?.Description || 'Neznámá chyba'}`);
      }
    } catch (error: any) {
      this.isLoggedIn = false;
      const duration = Date.now() - startTime;
      
      if (error.response) {
        logger.error('❌ Legacy Login: Chyba odpovědi serveru', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          duration
        });
        throw new Error(`Legacy Login chyba ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        logger.error('❌ Legacy Login: Síťová chyba', {
          message: error.message,
          code: error.code,
          duration
        });
        throw new Error(`Síťová chyba při přihlašování: ${error.message}`);
      } else {
        logger.error('❌ Legacy Login: Neočekávaná chyba', error);
        throw new Error(`Neočekávaná chyba: ${error.message}`);
      }
    }
  }

  /**
   * Volání eWay-CRM API metody
   */
  public async callMethod(methodName: string, parameters: any = {}): Promise<EwayApiResult> {
    // Ověření přihlášení
    if (!this.isLoggedIn) {
      await this.logIn();
    }

    const startTime = Date.now();

    try {
      // Rozhodnutí o použití session ID podle dostupnosti
      const isUsingBearer = configService.config.eway.authMethod === 'oauth2' && 
                           this.axiosInstance.defaults.headers.common['Authorization'];
      
      const requestData = this.sessionId ? {
        sessionId: this.sessionId,
        ...parameters
      } : parameters;

      logger.debug(`📊 API Request Data for ${methodName}:`, {
        isUsingBearer,
        sessionIdInData: requestData.sessionId ? requestData.sessionId.substring(0, 8) + '...' : 'none',
        fullRequestData: {
          ...requestData,
          sessionId: requestData.sessionId ? requestData.sessionId.substring(0, 8) + '...' : requestData.sessionId
        }
      });

      logger.info(`📤 API: ${methodName}`, {
        authMethod: configService.config.eway.authMethod,
        usingBearer: isUsingBearer,
        sessionId: this.sessionId ? this.sessionId.substring(0, 8) + '...' : 'null',
        hasAuthHeader: !!this.axiosInstance.defaults.headers.common['Authorization'],
        parameters
      });

      const response = await this.axiosInstance.post(`/${methodName}`, requestData);
      const duration = Date.now() - startTime;

      logger.info(`📥 API Response: ${methodName} - ${response.data?.ReturnCode} (${duration}ms)`, {
        returnCode: response.data?.ReturnCode,
        dataCount: response.data?.Data?.length || 0,
        duration
      });

      // Zkontroluj, zda nemusíme obnovit session nebo token
      if (response.data?.ReturnCode === 'rcBadSession' || response.data?.ReturnCode === 'rcBadAccessToken') {
        logger.warn('🔄 Neplatná session/token, obnovuji přihlášení');
        
        this.isLoggedIn = false;
        this.sessionId = null;
        oauth2Service.clearToken();
        delete this.axiosInstance.defaults.headers.common['Authorization'];
        
        await this.logIn();
        
        // Zkus znovu
        return this.callMethod(methodName, parameters);
      }

      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error.response) {
        logger.error(`❌ API Error: ${methodName}`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          duration
        });
      } else {
        logger.error(`❌ API Error: ${methodName}`, {
          message: error.message,
          duration
        });
      }
      
      throw error;
    }
  }

  /**
   * Přihlášení s OAuth2 access tokenem
   */
  public async logInWithAccessToken(accessToken: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('🔑 OAuth2 Login: Přihlašuji se k eWay-CRM API s poskytnutým access tokenem...');

      // Nastavíme Bearer token do hlavičky
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Připravíme login data s userName a appVersion
      const loginData = {
        userName: configService.config.eway.username,
        appVersion: configService.config.app.version || 'MCP-Server-1.0'
      };
      
      const response = await this.axiosInstance.post('/LogIn', loginData);
      const duration = Date.now() - startTime;

      if (response.data && response.data.ReturnCode === 'rcSuccess') {
        this.sessionId = response.data.SessionId;
        this.isLoggedIn = true;

        logger.info('✅ OAuth2 Login: Úspěšné přihlášení s OAuth2 access tokenem', {
          sessionId: this.sessionId?.substring(0, 8) + '...',
          duration
        });
      } else {
        throw new Error(`OAuth2 login selhalo: ${response.data?.Description || response.data?.ReturnCode}`);
      }
    } catch (error: any) {
      this.isLoggedIn = false;
      const duration = Date.now() - startTime;
      
      logger.error('❌ OAuth2 Login: Chyba při přihlašování', {
        error: error.message,
        duration
      });
      
      // Odstraníme Authorization header při chybě
      delete this.axiosInstance.defaults.headers.common['Authorization'];
      
      throw error;
    }
  }

  /**
   * Odhlášení
   */
  public async logOut(): Promise<void> {
    if (!this.isLoggedIn) {
      return;
    }

    try {
      // Pro OAuth2 s Bearer tokenem není potřeba volat LogOut
      const isUsingBearer = configService.config.eway.authMethod === 'oauth2' && 
                           this.axiosInstance.defaults.headers.common['Authorization'];
      
      if (!isUsingBearer) {
        await this.callMethod('LogOut', {});
      }
      
      this.isLoggedIn = false;
      this.sessionId = null;
      oauth2Service.clearToken();
      delete this.axiosInstance.defaults.headers.common['Authorization'];
      
      logger.info('👋 Odhlášení z eWay-CRM úspěšné');
    } catch (error) {
      logger.error('❌ Chyba při odhlašování', error);
      // Reset stavu i při chybě
      this.isLoggedIn = false;
      this.sessionId = null;
      oauth2Service.clearToken();
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  /**
   * Kontrola stavu připojení
   */
  public isConnected(): boolean {
    return this.isLoggedIn && (this.sessionId !== null || oauth2Service.hasValidToken());
  }

  /**
   * Debug metoda pro kontrolu stavu autentizace
   */
  public getAuthStatus(): any {
    return {
      isLoggedIn: this.isLoggedIn,
      sessionId: this.sessionId ? this.sessionId.substring(0, 8) + '...' : null,
      hasOAuth2Token: oauth2Service.hasValidToken(),
      hasAuthHeader: !!this.axiosInstance.defaults.headers.common['Authorization'],
      authMethod: configService.config.eway.authMethod
    };
  }

  /**
   * Získání session ID
   */
  public getSessionId(): string | null {
    return this.sessionId;
  }
}

export default EwayHttpConnector.getInstance();