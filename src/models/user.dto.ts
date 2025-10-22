import { z } from 'zod';

// Zod schéma pro validaci uživatele
export const UserDtoSchema = z.object({
  id: z.string().optional(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  fileAs: z.string().optional(),

  // Status
  isActive: z.boolean().optional(),
  isSystem: z.boolean().optional(),
  isApiUser: z.boolean().optional(),

  // Kontaktní údaje
  email1Address: z.string().email('Neplatný formát emailu').optional().or(z.literal('')),
  email2Address: z.string().email('Neplatný formát emailu').optional().or(z.literal('')),
  mobilePhoneNumber: z.string().optional(),
  businessPhoneNumber: z.string().optional(),

  // Adresa
  homeAddressStreet: z.string().optional(),
  homeAddressCity: z.string().optional(),
  homeAddressPostalCode: z.string().optional(),
  homeAddressState: z.string().optional(),
  homeAddressPOBox: z.string().optional(),
  homeAddressCountry: z.string().optional(), // HomeAddressCountryEn GUID

  // Pracovní informace
  jobTitle: z.string().optional(),
  isHRManager: z.boolean().optional(),
  isProjectManager: z.boolean().optional(),
  workdayStartTime: z.string().optional(),

  // Osobní údaje
  birthdate: z.string().optional(),
  birthPlace: z.string().optional(),
  idCardNumber: z.string().optional(),
  identificationNumber: z.string().optional(),
  personalIdentificationNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  healthInsurance: z.string().optional(),

  // Dovolená
  holidayLength: z.number().optional(),
  remainingDaysOfHoliday: z.number().optional(),

  // Komunikační nástroje
  msn: z.string().optional(),
  icq: z.string().optional(),
  skype: z.string().optional(),

  // Enumerace
  familyStatus: z.string().optional(), // FamilyStatusEn GUID
  salaryDate: z.string().optional(), // SalaryDateEn GUID
  prefix: z.string().optional(), // PrefixEn GUID
  suffix: z.string().optional(), // SuffixEn GUID
  type: z.string().optional(), // TypeEn GUID
  state: z.string().optional(), // StateEn GUID
  previousState: z.string().optional(), // PrevStateEn GUID

  // Doprava
  transportMode: z.string().optional(),
  travelDistance: z.string().optional(),
  timeAccessibility: z.string().optional(),

  // Poznámka
  note: z.string().optional(),

  // Obrázek profilu
  profilePicture: z.string().optional(),
  profilePictureWidth: z.number().optional(),
  profilePictureHeight: z.number().optional(),

  // Serverová pole (read-only)
  serverPassword: z.string().optional(),
  serverOutlookAccess: z.boolean().optional(),
  serverWebAccess: z.boolean().optional(),
  serverMobileAccess: z.boolean().optional(),
  serverLicensingBundlesList: z.array(z.string()).optional(),
  serverLastLogin: z.string().optional(),
  serverLastActivity: z.string().optional(),
  serverAccountLockedTime: z.string().optional(),
  serverForcePasswordChange: z.boolean().optional(),
  serverIsAccountLocked: z.boolean().optional(),

  // Vztahy
  supervisorId: z.string().optional(), // Users_SupervisorGuid
  supervisorName: z.string().optional(), // Read-only
  defaultGroupId: z.string().optional(), // Groups_Default_GroupGuid
  defaultGroupName: z.string().optional(), // Read-only

  // Vlastník a metadata
  ownerId: z.string().optional(),
  createdById: z.string().optional(),
  modifiedById: z.string().optional(),
  isPrivate: z.boolean().optional(),

  // System fields
  created: z.string().optional(),
  modified: z.string().optional(),
  serverCreated: z.string().optional(),
  serverModified: z.string().optional(),
  itemVersion: z.number().optional(),
});

export const CreateUserDtoSchema = UserDtoSchema.omit({
  id: true,
  supervisorName: true,
  defaultGroupName: true,
  serverLastLogin: true,
  serverLastActivity: true,
  serverAccountLockedTime: true,
  serverIsAccountLocked: true,
  created: true,
  modified: true,
  serverCreated: true,
  serverModified: true,
  itemVersion: true,
});

export const UpdateUserDtoSchema = UserDtoSchema.omit({
  id: true,
  supervisorName: true,
  defaultGroupName: true,
  serverLastLogin: true,
  serverLastActivity: true,
  serverAccountLockedTime: true,
  serverIsAccountLocked: true,
  created: true,
  modified: true,
  serverCreated: true,
  serverModified: true,
}).partial();

// TypeScript typy odvozené ze schémat
export type UserDto = z.infer<typeof UserDtoSchema>;
export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>;

/**
 * Rozhraní pro user data z eWay-CRM API
 */
export interface EwayUser {
  ItemGUID: string;
  ItemVersion: number;

  // Základní údaje
  Username?: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
  FileAs?: string;

  // Status
  IsActive?: boolean;
  IsSystem?: boolean;
  IsApiUser?: boolean;

  // Kontaktní údaje
  Email1Address?: string;
  Email2Address?: string;
  MobilePhoneNumber?: string;
  BusinessPhoneNumber?: string;
  MobilePhoneNumberNormalized?: string;
  BusinessPhoneNumberNormalized?: string;

  // Adresa
  HomeAddressStreet?: string;
  HomeAddressCity?: string;
  HomeAddressPostalCode?: string;
  HomeAddressState?: string;
  HomeAddressPOBox?: string;
  HomeAddressCountryEn?: string;

  // Pracovní informace
  JobTitle?: string;
  IsHRManager?: boolean;
  IsProjectManager?: boolean;
  WorkdayStartTime?: string;

  // Osobní údaje
  Birthdate?: string;
  BirthPlace?: string;
  IDCardNumber?: string;
  IdentificationNumber?: string;
  PersonalIdentificationNumber?: string;
  BankAccount?: string;
  HealthInsurance?: string;

  // Dovolená
  HolidayLength?: number;
  RemainingDaysOfHoliday?: number;

  // Komunikační nástroje
  MSN?: string;
  ICQ?: string;
  Skype?: string;

  // Enumerace
  FamilyStatusEn?: string;
  SalaryDateEn?: string;
  PrefixEn?: string;
  SuffixEn?: string;
  TypeEn?: string;
  StateEn?: string;
  PrevStateEn?: string;

  // Doprava
  TransportMode?: string;
  TravelDistance?: string;
  TimeAccessibility?: string;

  // Poznámka
  Note?: string;

  // Obrázek profilu
  ProfilePicture?: string;
  ProfilePictureWidth?: number;
  ProfilePictureHeight?: number;

  // Serverová pole
  Server_Password?: string;
  Server_OutlookAccess?: boolean;
  Server_WebAccess?: boolean;
  Server_MobileAccess?: boolean;
  Server_LicensingBundlesList?: string[];
  Server_LastLogin?: string;
  Server_LastActivity?: string;
  Server_AccountLockedTime?: string;
  Server_ForcePasswordChange?: boolean;
  Server_IsAccountLocked?: boolean;

  // Vztahy
  Users_SupervisorGuid?: string;
  SupervisorName?: string;
  Groups_Default_GroupGuid?: string;
  DefaultGroupName?: string;

  // Vlastník a metadata
  OwnerGUID?: string;
  CreatedByGUID?: string;
  ModifiedByGUID?: string;
  IsPrivate?: boolean;

  // System fields
  Server_ItemCreated?: string;
  Server_ItemChanged?: string;
  ItemCreated?: string;
  ItemChanged?: string;

  // Custom fields
  AdditionalFields?: any;
  Relations?: any[];

  // Ostatní eWay-CRM pole
  [key: string]: any;
}
