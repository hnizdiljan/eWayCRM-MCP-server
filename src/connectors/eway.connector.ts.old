import ApiConnection from '@eway-crm/connector';
import configService from '../services/config.service';
import logger from '../services/logger.service';

export interface ApiResult {
  ReturnCode: string;
  Description: string;
  Data: any[];
  TotalCount?: number;
  ErrorMessage?: string;
}

/**
 * Singleton služba pro správu připojení k eWay-CRM API
 * Spravuje autentizaci, session management a automatické obnovení sessions
 */
export class EwayConnector {
  private static instance: EwayConnector;
  private connection: any;
  private sessionId: string | null = null;
  private isLoggedIn: boolean = false;

  private constructor() {
    const config = configService.config.eway;
    
    // Podrobné debugování konfigurace
    logger.info('🔍 Debug konfigurace před vytvořením ApiConnection', {
      apiUrl: config.apiUrl,
      apiUrlType: typeof config.apiUrl,
      apiUrlLength: config.apiUrl?.length,
      username: config.username,
      usernameType: typeof config.username,
      usernameLength: config.username?.length,
      passwordHash: config.passwordHash ? '[HASH_PRESENT]' : '[HASH_MISSING]',
      passwordHashType: typeof config.passwordHash,
      passwordHashLength: config.passwordHash?.length,
      appVersion: configService.config.app.version,
      clientMachineId: configService.config.app.clientMachineId,
      clientMachineName: configService.config.app.clientMachineName
    });

    // Ověření, že všechny požadované parametry jsou přítomny
    if (!config.apiUrl || config.apiUrl.trim() === '') {
      throw new Error('EWAY_API_URL je prázdná nebo neexistuje');
    }
    if (!config.username || config.username.trim() === '') {
      throw new Error('EWAY_USERNAME je prázdná nebo neexistuje');
    }
    if (!config.passwordHash || config.passwordHash.trim() === '') {
      throw new Error('EWAY_PASSWORD_HASH je prázdná nebo neexistuje');
    }
    
    try {
      this.connection = ApiConnection.create(
        config.apiUrl.trim(),
        config.username.trim(),
        config.passwordHash.trim(),
        configService.config.app.version,
        configService.config.app.clientMachineId,
        configService.config.app.clientMachineName,
        (error: any) => {
          logger.error('Kritická chyba eWay-CRM připojení', error);
          this.handleConnectionError(error);
        }
      );
      
      logger.info('✅ eWay-CRM konektor byl inicializován', {
        apiUrl: config.apiUrl,
        username: config.username
      });
    } catch (error) {
      logger.error('❌ Nepodařilo se vytvořit eWay-CRM připojení', error);
      throw error;
    }
  }

  /**
   * Získání singleton instance
   */
  public static getInstance(): EwayConnector {
    if (!EwayConnector.instance) {
      EwayConnector.instance = new EwayConnector();
    }
    return EwayConnector.instance;
  }

  /**
   * Přihlášení k eWay-CRM API
   */
  public async logIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isLoggedIn) {
        logger.debug('Již přihlášen k eWay-CRM');
        resolve();
        return;
      }

      const startTime = Date.now();
      
      logger.info('🔑 Pokouším se přihlásit k eWay-CRM API...');
      
      this.connection.callMethod('LogIn', {}, (result: ApiResult) => {
        const duration = Date.now() - startTime;
        
        if (result.ReturnCode === 'rcSuccess') {
          this.sessionId = result.Data[0]?.SessionId;
          this.isLoggedIn = true;
          
          logger.info('Úspěšné přihlášení k eWay-CRM', {
            sessionId: this.sessionId,
            duration
          });
          
          resolve();
        } else {
          this.isLoggedIn = false;
          logger.error('Chyba při přihlašování k eWay-CRM', {
            returnCode: result.ReturnCode,
            description: result.Description,
            duration
          });
          
          reject(new Error(`Přihlášení selhalo: ${result.Description}`));
        }
      });
    });
  }

  /**
   * Volání eWay-CRM API metody s automatickým obnovením session
   */
  public async callMethod(methodName: string, parameters: any = {}): Promise<ApiResult> {
    // Pokud nejsme přihlášeni, přihlásíme se
    if (!this.isLoggedIn) {
      await this.logIn();
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      this.connection.callMethod(methodName, parameters, async (result: ApiResult) => {
        const duration = Date.now() - startTime;
        
        logger.logEwayApiCall(methodName, parameters, result.ReturnCode, duration);
        
        // Zkontrolujeme, zda nemusíme obnovit session
        if (result.ReturnCode === 'rcBadSession') {
          logger.warn('Neplatná session, pokouším se obnovit přihlášení');
          
          try {
            this.isLoggedIn = false;
            this.sessionId = null;
            await this.logIn();
            
            // Zkusíme volání znovu
            this.connection.callMethod(methodName, parameters, (retryResult: ApiResult) => {
              const retryDuration = Date.now() - startTime;
              logger.logEwayApiCall(`${methodName} (retry)`, parameters, retryResult.ReturnCode, retryDuration);
              resolve(retryResult);
            });
          } catch (loginError) {
            logger.error('Nepodařilo se obnovit session', loginError);
            reject(loginError);
          }
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Odhlášení od eWay-CRM API
   */
  public async logOut(): Promise<void> {
    if (!this.isLoggedIn) {
      return;
    }

    return new Promise((resolve) => {
      this.connection.callMethod('LogOut', {}, (result: ApiResult) => {
        this.isLoggedIn = false;
        this.sessionId = null;
        
        logger.info('Odhlášení z eWay-CRM', {
          returnCode: result.ReturnCode
        });
        
        resolve();
      });
    });
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

  /**
   * Zpracování chyb připojení
   */
  private handleConnectionError(error: any): void {
    if (error?.code === 'NETWORK_ERROR') {
      logger.error('Síťová chyba při připojení k eWay-CRM');
    } else if (error?.code === 'AUTH_ERROR') {
      logger.error('Chyba autentizace eWay-CRM');
    } else {
      logger.error('Neočekávaná chyba eWay-CRM připojení', error);
    }
    
    // Reset stavu při chybě
    this.isLoggedIn = false;
    this.sessionId = null;
  }
}

// Export singleton instance
export default EwayConnector.getInstance(); 