import { Router } from 'express';
import { z } from 'zod';
import userController from '../controllers/user.controller';
import { validateQuery, validateBody, validateParams } from '../middleware/validation.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { CreateUserDtoSchema, UpdateUserDtoSchema } from '../models/user.dto';

const router = Router();

// Schémata pro validaci query parametrů
const SearchQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
  offset: z.coerce.number().min(0).default(0),
  isActive: z.enum(['true', 'false']).optional(),
  supervisorId: z.string().uuid('Neplatný formát ID nadřízeného').optional(),
  includeProfilePictures: z.enum(['true', 'false']).optional(),
});

const IdParamSchema = z.object({
  id: z.string().uuid('Neplatný formát ID')
});

const SupervisorIdParamSchema = z.object({
  supervisorId: z.string().uuid('Neplatný formát ID nadřízeného')
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unikátní identifikátor uživatele
 *         username:
 *           type: string
 *           description: Uživatelské jméno
 *         firstName:
 *           type: string
 *           description: Křestní jméno
 *         lastName:
 *           type: string
 *           description: Příjmení
 *         email1Address:
 *           type: string
 *           format: email
 *           description: Primární email
 *         isActive:
 *           type: boolean
 *           description: Zda je uživatel aktivní
 *         jobTitle:
 *           type: string
 *           description: Pracovní pozice
 *         supervisorId:
 *           type: string
 *           format: uuid
 *           description: ID nadřízeného
 *         supervisorName:
 *           type: string
 *           description: Jméno nadřízeného (jen pro čtení)
 *         serverLastLogin:
 *           type: string
 *           format: date-time
 *           description: Datum posledního přihlášení
 *         created:
 *           type: string
 *           format: date-time
 *           description: Datum vytvoření
 *         modified:
 *           type: string
 *           format: date-time
 *           description: Datum poslední změny
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         username: "jan.novak"
 *         firstName: "Jan"
 *         lastName: "Novák"
 *         email1Address: "jan.novak@example.com"
 *         isActive: true
 *         jobTitle: "Projektový manažer"
 *
 *     CreateUser:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           description: Uživatelské jméno
 *         firstName:
 *           type: string
 *           description: Křestní jméno
 *         lastName:
 *           type: string
 *           description: Příjmení
 *         email1Address:
 *           type: string
 *           format: email
 *           description: Primární email
 *         isActive:
 *           type: boolean
 *           description: Zda je uživatel aktivní
 *           default: true
 *         jobTitle:
 *           type: string
 *           description: Pracovní pozice
 *         supervisorId:
 *           type: string
 *           format: uuid
 *           description: ID nadřízeného
 *         serverPassword:
 *           type: string
 *           description: Heslo uživatele (pouze pro vytvoření/aktualizaci)
 *       example:
 *         username: "jan.novak"
 *         firstName: "Jan"
 *         lastName: "Novák"
 *         email1Address: "jan.novak@example.com"
 *         isActive: true
 *         jobTitle: "Projektový manažer"
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Seznam všech uživatelů
 *     description: Získá seznam uživatelů s možností vyhledávání, filtrování a stránkování
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Vyhledávací dotaz (username, jméno, příjmení, email)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 25
 *         description: Počet záznamů na stránku
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Počet záznamů k přeskočení
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrovat podle aktivního stavu
 *       - in: query
 *         name: supervisorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrovat podle ID nadřízeného
 *       - in: query
 *         name: includeProfilePictures
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: false
 *         description: Zahrnout profilové obrázky
 *     responses:
 *       200:
 *         description: Seznam uživatelů
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/',
  requireAuth,
  validateQuery(SearchQuerySchema),
  (req, res) => userController.getAll(req, res)
);

/**
 * @swagger
 * /api/v1/users/active:
 *   get:
 *     summary: Aktivní uživatelé
 *     description: Získá seznam všech aktivních uživatelů
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 25
 *         description: Počet záznamů na stránku
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Počet záznamů k přeskočení
 *     responses:
 *       200:
 *         description: Seznam aktivních uživatelů
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/active',
  requireAuth,
  validateQuery(SearchQuerySchema.omit({ q: true, isActive: true, supervisorId: true, includeProfilePictures: true })),
  (req, res) => userController.getActive(req, res)
);

/**
 * @swagger
 * /api/v1/users/by-supervisor/{supervisorId}:
 *   get:
 *     summary: Uživatelé podle nadřízeného
 *     description: Získá všechny uživatele pod konkrétním nadřízeným
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: supervisorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID nadřízeného
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 25
 *         description: Počet záznamů na stránku
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Počet záznamů k přeskočení
 *     responses:
 *       200:
 *         description: Seznam uživatelů nadřízeného
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Neplatné ID nadřízeného
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/by-supervisor/:supervisorId',
  requireAuth,
  validateParams(SupervisorIdParamSchema),
  validateQuery(SearchQuerySchema.omit({ q: true, isActive: true, supervisorId: true, includeProfilePictures: true })),
  (req, res) => userController.getBySupervisorId(req, res)
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Detail uživatele
 *     description: Získá detail konkrétního uživatele podle ID
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Detail uživatele
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Uživatel nebyl nalezen
 *       400:
 *         description: Neplatné ID
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/:id',
  requireAuth,
  validateParams(IdParamSchema),
  (req, res) => userController.getById(req, res)
);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Vytvoření nového uživatele
 *     description: Vytvoří nového uživatele v eWay-CRM
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: Uživatel byl úspěšně vytvořen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         description: Chybná validace dat
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.post('/',
  requireAuth,
  validateBody(CreateUserDtoSchema),
  (req, res) => userController.create(req, res)
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Aktualizace uživatele
 *     description: Aktualizuje existujícího uživatele v eWay-CRM
 *     tags: [Users]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       200:
 *         description: Uživatel byl úspěšně aktualizován
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         description: Chybná validace dat
 *       404:
 *         description: Uživatel nebyl nalezen
 *       409:
 *         description: Konflikt verzí (uživatel byl mezitím změněn)
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.put('/:id',
  requireAuth,
  validateParams(IdParamSchema),
  validateBody(UpdateUserDtoSchema),
  (req, res) => userController.update(req, res)
);

export default router;
