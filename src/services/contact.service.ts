import { ContactDto, CreateContactDto, EwayContact } from '../models/contact.dto';
import { 
  ewayContactToMcpContact, 
  mcpContactToEwayContactTracked, 
  mcpContactToEwayContactUpdate,
  createContactSearchParameters,
  createContactGetByIdParameters,
  createContactSaveParameters
} from '../models/contact.mapper';
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
 * Služba pro správu kontaktů - implementuje CRUD operace
 */
export class ContactService {
  
  /**
   * Získání všech kontaktů s možností vyhledávání a stránkování
   */
  public async getAll(query?: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<ContactDto>> {
    try {
      logger.debug('Získávání kontaktů', { query, limit, offset });
      
      const searchParams = createContactSearchParameters(query, limit, offset);
      const result = await ewayConnector.callMethod('SearchContacts', searchParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání kontaktů: ${result.Description}`);
      }
      
      // Mapování dat z eWay formátu do MCP formátu
      const contacts: ContactDto[] = (result.Data || []).map((ewayContact: EwayContact) =>
        ewayContactToMcpContact(ewayContact)
      );
      
      const total = result.TotalCount || contacts.length;
      
      logger.info(`Získáno ${contacts.length} kontaktů`, { 
        total, 
        hasQuery: !!query,
        limit,
        offset 
      });
      
      return {
        data: contacts,
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      };
      
    } catch (error) {
      logger.error('Chyba při získávání kontaktů', error);
      throw error;
    }
  }
  
  /**
   * Získání konkrétního kontaktu podle ID
   */
  public async getById(id: string): Promise<ContactDto | null> {
    try {
      logger.debug('Získávání kontaktu podle ID', { id });
      
      const getParams = createContactGetByIdParameters([id]);
      const result = await ewayConnector.callMethod('SearchContacts', getParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        if (result.ReturnCode === 'rcItemNotFound') {
          logger.warn('Kontakt nebyl nalezen', { id });
          return null;
        }
        throw new Error(`Chyba při získávání kontaktu: ${result.Description}`);
      }
      
      if (!result.Data || result.Data.length === 0) {
        logger.warn('Kontakt nebyl nalezen v datech', { id });
        return null;
      }
      
      const contact = ewayContactToMcpContact(result.Data[0]);
      logger.info('Kontakt byl nalezen', { id, fullName: contact.fullName });
      
      return contact;
      
    } catch (error) {
      logger.error('Chyba při získávání kontaktu podle ID', error);
      throw error;
    }
  }
  
  /**
   * Vytvoření nového kontaktu
   */
  public async create(contactData: CreateContactDto): Promise<ContactDto> {
    try {
      logger.debug('Vytváření nového kontaktu', { 
        firstName: contactData.firstName,
        lastName: contactData.lastName 
      });
      
      const ewayData = mcpContactToEwayContactTracked(contactData);
      const saveParams = createContactSaveParameters(ewayData);
      
      const result = await ewayConnector.callMethod('SaveContact', saveParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při vytváření kontaktu: ${result.Description}`);
      }
      
      if (!result.Guid) {
        throw new Error('Kontakt byl vytvořen, ale nebyl vrácen GUID');
      }
      
      // Po vytvoření načteme kontakt podle GUID
      const createdContact = await this.getById(result.Guid!);
      if (!createdContact) {
        throw new Error('Kontakt byl vytvořen, ale nelze jej načíst');
      }
      
      logger.info('Kontakt byl úspěšně vytvořen', { 
        id: createdContact.id,
        fullName: createdContact.fullName 
      });
      
      return createdContact;
      
    } catch (error) {
      logger.error('Chyba při vytváření kontaktu', error);
      throw error;
    }
  }
  
