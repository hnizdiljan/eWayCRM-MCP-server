import { createPasswordHash, isPasswordHash } from '../utils/crypto.utils';

// ENV proměnné jsou načteny v config/dotenv.config.ts, který se importuje jako první v main aplikaci

// Helper funkce pro logování v non-MCP módu
// V MCP módu (stdio transport) NESMÍ nic jít na stdout/stderr mimo JSON-RPC!
const isMcpMode = () => process.env.NODE_ENV === 'production' || process.env.MCP_MODE === 'true';

const safeConsoleLog = (...args: any[]) => {
  if (!isMcpMode()) {
    console.error(...args);
  }
};

const safeConsoleError = (...args: any[]) => {
  if (!isMcpMode()) {
    console.error(...args);
  }
};

export interface AppConfig {
  // eWay-CRM konfigurace
  eway: {
    apiUrl: string;
    username?: string; // Username potřebný i pro OAuth2
    // OAuth2 konfigurace
    oauth?: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
    // Legacy autentizace
    legacy?: {
      username: string;
      passwordHash: string;
    };
    authMethod: 'oauth2' | 'legacy';
  };
  
  // Server konfigurace
  server: {
    port: number;
  };
  
  // Aplikační konfigurace
  app: {
    version: string;
    clientMachineId: string;
    clientMachineName: string;
    nodeEnv: string;
  };
  
  // Logování
  logging: {
    level: string;
  };
}

class ConfigService {
  private readonly _config: AppConfig;

  constructor() {
    // Zjistíme, jakou metodu autentizace použít
    const authMethod = this.determineAuthMethod();
    
    this._config = {
      eway: {
        apiUrl: this.getRequiredEnv('EWAY_API_URL'),
        authMethod,
        // Username je potřebný i pro OAuth2
        ...(process.env.EWAY_USERNAME ? { username: process.env.EWAY_USERNAME } : {}),
        // Načteme OAuth2 pokud jsou dostupné proměnné
        ...(process.env.EWAY_CLIENT_ID && process.env.EWAY_CLIENT_SECRET ? {
          oauth: {
            clientId: process.env.EWAY_CLIENT_ID,
            clientSecret: process.env.EWAY_CLIENT_SECRET,
            redirectUri: process.env.EWAY_REDIRECT_URI || 'http://127.0.0.1:7777',
          }
        } : {}),
        // Načteme legacy pokud jsou dostupné proměnné (jako fallback)
        ...(process.env.EWAY_USERNAME && (process.env.EWAY_PASSWORD || process.env.EWAY_PASSWORD_HASH) ? {
          legacy: {
            username: process.env.EWAY_USERNAME,
            passwordHash: this.getPasswordValue(),
          }
        } : {}),
      },
      server: {
        port: parseInt(process.env.PORT || process.env.MCP_PORT || '3000', 10),
      },
      app: {
        version: process.env.APP_VERSION || 'MCP-Server-1.0',
        clientMachineId: process.env.CLIENT_MACHINE_ID || 'AA:BB:CC:DD:EE:FF',
        clientMachineName: process.env.CLIENT_MACHINE_NAME || 'MCP-Server',
        nodeEnv: process.env.NODE_ENV || 'development',
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
      },
    };
  }

