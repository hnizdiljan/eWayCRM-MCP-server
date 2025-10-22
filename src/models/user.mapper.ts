import { UserDto, EwayUser, CreateUserDto } from './user.dto';

/**
 * Konvertuje eWay-CRM user do MCP DTO formátu
 */
export function ewayUserToMcpUser(ewayUser: EwayUser): UserDto {
  return {
    id: ewayUser.ItemGUID,
    username: ewayUser.Username || undefined,
    firstName: ewayUser.FirstName || undefined,
    middleName: ewayUser.MiddleName || undefined,
    lastName: ewayUser.LastName || undefined,
    fileAs: ewayUser.FileAs || undefined,

    // Status
    isActive: ewayUser.IsActive ?? undefined,
    isSystem: ewayUser.IsSystem ?? false,
    isApiUser: ewayUser.IsApiUser ?? false,

    // Kontaktní údaje
    email1Address: ewayUser.Email1Address || undefined,
    email2Address: ewayUser.Email2Address || undefined,
    mobilePhoneNumber: ewayUser.MobilePhoneNumber || undefined,
    businessPhoneNumber: ewayUser.BusinessPhoneNumber || undefined,

    // Adresa
    homeAddressStreet: ewayUser.HomeAddressStreet || undefined,
    homeAddressCity: ewayUser.HomeAddressCity || undefined,
    homeAddressPostalCode: ewayUser.HomeAddressPostalCode || undefined,
    homeAddressState: ewayUser.HomeAddressState || undefined,
    homeAddressPOBox: ewayUser.HomeAddressPOBox || undefined,
    homeAddressCountry: ewayUser.HomeAddressCountryEn || undefined,

    // Pracovní informace
    jobTitle: ewayUser.JobTitle || undefined,
    isHRManager: ewayUser.IsHRManager ?? undefined,
    isProjectManager: ewayUser.IsProjectManager ?? undefined,
    workdayStartTime: ewayUser.WorkdayStartTime || undefined,

    // Osobní údaje
    birthdate: ewayUser.Birthdate || undefined,
    birthPlace: ewayUser.BirthPlace || undefined,
    idCardNumber: ewayUser.IDCardNumber || undefined,
    identificationNumber: ewayUser.IdentificationNumber || undefined,
    personalIdentificationNumber: ewayUser.PersonalIdentificationNumber || undefined,
    bankAccount: ewayUser.BankAccount || undefined,
    healthInsurance: ewayUser.HealthInsurance || undefined,

    // Dovolená
    holidayLength: ewayUser.HolidayLength || undefined,
    remainingDaysOfHoliday: ewayUser.RemainingDaysOfHoliday || undefined,

    // Komunikační nástroje
    msn: ewayUser.MSN || undefined,
    icq: ewayUser.ICQ || undefined,
    skype: ewayUser.Skype || undefined,

    // Enumerace
    familyStatus: ewayUser.FamilyStatusEn || undefined,
    salaryDate: ewayUser.SalaryDateEn || undefined,
    prefix: ewayUser.PrefixEn || undefined,
    suffix: ewayUser.SuffixEn || undefined,
    type: ewayUser.TypeEn || undefined,
    state: ewayUser.StateEn || undefined,
    previousState: ewayUser.PrevStateEn || undefined,

    // Doprava
    transportMode: ewayUser.TransportMode || undefined,
    travelDistance: ewayUser.TravelDistance || undefined,
    timeAccessibility: ewayUser.TimeAccessibility || undefined,

    // Poznámka
    note: ewayUser.Note || undefined,

    // Obrázek profilu
    profilePicture: ewayUser.ProfilePicture || undefined,
    profilePictureWidth: ewayUser.ProfilePictureWidth || undefined,
    profilePictureHeight: ewayUser.ProfilePictureHeight || undefined,

    // Serverová pole (read-only)
    serverPassword: undefined, // Nikdy nevracíme heslo
    serverOutlookAccess: ewayUser.Server_OutlookAccess ?? undefined,
    serverWebAccess: ewayUser.Server_WebAccess ?? undefined,
    serverMobileAccess: ewayUser.Server_MobileAccess ?? undefined,
    serverLicensingBundlesList: ewayUser.Server_LicensingBundlesList || undefined,
    serverLastLogin: ewayUser.Server_LastLogin || undefined,
    serverLastActivity: ewayUser.Server_LastActivity || undefined,
    serverAccountLockedTime: ewayUser.Server_AccountLockedTime || undefined,
    serverForcePasswordChange: ewayUser.Server_ForcePasswordChange ?? undefined,
    serverIsAccountLocked: ewayUser.Server_IsAccountLocked ?? undefined,

    // Vztahy
    supervisorId: ewayUser.Users_SupervisorGuid || undefined,
    supervisorName: ewayUser.SupervisorName || undefined,
    defaultGroupId: ewayUser.Groups_Default_GroupGuid || undefined,
    defaultGroupName: ewayUser.DefaultGroupName || undefined,

    // Vlastník a metadata
    ownerId: ewayUser.OwnerGUID || undefined,
    createdById: ewayUser.CreatedByGUID || undefined,
    modifiedById: ewayUser.ModifiedByGUID || undefined,
    isPrivate: ewayUser.IsPrivate ?? undefined,

    // System fields
    created: ewayUser.ItemCreated || undefined,
    modified: ewayUser.ItemChanged || undefined,
    serverCreated: ewayUser.Server_ItemCreated || undefined,
    serverModified: ewayUser.Server_ItemChanged || undefined,
    itemVersion: ewayUser.ItemVersion,
  };
}

