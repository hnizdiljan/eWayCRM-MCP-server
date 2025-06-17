import axios, { AxiosInstance } from 'axios';
import configService from '../services/config.service';
import logger from '../services/logger.service';

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
 * HTTP konektor pro eWay-CRM API jako workaround problému s oficiální knihovnou
 * Implementuje přímá HTTP volání na eWay-CRM REST API
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

    logger.info('🌐 HTTP konektor pro eWay-CRM byl inicializován', {
      baseURL: `${config.apiUrl}/API.svc`,
      username: config.username
    });
  }

  public static getInstance(): EwayHttpConnector {
    if (!EwayHttpConnector.instance) {
      EwayHttpConnector.instance = new EwayHttpConnector();
    }
    return EwayHttpConnector.instance;
  }

  /**
   * Přihlášení pomocí přímého HTTP volání
   */
  public async logIn(): Promise<void> {
    if (this.isLoggedIn) {
      logger.debug('Již přihlášen pomocí HTTP konektoru');
      return;
    }

    const config = configService.config.eway;
    const startTime = Date.now();

    try {
      logger.info('🔑 HTTP Login: Pokouším se přihlásit k eWay-CRM API...');

      const loginData = {
        userName: config.username,
        passwordHash: config.passwordHash,
        appVersion: configService.config.app.version,
        clientMachineIdentifier: configService.config.app.clientMachineId,
        clientMachineName: configService.config.app.clientMachineName,
        createSessionCookie: false
      };

      logger.info('📤 Odesílám login data:', {
        userName: loginData.userName,
        passwordHashLength: loginData.passwordHash?.length,
        appVersion: loginData.appVersion,
        clientMachineIdentifier: loginData.clientMachineIdentifier,
        clientMachineName: loginData.clientMachineName
      });

      const response = await this.axiosInstance.post('/LogIn', loginData);
      const duration = Date.now() - startTime;

      if (response.data && response.data.ReturnCode === 'rcSuccess') {
        this.sessionId = response.data.SessionId;
        this.isLoggedIn = true;

        logger.info('✅ HTTP Login: Úspěšné přihlášení k eWay-CRM', {
          sessionId: this.sessionId?.substring(0, 8) + '...',
          sessionIdPresent: !!this.sessionId,
          responseData: JSON.stringify(response.data),
          duration
        });
      } else {
        this.isLoggedIn = false;
        logger.error('❌ HTTP Login: Chyba při přihlašování', {
          returnCode: response.data?.ReturnCode,
          description: response.data?.Description,
          response: response.data,
          duration
        });
        
        throw new Error(`HTTP Login selhalo: ${response.data?.Description || 'Neznámá chyba'}`);
      }
    } catch (error: any) {
      this.isLoggedIn = false;
      const duration = Date.now() - startTime;
      
      if (error.response) {
        logger.error('❌ HTTP Login: Chyba odpovědi serveru', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          duration
        });
        throw new Error(`HTTP Login chyba ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        logger.error('❌ HTTP Login: Síťová chyba', {
          message: error.message,
          code: error.code,
          duration
        });
        throw new Error(`Síťová chyba při přihlašování: ${error.message}`);
      } else {
        logger.error('❌ HTTP Login: Neočekávaná chyba', error);
        throw new Error(`Neočekávaná chyba: ${error.message}`);
      }
    }
  }

  /**
   * Volání eWay-CRM API metody pomocí HTTP
   */
  public async callMethod(methodName: string, parameters: any = {}): Promise<EwayApiResult> {
    // Ověření přihlášení
    if (!this.isLoggedIn) {
      await this.logIn();
    }

    const startTime = Date.now();

    try {
      const requestData = {
        sessionId: this.sessionId,
        ...parameters
      };

      logger.info(`📤 HTTP API: ${methodName}`, {
        sessionId: this.sessionId?.substring(0, 8) + '...',
        parameters
      });

      const response = await this.axiosInstance.post(`/${methodName}`, requestData);
      const duration = Date.now() - startTime;

      logger.info(`📥 HTTP API Response: ${methodName} - ${response.data?.ReturnCode} (${duration}ms)`, {
        returnCode: response.data?.ReturnCode,
        dataCount: response.data?.Data?.length || 0,
        duration
      });

      // Debug: Raw data z eWay-CRM pro debugging
      if (methodName === 'SearchCompanies' && response.data?.Data?.length > 0) {
        logger.debug('🔍 DEBUG Raw eWay-CRM data (první položka):', {
          rawData: JSON.stringify(response.data.Data[0], null, 2)
        });
      }

      // Zkontroluj, zda nemusíme obnovit session
      if (response.data?.ReturnCode === 'rcBadSession') {
        logger.warn('🔄 HTTP: Neplatná session, obnovuji přihlášení');
        
        this.isLoggedIn = false;
        this.sessionId = null;
        await this.logIn();
        
        // Zkus znovu
        return this.callMethod(methodName, parameters);
      }

      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error.response) {
        logger.error(`❌ HTTP API Error: ${methodName}`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          duration
        });
      } else {
        logger.error(`❌ HTTP API Error: ${methodName}`, {
          message: error.message,
          duration
        });
      }
      
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
      await this.callMethod('LogOut', {});
      
      this.isLoggedIn = false;
      this.sessionId = null;
      
      logger.info('👋 HTTP: Odhlášení z eWay-CRM úspěšné');
    } catch (error) {
      logger.error('❌ HTTP: Chyba při odhlašování', error);
      // Reset stavu i při chybě
      this.isLoggedIn = false;
      this.sessionId = null;
    }
  }

  /**
   * Kontrola stavu připojení
   */
  public isConnected(): boolean {
    return this.isLoggedIn && this.sessionId !== null;
  }

  /**
   * Získání session ID
   */
  public getSessionId(): string | null {
    return this.sessionId;
  }
}

export default EwayHttpConnector.getInstance(); 