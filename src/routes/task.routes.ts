import { Router } from 'express';
import { z } from 'zod';
import taskController from '../controllers/task.controller';
import { validateQuery, validateBody, validateParams } from '../middleware/validation.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { CreateTaskDtoSchema, UpdateTaskDtoSchema } from '../models/task.dto';

const router = Router();

// Schémata pro validaci query parametrů
const SearchQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
  offset: z.coerce.number().min(0).default(0),
  companyId: z.string().uuid('Neplatný formát ID společnosti').optional(),
  contactId: z.string().uuid('Neplatný formát ID kontaktu').optional(),
  taskSolverId: z.string().uuid('Neplatný formát ID řešitele').optional(),
  taskDelegatorId: z.string().uuid('Neplatný formát ID delegujícího').optional(),
  isCompleted: z.enum(['true', 'false']).optional(),
});

const IdParamSchema = z.object({
  id: z.string().uuid('Neplatný formát ID')
});

const CompanyIdParamSchema = z.object({
  companyId: z.string().uuid('Neplatný formát ID společnosti')
});

const ContactIdParamSchema = z.object({
  contactId: z.string().uuid('Neplatný formát ID kontaktu')
});

const TaskSolverIdParamSchema = z.object({
  taskSolverId: z.string().uuid('Neplatný formát ID řešitele')
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - subject
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unikátní identifikátor úkolu
 *         subject:
 *           type: string
 *           description: Předmět úkolu
 *         body:
 *           type: string
 *           description: Tělo/popis úkolu
 *         fileAs:
 *           type: string
 *           description: Zobrazovaný název
 *         isCompleted:
 *           type: boolean
 *           description: Zda je úkol dokončen
 *         completedDate:
 *           type: string
 *           format: date-time
 *           description: Datum dokončení
 *         percentComplete:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Procento dokončení
 *         state:
 *           type: string
 *           description: Stav úkolu
 *         previousState:
 *           type: string
 *           description: Předchozí stav úkolu
 *         startDate:
 *           type: string
 *           format: date
 *           description: Datum zahájení
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Termín splnění
 *         type:
 *           type: string
 *           description: Typ úkolu
 *         importance:
 *           type: string
 *           description: Důležitost úkolu
 *         level:
 *           type: integer
 *           description: Úroveň úkolu
 *         actualWorkHours:
 *           type: number
 *           minimum: 0
 *           description: Skutečný pracovní čas v hodinách
 *         estimatedWorkHours:
 *           type: number
 *           minimum: 0
 *           description: Odhadovaný pracovní čas v hodinách
 *         isReminderSet:
 *           type: boolean
 *           description: Zda je nastavena připomínka
 *         reminderDate:
 *           type: string
 *           format: date-time
 *           description: Datum a čas připomínky
 *         isPrivate:
 *           type: boolean
 *           description: Zda je úkol soukromý
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
 *         taskSolverId:
 *           type: string
 *           format: uuid
 *           description: ID řešitele úkolu
 *         taskSolverName:
 *           type: string
 *           description: Jméno řešitele úkolu (jen pro čtení)
 *         taskDelegatorId:
 *           type: string
 *           format: uuid
 *           description: ID delegujícího úkol
 *         taskDelegatorName:
 *           type: string
 *           description: Jméno delegujícího (jen pro čtení)
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
 *         subject: "Připravit prezentaci pro klienta"
 *         body: "Připravit prezentaci produktu pro schůzku s klientem ACME"
 *         isCompleted: false
 *         percentComplete: 50
 *         dueDate: "2024-02-15"
 *         importance: "High"
 *         actualWorkHours: 2
 *         estimatedWorkHours: 4
 *         companyId: "456e7890-e89b-12d3-a456-426614174000"
 *         companyName: "ACME s.r.o."
 *         taskSolverId: "789e0123-e89b-12d3-a456-426614174000"
 *         created: "2024-02-01T10:00:00.000Z"
 *         itemVersion: 1
 *
 *     CreateTask:
 *       type: object
 *       required:
 *         - subject
 *         - taskDelegatorId
 *       properties:
 *         subject:
 *           type: string
 *           description: Předmět úkolu
 *         body:
 *           type: string
 *           description: Tělo/popis úkolu
 *         fileAs:
 *           type: string
 *           description: Zobrazovaný název
 *         isCompleted:
 *           type: boolean
 *           description: Zda je úkol dokončen
 *         completedDate:
 *           type: string
 *           format: date-time
 *           description: Datum dokončení
 *         percentComplete:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Procento dokončení
 *         state:
 *           type: string
 *           description: Stav úkolu
 *         startDate:
 *           type: string
 *           format: date
 *           description: Datum zahájení
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Termín splnění
 *         type:
 *           type: string
 *           description: Typ úkolu
 *         importance:
 *           type: string
 *           description: Důležitost úkolu
 *         actualWorkHours:
 *           type: number
 *           minimum: 0
 *           description: Skutečný pracovní čas v hodinách
 *         estimatedWorkHours:
 *           type: number
 *           minimum: 0
 *           description: Odhadovaný pracovní čas v hodinách
 *         isReminderSet:
 *           type: boolean
 *           description: Zda je nastavena připomínka
 *         reminderDate:
 *           type: string
 *           format: date-time
 *           description: Datum a čas připomínky
 *         isPrivate:
 *           type: boolean
 *           description: Zda je úkol soukromý
 *         companyId:
 *           type: string
 *           format: uuid
 *           description: ID propojené společnosti
 *         contactId:
 *           type: string
 *           format: uuid
 *           description: ID propojeného kontaktu
 *         taskSolverId:
 *           type: string
 *           format: uuid
 *           description: ID řešitele úkolu
 *         taskDelegatorId:
 *           type: string
 *           format: uuid
 *           description: ID zadavatele úkolu (povinné pole - osoba, která úkol zadává)
 *       example:
 *         subject: "Připravit prezentaci pro klienta"
 *         body: "Připravit prezentaci produktu pro schůzku s klientem ACME"
 *         dueDate: "2024-02-15"
 *         importance: "High"
 *         estimatedWorkHours: 4
 *         companyId: "456e7890-e89b-12d3-a456-426614174000"
 *         taskDelegatorId: "111e2222-e89b-12d3-a456-426614174000"
 *         taskSolverId: "789e0123-e89b-12d3-a456-426614174000"
 */

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     summary: Seznam všech úkolů
 *     description: Získá seznam úkolů s možností vyhledávání, filtrování a stránkování
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Vyhledávací dotaz (předmět úkolu)
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
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrovat podle ID společnosti
 *       - in: query
 *         name: contactId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrovat podle ID kontaktu
 *       - in: query
 *         name: taskSolverId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrovat podle ID řešitele
 *       - in: query
 *         name: isCompleted
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrovat podle stavu dokončení
 *     responses:
 *       200:
 *         description: Seznam úkolů
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
 *                     $ref: '#/components/schemas/Task'
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
  (req, res) => taskController.getAll(req, res)
);

/**
 * @swagger
 * /api/v1/tasks/completed:
 *   get:
 *     summary: Dokončené úkoly
 *     description: Získá seznam všech dokončených úkolů
 *     tags: [Tasks]
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
 *         description: Seznam dokončených úkolů
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
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/completed',
  requireAuth,
  validateQuery(SearchQuerySchema.omit({ q: true, companyId: true, contactId: true, taskSolverId: true, taskDelegatorId: true, isCompleted: true })),
  (req, res) => taskController.getCompleted(req, res)
);

/**
 * @swagger
 * /api/v1/tasks/pending:
 *   get:
 *     summary: Nedokončené úkoly
 *     description: Získá seznam všech nedokončených úkolů
 *     tags: [Tasks]
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
 *         description: Seznam nedokončených úkolů
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
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/pending',
  requireAuth,
  validateQuery(SearchQuerySchema.omit({ q: true, companyId: true, contactId: true, taskSolverId: true, taskDelegatorId: true, isCompleted: true })),
  (req, res) => taskController.getPending(req, res)
);

/**
 * @swagger
 * /api/v1/tasks/by-company/{companyId}:
 *   get:
 *     summary: Úkoly podle společnosti
 *     description: Získá všechny úkoly propojené s konkrétní společností
 *     tags: [Tasks]
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
 *         description: Seznam úkolů společnosti
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
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Neplatné ID společnosti
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/by-company/:companyId',
  requireAuth,
  validateParams(CompanyIdParamSchema),
  validateQuery(SearchQuerySchema.omit({ q: true, companyId: true, contactId: true, taskSolverId: true, taskDelegatorId: true, isCompleted: true })),
  (req, res) => taskController.getByCompanyId(req, res)
);

/**
 * @swagger
 * /api/v1/tasks/by-contact/{contactId}:
 *   get:
 *     summary: Úkoly podle kontaktu
 *     description: Získá všechny úkoly propojené s konkrétním kontaktem
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID kontaktu
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
 *         description: Seznam úkolů kontaktu
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
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Neplatné ID kontaktu
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/by-contact/:contactId',
  requireAuth,
  validateParams(ContactIdParamSchema),
  validateQuery(SearchQuerySchema.omit({ q: true, companyId: true, contactId: true, taskSolverId: true, taskDelegatorId: true, isCompleted: true })),
  (req, res) => taskController.getByContactId(req, res)
);

/**
 * @swagger
 * /api/v1/tasks/by-solver/{taskSolverId}:
 *   get:
 *     summary: Úkoly podle řešitele
 *     description: Získá všechny úkoly přiřazené konkrétnímu řešiteli
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskSolverId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID řešitele úkolu
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
 *         description: Seznam úkolů řešitele
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
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Neplatné ID řešitele
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/by-solver/:taskSolverId',
  requireAuth,
  validateParams(TaskSolverIdParamSchema),
  validateQuery(SearchQuerySchema.omit({ q: true, companyId: true, contactId: true, taskSolverId: true, taskDelegatorId: true, isCompleted: true })),
  (req, res) => taskController.getByTaskSolverId(req, res)
);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     summary: Detail úkolu
 *     description: Získá detail konkrétního úkolu podle ID
 *     tags: [Tasks]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Detail úkolu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Úkol nebyl nalezen
 *       400:
 *         description: Neplatné ID
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/:id',
  requireAuth,
  validateParams(IdParamSchema),
  (req, res) => taskController.getById(req, res)
);

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     summary: Vytvoření nového úkolu
 *     description: Vytvoří nový úkol v eWay-CRM
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTask'
 *     responses:
 *       201:
 *         description: Úkol byl úspěšně vytvořen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *       400:
 *         description: Chybná validace dat
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.post('/',
  requireAuth,
  validateBody(CreateTaskDtoSchema),
  (req, res) => taskController.create(req, res)
);

/**
 * @swagger
 * /api/v1/tasks/{id}/complete:
 *   put:
 *     summary: Uzavření úkolu
 *     description: Uzavře úkol nastavením isCompleted=true, completedDate=dnešní datum, percentComplete=100
 *     tags: [Tasks]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Úkol byl úspěšně uzavřen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *                   example: Úkol byl úspěšně uzavřen
 *       404:
 *         description: Úkol nebyl nalezen
 *       400:
 *         description: Neplatné ID
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.put('/:id/complete',
  requireAuth,
  validateParams(IdParamSchema),
  (req, res) => taskController.complete(req, res)
);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     summary: Aktualizace úkolu
 *     description: Aktualizuje existující úkol v eWay-CRM
 *     tags: [Tasks]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTask'
 *     responses:
 *       200:
 *         description: Úkol byl úspěšně aktualizován
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *       400:
 *         description: Chybná validace dat
 *       404:
 *         description: Úkol nebyl nalezen
 *       409:
 *         description: Konflikt verzí (úkol byl mezitím změněn)
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.put('/:id',
  requireAuth,
  validateParams(IdParamSchema),
  validateBody(UpdateTaskDtoSchema),
  (req, res) => taskController.update(req, res)
);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     summary: Smazání úkolu
 *     description: Označí úkol jako smazaný v eWay-CRM (soft delete)
 *     tags: [Tasks]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       204:
 *         description: Úkol byl úspěšně smazán (bez obsahu)
 *       404:
 *         description: Úkol nebyl nalezen
 *       400:
 *         description: Neplatné ID
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.delete('/:id',
  requireAuth,
  validateParams(IdParamSchema),
  (req, res) => taskController.delete(req, res)
);

export default router;
