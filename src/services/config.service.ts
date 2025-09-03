import { config } from 'dotenv';
import { createPasswordHash, isPasswordHash } from '../utils/crypto.utils';

// Načtení environment proměnných
config();

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
        port: parseInt(process.env.MCP_PORT || '3000', 10),
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
      console.error(`❌ CHYBA KONFIGURACE: Povinná environment proměnná ${key} není nastavena nebo je prázdná!`);
      console.error(`📝 Vytvořte .env soubor podle .env.example a nastavte správné hodnoty.`);
      console.error(`🔧 Aktuálně načtené environment proměnné pro eWay-CRM:`);
      console.error(`   EWAY_API_URL: ${process.env.EWAY_API_URL || 'NENÍ NASTAVENA'}`);
      console.error(`   OAuth2:`);
      console.error(`     EWAY_CLIENT_ID: ${process.env.EWAY_CLIENT_ID || 'NENÍ NASTAVENA'}`);
      console.error(`     EWAY_CLIENT_SECRET: ${process.env.EWAY_CLIENT_SECRET ? '[NASTAVENA]' : 'NENÍ NASTAVENA'}`);
      console.error(`     EWAY_REDIRECT_URI: ${process.env.EWAY_REDIRECT_URI || 'NENÍ NASTAVENA'}`);
      console.error(`   Legacy:`);
      console.error(`     EWAY_USERNAME: ${process.env.EWAY_USERNAME || 'NENÍ NASTAVENA'}`);
      console.error(`     EWAY_PASSWORD: ${process.env.EWAY_PASSWORD ? '[NASTAVENA]' : 'NENÍ NASTAVENA'}`);
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
      console.log('🔐 Používám OAuth2 autentizaci s Client Secret fallback');
      console.log('ℹ️  Poznámka: eWay-CRM podporuje pouze Authorization Code flow, ne Client Credentials flow');
      console.log('ℹ️  Server použije Client Secret jako Bearer token pro server-to-server komunikaci');
      return 'oauth2';
    }

    // Pak zkontrolujeme legacy autentizaci
    if (process.env.EWAY_USERNAME && (process.env.EWAY_PASSWORD || process.env.EWAY_PASSWORD_HASH)) {
      console.log('🔐 Používám legacy autentizaci (username/password)');
      return 'legacy';
    }

    // Chyba - žádná autentizace není nastavena
    console.error('❌ CHYBA KONFIGURACE: Musíte nastavit buď OAuth2 nebo Legacy autentizaci!');
    console.error('📝 Příklad .env souboru:');
    console.error('');
    console.error('   # OAuth2 (doporučeno):');
    console.error('   EWAY_CLIENT_ID=váš-client-id');
    console.error('   EWAY_CLIENT_SECRET=váš-client-secret');
    console.error('   EWAY_REDIRECT_URI=https://oauth.pstmn.io/v1/browser-callback');
    console.error('');
    console.error('   # NEBO Legacy:');
    console.error('   EWAY_USERNAME=api');
    console.error('   EWAY_PASSWORD=vase-heslo-zde');
    throw new Error('Není nastavena žádná metoda autentizace pro eWay-CRM');
  }

  /**
   * Získá heslo a automaticky ho převede na hash pokud je potřeba
   */
  private getPasswordValue(): string {
    // Nejdříve zkusíme EWAY_PASSWORD (plaintext)
    const plainPassword = process.env.EWAY_PASSWORD;
    if (plainPassword) {
      console.log('🔐 Používám plaintext heslo z EWAY_PASSWORD a vytvářím MD5 hash');
      return createPasswordHash(plainPassword);
    }

    // Pak zkusíme EWAY_PASSWORD_HASH (už hashované)
    const hashedPassword = process.env.EWAY_PASSWORD_HASH;
    if (hashedPassword) {
      // Ověříme, zda je to skutečně hash nebo plaintext
      if (isPasswordHash(hashedPassword)) {
        console.log('🔐 Používám hashované heslo z EWAY_PASSWORD_HASH');
        return hashedPassword.toUpperCase();
      } else {
        console.log('🔐 EWAY_PASSWORD_HASH obsahuje plaintext, vytvářím MD5 hash');
        return createPasswordHash(hashedPassword);
      }
    }

    // Chyba - žádné heslo není nastaveno
    throw new Error('Heslo pro legacy autentizaci není nastaveno');
  }
}

export const configService = new ConfigService();
export default configService; 