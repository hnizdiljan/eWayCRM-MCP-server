import { Router } from 'express';
import { z } from 'zod';
import contactController from '../controllers/contact.controller';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import { CreateContactDtoSchema, UpdateContactDtoSchema } from '../models/contact.dto';

const router = Router();

// Schéma pro validaci query parametrů při získávání seznamu
const GetAllQuerySchema = z.object({
  q: z.string().optional(), // Vyhledávací dotaz
  companyId: z.string().optional(), // Filtrování podle společnosti
  limit: z.string().transform(val => parseInt(val) || 25).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).pipe(z.number().min(0)).optional()
});

// Schéma pro validaci ID parametru
const IdParamSchema = z.object({
  id: z.string().uuid('ID musí být platný UUID')
});

// Schéma pro validaci company ID parametru
const CompanyIdParamSchema = z.object({
  companyId: z.string().uuid('Company ID musí být platný UUID')
});

// Schéma pro query parametry u by-company endpoint
const ByCompanyQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val) || 25).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).pipe(z.number().min(0)).optional()
});

/**
 * @swagger
 * /api/v1/contacts:
 *   get:
 *     summary: Získání seznamu kontaktů
 *     description: Vrací seznam všech kontaktů s možností fulltextového vyhledávání, filtrování podle společnosti a stránkování
 *     tags: [Contacts]
 *     parameters:
 *       - $ref: '#/components/parameters/QueryParam'
 *       - name: companyId
 *         in: query
 *         description: ID společnosti pro filtrování kontaktů
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "12345678-1234-1234-1234-123456789abc"
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: Seznam kontaktů
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactsResponse'
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
  (req, res) => contactController.getAll(req, res)
);

/**
 * @swagger
 * /api/v1/contacts/by-company/{companyId}:
 *   get:
 *     summary: Získání kontaktů podle společnosti
 *     description: Vrací všechny kontakty, které patří k dané společnosti
 *     tags: [Contacts]
 *     parameters:
 *       - name: companyId
 *         in: path
 *         required: true
 *         description: ID společnosti
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "12345678-1234-1234-1234-123456789abc"
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: Seznam kontaktů společnosti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactsResponse'
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
  validateParams(CompanyIdParamSchema),
  validateQuery(ByCompanyQuerySchema),
  (req, res) => contactController.getByCompanyId(req, res)
);

/**
 * @swagger
 * /api/v1/contacts/{id}:
 *   get:
 *     summary: Získání konkrétního kontaktu
 *     description: Vrací detail konkrétního kontaktu podle ID
 *     tags: [Contacts]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Detail kontaktu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       404:
 *         description: Kontakt nebyl nalezen
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
  (req, res) => contactController.getById(req, res)
);

/**
 * @swagger
 * /api/v1/contacts:
 *   post:
 *     summary: Vytvoření nového kontaktu
 *     description: Vytvoří nový kontakt v eWay-CRM
 *     tags: [Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContact'
 *           examples:
 *             example1:
 *               summary: Základní kontakt
 *               value:
 *                 firstName: "Jan"
 *                 lastName: "Novák"
 *                 email: "jan.novak@example.com"
 *                 phone: "+420 123 456 789"
 *                 mobile: "+420 987 654 321"
 *                 jobTitle: "Projektový manažer"
 *                 companyId: "12345678-1234-1234-1234-123456789abc"
 *     responses:
 *       201:
 *         description: Kontakt byl úspěšně vytvořen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
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
  validateBody(CreateContactDtoSchema),
  (req, res) => contactController.create(req, res)
);

/**
 * @swagger
 * /api/v1/contacts/{id}:
 *   put:
 *     summary: Aktualizace existujícího kontaktu
 *     description: Aktualizuje existující kontakt v eWay-CRM
 *     tags: [Contacts]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateContact'
 *           examples:
 *             example1:
 *               summary: Aktualizace údajů
 *               value:
 *                 firstName: "Jan"
 *                 lastName: "Novák"
 *                 email: "jan.novak@example.com"
 *                 phone: "+420 123 456 789"
 *                 jobTitle: "Senior projektový manažer"
 *     responses:
 *       200:
 *         description: Kontakt byl úspěšně aktualizován
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       404:
 *         description: Kontakt nebyl nalezen
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
 *         description: Konflikt verzí (kontakt byl mezitím změněn)
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
  validateBody(UpdateContactDtoSchema),
  (req, res) => contactController.update(req, res)
);

/**
 * @swagger
 * /api/v1/contacts/{id}:
 *   delete:
 *     summary: Smazání kontaktu
 *     description: Označí kontakt jako smazaný v eWay-CRM (soft delete)
 *     tags: [Contacts]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       204:
 *         description: Kontakt byl úspěšně smazán (bez obsahu)
 *       404:
 *         description: Kontakt nebyl nalezen
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
  (req, res) => contactController.delete(req, res)
);

export default router; 