/**
 * Konvertuje MCP DTO do eWay-CRM formátu pro vytvoření nového uživatele
 */
export function mcpUserToEwayUserTracked(mcpUser: CreateUserDto): any {
  const ewayData: any = {};

  // Základní údaje
  if (mcpUser.username) ewayData.Username = mcpUser.username;
  if (mcpUser.firstName) ewayData.FirstName = mcpUser.firstName;
  if (mcpUser.middleName) ewayData.MiddleName = mcpUser.middleName;
  if (mcpUser.lastName) ewayData.LastName = mcpUser.lastName;
  if (mcpUser.fileAs) ewayData.FileAs = mcpUser.fileAs;

  // Status
  if (mcpUser.isActive !== undefined) ewayData.IsActive = mcpUser.isActive;
  if (mcpUser.isApiUser !== undefined) ewayData.IsApiUser = mcpUser.isApiUser;

  // Kontaktní údaje
  if (mcpUser.email1Address) ewayData.Email1Address = mcpUser.email1Address;
  if (mcpUser.email2Address) ewayData.Email2Address = mcpUser.email2Address;
  if (mcpUser.mobilePhoneNumber) ewayData.MobilePhoneNumber = mcpUser.mobilePhoneNumber;
  if (mcpUser.businessPhoneNumber) ewayData.BusinessPhoneNumber = mcpUser.businessPhoneNumber;

  // Adresa
  if (mcpUser.homeAddressStreet) ewayData.HomeAddressStreet = mcpUser.homeAddressStreet;
  if (mcpUser.homeAddressCity) ewayData.HomeAddressCity = mcpUser.homeAddressCity;
  if (mcpUser.homeAddressPostalCode) ewayData.HomeAddressPostalCode = mcpUser.homeAddressPostalCode;
  if (mcpUser.homeAddressState) ewayData.HomeAddressState = mcpUser.homeAddressState;
  if (mcpUser.homeAddressPOBox) ewayData.HomeAddressPOBox = mcpUser.homeAddressPOBox;
  if (mcpUser.homeAddressCountry) ewayData.HomeAddressCountryEn = mcpUser.homeAddressCountry;

  // Pracovní informace
  if (mcpUser.jobTitle) ewayData.JobTitle = mcpUser.jobTitle;
  if (mcpUser.isHRManager !== undefined) ewayData.IsHRManager = mcpUser.isHRManager;
  if (mcpUser.isProjectManager !== undefined) ewayData.IsProjectManager = mcpUser.isProjectManager;
  if (mcpUser.workdayStartTime) ewayData.WorkdayStartTime = mcpUser.workdayStartTime;

  // Osobní údaje
  if (mcpUser.birthdate) ewayData.Birthdate = mcpUser.birthdate;
  if (mcpUser.birthPlace) ewayData.BirthPlace = mcpUser.birthPlace;
  if (mcpUser.idCardNumber) ewayData.IDCardNumber = mcpUser.idCardNumber;
  if (mcpUser.identificationNumber) ewayData.IdentificationNumber = mcpUser.identificationNumber;
  if (mcpUser.personalIdentificationNumber) ewayData.PersonalIdentificationNumber = mcpUser.personalIdentificationNumber;
  if (mcpUser.bankAccount) ewayData.BankAccount = mcpUser.bankAccount;
  if (mcpUser.healthInsurance) ewayData.HealthInsurance = mcpUser.healthInsurance;

  // Dovolená
  if (mcpUser.holidayLength !== undefined) ewayData.HolidayLength = mcpUser.holidayLength;
  if (mcpUser.remainingDaysOfHoliday !== undefined) ewayData.RemainingDaysOfHoliday = mcpUser.remainingDaysOfHoliday;

  // Komunikační nástroje
  if (mcpUser.msn) ewayData.MSN = mcpUser.msn;
  if (mcpUser.icq) ewayData.ICQ = mcpUser.icq;
  if (mcpUser.skype) ewayData.Skype = mcpUser.skype;

  // Enumerace
  if (mcpUser.familyStatus) ewayData.FamilyStatusEn = mcpUser.familyStatus;
  if (mcpUser.salaryDate) ewayData.SalaryDateEn = mcpUser.salaryDate;
  if (mcpUser.prefix) ewayData.PrefixEn = mcpUser.prefix;
  if (mcpUser.suffix) ewayData.SuffixEn = mcpUser.suffix;
  if (mcpUser.type) ewayData.TypeEn = mcpUser.type;
  if (mcpUser.state) ewayData.StateEn = mcpUser.state;
  if (mcpUser.previousState) ewayData.PrevStateEn = mcpUser.previousState;

  // Doprava
  if (mcpUser.transportMode) ewayData.TransportMode = mcpUser.transportMode;
  if (mcpUser.travelDistance) ewayData.TravelDistance = mcpUser.travelDistance;
  if (mcpUser.timeAccessibility) ewayData.TimeAccessibility = mcpUser.timeAccessibility;

  // Poznámka
  if (mcpUser.note) ewayData.Note = mcpUser.note;

  // Obrázek profilu
  if (mcpUser.profilePicture) ewayData.ProfilePicture = mcpUser.profilePicture;
  if (mcpUser.profilePictureWidth !== undefined) ewayData.ProfilePictureWidth = mcpUser.profilePictureWidth;
  if (mcpUser.profilePictureHeight !== undefined) ewayData.ProfilePictureHeight = mcpUser.profilePictureHeight;

  // Serverová pole
  if (mcpUser.serverPassword) ewayData.Server_Password = mcpUser.serverPassword;
  if (mcpUser.serverOutlookAccess !== undefined) ewayData.Server_OutlookAccess = mcpUser.serverOutlookAccess;
  if (mcpUser.serverWebAccess !== undefined) ewayData.Server_WebAccess = mcpUser.serverWebAccess;
  if (mcpUser.serverMobileAccess !== undefined) ewayData.Server_MobileAccess = mcpUser.serverMobileAccess;
  if (mcpUser.serverLicensingBundlesList) ewayData.Server_LicensingBundlesList = mcpUser.serverLicensingBundlesList;
  if (mcpUser.serverForcePasswordChange !== undefined) ewayData.Server_ForcePasswordChange = mcpUser.serverForcePasswordChange;

  // Vztahy
  if (mcpUser.supervisorId) ewayData.Users_SupervisorGuid = mcpUser.supervisorId;
  if (mcpUser.defaultGroupId) ewayData.Groups_Default_GroupGuid = mcpUser.defaultGroupId;

  // Vlastník a metadata
  if (mcpUser.ownerId) ewayData.OwnerGUID = mcpUser.ownerId;
  if (mcpUser.createdById) ewayData.CreatedByGUID = mcpUser.createdById;
  if (mcpUser.modifiedById) ewayData.ModifiedByGUID = mcpUser.modifiedById;
  if (mcpUser.isPrivate !== undefined) ewayData.IsPrivate = mcpUser.isPrivate;

  return ewayData;
}

