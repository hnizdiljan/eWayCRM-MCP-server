import { TaskDto, EwayTask, CreateTaskDto } from './task.dto';

/**
 * Konvertuje eWay-CRM task do MCP DTO formátu
 */
export function ewayTaskToMcpTask(ewayTask: EwayTask): TaskDto {
  return {
    id: ewayTask.ItemGUID,
    subject: ewayTask.Subject,
    body: ewayTask.Body || undefined,
    fileAs: ewayTask.FileAs || undefined,

    // Stav úkolu
    isCompleted: ewayTask.IsCompleted || false,
    completedDate: ewayTask.CompletedDate || undefined,
    // Konverze z eWay decimal (0-1) na procenta (0-100)
    percentComplete: ewayTask.PercentCompleteDecimal !== undefined
      ? ewayTask.PercentCompleteDecimal * 100
      : undefined,
    state: ewayTask.StateEn || undefined,
    previousState: ewayTask.PrevStateEn || undefined,

    // Termíny
    startDate: ewayTask.StartDate || undefined,
    dueDate: ewayTask.DueDate || undefined,

    // Typ a priorita
    type: ewayTask.TypeEn || undefined,
    importance: ewayTask.ImportanceEn || undefined,
    level: ewayTask.Level || undefined,

    // Pracovní čas
    actualWorkHours: ewayTask.ActualWorkHours || undefined,
    estimatedWorkHours: ewayTask.EstimatedWorkHours || undefined,

    // Připomínka
    isReminderSet: ewayTask.IsReminderSet || false,
    reminderDate: ewayTask.ReminderDate || undefined,

    // Obrázek
    picture: ewayTask.Picture || undefined,
    pictureWidth: ewayTask.PictureWidth || undefined,
    pictureHeight: ewayTask.PictureHeight || undefined,

    // Soukromí
    isPrivate: ewayTask.IsPrivate || false,

    // Vztahy k jiným entitám - Leads
    leadTopLevelProjectId: ewayTask.Leads_TopLevelProjectGuid || undefined,
    leadTaskParentId: ewayTask.Leads_TaskParentGuid || undefined,

    // Vztahy k jiným entitám - Projects
    projectTopLevelProjectId: ewayTask.Projects_TopLevelProjectGuid || undefined,
    projectTaskParentId: ewayTask.Projects_TaskParentGuid || undefined,

    // Vztahy k jiným entitám - Tasks
    taskParentId: ewayTask.Tasks_TaskParentGuid || undefined,
    taskOriginId: ewayTask.Tasks_TaskOriginGuid || undefined,

    // Vztahy k jiným entitám - Marketing
    marketingTopLevelProjectId: ewayTask.Marketing_TopLevelProjectGuid || undefined,
    marketingTaskParentId: ewayTask.Marketing_TaskParentGuid || undefined,

    // Vztahy k jiným entitám - Company/Contact
    companyId: ewayTask.Companies_CompanyGuid || undefined,
    companyName: ewayTask.CompanyName || undefined,
    contactId: ewayTask.Contacts_ContactGuid || undefined,
    contactName: ewayTask.ContactName || undefined,

    // Vztahy k jiným entitám - Users
    taskDelegatorId: ewayTask.Users_TaskDelegatorGuid || undefined,
    taskDelegatorName: ewayTask.TaskDelegatorName || undefined,
    taskSolverId: ewayTask.Users_TaskSolverGuid || undefined,
    taskSolverName: ewayTask.TaskSolverName || undefined,

    // Vlastník a metadata
    ownerId: ewayTask.OwnerGUID || undefined,
    createdById: ewayTask.CreatedByGUID || undefined,
    modifiedById: ewayTask.ModifiedByGUID || undefined,

    // System fields
    created: ewayTask.ItemCreated || undefined,
    modified: ewayTask.ItemChanged || undefined,
    serverCreated: ewayTask.Server_ItemCreated || undefined,
    serverModified: ewayTask.Server_ItemChanged || undefined,
    itemVersion: ewayTask.ItemVersion,
    isDeleted: ewayTask.IsDeleted || false,
  };
}

/**
 * Konvertuje MCP DTO do eWay-CRM formátu pro vytvoření nového úkolu
 */
