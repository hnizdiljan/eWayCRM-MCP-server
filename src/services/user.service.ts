import { UserDto, CreateUserDto, EwayUser } from '../models/user.dto';
import {
  ewayUserToMcpUser,
  mcpUserToEwayUserTracked,
  mcpUserToEwayUserUpdate,
  createSearchParameters,
  createGetByIdParameters,
  createSaveParameters
} from '../models/user.mapper';
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
 * Služba pro správu uživatelů - implementuje operace pro čtení a zápis
 * Poznámka: Delete operace není v eWay API dostupná pro Users
 */
export class UserService {

  /**
   * Získání všech uživatelů s možností vyhledávání, filtrování a stránkování
   * Používá SearchUsers s filtry nebo bez nich
   */
  public async getAll(
    query?: string,
    filters?: any,
    limit: number = 25,
    offset: number = 0
  ): Promise<PaginatedResult<UserDto>> {
    try {
      logger.debug('Získávání uživatelů', { query, filters, limit, offset });

      // Kontrola zda jsou zadány nějaké filtry pro transmitObject
      // query se NEPOUŽÍVÁ jako filtr SearchUsers - pouze pro in-memory filtrování
      // includeProfilePictures není filtr transmitObject, ale parametr API volání
      const hasTransmitObjectFilters = !!(
        filters && (filters.isActive !== undefined || filters.supervisorId || filters.defaultGroupId)
      );

      let result;

      if (hasTransmitObjectFilters) {
        // Pokud jsou filtry, použijeme SearchUsers s nimi
        const searchParams = createSearchParameters(filters);
        result = await ewayConnector.callMethod('SearchUsers', searchParams);
      } else {
        // Pokud nejsou filtry pro transmitObject, použijeme IsActive=true jako základní filtr
        const includeProfilePictures = filters?.includeProfilePictures ?? false;
        result = await ewayConnector.callMethod('SearchUsers', {
          transmitObject: {
            IsActive: true  // Vrátí aktivní uživatele
          },
          includeRelations: true,
          includeProfilePictures: includeProfilePictures
        });
      }

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání uživatelů: ${result.Description}`);
      }

      // Mapování dat z eWay formátu do MCP formátu
      let users: UserDto[] = (result.Data || []).map((ewayUser: EwayUser) =>
        ewayUserToMcpUser(ewayUser)
      );

      // In-memory filtrování pokud je zadán query (username, jméno, příjmení)
      if (query && query.trim()) {
        const searchTerm = query.trim().toLowerCase();
        users = users.filter(user =>
          (user.username && user.username.toLowerCase().includes(searchTerm)) ||
          (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
          (user.lastName && user.lastName.toLowerCase().includes(searchTerm)) ||
          (user.email1Address && user.email1Address.toLowerCase().includes(searchTerm)) ||
          (user.fileAs && user.fileAs.toLowerCase().includes(searchTerm))
        );
      }

      // In-memory stránkování
      const total = users.length;
      const startIndex = offset;
      const endIndex = offset + limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      logger.info(`Získáno ${paginatedUsers.length} uživatelů (stránkování ${startIndex}-${endIndex} z ${total})`, {
        total,
        hasQuery: !!query,
        hasFilters: !!(filters && Object.keys(filters).length > 0),
        limit,
        offset
      });

      return {
        data: paginatedUsers,
        total,
        limit,
        offset,
        hasMore: endIndex < total
      };

    } catch (error) {
      logger.error('Chyba při získávání uživatelů', error);
      throw error;
    }
  }

  /**
   * Získání konkrétního uživatele podle ID
   */
  public async getById(id: string): Promise<UserDto | null> {
    try {
      logger.debug('Získávání uživatele podle ID', { id });

      const getParams = createGetByIdParameters([id]);
      const result = await ewayConnector.callMethod('GetUsersByItemGuids', getParams);

      if (result.ReturnCode !== 'rcSuccess') {
        if (result.ReturnCode === 'rcItemNotFound') {
          logger.warn('Uživatel nebyl nalezen', { id });
          return null;
        }
        throw new Error(`Chyba při získávání uživatele: ${result.Description}`);
      }

      if (!result.Data || result.Data.length === 0) {
        logger.warn('Uživatel nebyl nalezen v datech', { id });
        return null;
      }

      const user = ewayUserToMcpUser(result.Data[0]);
      logger.info('Uživatel byl nalezen', { id, username: user.username });

      return user;

    } catch (error) {
      logger.error('Chyba při získávání uživatele podle ID', error);
      throw error;
    }
  }

  /**
   * Vytvoření nového uživatele
   */
  public async create(userData: CreateUserDto): Promise<UserDto> {
    try {
      logger.debug('Vytváření nového uživatele', { username: userData.username });

      const ewayData = mcpUserToEwayUserTracked(userData);
      const saveParams = createSaveParameters(ewayData);

      const result = await ewayConnector.callMethod('SaveUser', saveParams);

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při vytváření uživatele: ${result.Description}`);
      }

