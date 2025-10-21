import { ContactDto, CreateContactDto, EwayContact } from '../models/contact.dto';
import {
  ewayContactToMcpContact,
  mcpContactToEwayContactTracked,
  mcpContactToEwayContactUpdate,
  createContactSearchParameters,
  createContactGetByIdParameters,
  createContactSaveParameters,
  createContactDeleteParameters
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
   * Používá GetContacts a provádí filtrování v paměti
   */
  public async getAll(query?: string, limit: number = 25, offset: number = 0, searchType: string = 'general', companyId?: string): Promise<PaginatedResult<ContactDto>> {
    try {
      logger.debug('Získávání kontaktů', { query, limit, offset, searchType, companyId });
      
      // Vždy použijeme GetContacts pro získání všech kontaktů
      const result = await ewayConnector.callMethod('GetContacts', { 
        transmitObject: {},
        includeForeignKeys: true
      });
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání kontaktů: ${result.Description}`);
      }
      
      // Mapování dat z eWay formátu do MCP formátu
      let contacts: ContactDto[] = (result.Data || []).map((ewayContact: EwayContact) =>
        ewayContactToMcpContact(ewayContact)
      );
      
      // In-memory filtrování podle companyId
      if (companyId && companyId.trim()) {
        contacts = contacts.filter(contact => 
          contact.companyId === companyId
        );
      }
      
      // In-memory filtrování pokud je zadán query
      if (query && query.trim()) {
        const searchTerm = query.trim().toLowerCase();
        
        contacts = contacts.filter(contact => {
          switch (searchType) {
            case 'email':
              return contact.email && contact.email.toLowerCase().includes(searchTerm);
            case 'fullname':
              return (contact.fullName && contact.fullName.toLowerCase().includes(searchTerm)) ||
                     (contact.firstName && contact.firstName.toLowerCase().includes(searchTerm)) ||
                     (contact.lastName && contact.lastName.toLowerCase().includes(searchTerm));
            default:
              // Obecné vyhledávání ve všech relevantních polích
              return (contact.firstName && contact.firstName.toLowerCase().includes(searchTerm)) ||
                     (contact.lastName && contact.lastName.toLowerCase().includes(searchTerm)) ||
                     (contact.fullName && contact.fullName.toLowerCase().includes(searchTerm)) ||
                     (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
                     (contact.phone && contact.phone.toLowerCase().includes(searchTerm)) ||
                     (contact.mobile && contact.mobile.toLowerCase().includes(searchTerm)) ||
                     (contact.jobTitle && contact.jobTitle.toLowerCase().includes(searchTerm)) ||
                     (contact.companyName && contact.companyName.toLowerCase().includes(searchTerm)) ||
                     (contact.companyId && contact.companyId.toLowerCase().includes(searchTerm));
          }
        });
      }
      
      // In-memory stránkování
      const total = contacts.length;
      const startIndex = offset;
      const endIndex = offset + limit;
      const paginatedContacts = contacts.slice(startIndex, endIndex);
      
      logger.info(`Získáno ${paginatedContacts.length} kontaktů (stránkování ${startIndex}-${endIndex} z ${total})`, { 
        total, 
        hasQuery: !!query,
        hasCompanyFilter: !!companyId,
        searchType,
        limit,
        offset 
      });
      
      return {
        data: paginatedContacts,
        total,
        limit,
        offset,
        hasMore: endIndex < total
      };
      
    } catch (error) {
      logger.error('Chyba při získávání kontaktů', error);
      throw error;
    }
  }
  
  /**
   * Získání konkrétního kontaktu podle ID
   * Používá GetContacts a vyhledává v paměti
   */
  public async getById(id: string): Promise<ContactDto | null> {
    try {
      logger.debug('Získávání kontaktu podle ID', { id });
      
      // Získáme všechny kontakty
      const result = await ewayConnector.callMethod('GetContacts', {
        transmitObject: {},
        includeForeignKeys: true
      });
      
      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání kontaktů: ${result.Description}`);
      }
      
      if (!result.Data || result.Data.length === 0) {
        logger.warn('Žádné kontakty nebyly nalezeny');
        return null;
      }
      
      // Najdeme kontakt podle ID v paměti
      const ewayContact = result.Data.find((contact: any) => contact.ItemGUID === id);
      
      if (!ewayContact) {
        logger.warn('Kontakt nebyl nalezen', { id });
        return null;
      }
      
      const contact = ewayContactToMcpContact(ewayContact);
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

      // Používáme SaveContact místo SaveItem (tento server nemá univerzální SaveItem)
      const result = await ewayConnector.callMethod('SaveContact', saveParams);

      if (result.ReturnCode !== 'rcSuccess') {
        if (result.ReturnCode === 'rcItemConflict') {
          logger.warn('Konflikt verzí při aktualizaci kontaktu', { id, itemVersion: versionToUse });
          throw new Error('Kontakt byl mezitím změněn jiným uživatelem. Obnovte data a zkuste znovu.');
        }
        throw new Error(`Chyba při aktualizaci kontaktu: ${result.Description}`);
      }

      // SaveContact vrací jen Guid, ne Data - musíme načíst kontakt znovu
      if (!result.Guid) {
        throw new Error('Kontakt byl aktualizován, ale nebyl vrácen GUID');
      }

      // Po aktualizaci načteme kontakt podle GUID pro úplná data
      const updatedContact = await this.getById(result.Guid);
      if (!updatedContact) {
        throw new Error('Kontakt byl aktualizován, ale nelze jej načíst');
      }

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
   * Smazání kontaktu pomocí DeleteContact endpoint
   */
  public async delete(id: string): Promise<void> {
    try {
      logger.debug('Mazání kontaktu', { id });

      // Nejprve ověříme, že kontakt existuje
      const existingContact = await this.getById(id);
      if (!existingContact) {
        throw new Error(`Kontakt s ID ${id} nebyl nalezen`);
      }

      // Použijeme dedikovaný DeleteContact endpoint
      const deleteParams = createContactDeleteParameters(id);
      const result = await ewayConnector.callMethod('DeleteContact', deleteParams);

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
   * Používá GetContacts a provádí filtrování v paměti podle companyId
   */
  public async getByCompanyId(companyId: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<ContactDto>> {
    try {
      logger.debug('Získávání kontaktů podle společnosti', { companyId, limit, offset });

      // Použijeme getAll s companyId filtrem - ta metoda už má správnou implementaci
      // s GetContacts a in-memory filtrováním
      const result = await this.getAll(undefined, limit, offset, 'general', companyId);

      logger.info(`Získáno ${result.data.length} kontaktů pro společnost`, {
        companyId,
        total: result.total,
        limit,
        offset
      });

      return result;

    } catch (error) {
      logger.error('Chyba při získávání kontaktů podle společnosti', error);
      throw error;
    }
  }
}

export default new ContactService(); 