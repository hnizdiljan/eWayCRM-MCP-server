import { Request, Response } from 'express';
import userService from '../services/user.service';
import logger from '../services/logger.service';
import { CreateUserDto } from '../models/user.dto';
import { handleApiError, createSuccessResponse, createPaginatedResponse } from '../utils/error.utils';
import { HTTP_STATUS } from '../constants/api.constants';

/**
 * Controller pro správu uživatelů
 * Implementuje REST API endpointy (bez DELETE - není podporováno eWay API)
 */
export class UserController {

  /**
   * GET /api/v1/users
   * Získání všech uživatelů s možností vyhledávání a stránkování
   */
  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = (req as any).validatedQuery || {};
      const query = validatedQuery.q;
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;

      // Filtry z query parametrů
      const filters: any = {};
      if (validatedQuery.isActive !== undefined) filters.isActive = validatedQuery.isActive === 'true';
      if (validatedQuery.supervisorId) filters.supervisorId = validatedQuery.supervisorId;
      if (validatedQuery.includeProfilePictures !== undefined) filters.includeProfilePictures = validatedQuery.includeProfilePictures === 'true';

      logger.debug('Požadavek na seznam uživatelů', { query, filters, limit, offset });

      const result = await userService.getAll(query, filters, limit, offset);

      const response = createPaginatedResponse(result.data, result.total, result.limit, result.offset);
      res.status(HTTP_STATUS.OK).json(response);

    } catch (error) {
      handleApiError(error, res, 'Získávání uživatelů');
    }
  }

  /**
   * GET /api/v1/users/:id
   * Získání konkrétního uživatele podle ID
   */
  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      logger.debug('Požadavek na uživatele podle ID', { id });

      const user = await userService.getById(id);

      if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: `Uživatel s ID ${id} nebyl nalezen`
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json(createSuccessResponse(user));

    } catch (error) {
      handleApiError(error, res, 'Získávání uživatele');
    }
  }

  /**
   * POST /api/v1/users
   * Vytvoření nového uživatele
   */
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserDto = req.body;

      logger.debug('Požadavek na vytvoření uživatele', { username: userData.username });

      const createdUser = await userService.create(userData);

      res.status(HTTP_STATUS.CREATED).json(
        createSuccessResponse(createdUser, 'Uživatel byl úspěšně vytvořen')
      );

    } catch (error) {
      handleApiError(error, res, 'Vytváření uživatele');
    }
  }

  /**
   * PUT /api/v1/users/:id
   * Aktualizace existujícího uživatele
   */
  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userData: CreateUserDto = req.body;
      const itemVersion = req.body.itemVersion ? parseInt(req.body.itemVersion) : undefined;

      logger.debug('Požadavek na aktualizaci uživatele', {
        id,
        username: userData.username,
        itemVersion
      });

      const updatedUser = await userService.update(id, userData, itemVersion);

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(updatedUser, 'Uživatel byl úspěšně aktualizován')
      );

    } catch (error) {
      handleApiError(error, res, 'Aktualizace uživatele');
    }
  }

  /**
   * GET /api/v1/users/active
   * Získání aktivních uživatelů
   */
  public async getActive(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = (req as any).validatedQuery || {};
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;

      logger.debug('Požadavek na aktivní uživatele', { limit, offset });

      const result = await userService.getActive(limit, offset);

      const response = createPaginatedResponse(result.data, result.total, result.limit, result.offset);
      res.status(HTTP_STATUS.OK).json(response);

    } catch (error) {
      handleApiError(error, res, 'Získávání aktivních uživatelů');
    }
  }

  /**
   * GET /api/v1/users/by-supervisor/:supervisorId
   * Získání uživatelů pro konkrétního nadřízeného
   */
  public async getBySupervisorId(req: Request, res: Response): Promise<void> {
    try {
      const { supervisorId } = req.params;
      const validatedQuery = (req as any).validatedQuery || {};
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;

      logger.debug('Požadavek na uživatele podle nadřízeného', { supervisorId, limit, offset });

      const result = await userService.getBySupervisorId(supervisorId, limit, offset);

      const response = createPaginatedResponse(result.data, result.total, result.limit, result.offset);
      res.status(HTTP_STATUS.OK).json(response);

    } catch (error) {
      handleApiError(error, res, 'Získávání uživatelů podle nadřízeného');
    }
  }
}

export default new UserController();
