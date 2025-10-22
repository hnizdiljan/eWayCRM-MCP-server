import { EnumTypeDto, EwayEnumType } from '../models/enum-type.dto';
import {
  ewayEnumTypeToMcpEnumType,
  createSearchEnumTypesParameters
} from '../models/enum-type.mapper';
import ewayConnector from '../connectors/eway-http.connector';
import logger from './logger.service';

/**
 * Služba pro správu enum typů - získávání informací o enumeracích
 */
export class EnumTypeService {

  /**
   * Získání všech enum typů nebo filtrování podle jména/složky
   */
  public async search(options?: {
    enumName?: string;
    associatedFolderNames?: string[];
    includeEnumValues?: boolean;
  }): Promise<EnumTypeDto[]> {
    try {
      logger.debug('Vyhledávání enum typů', options);

      // Kontrola zda je zadán enumName filtr (jediný podporovaný SearchEnumTypes filtr kromě IsSystem)
      const hasEnumNameFilter = !!options?.enumName;

      let result;

      if (hasEnumNameFilter) {
        // Pokud je enumName, použijeme SearchEnumTypes s EnumName filtrem
        const searchParams = createSearchEnumTypesParameters(options);
        result = await ewayConnector.callMethod('SearchEnumTypes', searchParams);
      } else {
        // Pro získání všech enum typů použijeme SearchEnumTypes se základním filtrem
        // SearchEnumTypes vyžaduje alespoň jednu property - použijeme IsSystem=false jako široký filtr
        result = await ewayConnector.callMethod('SearchEnumTypes', {
          transmitObject: {
            IsSystem: false  // Filtr který vrátí většinu enum typů
          },
          includeRelations: false,
          omitEnumValues: options?.includeEnumValues === false
        });
      }

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při vyhledávání enum typů: ${result.Description}`);
      }

      // Mapování dat z eWay formátu do MCP formátu
      let enumTypes: EnumTypeDto[] = (result.Data || []).map((ewayEnumType: EwayEnumType) =>
        ewayEnumTypeToMcpEnumType(ewayEnumType)
      );

      // Filtrování podle AssociatedFolderNames (pokud je zadáno) - na straně serveru
      if (options?.associatedFolderNames && options.associatedFolderNames.length > 0) {
        const folderNamesToFind = options.associatedFolderNames.map(f => f.toLowerCase());
        enumTypes = enumTypes.filter(enumType => {
          if (!enumType.associatedFolderNames || enumType.associatedFolderNames.length === 0) {
            return false;
          }
          // Kontrola zda enum type obsahuje alespoň jednu z hledaných složek
          return enumType.associatedFolderNames.some(folderName =>
            folderNamesToFind.includes(folderName.toLowerCase())
          );
        });
      }

      logger.info(`Získáno ${enumTypes.length} enum typů`, {
        total: enumTypes.length,
        hasEnumNameFilter,
        hasFolderFilter: !!(options?.associatedFolderNames && options.associatedFolderNames.length > 0)
      });

      return enumTypes;

    } catch (error) {
      logger.error('Chyba při vyhledávání enum typů', error);
      throw error;
    }
  }

  /**
   * Získání konkrétního enum typu podle jména
   */
  public async getByName(enumName: string, includeEnumValues: boolean = true): Promise<EnumTypeDto | null> {
    try {
      logger.debug('Získávání enum typu podle jména', { enumName });

      const enumTypes = await this.search({ enumName, includeEnumValues });

      if (enumTypes.length === 0) {
        logger.warn('Enum typ nebyl nalezen', { enumName });
        return null;
      }

      const enumType = enumTypes[0];
      logger.info('Enum typ byl nalezen', { enumName, valuesCount: enumType.enumValues?.length || 0 });

      return enumType;

    } catch (error) {
      logger.error('Chyba při získávání enum typu podle jména', error);
      throw error;
    }
  }

  /**
   * Získání enum typů pro konkrétní složku (např. "Tasks", "Leads", atd.)
   */
  public async getByFolderName(folderName: string, includeEnumValues: boolean = true): Promise<EnumTypeDto[]> {
    try {
      logger.debug('Získávání enum typů podle složky', { folderName });

      const enumTypes = await this.search({
        associatedFolderNames: [folderName],
        includeEnumValues
      });

      logger.info(`Získáno ${enumTypes.length} enum typů pro složku ${folderName}`, {
        folderName,
        total: enumTypes.length
      });

      return enumTypes;

    } catch (error) {
      logger.error('Chyba při získávání enum typů podle složky', error);
      throw error;
    }
  }

  /**
   * Získání všech enum typů pro Tasks (užitečné pro zjištění ImportanceEn, TypeEn, StateEn atd.)
   */
  public async getTaskEnumTypes(): Promise<EnumTypeDto[]> {
    return this.getByFolderName('Tasks', true);
  }
}

// Singleton instance
const enumTypeService = new EnumTypeService();
export default enumTypeService;
