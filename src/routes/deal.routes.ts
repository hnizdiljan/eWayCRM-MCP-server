import { Router } from 'express';
import { z } from 'zod';
import dealController from '../controllers/deal.controller';
import { validateQuery, validateBody, validateParams } from '../middleware/validation.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { CreateDealDtoSchema, UpdateDealDtoSchema } from '../models/deal.dto';

const router = Router();

// Schémata pro validaci query parametrů
const SearchQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
  offset: z.coerce.number().min(0).default(0),
});

const IdParamSchema = z.object({
  id: z.string().uuid('Neplatný formát ID')
});

const CompanyIdParamSchema = z.object({
  companyId: z.string().uuid('Neplatný formát ID společnosti')
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Deal:
 *       type: object
 *       required:
 *         - projectName
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unikátní identifikátor obchodu
 *         projectName:
 *           type: string
 *           description: Název obchodu/projektu
 *         fileAs:
 *           type: string
 *           description: Zobrazovaný název
 *         companyId:
 *           type: string
 *           format: uuid
 *           description: ID propojené společnosti
 *         companyName:
 *           type: string
 *           description: Název propojené společnosti (jen pro čtení)
 *         contactId:
 *           type: string
 *           format: uuid
 *           description: ID propojeného kontaktu
 *         contactName:
 *           type: string
 *           description: Jméno propojeného kontaktu (jen pro čtení)
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Cena obchodu
 *         currency:
 *           type: string
 *           description: Měna
 *         probability:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Pravděpodobnost uzavření (%)
 *         dealStage:
 *           type: string
 *           description: Fáze obchodu
 *         dealType:
 *           type: string
 *           description: Typ obchodu
 *         startDate:
 *           type: string
 *           format: date
 *           description: Datum zahájení
 *         endDate:
 *           type: string
 *           format: date
 *           description: Datum ukončení
 *         deadlineDate:
 *           type: string
 *           format: date
 *           description: Termín uzavření
 *         description:
 *           type: string
 *           description: Popis obchodu
 *         note:
 *           type: string
 *           description: Poznámky
 *         created:
 *           type: string
 *           format: date-time
 *           description: Datum vytvoření
 *         modified:
 *           type: string
 *           format: date-time
 *           description: Datum poslední změny
 *         itemVersion:
 *           type: integer
 *           description: Verze záznamu pro optimistic locking
 *         isDeleted:
 *           type: boolean
 *           description: Zda je záznam smazán
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         projectName: "Nový web pro společnost"
 *         fileAs: "Web - ACME s.r.o."
 *         companyId: "456e7890-e89b-12d3-a456-426614174000"
 *         companyName: "ACME s.r.o."
 *         price: 150000
 *         currency: "CZK"
 *         probability: 75
 *         dealStage: "Nabídka"
 *         dealType: "Nový projekt"
 *         description: "Kompletní redesign webových stránek včetně e-shopu"
 *         created: "2024-01-01T10:00:00.000Z"
 *         itemVersion: 1
 *
 *     CreateDeal:
 *       type: object
 *       required:
 *         - projectName
 *       properties:
 *         projectName:
 *           type: string
 *           description: Název obchodu/projektu
 *         fileAs:
 *           type: string
 *           description: Zobrazovaný název
 *         companyId:
 *           type: string
 *           format: uuid
 *           description: ID propojené společnosti
 *         contactId:
 *           type: string
 *           format: uuid
 *           description: ID propojeného kontaktu
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Cena obchodu
 *         currency:
 *           type: string
 *           description: Měna
 *         probability:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Pravděpodobnost uzavření (%)
 *         dealStage:
 *           type: string
 *           description: Fáze obchodu
 *         dealType:
 *           type: string
 *           description: Typ obchodu
 *         startDate:
 *           type: string
 *           format: date
 *           description: Datum zahájení
 *         endDate:
 *           type: string
 *           format: date
 *           description: Datum ukončení
 *         deadlineDate:
 *           type: string
 *           format: date
 *           description: Termín uzavření
 *         description:
 *           type: string
 *           description: Popis obchodu
 *         note:
 *           type: string
 *           description: Poznámky
 *       example:
 *         projectName: "Nový web pro společnost"
 *         companyId: "456e7890-e89b-12d3-a456-426614174000"
 *         price: 150000
 *         currency: "CZK"
 *         probability: 75
 *         dealStage: "Nabídka"
 *         description: "Kompletní redesign webových stránek"
 */

/**
 * @swagger
 * /api/v1/deals:
 *   get:
 *     summary: Seznam všech obchodů
 *     description: Získá seznam obchodů s možností vyhledávání a stránkování
 *     tags: [Deals]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Vyhledávací dotaz (název obchodu)
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
 *         description: Seznam obchodů
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
 *                     $ref: '#/components/schemas/Deal'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Vnitřní chyba serveru
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/',
  requireAuth,
  validateQuery(SearchQuerySchema),
  (req, res) => dealController.getAll(req, res)
);

/**
 * @swagger
 * /api/v1/deals/by-company/{companyId}:
 *   get:
 *     summary: Obchody podle společnosti
 *     description: Získá všechny obchody propojené s konkrétní společností
 *     tags: [Deals]
 *     parameters:
 *       - $ref: '#/components/parameters/CompanyIdParam'
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
 *         description: Seznam obchodů společnosti
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
 *                     $ref: '#/components/schemas/Deal'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Neplatné ID společnosti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Vnitřní chyba serveru
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/by-company/:companyId',
  requireAuth,
  validateParams(CompanyIdParamSchema),
  validateQuery(SearchQuerySchema.omit({ q: true })),
  (req, res) => dealController.getByCompanyId(req, res)
);

/**
 * @swagger
 * /api/v1/deals/{id}:
 *   get:
 *     summary: Detail obchodu
 *     description: Získá detail konkrétního obchodu podle ID
 *     tags: [Deals]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Detail obchodu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Deal'
 *       404:
 *         description: Obchod nebyl nalezen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Neplatné ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Vnitřní chyba serveru
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id',
  requireAuth,
  validateParams(IdParamSchema),
  (req, res) => dealController.getById(req, res)
);

/**
 * @swagger
 * /api/v1/deals:
 *   post:
 *     summary: Vytvoření nového obchodu
 *     description: Vytvoří nový obchod v eWay-CRM
 *     tags: [Deals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDeal'
 *     responses:
 *       201:
 *         description: Obchod byl úspěšně vytvořen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Deal'
 *                 message:
 *                   type: string
 *       400:
 *         description: Chybná validace dat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Vnitřní chyba serveru
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/',
  requireAuth,
  validateBody(CreateDealDtoSchema),
  (req, res) => dealController.create(req, res)
);

/**
 * @swagger
 * /api/v1/deals/{id}:
 *   put:
 *     summary: Aktualizace obchodu
 *     description: Aktualizuje existující obchod v eWay-CRM
 *     tags: [Deals]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDeal'
 *     responses:
 *       200:
 *         description: Obchod byl úspěšně aktualizován
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Deal'
 *                 message:
 *                   type: string
 *       400:
 *         description: Chybná validace dat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Obchod nebyl nalezen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Konflikt verzí (obchod byl mezitím změněn)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Vnitřní chyba serveru
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id',
  requireAuth,
  validateParams(IdParamSchema),
  validateBody(UpdateDealDtoSchema),
  (req, res) => dealController.update(req, res)
);

/**
 * @swagger
 * /api/v1/deals/{id}:
 *   delete:
 *     summary: Smazání obchodu
 *     description: Označí obchod jako smazaný v eWay-CRM (soft delete)
 *     tags: [Deals]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       204:
 *         description: Obchod byl úspěšně smazán (bez obsahu)
 *       404:
 *         description: Obchod nebyl nalezen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Neplatné ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Vnitřní chyba serveru
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id',
  requireAuth,
  validateParams(IdParamSchema),
  (req, res) => dealController.delete(req, res)
);

export default router; 