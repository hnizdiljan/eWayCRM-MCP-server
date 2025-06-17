import { CompanyDto, CreateCompanyDto, EwayCompany } from '../models/company.dto';
import { 
  ewayCompanyToMcpCompany, 
  mcpCompanyToEwayCompanyTracked, 
  mcpCompanyToEwayCompanyUpdate,
  createSearchParameters,
  createGetByIdParameters,
  createSaveParameters
} from '../models/company.mapper';
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
 * Služba pro správu společností - implementuje CRUD operace
 */
export class CompanyService {
  
  /**
   * Získání všech společností s možností vyhledávání a stránkování
   */
  public async getAll(query?: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<CompanyDto>> {
    try {
      logger.debug('Získávání společností', { query, limit, offset });
      
      const searchParams = createSearchParameters(query, limit, offset);
      const result = await ewayConnector.callMethod('SearchCompanies', searchParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání společností: ${result.Description}`);
      }
      
      // Mapování dat z eWay formátu do MCP formátu
      const companies: CompanyDto[] = (result.Data || []).map((ewayCompany: EwayCompany) =>
        ewayCompanyToMcpCompany(ewayCompany)
      );
      
      const total = result.TotalCount || companies.length;
      
      logger.info(`Získáno ${companies.length} společností`, { 
        total, 
        hasQuery: !!query,
        limit,
        offset 
      });
      
      return {
        data: companies,
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      };
      
    } catch (error) {
      logger.error('Chyba při získávání společností', error);
      throw error;
    }
  }
  
  /**
   * Získání konkrétní společnosti podle ID
   */
  public async getById(id: string): Promise<CompanyDto | null> {
    try {
      logger.debug('Získávání společnosti podle ID', { id });
      
      const getParams = createGetByIdParameters([id]);
      const result = await ewayConnector.callMethod('SearchCompanies', getParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        if (result.ReturnCode === 'rcItemNotFound') {
          logger.warn('Společnost nebyla nalezena', { id });
          return null;
        }
        throw new Error(`Chyba při získávání společnosti: ${result.Description}`);
      }
      
      if (!result.Data || result.Data.length === 0) {
        logger.warn('Společnost nebyla nalezena v datech', { id });
        return null;
      }
      
      const company = ewayCompanyToMcpCompany(result.Data[0]);
      logger.info('Společnost byla nalezena', { id, companyName: company.companyName });
      
      return company;
      
    } catch (error) {
      logger.error('Chyba při získávání společnosti podle ID', error);
      throw error;
    }
  }
  
  /**
   * Vytvoření nové společnosti
   */
  public async create(companyData: CreateCompanyDto): Promise<CompanyDto> {
    try {
      logger.debug('Vytváření nové společnosti', { companyName: companyData.companyName });
      
      const ewayData = mcpCompanyToEwayCompanyTracked(companyData);
      const saveParams = createSaveParameters(ewayData);
      
      const result = await ewayConnector.callMethod('SaveCompany', saveParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při vytváření společnosti: ${result.Description}`);
      }
      
      if (!result.Guid) {
        throw new Error('Společnost byla vytvořena, ale nebyl vrácen GUID');
      }
      
      // Po vytvoření načteme společnost podle GUID
      const createdCompany = await this.getById(result.Guid!);
      if (!createdCompany) {
        throw new Error('Společnost byla vytvořena, ale nelze ji načíst');
      }
      
      logger.info('Společnost byla úspěšně vytvořena', { 
        id: createdCompany.id,
        companyName: createdCompany.companyName 
      });
      
      return createdCompany;
      
    } catch (error) {
      logger.error('Chyba při vytváření společnosti', error);
      throw error;
    }
  }
  
  /**
   * Aktualizace existující společnosti
   */
  public async update(id: string, companyData: CreateCompanyDto, itemVersion?: number): Promise<CompanyDto> {
    try {
      logger.debug('Aktualizace společnosti', { id, companyName: companyData.companyName });
      
      // Nejprve ověříme, že společnost existuje
      const existingCompany = await this.getById(id);
      if (!existingCompany) {
        throw new Error(`Společnost s ID ${id} nebyla nalezena`);
      }
      
      // Použijeme ItemVersion z existující společnosti pokud není poskytnut
      const versionToUse = itemVersion ?? existingCompany.itemVersion;
      
      const ewayData = mcpCompanyToEwayCompanyUpdate(companyData, id, versionToUse);
      const saveParams = createSaveParameters(ewayData);
      
      const result = await ewayConnector.callMethod('SaveItem', saveParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        if (result.ReturnCode === 'rcItemConflict') {
          logger.warn('Konflikt verzí při aktualizaci společnosti', { id, itemVersion: versionToUse });
          throw new Error('Společnost byla mezitím změněna jiným uživatelem. Obnovte data a zkuste znovu.');
        }
        throw new Error(`Chyba při aktualizaci společnosti: ${result.Description}`);
      }
      
      if (!result.Data || result.Data.length === 0) {
        throw new Error('Společnost byla aktualizována, ale nebyla vrácena data');
      }
      
      const updatedCompany = ewayCompanyToMcpCompany(result.Data[0]);
      logger.info('Společnost byla úspěšně aktualizována', { 
        id: updatedCompany.id,
        companyName: updatedCompany.companyName 
      });
      
      return updatedCompany;
      
    } catch (error) {
      logger.error('Chyba při aktualizaci společnosti', error);
      throw error;
    }
  }
  
  /**
   * Smazání společnosti (označení jako smazané)
   */
  public async delete(id: string): Promise<void> {
    try {
      logger.debug('Mazání společnosti', { id });
      
      // Nejprve ověříme, že společnost existuje
      const existingCompany = await this.getById(id);
      if (!existingCompany) {
        throw new Error(`Společnost s ID ${id} nebyla nalezena`);
      }
      
      // Označíme jako smazenou
      const ewayData = {
        ItemGUID: id,
        ItemVersion: existingCompany.itemVersion,
        IsDeleted: true
      };
      
      const saveParams = createSaveParameters(ewayData);
      const result = await ewayConnector.callMethod('SaveItem', saveParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při mazání společnosti: ${result.Description}`);
      }
      
      logger.info('Společnost byla úspěšně smazána', { 
        id,
        companyName: existingCompany.companyName 
      });
      
    } catch (error) {
      logger.error('Chyba při mazání společnosti', error);
      throw error;
    }
  }
}

export default new CompanyService(); 