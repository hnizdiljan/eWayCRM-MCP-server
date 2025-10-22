import { z } from 'zod';

// Zod schéma pro validaci úkolu
export const TaskDtoSchema = z.object({
  id: z.string().optional(),
  subject: z.string().min(1, 'Předmět úkolu je povinný'),
  body: z.string().optional(),
  fileAs: z.string().optional(),

  // Stav úkolu
  isCompleted: z.boolean().optional(),
  completedDate: z.string().optional(), // ISO date string
  percentComplete: z.number().min(0).max(100, 'Procento dokončení musí být 0-100%').optional(),
  state: z.string().optional(), // StateEn - stav úkolu
  previousState: z.string().optional(), // PrevStateEn

  // Termíny
  startDate: z.string().optional(), // ISO date string
  dueDate: z.string().optional(), // ISO date string

  // Typ a priorita
  type: z.string().optional(), // TypeEn
  importance: z.string().optional(), // ImportanceEn
  level: z.number().optional(),

  // Pracovní čas
  actualWorkHours: z.number().min(0, 'Skutečný pracovní čas musí být nezáporný').optional(),
  estimatedWorkHours: z.number().min(0, 'Odhadovaný pracovní čas musí být nezáporný').optional(),

  // Připomínka
  isReminderSet: z.boolean().optional(),
  reminderDate: z.string().optional(), // ISO datetime string

  // Obrázek
  picture: z.string().optional(),
  pictureWidth: z.number().optional(),
  pictureHeight: z.number().optional(),

  // Soukromí
  isPrivate: z.boolean().optional(),

  // Vztahy k jiným entitám - Leads
  leadTopLevelProjectId: z.string().optional(),
  leadTaskParentId: z.string().optional(),

  // Vztahy k jiným entitám - Projects
  projectTopLevelProjectId: z.string().optional(),
  projectTaskParentId: z.string().optional(),

  // Vztahy k jiným entitám - Tasks
  taskParentId: z.string().optional(),
  taskOriginId: z.string().optional(),

  // Vztahy k jiným entitám - Marketing
  marketingTopLevelProjectId: z.string().optional(),
  marketingTaskParentId: z.string().optional(),

  // Vztahy k jiným entitám - Company/Contact
  companyId: z.string().optional(),
  companyName: z.string().optional(), // Jen pro čtení
  contactId: z.string().optional(),
  contactName: z.string().optional(), // Jen pro čtení

  // Vztahy k jiným entitám - Users
  taskDelegatorId: z.string().uuid('Neplatný formát ID zadavatele').optional(),
  taskDelegatorName: z.string().optional(), // Jen pro čtení
  taskSolverId: z.string().uuid('Neplatný formát ID řešitele').optional(),
  taskSolverName: z.string().optional(), // Jen pro čtení

  // Vlastník a metadata
  ownerId: z.string().optional(),
  createdById: z.string().optional(),
  modifiedById: z.string().optional(),

  // System fields
  created: z.string().optional(),
  modified: z.string().optional(),
  serverCreated: z.string().optional(),
  serverModified: z.string().optional(),
  itemVersion: z.number().optional(),
  isDeleted: z.boolean().optional(),
});

export const CreateTaskDtoSchema = TaskDtoSchema.omit({
  id: true,
  companyName: true, // Nelze nastavit při vytváření
  contactName: true, // Nelze nastavit při vytváření
  taskDelegatorName: true, // Nelze nastavit při vytváření
  taskSolverName: true, // Nelze nastavit při vytváření
  created: true,
  modified: true,
  serverCreated: true,
  serverModified: true,
  itemVersion: true,
  isDeleted: true,
}).extend({
  // taskDelegatorId je povinný při vytváření nového úkolu
  taskDelegatorId: z.string().uuid('Neplatný formát ID zadavatele').min(1, 'ID zadavatele úkolu je povinné'),
});

export const UpdateTaskDtoSchema = TaskDtoSchema.omit({
  id: true,
  companyName: true, // Nelze aktualizovat
  contactName: true, // Nelze aktualizovat
  taskDelegatorName: true, // Nelze aktualizovat
  taskSolverName: true, // Nelze aktualizovat
  created: true,
  modified: true,
  serverCreated: true,
  serverModified: true,
}).partial();

// TypeScript typy odvozené ze schémat
export type TaskDto = z.infer<typeof TaskDtoSchema>;
export type CreateTaskDto = z.infer<typeof CreateTaskDtoSchema>;
export type UpdateTaskDto = z.infer<typeof UpdateTaskDtoSchema>;

/**
 * Rozhraní pro task data z eWay-CRM API
 */
export interface EwayTask {
  ItemGUID: string;
  ItemVersion: number;

  // Základní údaje
  Subject: string;
  Body?: string;
  FileAs?: string;

  // Stav úkolu
  IsCompleted?: boolean;
  CompletedDate?: string;
  PercentCompleteDecimal?: number;
  StateEn?: string;
  PrevStateEn?: string;

  // Termíny
  StartDate?: string;
  DueDate?: string;

  // Typ a priorita
  TypeEn?: string;
  ImportanceEn?: string;
  Level?: number;

  // Pracovní čas
  ActualWorkHours?: number;
  EstimatedWorkHours?: number;

  // Připomínka
  IsReminderSet?: boolean;
  ReminderDate?: string;

  // Obrázek
  Picture?: string;
  PictureWidth?: number;
  PictureHeight?: number;

  // Soukromí
  IsPrivate?: boolean;

  // Vztahy k jiným entitám - Leads
  Leads_TopLevelProjectGuid?: string;
  Leads_TaskParentGuid?: string;

  // Vztahy k jiným entitám - Projects
  Projects_TopLevelProjectGuid?: string;
  Projects_TaskParentGuid?: string;

  // Vztahy k jiným entitám - Tasks
  Tasks_TaskParentGuid?: string;
  Tasks_TaskOriginGuid?: string;

  // Vztahy k jiným entitám - Marketing
  Marketing_TopLevelProjectGuid?: string;
  Marketing_TaskParentGuid?: string;

  // Vztahy k jiným entitám - Company/Contact
  Companies_CompanyGuid?: string;
  CompanyName?: string;
  Contacts_ContactGuid?: string;
  ContactName?: string;

  // Vztahy k jiným entitám - Users
  Users_TaskDelegatorGuid?: string;
  TaskDelegatorName?: string;
  Users_TaskSolverGuid?: string;
  TaskSolverName?: string;

  // Vlastník a metadata
  OwnerGUID?: string;
  CreatedByGUID?: string;
  ModifiedByGUID?: string;

  // Custom fields
  AdditionalFields?: {
    Count?: number;
    All?: Array<{
      BaseValue: any;
      FieldId: number;
    }>;
    Item?: any;
  };

  // Relations
  Relations?: Array<{
    ItemGUID: string;
    RelationDataGUID: string;
    RelationType: string;
    ForeignFolderName: string;
    ForeignItemGUID: string;
    DifferDirection: boolean;
    OwnerGUID: string;
    MainItemGUID: string;
  }>;

  // System fields
  Server_ItemCreated?: string;
  Server_ItemChanged?: string;
  ItemCreated?: string;
  ItemChanged?: string;
  IsDeleted?: boolean;

  // Ostatní eWay-CRM pole
  [key: string]: any;
}
