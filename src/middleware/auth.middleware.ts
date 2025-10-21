import { Request, Response, NextFunction } from 'express';
import ewayConnector from '../connectors/eway-http.connector';
import oauth2Service from '../services/oauth2.service';
import logger from '../services/logger.service';
import configService from '../services/config.service';

/**
 * Middleware pro ověření autentizace
 * Zkontroluje, zda je uživatel přihlášen pomocí OAuth2 nebo legacy autentizace
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const config = configService.config.eway;

    // Pro OAuth2 zkontrolujeme, zda máme platný token
    if (config.authMethod === 'oauth2') {
      // Zkontrolujeme, zda máme platný OAuth2 token
      if (!oauth2Service.hasValidToken()) {
        logger.warn('⚠️ Auth Middleware: Neplatný nebo chybějící OAuth2 token', {
          method: req.method,
          url: req.url
        });

        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Nejste autorizován. Prosím, proveďte OAuth2 autorizaci.',
            details: {
              reason: 'Chybí platný OAuth2 access token',
              authorizationUrl: `${req.protocol}://${req.get('host')}/api/v1/oauth2/authorize`,
              instructions: [
                '1. Navštivte authorization URL',
                '2. Přihlaste se pomocí Azure AD',
                '3. Po úspěšné autorizaci budete moci používat API endpointy'
              ]
            }
          }
        });
        return;
      }

      // Zkontrolujeme, zda je konektor připojen
      if (!ewayConnector.isConnected()) {
        logger.info('🔄 Auth Middleware: Konektor není připojen, pokouším se přihlásit', {
          method: req.method,
          url: req.url
        });

        try {
          // Pokus o přihlášení
          await ewayConnector.logIn();

          logger.info('✅ Auth Middleware: Úspěšné přihlášení konektoru', {
            method: req.method,
            url: req.url
          });
        } catch (loginError: any) {
          logger.error('❌ Auth Middleware: Chyba při přihlašování konektoru', {
            error: loginError.message,
            method: req.method,
            url: req.url
          });

          res.status(401).json({
            error: {
              code: 'LOGIN_FAILED',
              message: 'Přihlášení k eWay-CRM API selhalo',
              details: {
                reason: loginError.message,
                authorizationUrl: `${req.protocol}://${req.get('host')}/api/v1/oauth2/authorize`,
                suggestion: 'Zkuste prosím znovu provést OAuth2 autorizaci'
              }
            }
          });
          return;
        }
      }
    } else {
      // Pro legacy autentizaci pouze zkontrolujeme připojení
      if (!ewayConnector.isConnected()) {
        logger.info('🔄 Auth Middleware: Legacy autentizace - pokouším se přihlásit', {
          method: req.method,
          url: req.url
        });

        try {
          await ewayConnector.logIn();
        } catch (loginError: any) {
          logger.error('❌ Auth Middleware: Legacy přihlášení selhalo', {
            error: loginError.message,
            method: req.method,
            url: req.url
          });

          res.status(401).json({
            error: {
              code: 'LOGIN_FAILED',
              message: 'Přihlášení k eWay-CRM API selhalo',
              details: {
                reason: loginError.message
              }
            }
          });
          return;
        }
      }
    }

    // Vše v pořádku, pokračujeme
    logger.debug('✅ Auth Middleware: Autentizace úspěšná', {
      method: req.method,
      url: req.url,
      authMethod: config.authMethod
    });

    next();
  } catch (error: any) {
    logger.error('❌ Auth Middleware: Neočekávaná chyba', {
      error: error.message,
      method: req.method,
      url: req.url
    });

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Vnitřní chyba serveru při ověřování autentizace',
        details: error.message
      }
    });
  }
};

/**
 * Middleware pro volitelnou autentizaci
 * Pokusí se přihlásit, ale nepožaduje to
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!ewayConnector.isConnected()) {
      logger.debug('🔄 Optional Auth Middleware: Pokouším se přihlásit', {
        method: req.method,
        url: req.url
      });

      try {
        await ewayConnector.logIn();
      } catch (error: any) {
        logger.debug('⚠️ Optional Auth Middleware: Přihlášení selhalo, ale pokračuji', {
          error: error.message,
          method: req.method,
          url: req.url
        });
      }
    }

    next();
  } catch (error: any) {
    // Při optional auth nikdy neblokujeme request
    logger.warn('⚠️ Optional Auth Middleware: Chyba, ale pokračuji', {
      error: error.message,
      method: req.method,
      url: req.url
    });
    next();
  }
};
