import { ContactDto, EwayContact, CreateContactDto } from './contact.dto';

/**
 * Konvertuje eWay-CRM kontakt do MCP DTO formátu
 */
export function ewayContactToMcpContact(ewayContact: EwayContact): ContactDto {
  return {
    id: ewayContact.ItemGUID,
    firstName: ewayContact.FirstName,
    lastName: ewayContact.LastName,
    fullName: ewayContact.FileAs || undefined,
    email: ewayContact.Email1Address || undefined,
    phone: ewayContact.TelephoneNumber1 || undefined,
    mobile: ewayContact.TelephoneNumber2 || undefined,
    jobTitle: ewayContact.Department || undefined, // JobTitle neexistuje v API
    department: ewayContact.Department || undefined,

    // Adresa - podle Swagger API
    address: ewayContact.BusinessAddressStreet || undefined,
    city: ewayContact.BusinessAddressCity || undefined,
    zipCode: ewayContact.BusinessAddressPostalCode || undefined,
    country: undefined, // BusinessAddressCountryEn je GUID

    // Poznámka
    note: ewayContact.Note || undefined,
    
    // Propojení se společností
    companyId: ewayContact.Companies_CompanyGuid,
    companyName: ewayContact.CompanyName,
    
    // System fields
    created: ewayContact.DateCreated,
    modified: ewayContact.DateModified,
    itemVersion: ewayContact.ItemVersion,
    isDeleted: ewayContact.IsDeleted || false,
  };
}

/**
 * Konvertuje MCP DTO do eWay-CRM formátu pro vytvoření nového kontaktu
 */
export function mcpContactToEwayContactTracked(mcpContact: CreateContactDto): any {
  const ewayData: any = {
    FirstName: mcpContact.firstName,
    LastName: mcpContact.lastName,
    FileAs: `${mcpContact.lastName}, ${mcpContact.firstName}`, // Standard formát
  };

  // Volitelná pole - názvy podle Swagger dokumentace
  if (mcpContact.email) ewayData.Email1Address = mcpContact.email;
  if (mcpContact.phone) ewayData.TelephoneNumber1 = mcpContact.phone;
  if (mcpContact.mobile) ewayData.TelephoneNumber2 = mcpContact.mobile;
  if (mcpContact.jobTitle) ewayData.Department = mcpContact.jobTitle; // JobTitle neexistuje, používáme Department
  if (mcpContact.department) ewayData.Department = mcpContact.department;
  if (mcpContact.address) ewayData.BusinessAddressStreet = mcpContact.address;
  if (mcpContact.city) ewayData.BusinessAddressCity = mcpContact.city;
  if (mcpContact.zipCode) ewayData.BusinessAddressPostalCode = mcpContact.zipCode;
  // Country je GUID, ne string - vynecháme
  // if (mcpContact.country) ewayData.BusinessAddressCountryEn = mcpContact.country;
  if (mcpContact.note) ewayData.Note = mcpContact.note;

  // Propojení se společností - podle Swagger: Companies_CompanyGuid
  if (mcpContact.companyId) ewayData.Companies_CompanyGuid = mcpContact.companyId;

  return ewayData;
}

/**
 * Konvertuje MCP DTO do eWay-CRM formátu pro aktualizaci existujícího kontaktu
 */
export function mcpContactToEwayContactUpdate(mcpContact: CreateContactDto, itemGuid: string, itemVersion?: number): any {
  const ewayData = mcpContactToEwayContactTracked(mcpContact);
  
  // Pro update potřebujeme GUID
  ewayData.ItemGUID = itemGuid;
  
  // ItemVersion pro conflict resolution (volitelné)
  if (itemVersion !== undefined) {
    ewayData.ItemVersion = itemVersion;
  }

  return ewayData;
}

/**
 * Vytvoří parametr objekt pro vyhledávání kontaktů
 * Vyhledává podle specifického typu vyhledávání
 */
export function createContactSearchParameters(query?: string, limit: number = 100, offset: number = 0, searchType: string = 'general') {
  const transmitObject: any = {};

  // eWay-CRM SearchContacts vyžaduje alespoň jeden parametr
  if (query && query.trim()) {
    const searchTerm = query.trim();
    
    switch (searchType) {
      case 'email':
        // Explicitní vyhledávání v email adresách
        transmitObject.Email1Address = `*${searchTerm}*`;
        break;
      case 'fullname':
        // Explicitní vyhledávání ve fullname (FileAs)
        transmitObject.FileAs = `*${searchTerm}*`;
        break;
      default:
        // Obecné vyhledávání - detekujeme podle obsahu
        if (searchTerm.includes('@')) {
          // Pokud obsahuje @, pravděpodobně jde o email
          transmitObject.Email1Address = `*${searchTerm}*`;
        } else {
          // Pro jména používáme FileAs (obsahuje fullname)
          transmitObject.FileAs = `*${searchTerm}*`;
        }
    }
  } else {
    // Pro SearchContacts bez query použijeme wildcard pro získání všech
    transmitObject.FirstName = '*';
  }

  return {
    transmitObject
  };
}

/**
 * Vytvoří parametr objekt pro získání konkrétních kontaktů podle GUID
 */
export function createContactGetByIdParameters(itemGuids: string[]) {
  return {
    transmitObject: {
      ItemGUID: itemGuids[0] // Hledáme konkrétní kontakt podle GUID
    }
  };
}

/**
 * Vytvoří parametr objekt pro uložení kontaktu (SaveContact metoda)
 */
export function createContactSaveParameters(contactData: any) {
  return {
    transmitObject: contactData
  };
}

/**
 * Vytvoří parametr objekt pro smazání kontaktu (DeleteContact metoda)
 */
export function createContactDeleteParameters(itemGuid: string) {
  return {
    itemGuid: itemGuid
  };
} 