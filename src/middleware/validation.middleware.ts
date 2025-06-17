import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../services/logger.service';

/**
 * Generický validační middleware pro validaci těla požadavku
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validace těla požadavku
      const validatedData = schema.parse(req.body);
      
      // Nahradíme původní body validovanými daty
      req.body = validatedData;
      
      logger.debug('Validace těla požadavku byla úspěšná', {
        method: req.method,
        url: req.url
      });
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validační chyba v těle požadavku', {
          method: req.method,
          url: req.url,
          errors: error.errors
        });
        
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Neplatná data v těle požadavku',
            details: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          }
        });
        return;
      }
      
      logger.error('Neočekávaná chyba při validaci', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Vnitřní chyba serveru při validaci'
        }
      });
      return;
    }
  };
};

/**
 * Validační middleware pro query parametry
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validace query parametrů
      const validatedQuery = schema.parse(req.query);
      
      // Přidáme validované query data do req objektu
      (req as any).validatedQuery = validatedQuery;
      
      logger.debug('Validace query parametrů byla úspěšná', {
        method: req.method,
        url: req.url
      });
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validační chyba v query parametrech', {
          method: req.method,
          url: req.url,
          errors: error.errors
        });
        
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Neplatné query parametry',
            details: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          }
        });
        return;
      }
      
      logger.error('Neočekávaná chyba při validaci query parametrů', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Vnitřní chyba serveru při validaci'
        }
      });
      return;
    }
  };
};

/**
 * Validační middleware pro parametry v URL (params)
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validace parametrů URL
      const validatedParams = schema.parse(req.params);
      
      // Nahradíme původní params validovanými daty  
      req.params = validatedParams;
      
      logger.debug('Validace URL parametrů byla úspěšná', {
        method: req.method,
        url: req.url
      });
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validační chyba v URL parametrech', {
          method: req.method,
          url: req.url,
          errors: error.errors
        });
        
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Neplatné parametry URL',
            details: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          }
        });
        return;
      }
      
      logger.error('Neočekávaná chyba při validaci URL parametrů', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Vnitřní chyba serveru při validaci'
        }
      });
      return;
    }
  };
}; 