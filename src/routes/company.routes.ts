import { Router } from 'express';
import { z } from 'zod';
import companyController from '../controllers/company.controller';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import { CreateCompanyDtoSchema, UpdateCompanyDtoSchema } from '../models/company.dto';

const router = Router();

// Schéma pro validaci query parametrů při získávání seznamu
const GetAllQuerySchema = z.object({
  q: z.string().optional(), // Vyhledávací dotaz
  limit: z.string().transform(val => parseInt(val) || 25).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).pipe(z.number().min(0)).optional()
});

// Schéma pro validaci ID parametru
const IdParamSchema = z.object({
  id: z.string().uuid('ID musí být platný UUID')
});

/**
 * @swagger
 * /api/v1/companies:
 *   get:
 *     summary: Získání seznamu společností
 *     description: Vrací seznam všech společností s možností fulltextového vyhledávání a stránkování
 *     tags: [Companies]
 *     parameters:
 *       - $ref: '#/components/parameters/QueryParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: Seznam společností
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompaniesResponse'
 *       400:
 *         description: Neplatné parametry požadavku
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
router.get('/', 
  validateQuery(GetAllQuerySchema),
  (req, res) => companyController.getAll(req, res)
);

/**
 * @swagger
 * /api/v1/companies/{id}:
 *   get:
 *     summary: Získání konkrétní společnosti
 *     description: Vrací detail konkrétní společnosti podle ID
 *     tags: [Companies]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Detail společnosti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Společnost nebyla nalezena
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
  validateParams(IdParamSchema),
  (req, res) => companyController.getById(req, res)
);

/**
 * @swagger
 * /api/v1/companies:
 *   post:
 *     summary: Vytvoření nové společnosti
 *     description: Vytvoří novou společnost v eWay-CRM
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompany'
 *           examples:
 *             example1:
 *               summary: Základní společnost
 *               value:
 *                 companyName: "Acme Corp s.r.o."
 *                 email: "info@acme.com"
 *                 phone: "+420 123 456 789"
 *                 website: "https://www.acme.com"
 *                 address: "Václavské náměstí 1"
 *                 city: "Praha"
 *                 zipCode: "110 00"
 *                 country: "Česká republika"
 *                 ico: "12345678"
 *                 dic: "CZ12345678"
 *     responses:
 *       201:
 *         description: Společnost byla úspěšně vytvořena
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Neplatná data
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
  validateBody(CreateCompanyDtoSchema),
  (req, res) => companyController.create(req, res)
);

/**
 * @swagger
 * /api/v1/companies/{id}:
 *   put:
 *     summary: Aktualizace existující společnosti
 *     description: Aktualizuje existující společnost v eWay-CRM
 *     tags: [Companies]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompany'
 *           examples:
 *             example1:
 *               summary: Aktualizace údajů
 *               value:
 *                 companyName: "Acme Corp s.r.o."
 *                 email: "info@acme.com"
 *                 phone: "+420 123 456 789"
 *                 website: "https://www.acme.com"
 *     responses:
 *       200:
 *         description: Společnost byla úspěšně aktualizována
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Společnost nebyla nalezena
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Neplatná data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Konflikt verzí (společnost byla mezitím změněna)
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
  validateParams(IdParamSchema),
  validateBody(UpdateCompanyDtoSchema),
  (req, res) => companyController.update(req, res)
);

/**
 * @swagger
 * /api/v1/companies/{id}:
 *   delete:
 *     summary: Smazání společnosti
 *     description: Označí společnost jako smazanou v eWay-CRM (soft delete)
 *     tags: [Companies]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       204:
 *         description: Společnost byla úspěšně smazána (bez obsahu)
 *       404:
 *         description: Společnost nebyla nalezena
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
  validateParams(IdParamSchema),
  (req, res) => companyController.delete(req, res)
);

export default router; 