export function mcpTaskToEwayTaskTracked(mcpTask: CreateTaskDto): any {
  const ewayData: any = {};

  // Základní údaje
  if (mcpTask.subject) {
    ewayData.Subject = mcpTask.subject;
    // FileAs defaultuje na Subject, ale jen pokud není explicitně poskytnut
    if (!mcpTask.fileAs) {
      ewayData.FileAs = mcpTask.subject;
    }
  }
  if (mcpTask.fileAs) ewayData.FileAs = mcpTask.fileAs;
  if (mcpTask.body) ewayData.Body = mcpTask.body;

  // Stav úkolu
  if (mcpTask.isCompleted !== undefined) ewayData.IsCompleted = mcpTask.isCompleted;
  if (mcpTask.completedDate) ewayData.CompletedDate = mcpTask.completedDate;
  // Konverze z procent (0-100) na eWay decimal (0-1)
  if (mcpTask.percentComplete !== undefined) {
    ewayData.PercentCompleteDecimal = mcpTask.percentComplete / 100;
  }
  if (mcpTask.state) ewayData.StateEn = mcpTask.state;
  if (mcpTask.previousState) ewayData.PrevStateEn = mcpTask.previousState;

  // Termíny
  if (mcpTask.startDate) ewayData.StartDate = mcpTask.startDate;
  if (mcpTask.dueDate) ewayData.DueDate = mcpTask.dueDate;

  // Typ a priorita
  if (mcpTask.type) ewayData.TypeEn = mcpTask.type;
  if (mcpTask.importance) ewayData.ImportanceEn = mcpTask.importance;
  if (mcpTask.level !== undefined) ewayData.Level = mcpTask.level;

  // Pracovní čas
  if (mcpTask.actualWorkHours !== undefined) ewayData.ActualWorkHours = mcpTask.actualWorkHours;
  if (mcpTask.estimatedWorkHours !== undefined) ewayData.EstimatedWorkHours = mcpTask.estimatedWorkHours;

  // Připomínka
  if (mcpTask.isReminderSet !== undefined) ewayData.IsReminderSet = mcpTask.isReminderSet;
  if (mcpTask.reminderDate) ewayData.ReminderDate = mcpTask.reminderDate;

  // Obrázek
  if (mcpTask.picture) ewayData.Picture = mcpTask.picture;
  if (mcpTask.pictureWidth !== undefined) ewayData.PictureWidth = mcpTask.pictureWidth;
  if (mcpTask.pictureHeight !== undefined) ewayData.PictureHeight = mcpTask.pictureHeight;

  // Soukromí
  if (mcpTask.isPrivate !== undefined) ewayData.IsPrivate = mcpTask.isPrivate;

  // Vztahy k jiným entitám - Leads
  if (mcpTask.leadTopLevelProjectId) ewayData.Leads_TopLevelProjectGuid = mcpTask.leadTopLevelProjectId;
  if (mcpTask.leadTaskParentId) ewayData.Leads_TaskParentGuid = mcpTask.leadTaskParentId;

  // Vztahy k jiným entitám - Projects
  if (mcpTask.projectTopLevelProjectId) ewayData.Projects_TopLevelProjectGuid = mcpTask.projectTopLevelProjectId;
  if (mcpTask.projectTaskParentId) ewayData.Projects_TaskParentGuid = mcpTask.projectTaskParentId;

  // Vztahy k jiným entitám - Tasks
  if (mcpTask.taskParentId) ewayData.Tasks_TaskParentGuid = mcpTask.taskParentId;
  if (mcpTask.taskOriginId) ewayData.Tasks_TaskOriginGuid = mcpTask.taskOriginId;

  // Vztahy k jiným entitám - Marketing
  if (mcpTask.marketingTopLevelProjectId) ewayData.Marketing_TopLevelProjectGuid = mcpTask.marketingTopLevelProjectId;
  if (mcpTask.marketingTaskParentId) ewayData.Marketing_TaskParentGuid = mcpTask.marketingTaskParentId;

  // Vztahy k jiným entitám - Company/Contact
  if (mcpTask.companyId) ewayData.Companies_CompanyGuid = mcpTask.companyId;
  if (mcpTask.contactId) ewayData.Contacts_ContactGuid = mcpTask.contactId;

  // Vztahy k jiným entitám - Users
  if (mcpTask.taskDelegatorId) ewayData.Users_TaskDelegatorGuid = mcpTask.taskDelegatorId;
  if (mcpTask.taskSolverId) ewayData.Users_TaskSolverGuid = mcpTask.taskSolverId;

  // Vlastník a metadata
  if (mcpTask.ownerId) ewayData.OwnerGUID = mcpTask.ownerId;
  if (mcpTask.createdById) ewayData.CreatedByGUID = mcpTask.createdById;
  if (mcpTask.modifiedById) ewayData.ModifiedByGUID = mcpTask.modifiedById;

  return ewayData;
}

/**
 * Konvertuje MCP DTO do eWay-CRM formátu pro aktualizaci existujícího úkolu
 */
export function mcpTaskToEwayTaskUpdate(mcpTask: CreateTaskDto, itemGuid: string, itemVersion?: number): any {
  const ewayData = mcpTaskToEwayTaskTracked(mcpTask);

  // Pro update potřebujeme GUID
  ewayData.ItemGUID = itemGuid;

  // ItemVersion pro conflict resolution (volitelné)
  if (itemVersion !== undefined) {
    ewayData.ItemVersion = itemVersion;
  }

  return ewayData;
}

/**
 * Vytváří parametry pro vyhledávání úkolů pomocí SearchTasks
 * POZNÁMKA: SearchTasks nepodporuje filtrování podle foreign key polí!
 * Pro filtrování podle companyId, contactId, taskSolverId použijte dedikované metody
 * (getByCompanyId, getByContactId, getByTaskSolverId), které používají GetTasks a in-memory filtrování
 */
export function createSearchParameters(query?: string, filters?: any): any {
  const params: any = {
    transmitObject: {}
  };

  // Pokud je zadán dotaz, přidáme ho jako filtr na Subject
  if (query && query.trim()) {
    params.transmitObject.Subject = query.trim();
  }

  // Přidání filtrů které SearchTasks podporuje (pouze non-foreign-key pole)
  if (filters) {
    if (filters.isCompleted !== undefined) params.transmitObject.IsCompleted = filters.isCompleted;
    // Foreign key pole NELZE použít ve SearchTasks - způsobilo by to chybu:
    // "Searching by foreign key fields is not supported yet"
    // Např: companyId, contactId, taskSolverId, taskDelegatorId, leadTaskParentId, projectTaskParentId
  }

  return params;
}

/**
 * Vytváří parametry pro uložení úkolu
 * Poznámka: dieOnItemConflict a ignoredUserErrorMessages způsobovaly problémy
 * při update, proto je nepoužíváme (konzistentní s Contacts implementací)
 */
export function createSaveParameters(taskData: any): any {
  return {
    transmitObject: taskData
  };
}

/**
 * Vytváří parametry pro smazání úkolu (DeleteTask metoda)
 */
export function createDeleteParameters(itemGuid: string): any {
  return {
    itemGuid: itemGuid
  };
}
