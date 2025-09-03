export const API_CONSTANTS = {
  VERSION: 'v1',
  BASE_PATH: '/api/v1',
  PAGINATION: {
    DEFAULT_LIMIT: 25,
    MAX_LIMIT: 100,
    DEFAULT_OFFSET: 0
  },
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const EWAY_RETURN_CODES = {
  SUCCESS: 'rcSuccess',
  BAD_SESSION: 'rcBadSession',
  ERROR: 'rcError',
  VALIDATION_ERROR: 'rcValidationError'
} as const;

export const ERROR_MESSAGES = {
  REQUIRED_ENV: (key: string) => `Povinná environment proměnná ${key} není nastavena`,
  CONNECTION_FAILED: 'Připojení k eWay-CRM selhalo',
  SESSION_EXPIRED: 'Session vypršela, obnovuji přihlášení',
  NOT_FOUND: (entity: string, id: string) => `${entity} s ID ${id} nebyl nalezen`,
  VALIDATION_FAILED: 'Validace dat selhala',
  INTERNAL_ERROR: 'Interní chyba serveru'
} as const;