      if (!result.Guid) {
        throw new Error('Uživatel byl vytvořen, ale nebyl vrácen GUID');
      }

      // Po vytvoření načteme uživatele podle GUID
      const createdUser = await this.getById(result.Guid!);
      if (!createdUser) {
        throw new Error('Uživatel byl vytvořen, ale nelze jej načíst');
      }

      logger.info('Uživatel byl úspěšně vytvořen', {
        id: createdUser.id,
        username: createdUser.username
      });

      return createdUser;

    } catch (error) {
      logger.error('Chyba při vytváření uživatele', error);
      throw error;
    }
  }

  /**
   * Aktualizace existujícího uživatele
   */
  public async update(id: string, userData: CreateUserDto, itemVersion?: number): Promise<UserDto> {
    try {
      logger.debug('Aktualizace uživatele', { id, username: userData.username });

      // Nejprve ověříme, že uživatel existuje
      const existingUser = await this.getById(id);
      if (!existingUser) {
        throw new Error(`Uživatel s ID ${id} nebyl nalezen`);
      }

      // Použijeme ItemVersion z existujícího uživatele pokud není poskytnut
      const versionToUse = itemVersion ?? existingUser.itemVersion;

      const ewayData = mcpUserToEwayUserUpdate(userData, id, versionToUse);
      const saveParams = createSaveParameters(ewayData);

      const result = await ewayConnector.callMethod('SaveUser', saveParams);

      if (result.ReturnCode !== 'rcSuccess') {
        if (result.ReturnCode === 'rcItemConflict') {
          logger.warn('Konflikt verzí při aktualizaci uživatele', { id, itemVersion: versionToUse });
          throw new Error('Uživatel byl mezitím změněn jiným uživatelem. Obnovte data a zkuste znovu.');
        }
        throw new Error(`Chyba při aktualizaci uživatele: ${result.Description}`);
      }

      // SaveUser vrací jen Guid, ne Data - musíme načíst uživatele znovu
      if (!result.Guid) {
        throw new Error('Uživatel byl aktualizován, ale nebyl vrácen GUID');
      }

      // Po aktualizaci načteme uživatele podle GUID pro úplná data
      const updatedUser = await this.getById(result.Guid);
      if (!updatedUser) {
        throw new Error('Uživatel byl aktualizován, ale nelze jej načíst');
      }

      logger.info('Uživatel byl úspěšně aktualizován', {
        id: updatedUser.id,
        username: updatedUser.username
      });

      return updatedUser;

    } catch (error) {
      logger.error('Chyba při aktualizaci uživatele', error);
      throw error;
    }
  }

  /**
   * Získání aktivních uživatelů
   */
  public async getActive(limit: number = 25, offset: number = 0): Promise<PaginatedResult<UserDto>> {
    try {
      logger.debug('Získávání aktivních uživatelů', { limit, offset });

      return await this.getAll(undefined, { isActive: true }, limit, offset);

    } catch (error) {
      logger.error('Chyba při získávání aktivních uživatelů', error);
      throw error;
    }
  }

  /**
   * Získání uživatelů podle nadřízeného
   */
  public async getBySupervisorId(supervisorId: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<UserDto>> {
    try {
      logger.debug('Získávání uživatelů podle nadřízeného', { supervisorId, limit, offset });

      return await this.getAll(undefined, { supervisorId }, limit, offset);

    } catch (error) {
      logger.error('Chyba při získávání uživatelů podle nadřízeného', error);
      throw error;
    }
  }
}

// Singleton instance
const userService = new UserService();
export default userService;
