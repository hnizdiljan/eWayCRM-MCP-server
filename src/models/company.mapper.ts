import { CompanyDto, EwayCompany, CreateCompanyDto } from './company.dto';

/**
 * Konvertuje eWay-CRM společnost do MCP DTO formátu
 */
export function ewayCompanyToMcpCompany(ewayCompany: EwayCompany): CompanyDto {
  return {
    id: ewayCompany.ItemGUID,
    companyName: ewayCompany.CompanyName,
    fileAs: ewayCompany.FileAs || undefined,
    phone: ewayCompany.Phone || undefined,
    email: ewayCompany.Email || undefined,
    website: ewayCompany.WebPage || undefined,
    address: ewayCompany.BusinessAddress || undefined,
    city: ewayCompany.BusinessAddressCity || undefined,
    zipCode: ewayCompany.BusinessAddressPostalCode || undefined,
    country: ewayCompany.BusinessAddressCountry || undefined,
    note: ewayCompany.Remark || undefined,
    
    // Custom fields z AdditionalFields
    ico: ewayCompany.AdditionalFields?.cf_ICO || undefined,
    dic: ewayCompany.AdditionalFields?.cf_DIC || undefined,
    
    // System fields
    created: ewayCompany.DateCreated,
    modified: ewayCompany.DateModified,
    itemVersion: ewayCompany.ItemVersion,
    isDeleted: ewayCompany.IsDeleted || false,
  };
}

/**
 * Konvertuje MCP DTO do eWay-CRM formátu pro vytvoření nové společnosti
 */
export function mcpCompanyToEwayCompanyTracked(mcpCompany: CreateCompanyDto): any {
  const ewayData: any = {
    CompanyName: mcpCompany.companyName,
    FileAs: mcpCompany.fileAs || mcpCompany.companyName, // Default na companyName
  };

  // Volitelná pole
  if (mcpCompany.phone) ewayData.Phone = mcpCompany.phone;
  if (mcpCompany.email) ewayData.Email = mcpCompany.email;
  if (mcpCompany.website) ewayData.WebPage = mcpCompany.website;
  if (mcpCompany.address) ewayData.BusinessAddress = mcpCompany.address;
  if (mcpCompany.city) ewayData.BusinessAddressCity = mcpCompany.city;
  if (mcpCompany.zipCode) ewayData.BusinessAddressPostalCode = mcpCompany.zipCode;
  if (mcpCompany.country) ewayData.BusinessAddressCountry = mcpCompany.country;
  if (mcpCompany.note) ewayData.Remark = mcpCompany.note;

  // Custom fields
  if (mcpCompany.ico || mcpCompany.dic) {
    ewayData.AdditionalFields = {};
    if (mcpCompany.ico) ewayData.AdditionalFields.cf_ICO = mcpCompany.ico;
    if (mcpCompany.dic) ewayData.AdditionalFields.cf_DIC = mcpCompany.dic;
  }

  return ewayData;
}

/**
 * Konvertuje MCP DTO do eWay-CRM formátu pro aktualizaci existující společnosti
 */
export function mcpCompanyToEwayCompanyUpdate(mcpCompany: CreateCompanyDto, itemGuid: string, itemVersion?: number): any {
  const ewayData = mcpCompanyToEwayCompanyTracked(mcpCompany);
  
  // Pro update potřebujeme GUID
  ewayData.ItemGUID = itemGuid;
  
  // ItemVersion pro conflict resolution (volitelné)
  if (itemVersion !== undefined) {
    ewayData.ItemVersion = itemVersion;
  }

  return ewayData;
}

/**
 * Vytvoří parametr objekt pro vyhledávání společností
 */
export function createSearchParameters(query?: string, limit: number = 100, offset: number = 0) {
  const transmitObject: any = {};

  // Podle API je potřeba mít "searched attributes" v transmitObject
  // Pokud je zadán query, hledáme podle názvu společnosti
  if (query && query.trim()) {
    transmitObject.CompanyName = query.trim();
  }

  // Pro získání všech společností bez filtru použijeme prázdný ItemGUID constraint
  // nebo alespoň jeden atribut s prázdnou hodnotou aby API pochopilo že chceme všechny
  if (!query || !query.trim()) {
    transmitObject.CompanyName = ''; // Prázdná hodnota = bez filtru
  }

  return {
    transmitObject
  };
}

/**
 * Vytvoří parametr objekt pro získání konkrétních společností podle GUID
 * (používá SearchCompanies s filtrováním podle ItemGUID)
 */
export function createGetByIdParameters(itemGuids: string[]) {
  return {
    transmitObject: {
      ItemGUID: itemGuids[0] // Hledáme konkrétní společnost podle GUID
    }
  };
}

/**
 * Vytvoří parametr objekt pro uložení společnosti (SaveCompany metoda)
 */
export function createSaveParameters(companyData: any) {
  return {
    transmitObject: companyData
  };
} 