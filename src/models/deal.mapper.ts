import { DealDto, EwayDeal, CreateDealDto } from './deal.dto';

/**
 * Konvertuje eWay-CRM deal do MCP DTO formátu
 */
export function ewayDealToMcpDeal(ewayDeal: EwayDeal): DealDto {
  return {
    id: ewayDeal.ItemGUID,
    projectName: ewayDeal.ProjectName,
    fileAs: ewayDeal.FileAs || undefined,
    description: ewayDeal.Description || undefined,
    note: ewayDeal.Note || undefined,
    
    // Obchodní údaje
    price: ewayDeal.Price || undefined,
    currency: ewayDeal.Currency || undefined,
    probability: ewayDeal.Probability || undefined,
    dealStage: ewayDeal.DealStage || undefined,
    dealType: ewayDeal.DealType || undefined,
    
    // Termíny
    startDate: ewayDeal.StartDate || undefined,
    endDate: ewayDeal.EndDate || undefined,
    deadlineDate: ewayDeal.DeadlineDate || undefined,
    
    // Propojení
    companyId: ewayDeal.CompanyGUID || undefined,
    companyName: ewayDeal.CompanyName || undefined,
    contactId: ewayDeal.ContactGUID || undefined,
    contactName: ewayDeal.ContactName || undefined,
    
    // System fields
    created: ewayDeal.DateCreated,
    modified: ewayDeal.DateModified,
    itemVersion: ewayDeal.ItemVersion,
    isDeleted: ewayDeal.IsDeleted || false,
  };
}

/**
 * Konvertuje MCP DTO do eWay-CRM formátu pro vytvoření nového obchodu
 */
export function mcpDealToEwayDealTracked(mcpDeal: CreateDealDto): any {
  const ewayData: any = {
    ProjectName: mcpDeal.projectName,
    FileAs: mcpDeal.fileAs || mcpDeal.projectName, // Default na projectName
  };

  // Volitelná pole
  if (mcpDeal.description) ewayData.Description = mcpDeal.description;
  if (mcpDeal.note) ewayData.Note = mcpDeal.note;
  if (mcpDeal.price !== undefined) ewayData.Price = mcpDeal.price;
  if (mcpDeal.currency) ewayData.Currency = mcpDeal.currency;
  if (mcpDeal.probability !== undefined) ewayData.Probability = mcpDeal.probability;
  if (mcpDeal.dealStage) ewayData.DealStage = mcpDeal.dealStage;
  if (mcpDeal.dealType) ewayData.DealType = mcpDeal.dealType;
  if (mcpDeal.startDate) ewayData.StartDate = mcpDeal.startDate;
  if (mcpDeal.endDate) ewayData.EndDate = mcpDeal.endDate;
  if (mcpDeal.deadlineDate) ewayData.DeadlineDate = mcpDeal.deadlineDate;
  
  // Propojení
  if (mcpDeal.companyId) ewayData.CompanyGUID = mcpDeal.companyId;
  if (mcpDeal.contactId) ewayData.ContactGUID = mcpDeal.contactId;

  return ewayData;
}

/**
 * Konvertuje MCP DTO do eWay-CRM formátu pro aktualizaci existujícího obchodu
 */
export function mcpDealToEwayDealUpdate(mcpDeal: CreateDealDto, itemGuid: string, itemVersion?: number): any {
  const ewayData = mcpDealToEwayDealTracked(mcpDeal);
  
  // Pro update potřebujeme GUID
  ewayData.ItemGUID = itemGuid;
  
  // ItemVersion pro conflict resolution (volitelné)
  if (itemVersion !== undefined) {
    ewayData.ItemVersion = itemVersion;
  }

  return ewayData;
}

/**
 * Vytváří parametry pro vyhledávání dealů
 */
export function createSearchParameters(query?: string, limit: number = 25, offset: number = 0): any {
  const params: any = {
    transmitObject: {
      folderName: 'Leads',
      maxRecords: limit,
      skip: offset
    }
  };

  // Pokud je zadán dotaz, přidáme ho jako filtr
  if (query && query.trim()) {
    params.transmitObject.searchFields = {
      ProjectName: query.trim()
    };
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