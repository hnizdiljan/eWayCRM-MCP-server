import { TaskDto, CreateTaskDto, EwayTask } from '../models/task.dto';
import {
  ewayTaskToMcpTask,
  mcpTaskToEwayTaskTracked,
  mcpTaskToEwayTaskUpdate,
  createSearchParameters,
  createSaveParameters,
  createDeleteParameters
} from '../models/task.mapper';
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
 * Služba pro správu úkolů - implementuje CRUD operace
 */
export class TaskService {

  /**
   * Získání všech úkolů s možností vyhledávání, filtrování a stránkování
   * Používá SearchTasks nebo GetTasks a provádí filtrování v paměti
   */
  public async getAll(
    query?: string,
    filters?: any,
    limit: number = 25,
    offset: number = 0
  ): Promise<PaginatedResult<TaskDto>> {
    try {
      logger.debug('Získávání úkolů', { query, filters, limit, offset });

      // Pokud jsou zadány filtry, použijeme SearchTasks, jinak GetTasks
      const hasFilters = filters && Object.keys(filters).length > 0;
      let result;

      if (hasFilters) {
        // Použijeme SearchTasks s filtry
        const searchParams = createSearchParameters(query, filters);
        result = await ewayConnector.callMethod('SearchTasks', {
          ...searchParams,
          includeRelations: true
        });
      } else {
        // Použijeme GetTasks pro získání všech úkolů
        result = await ewayConnector.callMethod('GetTasks', {
          transmitObject: {},
          includeForeignKeys: true
        });
      }

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání úkolů: ${result.Description}`);
      }

      // Mapování dat z eWay formátu do MCP formátu
      let tasks: TaskDto[] = (result.Data || []).map((ewayTask: EwayTask) =>
        ewayTaskToMcpTask(ewayTask)
      );

      // In-memory filtrování pokud je zadán query
      if (query && query.trim()) {
        const searchTerm = query.trim().toLowerCase();
        tasks = tasks.filter(task =>
          (task.subject && task.subject.toLowerCase().includes(searchTerm)) ||
          (task.body && task.body.toLowerCase().includes(searchTerm)) ||
          (task.fileAs && task.fileAs.toLowerCase().includes(searchTerm)) ||
          (task.companyName && task.companyName.toLowerCase().includes(searchTerm)) ||
          (task.contactName && task.contactName.toLowerCase().includes(searchTerm))
        );
      }

      // In-memory stránkování
      const total = tasks.length;
      const startIndex = offset;
      const endIndex = offset + limit;
      const paginatedTasks = tasks.slice(startIndex, endIndex);

      logger.info(`Získáno ${paginatedTasks.length} úkolů (stránkování ${startIndex}-${endIndex} z ${total})`, {
        total,
        hasQuery: !!query,
        hasFilters: !!filters,
        limit,
        offset
      });

      return {
        data: paginatedTasks,
        total,
        limit,
        offset,
        hasMore: endIndex < total
      };

    } catch (error) {
      logger.error('Chyba při získávání úkolů', error);
      throw error;
    }
  }

  /**
   * Získání konkrétního úkolu podle ID
   */
  public async getById(id: string): Promise<TaskDto | null> {
    try {
      logger.debug('Získávání úkolu podle ID', { id });

      // Použijeme SearchTasks s filtrem ItemGUID
      const result = await ewayConnector.callMethod('SearchTasks', {
        transmitObject: {
          ItemGUID: id
        },
        includeRelations: true
      });

      if (result.ReturnCode !== 'rcSuccess') {
        if (result.ReturnCode === 'rcItemNotFound') {
          logger.warn('Úkol nebyl nalezen', { id });
          return null;
        }
        throw new Error(`Chyba při získávání úkolu: ${result.Description}`);
      }

      if (!result.Data || result.Data.length === 0) {
        logger.warn('Úkol nebyl nalezen v datech', { id });
        return null;
      }

      const task = ewayTaskToMcpTask(result.Data[0]);
      logger.info('Úkol byl nalezen', { id, subject: task.subject });

      return task;

    } catch (error) {
      logger.error('Chyba při získávání úkolu podle ID', error);
      throw error;
    }
  }

  /**
   * Vytvoření nového úkolu
   */
  public async create(taskData: CreateTaskDto): Promise<TaskDto> {
    try {
      logger.debug('Vytváření nového úkolu', { subject: taskData.subject });

      const ewayData = mcpTaskToEwayTaskTracked(taskData);
      const saveParams = createSaveParameters(ewayData);

      const result = await ewayConnector.callMethod('SaveTask', saveParams);

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při vytváření úkolu: ${result.Description}`);
      }

