import { z } from 'zod';

/**
 * Zod schéma pro hodnotu enumeration
 */
export const EnumValueDtoSchema = z.object({
  itemGuid: z.string().optional(),
  enumType: z.string().optional(),
  enumTypeName: z.string().optional(),
  rank: z.number().optional(),
  isSystem: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  en: z.string().optional(),
  cs: z.string().optional(),
  de: z.string().optional(),
  ru: z.string().optional(),
  sk: z.string().optional(),
  no: z.string().optional(),
  fileAs: z.string().optional(),
});

/**
 * Zod schéma pro typ enumeration
 */
export const EnumTypeDtoSchema = z.object({
  itemGuid: z.string().optional(),
  enumName: z.string().optional(),
  isSystem: z.boolean().optional(),
  isAdditionalField: z.boolean().optional(),
  associatedFolderNames: z.array(z.string()).optional(),
  nameEn: z.string().optional(),
  nameCs: z.string().optional(),
  nameDe: z.string().optional(),
  nameRu: z.string().optional(),
  nameSk: z.string().optional(),
  nameNo: z.string().optional(),
  enumValues: z.array(EnumValueDtoSchema).optional(),
  fileAs: z.string().optional(),
});

export type EnumValueDto = z.infer<typeof EnumValueDtoSchema>;
export type EnumTypeDto = z.infer<typeof EnumTypeDtoSchema>;

/**
 * Rozhraní pro EnumValue data z eWay-CRM API
 */
export interface EwayEnumValue {
  ItemGUID?: string;
  EnumType?: string;
  EnumTypeName?: string;
  Rank?: number;
  IsSystem?: boolean;
  IsVisible?: boolean;
  IsDefault?: boolean;
  En?: string;
  Cs?: string;
  De?: string;
  Ru?: string;
  Sk?: string;
  No?: string;
  FileAs?: string;
  IncludeInLastActivityCalculation?: boolean;
  NonEmptyFieldsPrecondition?: string[];
  FieldsLockedByAction?: string[];
  PerformsLockItemAction?: boolean;
  PerformsAreEqualAction?: boolean;
  PerformsCheckRelationPresenceAction?: boolean;
  PerformsWriteJournalAction?: boolean;
  PerformsSetOwnerAction?: boolean;
  PerformsSetFieldValueAction?: boolean;
  PerformsCreateTaskAction?: boolean;
  PerformsCreateRelationAction?: boolean;
  PerformsSendEmailAction?: boolean;
  SetOwnerActionMessage?: string;
  WriteJournalActionTitle?: string;
  WriteJournalActionTypeEn?: string;
  WriteJournalActionImportanceEn?: string;
  WriteJournalActionMessage?: string;
  AllActionEvents?: any[];
  ActionItemGuid?: string;
  Server_ItemCreated?: string;
  Server_ItemChanged?: string;
  ItemCreated?: string;
  ItemChanged?: string;
  OwnerGUID?: string;
  CreatedByGUID?: string;
  ModifiedByGUID?: string;
  AdditionalFields?: any;
  Relations?: any[];
  ItemVersion?: number;
  [key: string]: any;
}

/**
 * Rozhraní pro EnumType data z eWay-CRM API
 */
export interface EwayEnumType {
  ItemGUID?: string;
  EnumName?: string;
  IsSystem?: boolean;
  IsAdditionalField?: boolean;
  AssociatedAdditionalFieldId?: number;
  AssociatedFolderNames?: string[];
  AssociatedWorkflowModelGuid?: string;
  AllowEditVisibility?: boolean;
  AllowEditLastActivity?: boolean;
  RequireDefaultValue?: boolean;
  NameEn?: string;
  NameCs?: string;
  NameDe?: string;
  NameRu?: string;
  NameSk?: string;
  NameNo?: string;
  EnumValuesInEnumType?: EwayEnumValue[];
  EditMode?: string;
  IsPrivate?: boolean;
  Server_ItemCreated?: string;
  Server_ItemChanged?: string;
  ItemCreated?: string;
  ItemChanged?: string;
  FileAs?: string;
  OwnerGUID?: string;
  CreatedByGUID?: string;
  ModifiedByGUID?: string;
  AdditionalFields?: any;
  Relations?: any[];
  ItemVersion?: number;
  [key: string]: any;
}
