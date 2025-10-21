import { z } from 'zod';

// Zod schéma pro validaci kontaktu
export const ContactDtoSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, 'Jméno je povinné'),
  lastName: z.string().min(1, 'Příjmení je povinné'),
  fullName: z.string().optional(), // FileAs
  companyId: z.string().optional(), // Propojení se společností
  companyName: z.string().optional(), // Jen pro čtení
  email: z.string().email('Neplatný email formát').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  jobTitle: z.string().optional(), // Pozice
  department: z.string().optional(),
  
  // Adresa
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  
  note: z.string().optional(),
  
  // System fields
  created: z.string().optional(),
  modified: z.string().optional(),
  itemVersion: z.number().optional(),
  isDeleted: z.boolean().optional(),
});

export const CreateContactDtoSchema = ContactDtoSchema.omit({
  id: true,
  fullName: true, // Bude automaticky generováno
  companyName: true, // Nelze nastavit při vytváření
  created: true,
  modified: true,
  itemVersion: true,
  isDeleted: true,
});

export const UpdateContactDtoSchema = ContactDtoSchema.omit({
  id: true,
  fullName: true, // Bude automaticky generováno
  companyName: true, // Nelze aktualizovat
  created: true,
  modified: true,
}).partial();

// TypeScript typy odvozené ze schémat
export type ContactDto = z.infer<typeof ContactDtoSchema>;
export type CreateContactDto = z.infer<typeof CreateContactDtoSchema>;
export type UpdateContactDto = z.infer<typeof UpdateContactDtoSchema>;

/**
 * Rozhraní pro contact data z eWay-CRM API
 */
export interface EwayContact {
  ItemGUID: string;
  ItemVersion: number;

  // Základní údaje
  FirstName: string;
  LastName: string;
  FileAs: string;
  Email1Address?: string;
  Email2Address?: string;
  Email3Address?: string;

  // Telefony - podle Swagger API
  TelephoneNumber1?: string;
  TelephoneNumber2?: string;
  TelephoneNumber3?: string;
  TelephoneNumber4?: string;
  TelephoneNumber5?: string;
  TelephoneNumber6?: string;

  // Starší pole (deprecated, pro zpětnou kompatibilitu)
  Phone?: string;
  Mobile?: string;
  JobTitle?: string;

  Department?: string;

  // Adresa - podle Swagger API
  BusinessAddressStreet?: string;
  BusinessAddressCity?: string;
  BusinessAddressPostalCode?: string;
  BusinessAddressPOBox?: string;
  BusinessAddressState?: string;
  BusinessAddressCountryEn?: string; // GUID

  // Starší pole (deprecated)
  BusinessAddress?: string;
  BusinessAddressCountry?: string;

  // Poznámka
  Note?: string;
  Body?: string; // deprecated
  
  // Propojení
  CompanyGUID?: string;
  CompanyName?: string;
  Companies_CompanyGuid?: string; // Skutečné pole z eWay API
  
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