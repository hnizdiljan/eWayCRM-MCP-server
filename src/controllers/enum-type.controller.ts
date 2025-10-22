import { Request, Response } from 'express';
import enumTypeService from '../services/enum-type.service';
import logger from '../services/logger.service';
import { handleApiError, createSuccessResponse } from '../utils/error.utils';
import { HTTP_STATUS } from '../constants/api.constants';

/**
 * Controller pro správu enum typů
 * Implementuje read-only endpointy pro získání informací o enumeracích
 */
export class EnumTypeController {

  /**
   * GET /api/v1/enum-types
   * Vyhledání enum typů s možností filtrování
   */
  public async search(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = (req as any).validatedQuery || {};
      const enumName = validatedQuery.enumName;
      const folderName = validatedQuery.folderName;
      const includeEnumValues = validatedQuery.includeEnumValues !== 'false'; // Default true

      logger.debug('Požadavek na vyhledání enum typů', { enumName, folderName, includeEnumValues });

      const options: any = { includeEnumValues };
      if (enumName) options.enumName = enumName;
      if (folderName) options.associatedFolderNames = [folderName];

      const enumTypes = await enumTypeService.search(options);

      res.status(HTTP_STATUS.OK).json(createSuccessResponse(enumTypes));

    } catch (error) {
      handleApiError(error, res, 'Vyhledávání enum typů');
    }
  }

  /**
   * GET /api/v1/enum-types/:enumName
   * Získání konkrétního enum typu podle jména
   */
  public async getByName(req: Request, res: Response): Promise<void> {
    try {
      const { enumName } = req.params;
      const validatedQuery = (req as any).validatedQuery || {};
      const includeEnumValues = validatedQuery.includeEnumValues !== 'false'; // Default true

      logger.debug('Požadavek na enum typ podle jména', { enumName, includeEnumValues });

      const enumType = await enumTypeService.getByName(enumName, includeEnumValues);

      if (!enumType) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: `Enum typ s názvem ${enumName} nebyl nalezen`
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json(createSuccessResponse(enumType));

    } catch (error) {
      handleApiError(error, res, 'Získávání enum typu podle jména');
    }
  }

  /**
   * GET /api/v1/enum-types/folder/:folderName
   * Získání všech enum typů pro konkrétní složku (např. Tasks, Leads)
   */
  public async getByFolderName(req: Request, res: Response): Promise<void> {
    try {
      const { folderName } = req.params;
      const validatedQuery = (req as any).validatedQuery || {};
      const includeEnumValues = validatedQuery.includeEnumValues !== 'false'; // Default true

      logger.debug('Požadavek na enum typy podle složky', { folderName, includeEnumValues });

      const enumTypes = await enumTypeService.getByFolderName(folderName, includeEnumValues);

      res.status(HTTP_STATUS.OK).json(createSuccessResponse(enumTypes));

    } catch (error) {
      handleApiError(error, res, 'Získávání enum typů podle složky');
    }
  }

  /**
   * GET /api/v1/enum-types/tasks
   * Pomocný endpoint pro získání všech enum typů pro Tasks
   */
  public async getTaskEnumTypes(req: Request, res: Response): Promise<void> {
    try {
      logger.debug('Požadavek na enum typy pro Tasks');

      const enumTypes = await enumTypeService.getTaskEnumTypes();

      res.status(HTTP_STATUS.OK).json(createSuccessResponse(enumTypes));

    } catch (error) {
      handleApiError(error, res, 'Získávání enum typů pro Tasks');
    }
  }
}

export default new EnumTypeController();
