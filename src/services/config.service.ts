import { config } from 'dotenv';

// Načtení environment proměnných
config();

export interface AppConfig {
  // eWay-CRM konfigurace
  eway: {
    apiUrl: string;
    username: string;
    passwordHash: string;
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
    this._config = {
      eway: {
        apiUrl: this.getRequiredEnv('EWAY_API_URL'),
        username: this.getRequiredEnv('EWAY_USERNAME'),
        passwordHash: this.getRequiredEnv('EWAY_PASSWORD_HASH'),
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
      console.error(`   EWAY_USERNAME: ${process.env.EWAY_USERNAME || 'NENÍ NASTAVENA'}`);
      console.error(`   EWAY_PASSWORD_HASH: ${process.env.EWAY_PASSWORD_HASH ? '[NASTAVENA]' : 'NENÍ NASTAVENA'}`);
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
}

export const configService = new ConfigService();
export default configService; 