      if (!result.Guid) {
        throw new Error('Úkol byl vytvořen, ale nebyl vrácen GUID');
      }

      // Po vytvoření načteme úkol podle GUID
      const createdTask = await this.getById(result.Guid!);
      if (!createdTask) {
        throw new Error('Úkol byl vytvořen, ale nelze jej načíst');
      }

      logger.info('Úkol byl úspěšně vytvořen', {
        id: createdTask.id,
        subject: createdTask.subject
      });

      return createdTask;

    } catch (error) {
      logger.error('Chyba při vytváření úkolu', error);
      throw error;
    }
  }

  /**
   * Aktualizace existujícího úkolu
   */
  public async update(id: string, taskData: CreateTaskDto, itemVersion?: number): Promise<TaskDto> {
    try {
      logger.debug('Aktualizace úkolu', { id, subject: taskData.subject });

      // Nejprve ověříme, že úkol existuje
      const existingTask = await this.getById(id);
      if (!existingTask) {
        throw new Error(`Úkol s ID ${id} nebyl nalezen`);
      }

      // Použijeme ItemVersion z existujícího úkolu pokud není poskytnut
      const versionToUse = itemVersion ?? existingTask.itemVersion;

      // Sloučíme existující data s novými daty pro partial update
      // To zajistí, že všechna povinná pole budou přítomná
      const mergedData: CreateTaskDto = {
        subject: taskData.subject ?? existingTask.subject!,
        taskDelegatorId: taskData.taskDelegatorId ?? existingTask.taskDelegatorId!,
        // Ostatní pole z taskData, pokud jsou undefined, použijeme hodnoty z existingTask
        body: taskData.body !== undefined ? taskData.body : existingTask.body,
        fileAs: taskData.fileAs !== undefined ? taskData.fileAs : existingTask.fileAs,
        isCompleted: taskData.isCompleted !== undefined ? taskData.isCompleted : existingTask.isCompleted,
        completedDate: taskData.completedDate !== undefined ? taskData.completedDate : existingTask.completedDate,
        percentComplete: taskData.percentComplete !== undefined ? taskData.percentComplete : existingTask.percentComplete,
        state: taskData.state !== undefined ? taskData.state : existingTask.state,
        previousState: taskData.previousState !== undefined ? taskData.previousState : existingTask.previousState,
        startDate: taskData.startDate !== undefined ? taskData.startDate : existingTask.startDate,
        dueDate: taskData.dueDate !== undefined ? taskData.dueDate : existingTask.dueDate,
        type: taskData.type !== undefined ? taskData.type : existingTask.type,
        importance: taskData.importance !== undefined ? taskData.importance : existingTask.importance,
        level: taskData.level !== undefined ? taskData.level : existingTask.level,
        actualWorkHours: taskData.actualWorkHours !== undefined ? taskData.actualWorkHours : existingTask.actualWorkHours,
        estimatedWorkHours: taskData.estimatedWorkHours !== undefined ? taskData.estimatedWorkHours : existingTask.estimatedWorkHours,
        isReminderSet: taskData.isReminderSet !== undefined ? taskData.isReminderSet : existingTask.isReminderSet,
        reminderDate: taskData.reminderDate !== undefined ? taskData.reminderDate : existingTask.reminderDate,
        isPrivate: taskData.isPrivate !== undefined ? taskData.isPrivate : existingTask.isPrivate,
        companyId: taskData.companyId !== undefined ? taskData.companyId : existingTask.companyId,
        contactId: taskData.contactId !== undefined ? taskData.contactId : existingTask.contactId,
        taskSolverId: taskData.taskSolverId !== undefined ? taskData.taskSolverId : existingTask.taskSolverId,
      };

      const ewayData = mcpTaskToEwayTaskUpdate(mergedData, id, versionToUse);
      const saveParams = createSaveParameters(ewayData);

      const result = await ewayConnector.callMethod('SaveTask', saveParams);

      if (result.ReturnCode !== 'rcSuccess') {
        if (result.ReturnCode === 'rcItemConflict') {
          logger.warn('Konflikt verzí při aktualizaci úkolu', { id, itemVersion: versionToUse });
          throw new Error('Úkol byl mezitím změněn jiným uživatelem. Obnovte data a zkuste znovu.');
        }
        throw new Error(`Chyba při aktualizaci úkolu: ${result.Description}`);
      }

      // SaveTask vrací jen Guid, ne Data - musíme načíst úkol znovu
      if (!result.Guid) {
        throw new Error('Úkol byl aktualizován, ale nebyl vrácen GUID');
      }

      // Po aktualizaci načteme úkol podle GUID pro úplná data
      const updatedTask = await this.getById(result.Guid);
      if (!updatedTask) {
        throw new Error('Úkol byl aktualizován, ale nelze jej načíst');
      }

      logger.info('Úkol byl úspěšně aktualizován', {
        id: updatedTask.id,
        subject: updatedTask.subject
      });

      return updatedTask;

    } catch (error) {
      logger.error('Chyba při aktualizaci úkolu', error);
      throw error;
    }
  }

  /**
   * Uzavření úkolu - nastaví isCompleted=true, completedDate=dnes, percentComplete=100
   */
  public async complete(id: string): Promise<TaskDto> {
    try {
      logger.debug('Uzavírání úkolu', { id });

      // Získáme dnešní datum ve formátu YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];

      // Použijeme update metodu s automaticky nastavenými hodnotami
      const updatedTask = await this.update(id, {
        isCompleted: true,
        completedDate: today,
        percentComplete: 100
      } as CreateTaskDto);

      logger.info('Úkol byl úspěšně uzavřen', {
        id: updatedTask.id,
        subject: updatedTask.subject,
        completedDate: today
      });

      return updatedTask;

    } catch (error) {
      logger.error('Chyba při uzavírání úkolu', error);
      throw error;
    }
  }

  /**
   * Smazání úkolu pomocí DeleteTask endpoint
   */
  public async delete(id: string): Promise<void> {
    try {
      logger.debug('Mazání úkolu', { id });

      // Nejprve ověříme, že úkol existuje
      const existingTask = await this.getById(id);
      if (!existingTask) {
        throw new Error(`Úkol s ID ${id} nebyl nalezen`);
      }

      // Použijeme dedikovaný DeleteTask endpoint
      const deleteParams = createDeleteParameters(id);
      const result = await ewayConnector.callMethod('DeleteTask', deleteParams);

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při mazání úkolu: ${result.Description}`);
      }

      logger.info('Úkol byl úspěšně smazán', {
        id,
        subject: existingTask.subject
      });

    } catch (error) {
      logger.error('Chyba při mazání úkolu', error);
      throw error;
    }
  }

  /**
   * Získání úkolů podle společnosti
   * Používá GetTasks a provádí filtrování v paměti podle companyId
   */
  public async getByCompanyId(companyId: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<TaskDto>> {
    try {
      logger.debug('Získávání úkolů podle společnosti', { companyId, limit, offset });

      // Použijeme GetTasks pro získání všech úkolů
      const result = await ewayConnector.callMethod('GetTasks', {
        transmitObject: {},
        includeForeignKeys: true
      });

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání úkolů podle společnosti: ${result.Description}`);
      }

      // Mapování dat z eWay formátu do MCP formátu
      let tasks: TaskDto[] = (result.Data || []).map((ewayTask: EwayTask) =>
        ewayTaskToMcpTask(ewayTask)
      );

      // In-memory filtrování podle companyId
      if (companyId && companyId.trim()) {
        tasks = tasks.filter(task => task.companyId === companyId);
      }

      // In-memory stránkování
      const total = tasks.length;
      const startIndex = offset;
      const endIndex = offset + limit;
      const paginatedTasks = tasks.slice(startIndex, endIndex);

      logger.info(`Získáno ${paginatedTasks.length} úkolů společnosti (stránkování ${startIndex}-${endIndex} z ${total})`, {
        companyId,
        total,
        limit,
        offset
      });

      return {
        data: paginatedTasks,
        total,
        limit,
        offset,
        hasMore: endIndex < total
      };

    } catch (error) {
      logger.error('Chyba při získávání úkolů podle společnosti', error);
      throw error;
    }
  }

  /**
   * Získání úkolů podle kontaktu
   * Používá GetTasks a provádí filtrování v paměti podle contactId
   */
  public async getByContactId(contactId: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<TaskDto>> {
    try {
      logger.debug('Získávání úkolů podle kontaktu', { contactId, limit, offset });

      // Použijeme GetTasks pro získání všech úkolů
      const result = await ewayConnector.callMethod('GetTasks', {
        transmitObject: {},
        includeForeignKeys: true
      });

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání úkolů podle kontaktu: ${result.Description}`);
      }

      // Mapování dat z eWay formátu do MCP formátu
      let tasks: TaskDto[] = (result.Data || []).map((ewayTask: EwayTask) =>
        ewayTaskToMcpTask(ewayTask)
      );

      // In-memory filtrování podle contactId
      if (contactId && contactId.trim()) {
        tasks = tasks.filter(task => task.contactId === contactId);
      }

      // In-memory stránkování
      const total = tasks.length;
      const startIndex = offset;
      const endIndex = offset + limit;
      const paginatedTasks = tasks.slice(startIndex, endIndex);

      logger.info(`Získáno ${paginatedTasks.length} úkolů kontaktu (stránkování ${startIndex}-${endIndex} z ${total})`, {
        contactId,
        total,
        limit,
        offset
      });

      return {
        data: paginatedTasks,
        total,
        limit,
        offset,
        hasMore: endIndex < total
      };

    } catch (error) {
      logger.error('Chyba při získávání úkolů podle kontaktu', error);
      throw error;
    }
  }

  /**
   * Získání úkolů podle řešitele
   * Používá GetTasks a provádí filtrování v paměti podle taskSolverId
   */
  public async getByTaskSolverId(taskSolverId: string, limit: number = 25, offset: number = 0): Promise<PaginatedResult<TaskDto>> {
    try {
      logger.debug('Získávání úkolů podle řešitele', { taskSolverId, limit, offset });

      // Použijeme GetTasks pro získání všech úkolů
      const result = await ewayConnector.callMethod('GetTasks', {
        transmitObject: {},
        includeForeignKeys: true
      });

      if (result.ReturnCode !== 'rcSuccess') {
        throw new Error(`Chyba při získávání úkolů podle řešitele: ${result.Description}`);
      }

      // Mapování dat z eWay formátu do MCP formátu
      let tasks: TaskDto[] = (result.Data || []).map((ewayTask: EwayTask) =>
        ewayTaskToMcpTask(ewayTask)
      );

      // In-memory filtrování podle taskSolverId
      if (taskSolverId && taskSolverId.trim()) {
        tasks = tasks.filter(task => task.taskSolverId === taskSolverId);
      }

      // In-memory stránkování
      const total = tasks.length;
      const startIndex = offset;
      const endIndex = offset + limit;
      const paginatedTasks = tasks.slice(startIndex, endIndex);

      logger.info(`Získáno ${paginatedTasks.length} úkolů řešitele (stránkování ${startIndex}-${endIndex} z ${total})`, {
        taskSolverId,
        total,
        limit,
        offset
      });

      return {
        data: paginatedTasks,
        total,
        limit,
        offset,
        hasMore: endIndex < total
      };

    } catch (error) {
      logger.error('Chyba při získávání úkolů podle řešitele', error);
      throw error;
    }
  }

  /**
   * Získání dokončených/nedokončených úkolů
   * Používá SearchTasks s filtrem na IsCompleted
   */
  public async getByCompletionStatus(isCompleted: boolean, limit: number = 25, offset: number = 0): Promise<PaginatedResult<TaskDto>> {
    try {
      logger.debug('Získávání úkolů podle stavu dokončení', { isCompleted, limit, offset });

      return await this.getAll(undefined, { isCompleted }, limit, offset);

    } catch (error) {
      logger.error('Chyba při získávání úkolů podle stavu dokončení', error);
      throw error;
    }
  }
}

// Singleton instance
const taskService = new TaskService();
export default taskService;
