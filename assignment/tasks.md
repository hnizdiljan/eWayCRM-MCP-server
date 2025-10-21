Cílem je implementovat nový controller "Tasks".

Vůči podkladovému API je třeba volat následující endpointy:

1. Pro čtení:
  - Inspirovat se u Contacts / Companies, ale pravděpodobně ideální bude endpoint:
    - POST /SearchTasks
  - Má strukturu:
    - {
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "transmitObject": {
    "Leads_TopLevelProjectGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Leads_TaskParentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Projects_TopLevelProjectGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Projects_TaskParentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Tasks_TaskParentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Marketing_TopLevelProjectGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Marketing_TaskParentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Companies_CompanyGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Contacts_ContactGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Users_TaskDelegatorGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Users_TaskSolverGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Tasks_TaskOriginGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Body": "string",
    "IsCompleted": true,
    "DueDate": "2025-10-21",
    "PercentCompleteDecimal": 0,
    "PrevStateEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "StartDate": "2025-10-21",
    "StateEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Subject": "string",
    "TypeEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Level": 0,
    "ImportanceEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ActualWorkHours": 0,
    "EstimatedWorkHours": 0,
    "IsReminderSet": true,
    "ReminderDate": "2025-10-21T12:14:52.427Z",
    "CompletedDate": "2025-10-21T12:14:52.427Z",
    "Picture": "string",
    "PictureWidth": 0,
    "PictureHeight": 0,
    "IsPrivate": true,
    "Server_ItemCreated": "2025-10-21T12:14:52.427Z",
    "Server_ItemChanged": "2025-10-21T12:14:52.427Z",
    "ItemCreated": "2025-10-21T12:14:52.427Z",
    "ItemChanged": "2025-10-21T12:14:52.427Z",
    "FileAs": "string",
    "OwnerGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "CreatedByGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ModifiedByGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "AdditionalFields": {
      "Count": 0,
      "All": [
        {
          "BaseValue": {},
          "FieldId": 0
        }
      ],
      "Item": {}
    },
    "Relations": [
      {
        "ItemGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "RelationDataGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "RelationType": "string",
        "ForeignFolderName": "string",
        "ForeignItemGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "DifferDirection": true,
        "OwnerGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "MainItemGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ],
    "ItemGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ItemVersion": 0
  },
  "includeRelations": true,
  "relationsFilter": {
    "RelationType": "string",
    "ForeignFolderName": "string"
  },
  "binaryLogicalOperator": "string"
}

2. Pro Vytvoření nového / editaci:

POST /SaveTask

který má následující strukturu:
{
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "transmitObject": {
    "Body": "string",
    "IsCompleted": true,
    "DueDate": "2025-10-21",
    "PercentCompleteDecimal": 0,
    "PrevStateEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "StartDate": "2025-10-21",
    "StateEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Subject": "string",
    "TypeEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Level": 0,
    "ImportanceEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ActualWorkHours": 0,
    "EstimatedWorkHours": 0,
    "IsReminderSet": true,
    "ReminderDate": "2025-10-21T12:08:37.801Z",
    "CompletedDate": "2025-10-21T12:08:37.801Z",
    "Picture": "string",
    "PictureWidth": 0,
    "PictureHeight": 0,
    "Leads_TaskParentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Projects_TaskParentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Tasks_TaskParentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Marketing_TaskParentGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Companies_CompanyGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Contacts_ContactGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Users_TaskDelegatorGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Users_TaskSolverGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Tasks_TaskOriginGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "IsPrivate": true,
    "ItemCreated": "2025-10-21T12:08:37.801Z",
    "ItemChanged": "2025-10-21T12:08:37.801Z",
    "FileAs": "string",
    "OwnerGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "CreatedByGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ModifiedByGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "AdditionalFields": {
      "Count": 0,
      "All": [
        {
          "BaseValue": {},
          "FieldId": 0
        }
      ],
      "Item": {}
    },
    "ItemGUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ItemVersion": 0
  },
  "dieOnItemConflict": true,
  "ignoredUserErrorMessages": [
    "string"
  ]
}


3. Pro smazaní:

POST /DeleteTask

struktura:
{
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "itemGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}