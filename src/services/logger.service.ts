import winston from 'winston';
import configService from './config.service';

class LoggerService {
  private logger: winston.Logger;

  constructor() {
    const { level } = configService.config.logging;
    const { nodeEnv } = configService.config.app;

    this.logger = winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? '\n' + stack : ''}`;
        })
      ),
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        
        // File transport pro error logy
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),
        
        // File transport pro všechny logy
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      ],
      // Nelogovat v testovacím prostředí
      silent: nodeEnv === 'test'
    });

    // V development módu logovat i debug zprávy
    if (nodeEnv === 'development') {
      this.logger.level = 'debug';
    }
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  public error(message: string, error?: Error | any): void {
    this.logger.error(message, { error: error?.message || error, stack: error?.stack });
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  public verbose(message: string, meta?: any): void {
    this.logger.verbose(message, meta);
  }

  // Speciální metoda pro logování HTTP requestů
  public logRequest(method: string, url: string, statusCode: number, responseTime: number, userAgent?: string): void {
    this.info(`${method} ${url} ${statusCode} - ${responseTime}ms`, {
      method,
      url,
      statusCode,
      responseTime,
      userAgent
    });
  }

  // Speciální metoda pro logování eWay-CRM API volání
  public logEwayApiCall(method: string, params: any, responseCode: string, duration: number): void {
    this.info(`eWay API: ${method} - ${responseCode} (${duration}ms)`, {
      ewayMethod: method,
      params: params,
      responseCode,
      duration
    });
  }

  // Metoda pro logování startup informací
  public logStartup(port: number): void {
    this.info(`🚀 eWay-CRM MCP Server byl spuštěn na portu ${port}`, {
      port,
      environment: configService.config.app.nodeEnv,
      version: configService.config.app.version
    });
  }
}

export const logger = new LoggerService();
export default logger; 