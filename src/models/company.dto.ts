import { z } from 'zod';

// Zod schéma pro validaci společnosti
export const CompanyDtoSchema = z.object({
  id: z.string().optional(),
  companyName: z.string().min(1, 'Název společnosti je povinný'),
  fileAs: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Neplatný email formát').optional().or(z.literal('')),
  website: z.string().url('Neplatná URL').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  ico: z.string().optional(), // IČO
  dic: z.string().optional(), // DIČ
  note: z.string().optional(),
  
  // System fields
  created: z.string().optional(),
  modified: z.string().optional(),
  itemVersion: z.number().optional(),
  isDeleted: z.boolean().optional(),
});

export const CreateCompanyDtoSchema = CompanyDtoSchema.omit({
  id: true,
  created: true,
  modified: true,
  itemVersion: true,
  isDeleted: true,
});

export const UpdateCompanyDtoSchema = CompanyDtoSchema.omit({
  id: true,
  created: true,
  modified: true,
}).partial();

// TypeScript typy odvozené ze schémat
export type CompanyDto = z.infer<typeof CompanyDtoSchema>;
export type CreateCompanyDto = z.infer<typeof CreateCompanyDtoSchema>;
export type UpdateCompanyDto = z.infer<typeof UpdateCompanyDtoSchema>;

// Interface pro originální eWay data
export interface EwayCompany {
  ItemGUID?: string;
  CompanyName: string;
  FileAs?: string;
  Phone?: string;
  Email?: string;
  WebPage?: string;
  BusinessAddress?: string;
  BusinessAddressCity?: string;
  BusinessAddressPostalCode?: string;
  BusinessAddressCountry?: string;
  Remark?: string;
  ItemVersion?: number;
  IsDeleted?: boolean;
  DateCreated?: string;
  DateModified?: string;
  
  // Dodatečná pole (custom fields)
  AdditionalFields?: {
    cf_ICO?: string;
    cf_DIC?: string;
    [key: string]: any;
  };
} 