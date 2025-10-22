Cílem je rozšířit API o Users endpoint.

Podklady k internímu eWay API jsou následující.

Pro READ je k dispozici /SearchUsers se strukturou:

{
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "transmitObject": {
    "Users_SupervisorGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Groups_Default_GroupGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Username": "string",
    "FirstName": "string",
    "MiddleName": "string",
    "LastName": "string",
    "IsActive": true,
    "MobilePhoneNumber": "string",
    "BusinessPhoneNumber": "string",
    "MobilePhoneNumberNormalized": "string",
    "BusinessPhoneNumberNormalized": "string",
    "Email1Address": "string",
    "Email2Address": "string",
    "HomeAddressStreet": "string",
    "HomeAddressCity": "string",
    "HomeAddressPostalCode": "string",
    "HomeAddressState": "string",
    "HomeAddressPOBox": "string",
    "HomeAddressCountryEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "BankAccount": "string",
    "BirthPlace": "string",
    "Note": "string",
    "IDCardNumber": "string",
    "Birthdate": "2025-10-21",
    "IdentificationNumber": "string",
    "HealthInsurance": "string",
    "HolidayLength": 0,
    "PersonalIdentificationNumber": "string",
    "MSN": "string",
    "ICQ": "string",
    "Skype": "string",
    "FamilyStatusEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "SalaryDateEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "TransportMode": "string",
    "TravelDistance": "string",
    "TimeAccessibility": "string",
    "IsHRManager": true,
    "IsProjectManager": true,
    "PrefixEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "SuffixEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "WorkdayStartTime": "string",
    "RemainingDaysOfHoliday": 0,
    "IsSystem": true,
    "IsApiUser": true,
    "JobTitle": "string",
    "ProfilePicture": "string",
    "ProfilePictureWidth": 0,
    "ProfilePictureHeight": 0,
    "Server_Password": "string",
    "Server_OutlookAccess": true,
    "Server_WebAccess": true,
    "Server_MobileAccess": true,
    "Server_LicensingBundlesList": [
      "string"
    ],
    "Server_LastLogin": "2025-10-21T16:00:23.559Z",
    "Server_LastActivity": "2025-10-21T16:00:23.559Z",
    "Server_AccountLockedTime": "2025-10-21T16:00:23.559Z",
    "Server_ForcePasswordChange": true,
    "Server_IsAccountLocked": true,
    "TypeEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "StateEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "PrevStateEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "IsPrivate": true,
    "Server_ItemCreated": "2025-10-21T16:00:23.559Z",
    "Server_ItemChanged": "2025-10-21T16:00:23.559Z",
    "ItemCreated": "2025-10-21T16:00:23.559Z",
    "ItemChanged": "2025-10-21T16:00:23.559Z",
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
  "includeProfilePictures": true,
  "binaryLogicalOperator": "string"
}


Pro CREATE/UPDATE je k dispozici /SaveUser se strukturou:

{
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "transmitObject": {
    "Username": "string",
    "FirstName": "string",
    "MiddleName": "string",
    "LastName": "string",
    "IsActive": true,
    "MobilePhoneNumber": "string",
    "BusinessPhoneNumber": "string",
    "MobilePhoneNumberNormalized": "string",
    "BusinessPhoneNumberNormalized": "string",
    "Email1Address": "string",
    "Email2Address": "string",
    "HomeAddressStreet": "string",
    "HomeAddressCity": "string",
    "HomeAddressPostalCode": "string",
    "HomeAddressState": "string",
    "HomeAddressPOBox": "string",
    "HomeAddressCountryEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "BankAccount": "string",
    "BirthPlace": "string",
    "Note": "string",
    "IDCardNumber": "string",
    "Birthdate": "2025-10-21",
    "IdentificationNumber": "string",
    "HealthInsurance": "string",
    "HolidayLength": 0,
    "PersonalIdentificationNumber": "string",
    "MSN": "string",
    "ICQ": "string",
    "Skype": "string",
    "FamilyStatusEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "SalaryDateEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "TransportMode": "string",
    "TravelDistance": "string",
    "TimeAccessibility": "string",
    "IsHRManager": true,
    "IsProjectManager": true,
    "PrefixEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "SuffixEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "WorkdayStartTime": "string",
    "RemainingDaysOfHoliday": 0,
    "IsApiUser": true,
    "JobTitle": "string",
    "ProfilePicture": "string",
    "ProfilePictureWidth": 0,
    "ProfilePictureHeight": 0,
    "Server_Password": "string",
    "Server_OutlookAccess": true,
    "Server_WebAccess": true,
    "Server_MobileAccess": true,
    "Server_LicensingBundlesList": [
      "string"
    ],
    "Server_ForcePasswordChange": true,
    "TypeEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "StateEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "PrevStateEn": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Users_SupervisorGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "Groups_Default_GroupGuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "IsPrivate": true,
    "ItemCreated": "2025-10-21T16:00:53.288Z",
    "ItemChanged": "2025-10-21T16:00:53.288Z",
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