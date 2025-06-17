import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger.service';

export interface RequestWithTime extends Request {
  startTime?: number;
}

/**
 * Middleware pro logování všech příchozích HTTP requestů
 * Loguje metodu, URL, status kód, dobu odezvy a user agent
 */
export const loggingMiddleware = (req: RequestWithTime, res: Response, next: NextFunction): void => {
  // Uložíme čas začátku požadavku
  req.startTime = Date.now();

  // Zachytíme finish event pro výpočet doby odezvy
  res.on('finish', () => {
    const responseTime = Date.now() - (req.startTime || Date.now());
    const userAgent = req.get('User-Agent');
    
    logger.logRequest(
      req.method,
      req.originalUrl || req.url,
      res.statusCode,
      responseTime,
      userAgent
    );
  });

  next();
}; 