/**
 * Konvertuje MCP DTO do eWay-CRM formátu pro aktualizaci existujícího uživatele
 */
export function mcpUserToEwayUserUpdate(mcpUser: CreateUserDto, itemGuid: string, itemVersion?: number): any {
  const ewayData = mcpUserToEwayUserTracked(mcpUser);

  // Pro update potřebujeme GUID
  ewayData.ItemGUID = itemGuid;

  // ItemVersion pro conflict resolution (volitelné)
  if (itemVersion !== undefined) {
    ewayData.ItemVersion = itemVersion;
  }

  return ewayData;
}

/**
 * Vytváří parametry pro vyhledávání uživatelů pomocí SearchUsers
 * Poznámka: query parametr se NEPOUŽÍVÁ zde - používá se pro in-memory filtrování v service
 */
export function createSearchParameters(filters?: any): any {
  const params: any = {
    transmitObject: {},
    includeRelations: true,
    includeProfilePictures: false // Default false pro výkon
  };

  // Přidání filtrů
  if (filters) {
    if (filters.isActive !== undefined) params.transmitObject.IsActive = filters.isActive;
    if (filters.supervisorId) params.transmitObject.Users_SupervisorGuid = filters.supervisorId;
    if (filters.defaultGroupId) params.transmitObject.Groups_Default_GroupGuid = filters.defaultGroupId;
    if (filters.includeProfilePictures !== undefined) params.includeProfilePictures = filters.includeProfilePictures;
  }

  return params;
}

/**
 * Vytváří parametry pro získání uživatele podle ID
 * Používá GetUsersByItemGuids API metodu
 */
export function createGetByIdParameters(itemGuids: string[]): any {
  return {
    itemGuids: itemGuids,
    includeForeignKeys: true,
    includeRelations: false
  };
}

/**
 * Vytváří parametry pro uložení uživatele
 */
export function createSaveParameters(userData: any, dieOnItemConflict: boolean = true): any {
  return {
    transmitObject: userData,
    dieOnItemConflict: dieOnItemConflict,
    ignoredUserErrorMessages: []
  };
}