  get config(): AppConfig {
    return this._config;
  }

  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      safeConsoleError(`❌ CHYBA KONFIGURACE: Povinná environment proměnná ${key} není nastavena nebo je prázdná!`);
      safeConsoleError(`📝 Vytvořte .env soubor podle .env.example a nastavte správné hodnoty.`);
      safeConsoleError(`🔧 Aktuálně načtené environment proměnné pro eWay-CRM:`);
      safeConsoleError(`   EWAY_API_URL: ${process.env.EWAY_API_URL || 'NENÍ NASTAVENA'}`);
      safeConsoleError(`   OAuth2:`);
      safeConsoleError(`     EWAY_CLIENT_ID: ${process.env.EWAY_CLIENT_ID || 'NENÍ NASTAVENA'}`);
      safeConsoleError(`     EWAY_CLIENT_SECRET: ${process.env.EWAY_CLIENT_SECRET ? '[NASTAVENA]' : 'NENÍ NASTAVENA'}`);
      safeConsoleError(`     EWAY_REDIRECT_URI: ${process.env.EWAY_REDIRECT_URI || 'NENÍ NASTAVENA'}`);
      safeConsoleError(`   Legacy:`);
      safeConsoleError(`     EWAY_USERNAME: ${process.env.EWAY_USERNAME || 'NENÍ NASTAVENA'}`);
      safeConsoleError(`     EWAY_PASSWORD: ${process.env.EWAY_PASSWORD ? '[NASTAVENA]' : 'NENÍ NASTAVENA'}`);
      throw new Error(`Povinná environment proměnná ${key} není nastavena`);
    }
    return value.trim();
  }

  public isProduction(): boolean {
    return this._config.app.nodeEnv === 'production';
  }

  public isDevelopment(): boolean {
    return this._config.app.nodeEnv === 'development';
  }

  /**
   * Určí, jakou metodu autentizace použít
   */
  private determineAuthMethod(): 'oauth2' | 'legacy' {
    // Nejdříve zkontrolujeme OAuth2 proměnné
    if (process.env.EWAY_CLIENT_ID && process.env.EWAY_CLIENT_SECRET) {
      safeConsoleLog('🔐 Používám OAuth2 autentizaci s Client Secret fallback');
      safeConsoleLog('ℹ️  Poznámka: eWay-CRM podporuje pouze Authorization Code flow, ne Client Credentials flow');
      safeConsoleLog('ℹ️  Server použije Client Secret jako Bearer token pro server-to-server komunikaci');
      return 'oauth2';
    }

    // Pak zkontrolujeme legacy autentizaci
    if (process.env.EWAY_USERNAME && (process.env.EWAY_PASSWORD || process.env.EWAY_PASSWORD_HASH)) {
      safeConsoleLog('🔐 Používám legacy autentizaci (username/password)');
      return 'legacy';
    }

    // Chyba - žádná autentizace není nastavena
    safeConsoleError('❌ CHYBA KONFIGURACE: Musíte nastavit buď OAuth2 nebo Legacy autentizaci!');
    safeConsoleError('📝 Příklad .env souboru:');
    safeConsoleError('');
    safeConsoleError('   # OAuth2 (doporučeno):');
    safeConsoleError('   EWAY_CLIENT_ID=váš-client-id');
    safeConsoleError('   EWAY_CLIENT_SECRET=váš-client-secret');
    safeConsoleError('   EWAY_REDIRECT_URI=https://oauth.pstmn.io/v1/browser-callback');
    safeConsoleError('');
    safeConsoleError('   # NEBO Legacy:');
    safeConsoleError('   EWAY_USERNAME=api');
    safeConsoleError('   EWAY_PASSWORD=vase-heslo-zde');
    throw new Error('Není nastavena žádná metoda autentizace pro eWay-CRM');
  }

  /**
   * Získá heslo a automaticky ho převede na hash pokud je potřeba
   */
  private getPasswordValue(): string {
    // Nejdříve zkusíme EWAY_PASSWORD (plaintext)
    const plainPassword = process.env.EWAY_PASSWORD;
    if (plainPassword) {
      safeConsoleLog('🔐 Používám plaintext heslo z EWAY_PASSWORD a vytvářím MD5 hash');
      return createPasswordHash(plainPassword);
    }

    // Pak zkusíme EWAY_PASSWORD_HASH (už hashované)
    const hashedPassword = process.env.EWAY_PASSWORD_HASH;
    if (hashedPassword) {
      // Ověříme, zda je to skutečně hash nebo plaintext
      if (isPasswordHash(hashedPassword)) {
        safeConsoleLog('🔐 Používám hashované heslo z EWAY_PASSWORD_HASH');
        return hashedPassword.toUpperCase();
      } else {
        safeConsoleLog('🔐 EWAY_PASSWORD_HASH obsahuje plaintext, vytvářím MD5 hash');
        return createPasswordHash(hashedPassword);
      }
    }

    // Chyba - žádné heslo není nastaveno
    throw new Error('Heslo pro legacy autentizaci není nastaveno');
  }
}

export const configService = new ConfigService();
export default configService; 