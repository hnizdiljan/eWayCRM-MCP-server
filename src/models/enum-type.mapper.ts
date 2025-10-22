import { EnumTypeDto, EnumValueDto, EwayEnumType, EwayEnumValue } from './enum-type.dto';

/**
 * Konvertuje eWay-CRM enum value do MCP DTO formátu
 */
export function ewayEnumValueToMcpEnumValue(ewayEnumValue: EwayEnumValue): EnumValueDto {
  return {
    itemGuid: ewayEnumValue.ItemGUID || undefined,
    enumType: ewayEnumValue.EnumType || undefined,
    enumTypeName: ewayEnumValue.EnumTypeName || undefined,
    rank: ewayEnumValue.Rank || undefined,
    isSystem: ewayEnumValue.IsSystem || false,
    isVisible: ewayEnumValue.IsVisible !== false, // Default true
    isDefault: ewayEnumValue.IsDefault || false,
    en: ewayEnumValue.En || undefined,
    cs: ewayEnumValue.Cs || undefined,
    de: ewayEnumValue.De || undefined,
    ru: ewayEnumValue.Ru || undefined,
    sk: ewayEnumValue.Sk || undefined,
    no: ewayEnumValue.No || undefined,
    fileAs: ewayEnumValue.FileAs || undefined,
  };
}

/**
 * Konvertuje eWay-CRM enum type do MCP DTO formátu
 */
export function ewayEnumTypeToMcpEnumType(ewayEnumType: EwayEnumType): EnumTypeDto {
  return {
    itemGuid: ewayEnumType.ItemGUID || undefined,
    enumName: ewayEnumType.EnumName || undefined,
    isSystem: ewayEnumType.IsSystem || false,
    isAdditionalField: ewayEnumType.IsAdditionalField || false,
    associatedFolderNames: ewayEnumType.AssociatedFolderNames || undefined,
    nameEn: ewayEnumType.NameEn || undefined,
    nameCs: ewayEnumType.NameCs || undefined,
    nameDe: ewayEnumType.NameDe || undefined,
    nameRu: ewayEnumType.NameRu || undefined,
    nameSk: ewayEnumType.NameSk || undefined,
    nameNo: ewayEnumType.NameNo || undefined,
    enumValues: ewayEnumType.EnumValuesInEnumType
      ? ewayEnumType.EnumValuesInEnumType.map(ev => ewayEnumValueToMcpEnumValue(ev))
      : undefined,
    fileAs: ewayEnumType.FileAs || undefined,
  };
}

/**
 * Vytváří parametry pro vyhledávání enum types pomocí SearchEnumTypes
 *
 * POZNÁMKA: SearchEnumTypes podporuje pouze filtrování podle EnumName a IsSystem.
 * Filtrování podle AssociatedFolderNames musí být provedeno na straně serveru po získání dat.
 */
export function createSearchEnumTypesParameters(options?: {
  enumName?: string;
  associatedFolderNames?: string[];
  includeEnumValues?: boolean;
}): any {
  const params: any = {
    transmitObject: {},
    includeRelations: false,
    omitEnumValues: options?.includeEnumValues === false, // Default false = include values
  };

  // Přidání filtrů - pouze EnumName je podporován pro SearchEnumTypes
  if (options?.enumName) {
    params.transmitObject.EnumName = options.enumName;
  }

  // AssociatedFolderNames NENÍ podporován v SearchEnumTypes transmitObject
  // Filtrování podle složek musí být provedeno na straně serveru po získání dat

  return params;
}
