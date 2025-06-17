import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';
import configService from './services/config.service';
import logger from './services/logger.service';
import { loggingMiddleware } from './middleware/logging.middleware';
// import ewayConnector from './connectors/eway.connector';
import ewayConnector from './connectors/eway-http.connector';
import companyRoutes from './routes/company.routes';
import contactRoutes from './routes/contact.routes';

const app: Application = express();
const { port } = configService.config.server;

// Vytvoření logs adresáře pokud neexistuje
import { mkdirSync } from 'fs';
try {
  mkdirSync('logs', { recursive: true });
} catch (error) {
  // Adresář již existuje
}

// Základní middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logování middleware
app.use(loggingMiddleware);

// Swagger dokumentace
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'eWay-CRM MCP Server API',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Zdravotní kontrola serveru
 *     description: Kontroluje stav serveru a připojení k eWay-CRM
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server běží normálně
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     eway:
 *                       type: string
 *                       enum: [connected, disconnected]
 */
app.get('/health', async (req, res) => {
  const isEwayConnected = ewayConnector.isConnected();
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: configService.config.app.version,
    environment: configService.config.app.nodeEnv,
    services: {
      eway: isEwayConnected ? 'connected' : 'disconnected'
    }
  });
});

// API routes
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/contacts', contactRoutes);

/**
 * @swagger
 * /api/v1:
 *   get:
 *     summary: Základní informace o API
 *     description: Vrací základní informace o API a dostupných endpointech
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Informace o API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: string
 */
app.get('/api/v1', (req, res) => {
  res.json({ 
    message: 'eWay-CRM MCP Server API v1',
    version: configService.config.app.version,
    endpoints: [
      '/api/v1/companies',
      '/api/v1/contacts', 
      '/api/v1/deals'
    ],
    documentation: '/api-docs'
  });
});

// Test připojení k eWay-CRM
app.get('/api/v1/test-connection', async (req, res) => {
  try {
    await ewayConnector.logIn();
    res.json({
      status: 'success',
      message: 'Připojení k eWay-CRM je funkční',
      sessionId: ewayConnector.getSessionId()
    });
  } catch (error) {
    logger.error('Test připojení k eWay-CRM selhal', error);
    res.status(500).json({
      status: 'error',
      message: 'Připojení k eWay-CRM selhalo',
      error: error instanceof Error ? error.message : 'Neznámá chyba'
    });
  }
});

// Spuštění serveru
app.listen(port, () => {
  logger.logStartup(port);
  
  // Test připojení k eWay-CRM při startu
  ewayConnector.logIn()
    .then(() => {
      logger.info('✅ Připojení k eWay-CRM bylo úspěšně navázáno');
    })
    .catch((error) => {
      logger.error('❌ Nepodařilo se připojit k eWay-CRM při startu', error);
    });
});

export default app; 