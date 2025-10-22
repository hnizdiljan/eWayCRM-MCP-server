import { Router } from 'express';
import { z } from 'zod';
import enumTypeController from '../controllers/enum-type.controller';
import { validateQuery, validateParams } from '../middleware/validation.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Schémata pro validaci query parametrů
const SearchQuerySchema = z.object({
  enumName: z.string().optional(),
  folderName: z.string().optional(),
  includeEnumValues: z.enum(['true', 'false']).optional(),
});

const EnumNameParamSchema = z.object({
  enumName: z.string().min(1, 'Název enum typu je povinný')
});

const FolderNameParamSchema = z.object({
  folderName: z.string().min(1, 'Název složky je povinný')
});

const IncludeValuesQuerySchema = z.object({
  includeEnumValues: z.enum(['true', 'false']).optional(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     EnumValue:
 *       type: object
 *       properties:
 *         itemGuid:
 *           type: string
 *           format: uuid
 *           description: GUID hodnoty enumeration
 *         enumType:
 *           type: string
 *           description: GUID typu enumeration
 *         enumTypeName:
 *           type: string
 *           description: Název typu enumeration
 *         rank:
 *           type: integer
 *           description: Pořadí hodnoty
 *         isSystem:
 *           type: boolean
 *           description: Zda je systémová hodnota
 *         isVisible:
 *           type: boolean
 *           description: Zda je hodnota viditelná
 *         isDefault:
 *           type: boolean
 *           description: Zda je výchozí hodnota
 *         en:
 *           type: string
 *           description: Anglický název
 *         cs:
 *           type: string
 *           description: Český název
 *         de:
 *           type: string
 *           description: Německý název
 *         fileAs:
 *           type: string
 *           description: Zobrazovaný název
 *       example:
 *         itemGuid: "123e4567-e89b-12d3-a456-426614174000"
 *         enumTypeName: "ImportanceEn"
 *         rank: 1
 *         en: "High"
 *         cs: "Vysoká"
 *         isVisible: true
 *         isDefault: false
 *
 *     EnumType:
 *       type: object
 *       properties:
 *         itemGuid:
 *           type: string
 *           format: uuid
 *           description: GUID typu enumeration
 *         enumName:
 *           type: string
 *           description: Název enum typu
 *         isSystem:
 *           type: boolean
 *           description: Zda je systémový typ
 *         isAdditionalField:
 *           type: boolean
 *           description: Zda je dodatečné pole
 *         associatedFolderNames:
 *           type: array
 *           items:
 *             type: string
 *           description: Názvy přidružených složek
 *         nameEn:
 *           type: string
 *           description: Anglický název
 *         nameCs:
 *           type: string
 *           description: Český název
 *         enumValues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EnumValue'
 *           description: Hodnoty enumeration
 *       example:
 *         itemGuid: "456e7890-e89b-12d3-a456-426614174000"
 *         enumName: "ImportanceEn"
 *         nameEn: "Importance"
 *         nameCs: "Důležitost"
 *         isSystem: true
 *         associatedFolderNames: ["Tasks", "Journal"]
 *         enumValues:
 *           - itemGuid: "123e4567-e89b-12d3-a456-426614174001"
 *             en: "High"
 *             cs: "Vysoká"
 *           - itemGuid: "123e4567-e89b-12d3-a456-426614174002"
 *             en: "Normal"
 *             cs: "Normální"
 *           - itemGuid: "123e4567-e89b-12d3-a456-426614174003"
 *             en: "Low"
 *             cs: "Nízká"
 */

/**
 * @swagger
 * /api/v1/enum-types:
 *   get:
 *     summary: Vyhledání enum typů
 *     description: |
 *       Vyhledá enum typy s možností filtrování podle jména nebo složky.
 *
 *       **Důležité:** Názvy enum typů se liší od názvů polí v API!
 *       - Pro Tasks Importance použijte: `TaskImportance` (ne ImportanceEn)
 *       - Pro Tasks Type použijte: `TaskType` (ne TypeEn)
 *       - Pro Tasks State použijte: `TaskState` (ne StateEn)
 *
 *       Doporučujeme nejprve zavolat GET /api/v1/enum-types/tasks pro získání všech enum typů pro Tasks.
 *     tags: [Enum Types]
 *     parameters:
 *       - in: query
 *         name: enumName
 *         schema:
 *           type: string
 *         description: Filtrovat podle názvu enum typu (např. TaskImportance, TaskType, TaskState)
 *         example: TaskImportance
 *       - in: query
 *         name: folderName
 *         schema:
 *           type: string
 *         description: Filtrovat podle názvu složky (např. Tasks, Leads, Companies)
 *         example: Tasks
 *       - in: query
 *         name: includeEnumValues
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Zda zahrnout hodnoty enumeration
 *     responses:
 *       200:
 *         description: Seznam enum typů
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
 *                     $ref: '#/components/schemas/EnumType'
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/',
  requireAuth,
  validateQuery(SearchQuerySchema),
  (req, res) => enumTypeController.search(req, res)
);

/**
 * @swagger
 * /api/v1/enum-types/tasks:
 *   get:
 *     summary: Enum typy pro Tasks
 *     description: |
 *       Získá všechny enum typy pro modul Tasks včetně GUID hodnot.
 *
 *       **Vrácené enum typy zahrnují:**
 *       - `TaskImportance` - Důležitost úkolu (High/Vysoká, Normal/Normální, Low/Nízká)
 *       - `TaskType` - Typ úkolu
 *       - `TaskState` - Stav úkolu
 *
 *       **Použití:** Získané GUID hodnoty použijte v polích ImportanceEn, TypeEn, StateEn při vytváření nebo aktualizaci úkolů.
 *
 *       **Příklad:** Pro vytvoření úkolu s vysokou prioritou použijte GUID hodnotu z TaskImportance enumValue s en="High".
 *     tags: [Enum Types]
 *     responses:
 *       200:
 *         description: Seznam enum typů pro Tasks
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
 *                     $ref: '#/components/schemas/EnumType'
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/tasks',
  requireAuth,
  (req, res) => enumTypeController.getTaskEnumTypes(req, res)
);

/**
 * @swagger
 * /api/v1/enum-types/folder/{folderName}:
 *   get:
 *     summary: Enum typy podle složky
 *     description: Získá všechny enum typy pro konkrétní složku
 *     tags: [Enum Types]
 *     parameters:
 *       - in: path
 *         name: folderName
 *         required: true
 *         schema:
 *           type: string
 *         description: Název složky (např. Tasks, Leads, Companies)
 *       - in: query
 *         name: includeEnumValues
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Zda zahrnout hodnoty enumeration
 *     responses:
 *       200:
 *         description: Seznam enum typů pro složku
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
 *                     $ref: '#/components/schemas/EnumType'
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/folder/:folderName',
  requireAuth,
  validateParams(FolderNameParamSchema),
  validateQuery(IncludeValuesQuerySchema),
  (req, res) => enumTypeController.getByFolderName(req, res)
);

/**
 * @swagger
 * /api/v1/enum-types/{enumName}:
 *   get:
 *     summary: Detail enum typu
 *     description: |
 *       Získá konkrétní enum typ podle názvu včetně všech GUID hodnot.
 *
 *       **Důležité:** Používejte správné názvy enum typů (např. TaskImportance, ne ImportanceEn).
 *     tags: [Enum Types]
 *     parameters:
 *       - in: path
 *         name: enumName
 *         required: true
 *         schema:
 *           type: string
 *         description: Název enum typu (např. TaskImportance, TaskType, TaskState)
 *         example: TaskImportance
 *       - in: query
 *         name: includeEnumValues
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Zda zahrnout hodnoty enumeration
 *     responses:
 *       200:
 *         description: Detail enum typu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EnumType'
 *       404:
 *         description: Enum typ nebyl nalezen
 *       500:
 *         description: Vnitřní chyba serveru
 */
router.get('/:enumName',
  requireAuth,
  validateParams(EnumNameParamSchema),
  validateQuery(IncludeValuesQuerySchema),
  (req, res) => enumTypeController.getByName(req, res)
);

export default router;
