import { Request, Response } from 'express';
import taskService from '../services/task.service';
import logger from '../services/logger.service';
import { CreateTaskDto } from '../models/task.dto';
import { handleApiError, createSuccessResponse, createPaginatedResponse } from '../utils/error.utils';
import { HTTP_STATUS } from '../constants/api.constants';

/**
 * Controller pro správu úkolů
 * Implementuje REST API endpointy
 */
export class TaskController {

  /**
   * GET /api/v1/tasks
   * Získání všech úkolů s možností vyhledávání a stránkování
   */
  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = (req as any).validatedQuery || {};
      const query = validatedQuery.q;
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;

      // Filtry z query parametrů
      const filters: any = {};
      if (validatedQuery.companyId) filters.companyId = validatedQuery.companyId;
      if (validatedQuery.contactId) filters.contactId = validatedQuery.contactId;
      if (validatedQuery.taskSolverId) filters.taskSolverId = validatedQuery.taskSolverId;
      if (validatedQuery.taskDelegatorId) filters.taskDelegatorId = validatedQuery.taskDelegatorId;
      if (validatedQuery.isCompleted !== undefined) filters.isCompleted = validatedQuery.isCompleted === 'true';

      logger.debug('Požadavek na seznam úkolů', { query, filters, limit, offset });

      const result = await taskService.getAll(query, filters, limit, offset);

      const response = createPaginatedResponse(result.data, result.total, result.limit, result.offset);
      res.status(HTTP_STATUS.OK).json(response);

    } catch (error) {
      handleApiError(error, res, 'Získávání úkolů');
    }
  }

  /**
   * GET /api/v1/tasks/:id
   * Získání konkrétního úkolu podle ID
   */
  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      logger.debug('Požadavek na úkol podle ID', { id });

      const task = await taskService.getById(id);

      if (!task) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: `Úkol s ID ${id} nebyl nalezen`
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json(createSuccessResponse(task));

    } catch (error) {
      handleApiError(error, res, 'Získávání úkolu');
    }
  }

  /**
   * POST /api/v1/tasks
   * Vytvoření nového úkolu
   */
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const taskData: CreateTaskDto = req.body;

      logger.debug('Požadavek na vytvoření úkolu', { subject: taskData.subject });

      const createdTask = await taskService.create(taskData);

      res.status(HTTP_STATUS.CREATED).json(
        createSuccessResponse(createdTask, 'Úkol byl úspěšně vytvořen')
      );

    } catch (error) {
      handleApiError(error, res, 'Vytváření úkolu');
    }
  }

  /**
   * PUT /api/v1/tasks/:id
   * Aktualizace existujícího úkolu
   */
  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const taskData: CreateTaskDto = req.body;
      const itemVersion = req.body.itemVersion ? parseInt(req.body.itemVersion) : undefined;

      logger.debug('Požadavek na aktualizaci úkolu', {
        id,
        subject: taskData.subject,
        itemVersion
      });

      const updatedTask = await taskService.update(id, taskData, itemVersion);

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(updatedTask, 'Úkol byl úspěšně aktualizován')
      );

    } catch (error) {
      handleApiError(error, res, 'Aktualizace úkolu');
    }
  }

  /**
   * PUT /api/v1/tasks/:id/complete
   * Uzavření úkolu (nastaví isCompleted=true, completedDate=dnes, percentComplete=100)
   */
  public async complete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      logger.debug('Požadavek na uzavření úkolu', { id });

      const completedTask = await taskService.complete(id);

      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(completedTask, 'Úkol byl úspěšně uzavřen')
      );

    } catch (error) {
      handleApiError(error, res, 'Uzavření úkolu');
    }
  }

  /**
   * DELETE /api/v1/tasks/:id
   * Smazání úkolu
   */
  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      logger.debug('Požadavek na smazání úkolu', { id });

      await taskService.delete(id);

      res.status(HTTP_STATUS.NO_CONTENT).send();

    } catch (error) {
      handleApiError(error, res, 'Mazání úkolu');
    }
  }

  /**
   * GET /api/v1/tasks/by-company/:companyId
   * Získání úkolů pro konkrétní společnost
   */
  public async getByCompanyId(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const validatedQuery = (req as any).validatedQuery || {};
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;

      logger.debug('Požadavek na úkoly podle společnosti', { companyId, limit, offset });

      const result = await taskService.getByCompanyId(companyId, limit, offset);

      const response = createPaginatedResponse(result.data, result.total, result.limit, result.offset);
      res.status(HTTP_STATUS.OK).json(response);

    } catch (error) {
      handleApiError(error, res, 'Získávání úkolů podle společnosti');
    }
  }

  /**
   * GET /api/v1/tasks/by-contact/:contactId
   * Získání úkolů pro konkrétní kontakt
   */
  public async getByContactId(req: Request, res: Response): Promise<void> {
    try {
      const { contactId } = req.params;
      const validatedQuery = (req as any).validatedQuery || {};
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;

      logger.debug('Požadavek na úkoly podle kontaktu', { contactId, limit, offset });

      const result = await taskService.getByContactId(contactId, limit, offset);

      const response = createPaginatedResponse(result.data, result.total, result.limit, result.offset);
      res.status(HTTP_STATUS.OK).json(response);

    } catch (error) {
      handleApiError(error, res, 'Získávání úkolů podle kontaktu');
    }
  }

  /**
   * GET /api/v1/tasks/by-solver/:taskSolverId
   * Získání úkolů pro konkrétního řešitele
   */
  public async getByTaskSolverId(req: Request, res: Response): Promise<void> {
    try {
      const { taskSolverId } = req.params;
      const validatedQuery = (req as any).validatedQuery || {};
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;

      logger.debug('Požadavek na úkoly podle řešitele', { taskSolverId, limit, offset });

      const result = await taskService.getByTaskSolverId(taskSolverId, limit, offset);

      const response = createPaginatedResponse(result.data, result.total, result.limit, result.offset);
      res.status(HTTP_STATUS.OK).json(response);

    } catch (error) {
      handleApiError(error, res, 'Získávání úkolů podle řešitele');
    }
  }

  /**
   * GET /api/v1/tasks/completed
   * Získání dokončených úkolů
   */
  public async getCompleted(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = (req as any).validatedQuery || {};
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;

      logger.debug('Požadavek na dokončené úkoly', { limit, offset });

      const result = await taskService.getByCompletionStatus(true, limit, offset);

      const response = createPaginatedResponse(result.data, result.total, result.limit, result.offset);
      res.status(HTTP_STATUS.OK).json(response);

    } catch (error) {
      handleApiError(error, res, 'Získávání dokončených úkolů');
    }
  }

  /**
   * GET /api/v1/tasks/pending
   * Získání nedokončených úkolů
   */
  public async getPending(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = (req as any).validatedQuery || {};
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;

      logger.debug('Požadavek na nedokončené úkoly', { limit, offset });

      const result = await taskService.getByCompletionStatus(false, limit, offset);

      const response = createPaginatedResponse(result.data, result.total, result.limit, result.offset);
      res.status(HTTP_STATUS.OK).json(response);

    } catch (error) {
      handleApiError(error, res, 'Získávání nedokončených úkolů');
    }
  }
}

export default new TaskController();
