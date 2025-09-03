import ewayConnector from '../connectors/eway-http.connector';
import logger from './logger.service';
import { EWAY_RETURN_CODES, ERROR_MESSAGES } from '../constants/api.constants';

export interface SearchParams {
  limit?: number;
  offset?: number;
  searchQuery?: string;
  additionalFields?: Record<string, any>;
}

export interface ApiResponse<T> {
  data: T;
  totalCount?: number;
  returnCode: string;
  message?: string;
}

export abstract class BaseService<TDto, TCreateDto, TUpdateDto> {
  protected abstract entityName: string;
  protected abstract searchMethod: string;
  protected abstract getByIdMethod: string;
  protected abstract saveMethod: string;
  protected abstract deleteMethod: string;

  protected async executeSearch(params: SearchParams): Promise<ApiResponse<TDto[]>> {
    try {
      const searchParams = this.buildSearchParams(params);
      
      logger.info(`🔍 Vyhledávání ${this.entityName}`, searchParams);
      
      const result = await ewayConnector.callMethod(this.searchMethod, searchParams);
      
      if (result.ReturnCode !== EWAY_RETURN_CODES.SUCCESS) {
        throw new Error(result.Description || ERROR_MESSAGES.INTERNAL_ERROR);
      }

      return {
        data: result.Data || [],
        totalCount: result.TotalCount,
        returnCode: result.ReturnCode
      };
    } catch (error) {
      logger.error(`Chyba při vyhledávání ${this.entityName}`, error);
      throw error;
    }
  }

  protected async executeGetById(id: string): Promise<TDto | null> {
    try {
      logger.info(`🔍 Získávání ${this.entityName} s ID: ${id}`);
      
      const result = await ewayConnector.callMethod(this.getByIdMethod, {
        itemGuid: id,
        includeForeignKeys: true
      });

      if (result.ReturnCode !== EWAY_RETURN_CODES.SUCCESS) {
        logger.warn(`${this.entityName} nenalezen: ${id}`);
        return null;
      }

      return (result.Data && result.Data.length > 0) ? result.Data[0] : null;
    } catch (error) {
      logger.error(`Chyba při získávání ${this.entityName} ${id}`, error);
      throw error;
    }
  }

  protected async executeSave(data: any, isUpdate: boolean = false): Promise<string> {
    try {
      const action = isUpdate ? 'Aktualizace' : 'Vytváření';
      logger.info(`📝 ${action} ${this.entityName}`, { data });

      const result = await ewayConnector.callMethod(this.saveMethod, {
        transmitObject: data
      });

      if (result.ReturnCode !== EWAY_RETURN_CODES.SUCCESS) {
        throw new Error(result.Description || result.UserMessage || ERROR_MESSAGES.INTERNAL_ERROR);
      }

      const guid = result.Guid || data.ItemGUID;
      logger.info(`✅ ${action} ${this.entityName} úspěšná: ${guid}`);
      
      return guid;
    } catch (error) {
      logger.error(`Chyba při ukládání ${this.entityName}`, error);
      throw error;
    }
  }

  protected async executeDelete(id: string): Promise<boolean> {
    try {
      logger.info(`🗑️ Mazání ${this.entityName}: ${id}`);

      const result = await ewayConnector.callMethod(this.deleteMethod, {
        itemGuid: id
      });

      if (result.ReturnCode !== EWAY_RETURN_CODES.SUCCESS) {
        throw new Error(result.Description || ERROR_MESSAGES.INTERNAL_ERROR);
      }

      logger.info(`✅ ${this.entityName} smazán: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Chyba při mazání ${this.entityName} ${id}`, error);
      throw error;
    }
  }

  protected buildSearchParams(params: SearchParams): any {
    const { limit = 25, offset = 0, searchQuery, additionalFields = {} } = params;
    
    return {
      transmitObject: {
        Limit: Math.min(limit, 100),
        Offset: offset,
        ...(searchQuery && { SearchQuery: searchQuery }),
        ...additionalFields
      }
    };
  }

  protected handleError(error: any, operation: string): never {
    const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
    logger.error(`${operation} selhalo pro ${this.entityName}`, { error, message });
    throw new Error(`${operation} selhalo: ${message}`);
  }
}