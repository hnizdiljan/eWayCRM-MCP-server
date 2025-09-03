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
   * Používá GetCompanies a provádí filtrování v paměti
   */
  public async getAll(query?: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<CompanyDto>> {
    try {
      logger.debug('Získávání společností', { query, limit, offset });
      
      // Debug stavu autentizace
      const authStatus = (ewayConnector as any).getAuthStatus();
      logger.debug('Auth Status před API voláním:', authStatus);
      
      // Vždy použijeme GetCompanies pro získání všech společností
      const result = await ewayConnector.callMethod('GetCompanies', {
        transmitObject: {},
        includeForeignKeys: true
      });
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání společností: ${result.Description}`);
      }
      
      // Mapování dat z eWay formátu do MCP formátu
      let companies: CompanyDto[] = (result.Data || []).map((ewayCompany: EwayCompany) =>
        ewayCompanyToMcpCompany(ewayCompany)
      );
      
      // In-memory filtrování pokud je zadán query
      if (query && query.trim()) {
        const searchTerm = query.trim().toLowerCase();
        
        companies = companies.filter(company => 
          (company.companyName && company.companyName.toLowerCase().includes(searchTerm)) ||
          (company.phone && company.phone.toLowerCase().includes(searchTerm)) ||
          (company.email && company.email.toLowerCase().includes(searchTerm)) ||
          (company.website && company.website.toLowerCase().includes(searchTerm)) ||
          (company.address && company.address.toLowerCase().includes(searchTerm)) ||
          (company.city && company.city.toLowerCase().includes(searchTerm)) ||
          (company.ico && company.ico.toLowerCase().includes(searchTerm)) ||
          (company.dic && company.dic.toLowerCase().includes(searchTerm)) ||
          (company.note && company.note.toLowerCase().includes(searchTerm)) ||
          // Rozšířené atributy
          (company.address1City && company.address1City.toLowerCase().includes(searchTerm)) ||
          (company.address1Street && company.address1Street.toLowerCase().includes(searchTerm)) ||
          (company.address1State && company.address1State.toLowerCase().includes(searchTerm)) ||
          (company.identificationNumber && company.identificationNumber.toLowerCase().includes(searchTerm)) ||
          (company.lineOfBusiness && company.lineOfBusiness.toLowerCase().includes(searchTerm)) ||
          (company.vatNumber && company.vatNumber.toLowerCase().includes(searchTerm)) ||
          (company.employeesCount && company.employeesCount.toString().includes(searchTerm))
        );
      }
      
      // In-memory stránkování
      const total = companies.length;
      const startIndex = offset;
      const endIndex = offset + limit;
      const paginatedCompanies = companies.slice(startIndex, endIndex);
      
      logger.info(`Získáno ${paginatedCompanies.length} společností (stránkování ${startIndex}-${endIndex} z ${total})`, { 
        total, 
        hasQuery: !!query,
        limit,
        offset 
      });
      
      return {
        data: paginatedCompanies,
        total,
        limit,
        offset,
        hasMore: endIndex < total
      };
      
    } catch (error) {
      logger.error('Chyba při získávání společností', error);
      throw error;
    }
  }
  
  /**
   * Získání konkrétní společnosti podle ID
   * Používá GetCompanies a vyhledává v paměti
   */
  public async getById(id: string): Promise<CompanyDto | null> {
    try {
      logger.debug('Získávání společnosti podle ID', { id });
      
      // Získáme všechny společnosti
      const result = await ewayConnector.callMethod('GetCompanies', {
        transmitObject: {},
        includeForeignKeys: true
      });
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání společností: ${result.Description}`);
      }
      
      if (!result.Data || result.Data.length === 0) {
        logger.warn('Žádné společnosti nebyly nalezeny');
        return null;
      }
      
      // Najdeme společnost podle ID v paměti
      const ewayCompany = result.Data.find((company: any) => company.ItemGUID === id);
      
      if (!ewayCompany) {
        logger.warn('Společnost nebyla nalezena', { id });
        return null;
      }
      
      const company = ewayCompanyToMcpCompany(ewayCompany);
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