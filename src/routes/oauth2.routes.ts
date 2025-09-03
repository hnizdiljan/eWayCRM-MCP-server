import { Router } from 'express';
import oauth2Controller from '../controllers/oauth2.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: OAuth2
 *   description: OAuth2 autentizace pro eWay-CRM API
 */

/**
 * @swagger
 * /api/v1/oauth2/authorize:
 *   get:
 *     summary: Inicializace OAuth2 Authorization Code flow
 *     description: Přesměruje na Azure AD pro autorizaci nebo vrátí JSON s authorization URL
 *     tags: [OAuth2]
 *     parameters:
 *       - in: query
 *         name: json
 *         schema:
 *           type: string
 *           enum: ['true']
 *         description: Pokud je 'true', vrátí JSON místo přesměrování
 *     responses:
 *       302:
 *         description: Přesměrování na Azure AD authorization URL (výchozí)
 *       200:
 *         description: JSON s authorization URL (pouze pokud ?json=true)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 authorizationUrl:
 *                   type: string
 *                   format: uri
 *                 state:
 *                   type: string
 *                   description: CSRF token pro ověření callback
 *                 instructions:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Chyba při generování authorization URL
 */
router.get('/authorize', oauth2Controller.initializeAuthorization);

/**
 * @swagger
 * /api/v1/oauth2/callback:
 *   get:
 *     summary: OAuth2 callback endpoint
 *     description: Zpracovává OAuth2 authorization code a zobrazuje HTML stránku s výsledkem
 *     tags: [OAuth2]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Authorization code z Azure AD
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: CSRF token pro ověření
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Chybový kód v případě neúspěchu
 *       - in: query
 *         name: error_description
 *         schema:
 *           type: string
 *         description: Popis chyby
 *     responses:
 *       200:
 *         description: HTML stránka s výsledkem autorizace
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *             example: |
 *               <!DOCTYPE html>
 *               <html>
 *               <head><title>Autorizace úspěšná</title></head>
 *               <body>
 *                 <h1>✅ Autorizace úspěšná!</h1>
 *                 <p>OAuth2 autorizace byla úspěšně dokončena.</p>
 *               </body>
 *               </html>
 *       400:
 *         description: HTML stránka s chybou (neplatný code nebo state)
 *       500:
 *         description: HTML stránka s chybou zpracování
 */
router.get('/callback', oauth2Controller.handleCallback);

/**
 * @swagger
 * /api/v1/oauth2/exchange-code:
 *   post:
 *     summary: Výměna authorization code za access token
 *     description: Manuální výměna authorization code získaného z authorization serveru
 *     tags: [OAuth2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Authorization code z OAuth2 serveru
 *               state:
 *                 type: string
 *                 description: CSRF token pro ověření (pokud byl použit)
 *     responses:
 *       200:
 *         description: Code úspěšně vyměněn za access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 token:
 *                   type: object
 *                 ewaySession:
 *                   type: object
 *       400:
 *         description: Chybí authorization code
 *       500:
 *         description: Chyba při výměně code
 */
router.post('/exchange-code', oauth2Controller.exchangeCode);

/**
 * @swagger
 * /api/v1/oauth2/refresh:
 *   post:
 *     summary: Obnovení access tokenu
 *     description: Obnoví access token pomocí refresh tokenu
 *     tags: [OAuth2]
 *     responses:
 *       200:
 *         description: Token úspěšně obnoven
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 token:
 *                   type: object
 *                 ewaySession:
 *                   type: object
 *       500:
 *         description: Chyba při obnově tokenu
 */
router.post('/refresh', oauth2Controller.refreshToken);

/**
 * @swagger
 * /api/v1/oauth2/status:
 *   get:
 *     summary: Získání stavu OAuth2 autentizace
 *     description: Vrací aktuální stav OAuth2 tokenu a eWay API session
 *     tags: [OAuth2]
 *     responses:
 *       200:
 *         description: Stav autentizace
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 oauth2:
 *                   type: object
 *                   properties:
 *                     hasValidToken:
 *                       type: boolean
 *                     tokenDetails:
 *                       type: object
 *                 eway:
 *                   type: object
 *       500:
 *         description: Chyba při získávání statusu
 */
router.get('/status', oauth2Controller.getStatus);

/**
 * @swagger
 * /api/v1/oauth2/logout:
 *   post:
 *     summary: Odhlášení
 *     description: Odhlásí uživatele a vymaže OAuth2 token
 *     tags: [OAuth2]
 *     responses:
 *       200:
 *         description: Úspěšně odhlášeno
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *       500:
 *         description: Chyba při odhlašování
 */
router.post('/logout', oauth2Controller.logout);

export default router;