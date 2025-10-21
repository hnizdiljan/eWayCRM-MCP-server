import { LeadDto, EwayLead, CreateLeadDto } from './lead.dto';

/**
 * Konvertuje eWay-CRM deal do MCP DTO formátu
 */
export function ewayLeadToMcpLead(ewayLead: EwayLead): LeadDto {
  return {
    id: ewayLead.ItemGUID,
    projectName: ewayLead.ProjectName,
    fileAs: ewayLead.FileAs || undefined,
    description: ewayLead.Description || undefined,
    note: ewayLead.Note || undefined,
    
    // Obchodní údaje
    price: ewayLead.Price || undefined,
    currency: ewayLead.Currency || undefined,
    probability: ewayLead.Probability || undefined,
    dealStage: ewayLead.DealStage || undefined,
    dealType: ewayLead.DealType || undefined,
    
    // Termíny
    startDate: ewayLead.StartDate || undefined,
    endDate: ewayLead.EndDate || undefined,
    deadlineDate: ewayLead.DeadlineDate || undefined,
    
    // Propojení - preferujeme nové názvy polí z Swagger
    companyId: ewayLead.Companies_CustomerGuid || ewayLead.CompanyGUID || undefined,
    companyName: ewayLead.CompanyName || undefined,
    contactId: ewayLead.Contacts_ContactPersonGuid || ewayLead.ContactGUID || undefined,
    contactName: ewayLead.ContactName || undefined,
    
    // System fields
    created: ewayLead.DateCreated,
    modified: ewayLead.DateModified,
    itemVersion: ewayLead.ItemVersion,
    isDeleted: ewayLead.IsDeleted || false,
  };
}

/**
 * Konvertuje MCP DTO do eWay-CRM formátu pro vytvoření nového obchodu
 */
export function mcpLeadToEwayLeadTracked(mcpLead: CreateLeadDto): any {
  const ewayData: any = {
    ProjectName: mcpLead.projectName,
    FileAs: mcpLead.fileAs || mcpLead.projectName, // Default na projectName
  };

  // Volitelná pole
  if (mcpLead.description) ewayData.Description = mcpLead.description;
  if (mcpLead.note) ewayData.Note = mcpLead.note;
  if (mcpLead.price !== undefined) ewayData.Price = mcpLead.price;
  if (mcpLead.currency) ewayData.Currency = mcpLead.currency;
  if (mcpLead.probability !== undefined) ewayData.Probability = mcpLead.probability;
  if (mcpLead.dealStage) ewayData.DealStage = mcpLead.dealStage;
  if (mcpLead.dealType) ewayData.DealType = mcpLead.dealType;
  if (mcpLead.startDate) ewayData.StartDate = mcpLead.startDate;
  if (mcpLead.endDate) ewayData.EndDate = mcpLead.endDate;
  if (mcpLead.deadlineDate) ewayData.DeadlineDate = mcpLead.deadlineDate;
  
  // Propojení - podle Swagger: Companies_CustomerGuid a Contacts_ContactPersonGuid
  if (mcpLead.companyId) ewayData.Companies_CustomerGuid = mcpLead.companyId;
  if (mcpLead.contactId) ewayData.Contacts_ContactPersonGuid = mcpLead.contactId;

  return ewayData;
}

/**
 * Konvertuje MCP DTO do eWay-CRM formátu pro aktualizaci existujícího obchodu
 */
export function mcpLeadToEwayLeadUpdate(mcpLead: CreateLeadDto, itemGuid: string, itemVersion?: number): any {
  const ewayData = mcpLeadToEwayLeadTracked(mcpLead);
  
  // Pro update potřebujeme GUID
  ewayData.ItemGUID = itemGuid;
  
  // ItemVersion pro conflict resolution (volitelné)
  if (itemVersion !== undefined) {
    ewayData.ItemVersion = itemVersion;
  }

  return ewayData;
}

/**
 * Vytváří parametry pro vyhledávání dealů pomocí SearchLeads
 */
export function createSearchParameters(query?: string): any {
  const params: any = {
    transmitObject: {}
  };

  // Pokud je zadán dotaz, přidáme ho jako filtr na FileAs (název projektu)
  if (query && query.trim()) {
    params.transmitObject.FileAs = query.trim();
  }

  return params;
}

/**
 * Vytváří parametry pro získání dealu podle ID
 */
export function createGetByIdParameters(itemGuids: string[]): any {
  return {
    transmitObject: {
      folderName: 'Leads',
      itemGuids: itemGuids
    }
  };
}

/**
 * Vytváří parametry pro uložení dealu
 */
export function createSaveParameters(dealData: any): any {
  return {
    transmitObject: {
      folderName: 'Leads',
      itemData: dealData
    }
  };
}

/**
 * Vytváří parametry pro smazání dealu (DeleteLeads metoda)
 */
export function createDeleteParameters(itemGuid: string): any {
  return {
    itemGuid: itemGuid
  };
} 