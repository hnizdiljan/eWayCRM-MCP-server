import swaggerJsdoc from 'swagger-jsdoc';
import configService from '../services/config.service';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'eWay-CRM MCP Server API',
      version: configService.config.app.version,
      description: `
        Middleware server pro eWay-CRM API, který poskytuje jednoduché REST rozhraní 
        pro komunikaci s eWay-CRM systémem. Server zapouzdřuje komplexitu proprietárního API,
        sjednocuje datové modely a centralizuje správu autentizace.
        
        ## Funkce
        - CRUD operace pro Společnosti (Companies)
        - CRUD operace pro Kontakty (Contacts)
        - Fulltextové vyhledávání
        - Stránkování výsledků
        - Automatická správa sessions k eWay-CRM
        - Validace dat pomocí Zod schémat
        - Standardizované error handling
        
        ## Autentizace
        Server se automaticky přihlašuje k eWay-CRM pomocí konfigurace v prostředí.
        Klientské aplikace nepotřebují řešit autentizaci - server ji spravuje transparentně.
      `,
      contact: {
        name: 'API Support',
        email: 'api-support@example.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: `http://localhost:${configService.config.server.port}`,
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        // Error responses
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Kód chyby'
                },
                message: {
                  type: 'string',
                  description: 'Popis chyby'
                },
                details: {
                  type: 'object',
                  description: 'Dodatečné detaily o chybě'
                }
              },
              required: ['code', 'message']
            }
          },
          required: ['error']
        },
        
        // Pagination
        PaginationInfo: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Celkový počet záznamů'
            },
            limit: {
              type: 'integer',
              description: 'Limit záznamů na stránku'
            },
            offset: {
              type: 'integer',
              description: 'Offset (posun) od začátku'
            },
            hasMore: {
              type: 'boolean',
              description: 'Zda existují další záznamy'
            }
          }
        },
        
        // Company DTOs
        Company: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unikátní identifikátor společnosti (GUID)',
              example: '12345678-1234-1234-1234-123456789abc'
            },
            companyName: {
              type: 'string',
              description: 'Název společnosti',
              example: 'Acme Corp s.r.o.'
            },
            fileAs: {
              type: 'string',
              description: 'Alternativní název pro řazení',
              example: 'Acme Corp'
            },
            phone: {
              type: 'string',
              description: 'Telefon',
              example: '+420 123 456 789'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail',
              example: 'info@acme.com'
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Webové stránky',
              example: 'https://www.acme.com'
            },
            address: {
              type: 'string',
              description: 'Adresa',
              example: 'Václavské náměstí 1'
            },
            city: {
              type: 'string',
              description: 'Město',
              example: 'Praha'
            },
            zipCode: {
              type: 'string',
              description: 'PSČ',
              example: '110 00'
            },
            country: {
              type: 'string',
              description: 'Země',
              example: 'Česká republika'
            },
            ico: {
              type: 'string',
              description: 'IČO',
              example: '12345678'
            },
            dic: {
              type: 'string',
              description: 'DIČ',
              example: 'CZ12345678'
            },
            note: {
              type: 'string',
              description: 'Poznámka'
            },
            created: {
              type: 'string',
              format: 'date-time',
              description: 'Datum vytvoření'
            },
            modified: {
              type: 'string',
              format: 'date-time',
              description: 'Datum poslední úpravy'
            },
            itemVersion: {
              type: 'integer',
              description: 'Verze záznamu pro optimistic locking'
            },
            isDeleted: {
              type: 'boolean',
              description: 'Příznak smazání'
            }
          },
          required: ['companyName']
        },
        
        CreateCompany: {
          type: 'object',
          properties: {
            companyName: {
              type: 'string',
              description: 'Název společnosti (povinné)',
              example: 'Acme Corp s.r.o.'
            },
            fileAs: {
              type: 'string',
              description: 'Alternativní název pro řazení',
              example: 'Acme Corp'
            },
            phone: {
              type: 'string',
              description: 'Telefon',
              example: '+420 123 456 789'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail',
              example: 'info@acme.com'
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Webové stránky',
              example: 'https://www.acme.com'
            },
            address: {
              type: 'string',
              description: 'Adresa',
              example: 'Václavské náměstí 1'
            },
            city: {
              type: 'string',
              description: 'Město',
              example: 'Praha'
            },
            zipCode: {
              type: 'string',
              description: 'PSČ',
              example: '110 00'
            },
            country: {
              type: 'string',
              description: 'Země',
              example: 'Česká republika'
            },
            ico: {
              type: 'string',
              description: 'IČO',
              example: '12345678'
            },
            dic: {
              type: 'string',
              description: 'DIČ',
              example: 'CZ12345678'
            },
            note: {
              type: 'string',
              description: 'Poznámka'
            }
          },
          required: ['companyName']
        },
        
        CompaniesResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Company'
              }
            },
            total: {
              type: 'integer',
              description: 'Celkový počet záznamů'
            },
            limit: {
              type: 'integer',
              description: 'Limit záznamů na stránku'
            },
            offset: {
              type: 'integer',
              description: 'Offset (posun) od začátku'
            },
            hasMore: {
              type: 'boolean',
              description: 'Zda existují další záznamy'
            }
          }
        },
        
        // Contact DTOs
        Contact: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unikátní identifikátor kontaktu (GUID)',
              example: '12345678-1234-1234-1234-123456789abc'
            },
            firstName: {
              type: 'string',
              description: 'Křestní jméno',
              example: 'Jan'
            },
            lastName: {
              type: 'string',
              description: 'Příjmení',
              example: 'Novák'
            },
            fullName: {
              type: 'string',
              description: 'Celé jméno (readonly)',
              example: 'Jan Novák'
            },
            titleBefore: {
              type: 'string',
              description: 'Titul před jménem',
              example: 'Ing.'
            },
            titleAfter: {
              type: 'string',
              description: 'Titul za jménem',
              example: 'Ph.D.'
            },
            companyId: {
              type: 'string',
              description: 'ID společnosti, ke které kontakt patří'
            },
            companyName: {
              type: 'string',
              description: 'Název společnosti (readonly)'
            },
            jobTitle: {
              type: 'string',
              description: 'Pozice/funkce',
              example: 'Projektový manažer'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail',
              example: 'jan.novak@example.com'
            },
            phone: {
              type: 'string',
              description: 'Telefon',
              example: '+420 123 456 789'
            },
            mobile: {
              type: 'string',
              description: 'Mobilní telefon',
              example: '+420 987 654 321'
            },
            note: {
              type: 'string',
              description: 'Poznámka'
            },
            created: {
              type: 'string',
              format: 'date-time',
              description: 'Datum vytvoření'
            },
            modified: {
              type: 'string',
              format: 'date-time',
              description: 'Datum poslední úpravy'
            },
            itemVersion: {
              type: 'integer',
              description: 'Verze záznamu pro optimistic locking'
            },
            isDeleted: {
              type: 'boolean',
              description: 'Příznak smazání'
            }
          }
        },
        
        CreateContact: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              description: 'Křestní jméno',
              example: 'Jan'
            },
            lastName: {
              type: 'string',
              description: 'Příjmení',
              example: 'Novák'
            },
            titleBefore: {
              type: 'string',
              description: 'Titul před jménem',
              example: 'Ing.'
            },
            titleAfter: {
              type: 'string',
              description: 'Titul za jménem',
              example: 'Ph.D.'
            },
            companyId: {
              type: 'string',
              description: 'ID společnosti, ke které kontakt patří'
            },
            jobTitle: {
              type: 'string',
              description: 'Pozice/funkce',
              example: 'Projektový manažer'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail',
              example: 'jan.novak@example.com'
            },
            phone: {
              type: 'string',
              description: 'Telefon',
              example: '+420 123 456 789'
            },
            mobile: {
              type: 'string',
              description: 'Mobilní telefon',
              example: '+420 987 654 321'
            },
            note: {
              type: 'string',
              description: 'Poznámka'
            }
          }
        },
        
        ContactsResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Contact'
              }
            },
            total: {
              type: 'integer',
              description: 'Celkový počet záznamů'
            },
            limit: {
              type: 'integer',
              description: 'Limit záznamů na stránku'
            },
            offset: {
              type: 'integer',
              description: 'Offset (posun) od začátku'
            },
            hasMore: {
              type: 'boolean',
              description: 'Zda existují další záznamy'
            }
          }
        }
      },
      
      parameters: {
        QueryParam: {
          name: 'q',
          in: 'query',
          description: 'Fulltextové vyhledávání',
          schema: {
            type: 'string'
          },
          example: 'Acme'
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Maximální počet záznamů na stránku',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25
          }
        },
        OffsetParam: {
          name: 'offset',
          in: 'query',
          description: 'Offset (posun) od začátku',
          schema: {
            type: 'integer',
            minimum: 0,
            default: 0
          }
        },
        IdParam: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Unikátní identifikátor záznamu (GUID)',
          schema: {
            type: 'string',
            format: 'uuid'
          },
          example: '12345678-1234-1234-1234-123456789abc'
        }
      }
    },
    tags: [
      {
        name: 'Companies',
        description: 'Správa společností'
      },
      {
        name: 'Contacts',
        description: 'Správa kontaktů'
      },
      {
        name: 'System',
        description: 'Systémové endpointy'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/index.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(options); 