  /**
   * Aktualizace existujícího kontaktu
   */
  public async update(id: string, contactData: CreateContactDto, itemVersion?: number): Promise<ContactDto> {
    try {
      logger.debug('Aktualizace kontaktu', { 
        id, 
        firstName: contactData.firstName,
        lastName: contactData.lastName 
      });
      
      // Nejprve ověříme, že kontakt existuje
      const existingContact = await this.getById(id);
      if (!existingContact) {
        throw new Error(`Kontakt s ID ${id} nebyl nalezen`);
      }
      
      // Použijeme ItemVersion z existujícího kontaktu pokud není poskytnut
      const versionToUse = itemVersion ?? existingContact.itemVersion;
      
      const ewayData = mcpContactToEwayContactUpdate(contactData, id, versionToUse);
      const saveParams = createContactSaveParameters(ewayData);
      
      const result = await ewayConnector.callMethod('SaveItem', saveParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        if (result.ReturnCode === 'rcItemConflict') {
          logger.warn('Konflikt verzí při aktualizaci kontaktu', { id, itemVersion: versionToUse });
          throw new Error('Kontakt byl mezitím změněn jiným uživatelem. Obnovte data a zkuste znovu.');
        }
        throw new Error(`Chyba při aktualizaci kontaktu: ${result.Description}`);
      }
      
      if (!result.Data || result.Data.length === 0) {
        throw new Error('Kontakt byl aktualizován, ale nebyla vrácena data');
      }
      
      const updatedContact = ewayContactToMcpContact(result.Data[0]);
      logger.info('Kontakt byl úspěšně aktualizován', { 
        id: updatedContact.id,
        fullName: updatedContact.fullName 
      });
      
      return updatedContact;
      
    } catch (error) {
      logger.error('Chyba při aktualizaci kontaktu', error);
      throw error;
    }
  }
  
  /**
   * Smazání kontaktu (označení jako smazané)
   */
  public async delete(id: string): Promise<void> {
    try {
      logger.debug('Mazání kontaktu', { id });
      
      // Nejprve ověříme, že kontakt existuje
      const existingContact = await this.getById(id);
      if (!existingContact) {
        throw new Error(`Kontakt s ID ${id} nebyl nalezen`);
      }
      
      // Označíme kontakt jako smazaný pomocí aktualizace
      const deleteData = mcpContactToEwayContactUpdate(
        {
          firstName: existingContact.firstName || '',
          lastName: existingContact.lastName || ''
        },
        id,
        existingContact.itemVersion
      );
      
      // Přidáme IsDeleted flag
      deleteData.IsDeleted = true;
      
      const saveParams = createContactSaveParameters(deleteData);
      const result = await ewayConnector.callMethod('SaveItem', saveParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při mazání kontaktu: ${result.Description}`);
      }
      
      logger.info('Kontakt byl úspěšně smazán', { id });
      
    } catch (error) {
      logger.error('Chyba při mazání kontaktu', error);
      throw error;
    }
  }
  
  /**
   * Vyhledání kontaktů podle společnosti
   */
  public async getByCompanyId(companyId: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<ContactDto>> {
    try {
      logger.debug('Získávání kontaktů podle společnosti', { companyId, limit, offset });
      
      // Použijeme speciální search parametry pro vyhledávání podle společnosti
      const searchParams = {
        transmitObject: {
          CompanyGUID: companyId
        }
      };
      
      const result = await ewayConnector.callMethod('SearchContacts', searchParams);
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání kontaktů podle společnosti: ${result.Description}`);
      }
      
      const contacts: ContactDto[] = (result.Data || []).map((ewayContact: EwayContact) =>
        ewayContactToMcpContact(ewayContact)
      );
      
      const total = result.TotalCount || contacts.length;
      
      logger.info(`Získáno ${contacts.length} kontaktů pro společnost`, { 
        companyId,
        total, 
        limit,
        offset 
      });
      
      return {
        data: contacts,
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      };
      
    } catch (error) {
      logger.error('Chyba při získávání kontaktů podle společnosti', error);
      throw error;
    }
  }
}

export default new ContactService(); 