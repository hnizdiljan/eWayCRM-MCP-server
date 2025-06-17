import { z } from 'zod';

// Zod schéma pro validaci obchodu/příležitosti
export const DealDtoSchema = z.object({
  id: z.string().optional(),
  projectName: z.string().min(1, 'Název obchodu je povinný'),
  fileAs: z.string().optional(),
  companyId: z.string().optional(), // Propojení se společností
  companyName: z.string().optional(), // Jen pro čtení
  contactId: z.string().optional(), // Propojení s kontaktem
  contactName: z.string().optional(), // Jen pro čtení
  
  // Obchodní údaje
  price: z.number().min(0, 'Cena musí být nezáporná').optional(),
  currency: z.string().optional(),
  probability: z.number().min(0).max(100, 'Pravděpodobnost musí být 0-100%').optional(),
  dealStage: z.string().optional(), // Fáze obchodu
  dealType: z.string().optional(), // Typ obchodu
  
  // Termíny
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  deadlineDate: z.string().optional(), // ISO date string
  
  // Popis a poznámky
  description: z.string().optional(),
  note: z.string().optional(),
  
  // System fields
  created: z.string().optional(),
  modified: z.string().optional(),
  itemVersion: z.number().optional(),
  isDeleted: z.boolean().optional(),
});

export const CreateDealDtoSchema = DealDtoSchema.omit({
  id: true,
  companyName: true, // Nelze nastavit při vytváření
  contactName: true, // Nelze nastavit při vytváření
  created: true,
  modified: true,
  itemVersion: true,
  isDeleted: true,
});

export const UpdateDealDtoSchema = DealDtoSchema.omit({
  id: true,
  companyName: true, // Nelze aktualizovat
  contactName: true, // Nelze aktualizovat
  created: true,
  modified: true,
}).partial();

// TypeScript typy odvozené ze schémat
export type DealDto = z.infer<typeof DealDtoSchema>;
export type CreateDealDto = z.infer<typeof CreateDealDtoSchema>;
export type UpdateDealDto = z.infer<typeof UpdateDealDtoSchema>;

/**
 * Rozhraní pro deal data z eWay-CRM API
 */
export interface EwayDeal {
  ItemGUID: string;
  ItemVersion: number;
  
  // Základní údaje
  ProjectName: string;
  FileAs?: string;
  Description?: string;
  Note?: string;
  
  // Obchodní údaje
  Price?: number;
  Currency?: string;
  Probability?: number;
  DealStage?: string;
  DealType?: string;
  
  // Termíny
  StartDate?: string;
  EndDate?: string;
  DeadlineDate?: string;
  
  // Propojení
  CompanyGUID?: string;
  CompanyName?: string;
  ContactGUID?: string;
  ContactName?: string;
  
  // Custom fields
  AdditionalFields?: {
    [key: string]: any;
  };
  
  // System fields
  DateCreated?: string;
  DateModified?: string;
  IsDeleted?: boolean;
  
  // Ostatní eWay-CRM pole
  [key: string]: any;
} 