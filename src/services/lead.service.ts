import { LeadDto, CreateLeadDto, EwayLead } from '../models/lead.dto';
import {
  ewayLeadToMcpLead,
  mcpLeadToEwayLeadTracked,
  mcpLeadToEwayLeadUpdate,
  createSearchParameters,
  createGetByIdParameters,
  createSaveParameters,
  createDeleteParameters
} from '../models/lead.mapper';
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
export class LeadService {
  
  /**
   * Získání všech obchodů s možností vyhledávání a stránkování
   * Používá GetLeads a provádí filtrování v paměti
   */
  public async getAll(query?: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<LeadDto>> {
    try {
      logger.debug('Získávání obchodů', { query, limit, offset });

      // Použijeme GetLeads pro získání všech obchodů
      const result = await ewayConnector.callMethod('GetLeads', {
        transmitObject: {},
        includeForeignKeys: true
      });

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání obchodů: ${result.Description}`);
      }

      // Mapování dat z eWay formátu do MCP formátu
      let leads: LeadDto[] = (result.Data || []).map((ewayLead: EwayLead) =>
        ewayLeadToMcpLead(ewayLead)
      );

      // In-memory filtrování pokud je zadán query
      if (query && query.trim()) {
        const searchTerm = query.trim().toLowerCase();
        leads = leads.filter(lead =>
          (lead.projectName && lead.projectName.toLowerCase().includes(searchTerm)) ||
          (lead.fileAs && lead.fileAs.toLowerCase().includes(searchTerm)) ||
          (lead.description && lead.description.toLowerCase().includes(searchTerm)) ||
          (lead.companyName && lead.companyName.toLowerCase().includes(searchTerm)) ||
          (lead.contactName && lead.contactName.toLowerCase().includes(searchTerm))
        );
      }

      // In-memory stránkování
      const total = leads.length;
      const startIndex = offset;
      const endIndex = offset + limit;
      const paginatedDeals = leads.slice(startIndex, endIndex);

      logger.info(`Získáno ${paginatedDeals.length} obchodů (stránkování ${startIndex}-${endIndex} z ${total})`, {
        total,
        hasQuery: !!query,
        limit,
        offset
      });

      return {
        data: paginatedDeals,
        total,
        limit,
        offset,
        hasMore: endIndex < total
      };

    } catch (error) {
      logger.error('Chyba při získávání obchodů', error);
      throw error;
    }
  }
  
  /**
   * Získání konkrétního obchodu podle ID
   */
  public async getById(id: string): Promise<LeadDto | null> {
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
      
      const lead = ewayLeadToMcpLead(result.Data[0]);
      logger.info('Obchod byl nalezen', { id, projectName: lead.projectName });
      
      return lead;
      
    } catch (error) {
      logger.error('Chyba při získávání obchodu podle ID', error);
      throw error;
    }
  }
  
  /**
   * Vytvoření nového obchodu
   */
  public async create(leadData: CreateLeadDto): Promise<LeadDto> {
    try {
      logger.debug('Vytváření nového obchodu', { projectName: leadData.projectName });
      
      const ewayData = mcpLeadToEwayLeadTracked(leadData);
      const saveParams = createSaveParameters(ewayData);
      
      const result = await ewayConnector.callMethod('SaveLead', saveParams);

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při vytváření obchodu: ${result.Description}`);
      }

      if (!result.Guid) {
        throw new Error('Obchod byl vytvořen, ale nebyl vrácen GUID');
      }

      // Po vytvoření načteme obchod podle GUID
      const createdLead = await this.getById(result.Guid!);
      if (!createdLead) {
        throw new Error('Obchod byl vytvořen, ale nelze jej načíst');
      }
      
      logger.info('Obchod byl úspěšně vytvořen', { 
        id: createdLead.id,
        projectName: createdLead.projectName 
      });
      
      return createdLead;
      
    } catch (error) {
      logger.error('Chyba při vytváření obchodu', error);
      throw error;
    }
  }
  
  /**
   * Aktualizace existujícího obchodu
   */
  public async update(id: string, leadData: CreateLeadDto, itemVersion?: number): Promise<LeadDto> {
    try {
      logger.debug('Aktualizace obchodu', { id, projectName: leadData.projectName });
      
      // Nejprve ověříme, že obchod existuje
      const existingLead = await this.getById(id);
      if (!existingLead) {
        throw new Error(`Obchod s ID ${id} nebyl nalezen`);
      }

      // Použijeme ItemVersion z existujícího obchodu pokud není poskytnut
      const versionToUse = itemVersion ?? existingLead.itemVersion;

      const ewayData = mcpLeadToEwayLeadUpdate(leadData, id, versionToUse);
      const saveParams = createSaveParameters(ewayData);

      // Používáme SaveLead místo SaveLeads
      const result = await ewayConnector.callMethod('SaveLead', saveParams);

      if (result.ReturnCode !== 'rcSuccess') {
        if (result.ReturnCode === 'rcItemConflict') {
          logger.warn('Konflikt verzí při aktualizaci obchodu', { id, itemVersion: versionToUse });
          throw new Error('Obchod byl mezitím změněn jiným uživatelem. Obnovte data a zkuste znovu.');
        }
        throw new Error(`Chyba při aktualizaci obchodu: ${result.Description}`);
      }

      // SaveLead vrací jen Guid, ne Data - musíme načíst obchod znovu
      if (!result.Guid) {
        throw new Error('Obchod byl aktualizován, ale nebyl vrácen GUID');
      }

      // Po aktualizaci načteme obchod podle GUID pro úplná data
      const updatedLead = await this.getById(result.Guid);
      if (!updatedLead) {
        throw new Error('Obchod byl aktualizován, ale nelze jej načíst');
      }

      logger.info('Obchod byl úspěšně aktualizován', {
        id: updatedLead.id,
        projectName: updatedLead.projectName
      });

      return updatedLead;
      
    } catch (error) {
      logger.error('Chyba při aktualizaci obchodu', error);
      throw error;
    }
  }
  
  /**
   * Smazání obchodu pomocí DeleteLead endpoint
   */
  public async delete(id: string): Promise<void> {
    try {
      logger.debug('Mazání obchodu', { id });

      // Nejprve ověříme, že obchod existuje
      const existingLead = await this.getById(id);
      if (!existingLead) {
        throw new Error(`Obchod s ID ${id} nebyl nalezen`);
      }

      // Použijeme dedikovaný DeleteLead endpoint (jednotné číslo pro konzistenci)
      const deleteParams = createDeleteParameters(id);
      const result = await ewayConnector.callMethod('DeleteLead', deleteParams);

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při mazání obchodu: ${result.Description}`);
      }

      logger.info('Obchod byl úspěšně smazán', {
        id,
        projectName: existingLead.projectName
      });

    } catch (error) {
      logger.error('Chyba při mazání obchodu', error);
      throw error;
    }
  }

  /**
   * Získání obchodů podle společnosti
   * Používá GetLeads a provádí filtrování v paměti podle companyId
   */
  public async getByCompanyId(companyId: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<LeadDto>> {
    try {
      logger.debug('Získávání obchodů podle společnosti', { companyId, limit, offset });

      // Použijeme GetLeads pro získání všech obchodů
      const result = await ewayConnector.callMethod('GetLeads', {
        transmitObject: {},
        includeForeignKeys: true
      });

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání obchodů podle společnosti: ${result.Description}`);
      }

      // Mapování dat z eWay formátu do MCP formátu
      let leads: LeadDto[] = (result.Data || []).map((ewayLead: EwayLead) =>
        ewayLeadToMcpLead(ewayLead)
      );

      // In-memory filtrování podle companyId
      if (companyId && companyId.trim()) {
        leads = leads.filter(lead => lead.companyId === companyId);
      }

      // In-memory stránkování
      const total = leads.length;
      const startIndex = offset;
      const endIndex = offset + limit;
      const paginatedLeads = leads.slice(startIndex, endIndex);

      logger.info(`Získáno ${paginatedLeads.length} obchodů pro společnost (stránkování ${startIndex}-${endIndex} z ${total})`, {
        companyId,
        total,
        limit,
        offset
      });

      return {
        data: paginatedLeads,
        total,
        limit,
        offset,
        hasMore: endIndex < total
      };

    } catch (error) {
      logger.error('Chyba při získávání obchodů podle společnosti', error);
      throw error;
    }
  }
}

// Singleton instance
const leadService = new LeadService();
export default leadService; 