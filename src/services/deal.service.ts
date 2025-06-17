import { DealDto, CreateDealDto, EwayDeal } from '../models/deal.dto';
import { 
  ewayDealToMcpDeal, 
  mcpDealToEwayDealTracked, 
  mcpDealToEwayDealUpdate,
  createSearchParameters,
  createGetByIdParameters,
  createSaveParameters
} from '../models/deal.mapper';
import ewayConnector from '../connectors/eway-http.connector';
import logger from './logger.service';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Služba pro správu obchodů/příležitostí - implementuje CRUD operace
 */
export class DealService {
  
  /**
   * Získání všech obchodů s možností vyhledávání a stránkování
   */
  public async getAll(query?: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<DealDto>> {
    try {
      logger.debug('Získávání obchodů', { query, limit, offset });
      
      const searchParams = createSearchParameters(query, limit, offset);
      const result = await ewayConnector.callMethod('SearchItems', searchParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání obchodů: ${result.Description}`);
      }
      
      // Mapování dat z eWay formátu do MCP formátu
      const deals: DealDto[] = (result.Data || []).map((ewayDeal: EwayDeal) =>
        ewayDealToMcpDeal(ewayDeal)
      );
      
      const total = result.TotalCount || deals.length;
      
      logger.info(`Získáno ${deals.length} obchodů`, { 
        total, 
        hasQuery: !!query,
        limit,
        offset 
      });
      
      return {
        data: deals,
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      };
      
    } catch (error) {
      logger.error('Chyba při získávání obchodů', error);
      throw error;
    }
  }
  
  /**
   * Získání konkrétního obchodu podle ID
   */
  public async getById(id: string): Promise<DealDto | null> {
    try {
      logger.debug('Získávání obchodu podle ID', { id });
      
      const getParams = createGetByIdParameters([id]);
      const result = await ewayConnector.callMethod('GetLeadsByItemGuids', getParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        if (result.ReturnCode === 'rcItemNotFound') {
          logger.warn('Obchod nebyl nalezen', { id });
          return null;
        }
        throw new Error(`Chyba při získávání obchodu: ${result.Description}`);
      }
      
      if (!result.Data || result.Data.length === 0) {
        logger.warn('Obchod nebyl nalezen v datech', { id });
        return null;
      }
      
      const deal = ewayDealToMcpDeal(result.Data[0]);
      logger.info('Obchod byl nalezen', { id, projectName: deal.projectName });
      
      return deal;
      
    } catch (error) {
      logger.error('Chyba při získávání obchodu podle ID', error);
      throw error;
    }
  }
  
  /**
   * Vytvoření nového obchodu
   */
  public async create(dealData: CreateDealDto): Promise<DealDto> {
    try {
      logger.debug('Vytváření nového obchodu', { projectName: dealData.projectName });
      
      const ewayData = mcpDealToEwayDealTracked(dealData);
      const saveParams = createSaveParameters(ewayData);
      
      const result = await ewayConnector.callMethod('SaveLeads', saveParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při vytváření obchodu: ${result.Description}`);
      }
      
      if (!result.Guid) {
        throw new Error('Obchod byl vytvořen, ale nebyl vrácen GUID');
      }
      
      // Po vytvoření načteme obchod podle GUID
      const createdDeal = await this.getById(result.Guid!);
      if (!createdDeal) {
        throw new Error('Obchod byl vytvořen, ale nelze jej načíst');
      }
      
      logger.info('Obchod byl úspěšně vytvořen', { 
        id: createdDeal.id,
        projectName: createdDeal.projectName 
      });
      
      return createdDeal;
      
    } catch (error) {
      logger.error('Chyba při vytváření obchodu', error);
      throw error;
    }
  }
  
  /**
   * Aktualizace existujícího obchodu
   */
  public async update(id: string, dealData: CreateDealDto, itemVersion?: number): Promise<DealDto> {
    try {
      logger.debug('Aktualizace obchodu', { id, projectName: dealData.projectName });
      
      // Nejprve ověříme, že obchod existuje
      const existingDeal = await this.getById(id);
      if (!existingDeal) {
        throw new Error(`Obchod s ID ${id} nebyl nalezen`);
      }
      
      // Použijeme ItemVersion z existujícího obchodu pokud není poskytnut
      const versionToUse = itemVersion ?? existingDeal.itemVersion;
      
      const ewayData = mcpDealToEwayDealUpdate(dealData, id, versionToUse);
      const saveParams = createSaveParameters(ewayData);
      
      const result = await ewayConnector.callMethod('SaveLeads', saveParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        if (result.ReturnCode === 'rcItemConflict') {
          logger.warn('Konflikt verzí při aktualizaci obchodu', { id, itemVersion: versionToUse });
          throw new Error('Obchod byl mezitím změněn jiným uživatelem. Obnovte data a zkuste znovu.');
        }
        throw new Error(`Chyba při aktualizaci obchodu: ${result.Description}`);
      }
      
      if (!result.Data || result.Data.length === 0) {
        throw new Error('Obchod byl aktualizován, ale nebyla vrácena data');
      }
      
      const updatedDeal = ewayDealToMcpDeal(result.Data[0]);
      logger.info('Obchod byl úspěšně aktualizován', { 
        id: updatedDeal.id,
        projectName: updatedDeal.projectName 
      });
      
      return updatedDeal;
      
    } catch (error) {
      logger.error('Chyba při aktualizaci obchodu', error);
      throw error;
    }
  }
  
  /**
   * Smazání obchodu (označení jako smazané)
   */
  public async delete(id: string): Promise<void> {
    try {
      logger.debug('Mazání obchodu', { id });
      
      // Nejprve ověříme, že obchod existuje
      const existingDeal = await this.getById(id);
      if (!existingDeal) {
        throw new Error(`Obchod s ID ${id} nebyl nalezen`);
      }
      
      // Označíme jako smazané
      const deleteData = {
        ItemGUID: id,
        ItemVersion: existingDeal.itemVersion,
        IsDeleted: true
      };
      
      const saveParams = createSaveParameters(deleteData);
      const result = await ewayConnector.callMethod('SaveLeads', saveParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při mazání obchodu: ${result.Description}`);
      }
      
      logger.info('Obchod byl úspěšně smazán', { 
        id,
        projectName: existingDeal.projectName 
      });
      
    } catch (error) {
      logger.error('Chyba při mazání obchodu', error);
      throw error;
    }
  }

  /**
   * Získání obchodů podle společnosti
   */
  public async getByCompanyId(companyId: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<DealDto>> {
    try {
      logger.debug('Získávání obchodů podle společnosti', { companyId, limit, offset });
      
      const searchParams = {
        transmitObject: {
          folderName: 'Leads',
          searchFields: { CompanyGUID: companyId },
          maxRecords: limit,
          skip: offset
        }
      };
      
      const result = await ewayConnector.callMethod('SearchItems', searchParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání obchodů podle společnosti: ${result.Description}`);
      }
      
      const deals: DealDto[] = (result.Data || []).map((ewayDeal: EwayDeal) =>
        ewayDealToMcpDeal(ewayDeal)
      );
      
      const total = result.TotalCount || deals.length;
      
      logger.info(`Získáno ${deals.length} obchodů pro společnost`, { 
        companyId,
        total,
        limit,
        offset 
      });
      
      return {
        data: deals,
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      };
      
    } catch (error) {
      logger.error('Chyba při získávání obchodů podle společnosti', error);
      throw error;
    }
  }
}

// Singleton instance
const dealService = new DealService();
export default dealService; 