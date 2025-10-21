import { CompanyDto, EwayCompany, CreateCompanyDto } from './company.dto';

/**
 * Konvertuje eWay-CRM společnost do MCP DTO formátu
 */
export function ewayCompanyToMcpCompany(ewayCompany: EwayCompany): CompanyDto {
  // Pokud je CompanyName prázdné, pokusíme se použít jiné pole jako fallback
  let companyName = ewayCompany.CompanyName;
  
  if (!companyName || companyName.trim() === '') {
    // Zkusíme FileAs
    if (ewayCompany.FileAs && ewayCompany.FileAs.trim() !== '') {
      companyName = ewayCompany.FileAs;
    }
    // Pokud ani FileAs není k dispozici, zkusíme extrahovat z emailu
    else if (ewayCompany.Email && ewayCompany.Email.includes('@')) {
      const domain = ewayCompany.Email.split('@')[1];
      if (domain) {
        // Odstraníme .com, .it apod. a převedeme na název
        companyName = domain.split('.')[0];
        // Velkým písmenem na začátku
        companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
      }
    }
    // Poslední možnost - použijeme placeholder
    if (!companyName || companyName.trim() === '') {
      companyName = 'Neznámá společnost';
    }
  }

  return {
    id: ewayCompany.ItemGUID,
    companyName: companyName,
    fileAs: ewayCompany.FileAs || undefined,
    phone: ewayCompany.Phone || undefined,
    email: ewayCompany.Email || undefined,
    website: ewayCompany.WebPage || undefined,
    // Adresní pole - čteme z Address1* podle skutečné API struktury
    address: ewayCompany.Address1Street || undefined,
    city: ewayCompany.Address1City || undefined,
    zipCode: ewayCompany.Address1PostalCode || undefined,
    country: undefined, // Address1CountryEn je GUID, ne string
    note: ewayCompany.Note || undefined,
    
    // Rozšířené atributy
    address1City: ewayCompany.Address1City || undefined,
    address1Street: ewayCompany.Address1Street || undefined,
    address1State: ewayCompany.Address1State || undefined,
    employeesCount: ewayCompany.EmployeesCount || undefined,
    identificationNumber: ewayCompany.IdentificationNumber || undefined,
    lineOfBusiness: ewayCompany.LineOfBusiness || undefined,
    vatNumber: ewayCompany.VATNumber || undefined,
    
    // ICO a DIC z standardních polí (AdditionalFields nefunguje přes API)
    ico: ewayCompany.IdentificationNumber || undefined,
    dic: ewayCompany.VATNumber || undefined,
    
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

  // Adresní pole - používáme Address1* podle Swagger dokumentace
  if (mcpCompany.address) ewayData.Address1Street = mcpCompany.address;
  if (mcpCompany.city) ewayData.Address1City = mcpCompany.city;
  if (mcpCompany.zipCode) ewayData.Address1PostalCode = mcpCompany.zipCode;
  // Country je GUID podle API, ne string - zatím vynecháme
  // if (mcpCompany.country) ewayData.Address1CountryEn = mcpCompany.country;

  if (mcpCompany.note) ewayData.Note = mcpCompany.note;

  // Rozšířené atributy
  if (mcpCompany.address1City) ewayData.Address1City = mcpCompany.address1City;
  if (mcpCompany.address1Street) ewayData.Address1Street = mcpCompany.address1Street;
  if (mcpCompany.address1State) ewayData.Address1State = mcpCompany.address1State;
  if (mcpCompany.employeesCount !== undefined) ewayData.EmployeesCount = mcpCompany.employeesCount;
  if (mcpCompany.lineOfBusiness) ewayData.LineOfBusiness = mcpCompany.lineOfBusiness;

  // ICO a DIC - používáme standardní pole IdentificationNumber a VATNumber
  // Priorita: ico/dic pokud existuje, jinak identificationNumber/vatNumber
  if (mcpCompany.ico) {
    ewayData.IdentificationNumber = mcpCompany.ico;
  } else if (mcpCompany.identificationNumber) {
    ewayData.IdentificationNumber = mcpCompany.identificationNumber;
  }

  if (mcpCompany.dic) {
    ewayData.VATNumber = mcpCompany.dic;
  } else if (mcpCompany.vatNumber) {
    ewayData.VATNumber = mcpCompany.vatNumber;
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
 * Data jdou přímo do transmitObject bez obalení
 */
export function createSaveParameters(companyData: any) {
  return {
    transmitObject: companyData
  };
}

/**
 * Vytvoří parametr objekt pro smazání společnosti (DeleteCompany metoda)
 */
export function createDeleteParameters(itemGuid: string) {
  return {
    itemGuid: itemGuid
  };
} 