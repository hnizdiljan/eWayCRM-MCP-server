#!/usr/bin/env node

// DŮLEŽITÉ: Načteme .env jako první věc!
import "./config/dotenv.config.js";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn, ChildProcess } from "child_process";
import { createConnection } from "net";
import { join } from "path";
import configService from "./services/config.service.js";
import logger from "./services/logger.service.js";

// Pro sledování API serveru
let apiServerProcess: ChildProcess | null = null;

// Helper funkce pro HTTP volání na REST API
async function callRestApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  const config = configService.config;
  const baseUrl = process.env.SERVER_BASE_URL || `http://localhost:${config.server.port}`;
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => ({ message: response.statusText }));

      // REST API vrací chyby ve formátu { error: { code, message, details } }
      if (errorData.error) {
        const errorMsg = errorData.error.message || `HTTP ${response.status}: ${response.statusText}`;
        // Pokud jsou details, přidáme je do chybové zprávy
        if (errorData.error.details && Array.isArray(errorData.error.details)) {
          const detailsStr = errorData.error.details
            .map((d: any) => `${d.path}: ${d.message}`)
            .join(', ');
          throw new Error(`${errorMsg} (${detailsStr})`);
        }
        throw new Error(errorMsg);
      }

      // Fallback pro jiné formáty chyb
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    logger.error(`REST API call failed: ${endpoint}`, error);
    throw error;
  }
}

const server = new Server(
  {
    name: "eway-crm-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// =============================================================================
// AUTH TOOLS
// =============================================================================

const AUTH_TOOLS: Tool[] = [
  {
    name: "get_login_url",
    description: "Získat OAuth2 authorization URL pro přihlášení do eWay-CRM. Vrátí URL, kterou musí uživatel otevřít v prohlížeči pro dokončení autentizace.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_auth_status",
    description: "Zkontrolovat stav OAuth2 autentizace - zda je uživatel přihlášen a má platný token.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// =============================================================================
// COMPANY TOOLS
// =============================================================================

const COMPANY_TOOLS: Tool[] = [
  {
    name: "get_companies",
    description: "Získat seznam společností s možností fulltextového vyhledávání (hledá v názvu, adrese, emailu) a stránkování. Pro získání všech společností vynech parametr query.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Fulltextový vyhledávací dotaz - hledá ve všech textových polích společnosti (název, email, adresa, telefon...). Pokud chceš všechny společnosti, tento parametr nevyplňuj.",
        },
        limit: {
          type: "number",
          description: "Počet výsledků na stránku (výchozí: 25)",
          default: 25,
        },
        offset: {
          type: "number",
          description: "Posun pro stránkování (výchozí: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_company_by_id",
    description: "Získat konkrétní společnost podle ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID společnosti ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_company",
    description: "Vytvořit novou společnost v eWay-CRM",
    inputSchema: {
      type: "object",
      properties: {
        companyName: {
          type: "string",
          description: "Název společnosti (povinné)",
        },
        phone: {
          type: "string",
          description: "Telefon společnosti",
        },
        email: {
          type: "string",
          description: "Email společnosti",
        },
        website: {
          type: "string",
          description: "Webová stránka společnosti",
        },
        address: {
          type: "object",
          description: "Adresa společnosti",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
            zip: { type: "string" },
            country: { type: "string" },
            state: { type: "string" },
          },
        },
        businessRegistrationNumber: {
          type: "string",
          description: "IČO",
        },
        vatRegistrationNumber: {
          type: "string",
          description: "DIČ",
        },
        categoryId1: {
          type: "string",
          description: "ID kategorie 1",
        },
        categoryId2: {
          type: "string",
          description: "ID kategorie 2",
        },
        role: {
          type: "string",
          description: "Role společnosti",
        },
      },
      required: ["companyName"],
    },
  },
  {
    name: "update_company",
    description: "Aktualizovat existující společnost",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID společnosti ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', povinné)",
        },
        companyName: {
          type: "string",
          description: "Název společnosti",
        },
        phone: {
          type: "string",
          description: "Telefon",
        },
        email: {
          type: "string",
          description: "Email",
        },
        website: {
          type: "string",
          description: "Webová stránka",
        },
        address: {
          type: "object",
          description: "Adresa společnosti",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
            zip: { type: "string" },
            country: { type: "string" },
            state: { type: "string" },
          },
        },
        businessRegistrationNumber: {
          type: "string",
          description: "IČO",
        },
        vatRegistrationNumber: {
          type: "string",
          description: "DIČ",
        },
        itemVersion: {
          type: "number",
          description: "Verze záznamu (pro optimistic locking)",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_company",
    description: "Smazat společnost (soft delete)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID společnosti ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')",
        },
      },
      required: ["id"],
    },
  },
];

// =============================================================================
// CONTACT TOOLS
// =============================================================================

const CONTACT_TOOLS: Tool[] = [
  {
    name: "get_contacts",
    description: "Získat seznam kontaktů s možností fulltextového vyhledávání (hledá ve jménu, příjmení, emailu, telefonu, pozici, názvu společnosti) a stránkování. Pro získání všech kontaktů vynech parametr query.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Fulltextový vyhledávací dotaz - hledá ve všech textových polích kontaktu (jméno, příjmení, email, telefon, mobilní telefon, pozice, název společnosti). Pokud chceš všechny kontakty, tento parametr nevyplňuj.",
        },
        limit: {
          type: "number",
          description: "Počet výsledků na stránku (výchozí: 25)",
          default: 25,
        },
        offset: {
          type: "number",
          description: "Posun pro stránkování (výchozí: 0)",
          default: 0,
        },
        searchType: {
          type: "string",
          description: "Typ vyhledávání: 'general', 'email', 'fullname' (výchozí: 'general')",
          enum: ["general", "email", "fullname"],
          default: "general",
        },
        companyId: {
          type: "string",
          description: "ID společnosti pro filtrování kontaktů (volitelný)",
        },
      },
    },
  },
  {
    name: "get_contact_by_id",
    description: "Získat konkrétní kontakt podle ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID kontaktu ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_contacts_by_company",
    description: "Získat kontakty pro konkrétní společnost",
    inputSchema: {
      type: "object",
      properties: {
        companyId: {
          type: "string",
          description: "ID společnosti (GUID)",
        },
        limit: {
          type: "number",
          description: "Počet výsledků na stránku (výchozí: 25)",
          default: 25,
        },
        offset: {
          type: "number",
          description: "Posun pro stránkování (výchozí: 0)",
          default: 0,
        },
      },
      required: ["companyId"],
    },
  },
  {
    name: "create_contact",
    description: "Vytvořit nový kontakt v eWay-CRM",
    inputSchema: {
      type: "object",
      properties: {
        firstName: {
          type: "string",
          description: "Jméno (povinné)",
        },
        lastName: {
          type: "string",
          description: "Příjmení (povinné)",
        },
        companyId: {
          type: "string",
          description: "ID společnosti",
        },
        email: {
          type: "string",
          description: "Email",
        },
        phone: {
          type: "string",
          description: "Telefon",
        },
        mobilePhone: {
          type: "string",
          description: "Mobilní telefon",
        },
        jobTitle: {
          type: "string",
          description: "Pozice",
        },
        address: {
          type: "object",
          description: "Adresa kontaktu",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
            zip: { type: "string" },
            country: { type: "string" },
            state: { type: "string" },
          },
        },
      },
      required: ["firstName", "lastName"],
    },
  },
  {
    name: "update_contact",
    description: "Aktualizovat existující kontakt",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID kontaktu ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', povinné)",
        },
        firstName: {
          type: "string",
          description: "Jméno",
        },
        lastName: {
          type: "string",
          description: "Příjmení",
        },
        companyId: {
          type: "string",
          description: "ID společnosti",
        },
        email: {
          type: "string",
          description: "Email",
        },
        phone: {
          type: "string",
          description: "Telefon",
        },
        mobilePhone: {
          type: "string",
          description: "Mobilní telefon",
        },
        jobTitle: {
          type: "string",
          description: "Pozice",
        },
        itemVersion: {
          type: "number",
          description: "Verze záznamu (pro optimistic locking)",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_contact",
    description: "Smazat kontakt (soft delete)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID kontaktu ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')",
        },
      },
      required: ["id"],
    },
  },
];

// =============================================================================
// TASK TOOLS
// =============================================================================

const TASK_TOOLS: Tool[] = [
  {
    name: "get_tasks",
    description: "Získat seznam úkolů s možností fulltextového vyhledávání (hledá v předmětu/názvu úkolu, popisu, poznámkách) a stránkování. Pro získání všech úkolů vynech parametr query.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Fulltextový vyhledávací dotaz - hledá ve všech textových polích úkolu (předmět/název úkolu, popis/body, poznámky). Pokud chceš všechny úkoly, tento parametr nevyplňuj.",
        },
        limit: {
          type: "number",
          description: "Počet výsledků na stránku (výchozí: 25)",
          default: 25,
        },
        offset: {
          type: "number",
          description: "Posun pro stránkování (výchozí: 0)",
          default: 0,
        },
        companyId: {
          type: "string",
          description: "Filtrovat podle ID společnosti",
        },
        contactId: {
          type: "string",
          description: "Filtrovat podle ID kontaktu",
        },
        taskSolverId: {
          type: "string",
          description: "Filtrovat podle ID řešitele",
        },
        isCompleted: {
          type: "boolean",
          description: "Filtrovat podle stavu dokončení",
        },
      },
    },
  },
  {
    name: "get_task_by_id",
    description: "Získat konkrétní úkol podle ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID úkolu ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_task",
    description: "Vytvořit nový úkol v eWay-CRM",
    inputSchema: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "Předmět úkolu (povinné)",
        },
        taskDelegatorId: {
          type: "string",
          description: "ID zadavatele úkolu (povinné)",
        },
        body: {
          type: "string",
          description: "Popis úkolu",
        },
        dueDate: {
          type: "string",
          description: "Termín splnění (ISO date)",
        },
        startDate: {
          type: "string",
          description: "Datum zahájení (ISO date)",
        },
        importance: {
          type: "string",
          description: "Důležitost úkolu (např. 'High', 'Normal', 'Low')",
        },
        type: {
          type: "string",
          description: "Typ úkolu",
        },
        companyId: {
          type: "string",
          description: "ID společnosti",
        },
        contactId: {
          type: "string",
          description: "ID kontaktu",
        },
        taskSolverId: {
          type: "string",
          description: "ID řešitele",
        },
        estimatedWorkHours: {
          type: "number",
          description: "Odhadovaný čas v hodinách",
        },
      },
      required: ["subject", "taskDelegatorId"],
    },
  },
  {
    name: "update_task",
    description: "Aktualizovat existující úkol",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID úkolu ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', povinné)",
        },
        subject: {
          type: "string",
          description: "Předmět úkolu",
        },
        body: {
          type: "string",
          description: "Popis úkolu",
        },
        dueDate: {
          type: "string",
          description: "Termín splnění",
        },
        startDate: {
          type: "string",
          description: "Datum zahájení",
        },
        isCompleted: {
          type: "boolean",
          description: "Zda je úkol dokončen",
        },
        percentComplete: {
          type: "number",
          description: "Procento dokončení (0-100)",
        },
        taskSolverId: {
          type: "string",
          description: "ID řešitele",
        },
        importance: {
          type: "string",
          description: "Důležitost",
        },
        itemVersion: {
          type: "number",
          description: "Verze záznamu",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_task",
    description: "Smazat úkol (soft delete)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID úkolu ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "complete_task",
    description: "Uzavřít úkol (nastaví isCompleted=true, completedDate=dnes, percentComplete=100)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID úkolu ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_tasks_by_company",
    description: "Získat úkoly pro konkrétní společnost",
    inputSchema: {
      type: "object",
      properties: {
        companyId: {
          type: "string",
          description: "ID společnosti (GUID)",
        },
        limit: {
          type: "number",
          default: 25,
        },
        offset: {
          type: "number",
          default: 0,
        },
      },
      required: ["companyId"],
    },
  },
  {
    name: "get_tasks_by_contact",
    description: "Získat úkoly pro konkrétní kontakt",
    inputSchema: {
      type: "object",
      properties: {
        contactId: {
          type: "string",
          description: "ID kontaktu (GUID)",
        },
        limit: {
          type: "number",
          default: 25,
        },
        offset: {
          type: "number",
          default: 0,
        },
      },
      required: ["contactId"],
    },
  },
  {
    name: "get_tasks_by_solver",
    description: "Získat úkoly přiřazené konkrétnímu řešiteli",
    inputSchema: {
      type: "object",
      properties: {
        taskSolverId: {
          type: "string",
          description: "ID řešitele (GUID)",
        },
        limit: {
          type: "number",
          default: 25,
        },
        offset: {
          type: "number",
          default: 0,
        },
      },
      required: ["taskSolverId"],
    },
  },
  {
    name: "get_completed_tasks",
    description: "Získat všechny dokončené úkoly",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          default: 25,
        },
        offset: {
          type: "number",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_pending_tasks",
    description: "Získat všechny nedokončené úkoly",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          default: 25,
        },
        offset: {
          type: "number",
          default: 0,
        },
      },
    },
  },
];

// =============================================================================
// LEAD TOOLS
// =============================================================================

const LEAD_TOOLS: Tool[] = [
  {
    name: "get_leads",
    description: "Získat seznam příležitostí (leads) s možností fulltextového vyhledávání (hledá v názvu příležitosti, popisu, názvu společnosti, jméně kontaktu) a stránkování. Pro získání všech příležitostí vynech parametr query.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Fulltextový vyhledávací dotaz - hledá ve všech textových polích příležitosti (název, popis, název společnosti, jméno kontaktu, zdroj příležitosti). Pokud chceš všechny příležitosti, tento parametr nevyplňuj.",
        },
        limit: {
          type: "number",
          default: 25,
        },
        offset: {
          type: "number",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_lead_by_id",
    description: "Získat konkrétní příležitost podle ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID příležitosti ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_lead",
    description: "Vytvořit novou příležitost v eWay-CRM",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Název příležitosti (povinné)",
        },
        companyId: {
          type: "string",
          description: "ID společnosti",
        },
        contactId: {
          type: "string",
          description: "ID kontaktu",
        },
        ownerId: {
          type: "string",
          description: "ID vlastníka",
        },
        amount: {
          type: "number",
          description: "Hodnota příležitosti",
        },
        estimatedCloseDate: {
          type: "string",
          description: "Předpokládané datum uzavření (ISO date)",
        },
        probability: {
          type: "number",
          description: "Pravděpodobnost úspěchu (%)",
        },
        leadSource: {
          type: "string",
          description: "Zdroj příležitosti",
        },
        stage: {
          type: "string",
          description: "Fáze příležitosti",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "update_lead",
    description: "Aktualizovat existující příležitost",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID příležitosti ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', povinné)",
        },
        name: {
          type: "string",
          description: "Název",
        },
        companyId: {
          type: "string",
          description: "ID společnosti",
        },
        amount: {
          type: "number",
          description: "Hodnota",
        },
        estimatedCloseDate: {
          type: "string",
          description: "Předpokládané datum uzavření",
        },
        probability: {
          type: "number",
          description: "Pravděpodobnost úspěchu (%)",
        },
        stage: {
          type: "string",
          description: "Fáze",
        },
        itemVersion: {
          type: "number",
          description: "Verze záznamu",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_lead",
    description: "Smazat příležitost (soft delete)",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID příležitosti ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_leads_by_company",
    description: "Získat příležitosti pro konkrétní společnost",
    inputSchema: {
      type: "object",
      properties: {
        companyId: {
          type: "string",
          description: "ID společnosti (GUID)",
        },
        limit: {
          type: "number",
          default: 25,
        },
        offset: {
          type: "number",
          default: 0,
        },
      },
      required: ["companyId"],
    },
  },
];

// =============================================================================
// USER TOOLS
// =============================================================================

const USER_TOOLS: Tool[] = [
  {
    name: "get_users",
    description: "Získat seznam uživatelů s možností fulltextového vyhledávání (hledá ve jménu, příjmení, emailu, uživatelském jménu) a stránkování. Pro získání všech uživatelů vynech parametr query.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Fulltextový vyhledávací dotaz - hledá ve všech textových polích uživatele (jméno, příjmení, email, username/uživatelské jméno). Pokud chceš všechny uživatele, tento parametr nevyplňuj.",
        },
        limit: {
          type: "number",
          default: 25,
        },
        offset: {
          type: "number",
          default: 0,
        },
        isActive: {
          type: "boolean",
          description: "Filtrovat podle aktivity",
        },
      },
    },
  },
  {
    name: "get_user_by_id",
    description: "Získat konkrétního uživatele podle ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID uživatele ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_user",
    description: "Vytvořit nového uživatele v eWay-CRM",
    inputSchema: {
      type: "object",
      properties: {
        firstName: {
          type: "string",
          description: "Jméno (povinné)",
        },
        lastName: {
          type: "string",
          description: "Příjmení (povinné)",
        },
        email: {
          type: "string",
          description: "Email (povinné)",
        },
        phone: {
          type: "string",
          description: "Telefon",
        },
        isActive: {
          type: "boolean",
          description: "Aktivní uživatel",
        },
      },
      required: ["firstName", "lastName", "email"],
    },
  },
  {
    name: "update_user",
    description: "Aktualizovat existujícího uživatele",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID uživatele ve formátu UUID/GUID (např. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', povinné)",
        },
        firstName: {
          type: "string",
          description: "Jméno",
        },
        lastName: {
          type: "string",
          description: "Příjmení",
        },
        email: {
          type: "string",
          description: "Email",
        },
        phone: {
          type: "string",
          description: "Telefon",
        },
        isActive: {
          type: "boolean",
          description: "Aktivní",
        },
        itemVersion: {
          type: "number",
          description: "Verze záznamu",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_active_users",
    description: "Získat všechny aktivní uživatele",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          default: 25,
        },
        offset: {
          type: "number",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_users_by_supervisor",
    description: "Získat uživatele podle nadřízeného",
    inputSchema: {
      type: "object",
      properties: {
        supervisorId: {
          type: "string",
          description: "ID nadřízeného (GUID)",
        },
        limit: {
          type: "number",
          default: 25,
        },
        offset: {
          type: "number",
          default: 0,
        },
      },
      required: ["supervisorId"],
    },
  },
];

// =============================================================================
// ENUM TYPE TOOLS
// =============================================================================

const ENUM_TYPE_TOOLS: Tool[] = [
  {
    name: "search_enum_types",
    description: "Vyhledat číselníky (enum types) podle dotazu",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Vyhledávací dotaz (volitelný)",
        },
        limit: {
          type: "number",
          default: 25,
        },
        offset: {
          type: "number",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_enum_type_by_name",
    description: "Získat číselník podle názvu",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Název číselníku (např. 'Lead_Source', 'Task_Type')",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "get_enum_types_by_folder",
    description: "Získat číselníky podle folder name (např. 'Companies', 'Tasks', 'Leads')",
    inputSchema: {
      type: "object",
      properties: {
        folderName: {
          type: "string",
          description: "Název složky (např. 'Companies', 'Tasks', 'Leads')",
        },
      },
      required: ["folderName"],
    },
  },
  {
    name: "get_task_enum_types",
    description: "Získat všechny číselníky pro Tasks (types, importance, state)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// =============================================================================
// REGISTER ALL TOOLS
// =============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      ...AUTH_TOOLS,
      ...COMPANY_TOOLS,
      ...CONTACT_TOOLS,
      ...TASK_TOOLS,
      ...LEAD_TOOLS,
      ...USER_TOOLS,
      ...ENUM_TYPE_TOOLS,
    ],
  };
});

// =============================================================================
// TOOL HANDLERS
// =============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ========================================================================
      // AUTH TOOLS
      // ========================================================================

      case "get_login_url": {
        const config = configService.config;
        const baseUrl = process.env.SERVER_BASE_URL || `http://localhost:${config.server.port}`;
        const authUrl = `${baseUrl}/api/v1/oauth2/authorize`;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "success",
                message: "Pro přihlášení otevřete tuto URL v prohlížeči",
                authorizationUrl: authUrl,
                instructions: [
                  "1. Otevřete výše uvedenou URL v prohlížeči",
                  "2. Přihlaste se pomocí Azure AD účtu",
                  "3. Po úspěšném přihlášení budete moci používat API",
                ],
              }, null, 2),
            },
          ],
        };
      }

      case "get_auth_status": {
        // Toto volání se pokusí získat status - pokud není přihlášen, selže
        try {
          const response = await fetch(`${process.env.SERVER_BASE_URL || 'http://localhost:7777'}/api/v1/oauth2/status`);
          const statusData = await response.json();

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(statusData, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status: "error",
                  message: "Nepodařilo se získat status autentizace. Pravděpodobně nejste přihlášeni.",
                  hint: "Použijte get_login_url pro získání přihlašovací URL.",
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

      // ========================================================================
      // COMPANY TOOLS
      // ========================================================================

      case "get_companies": {
        const queryParams = new URLSearchParams();
        if (args?.query) queryParams.append('q', String(args.query));
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/companies?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_company_by_id": {
        const result = await callRestApi(`/api/v1/companies/${args?.id}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_company": {
        const result = await callRestApi('/api/v1/companies', {
          method: 'POST',
          body: JSON.stringify(args),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "update_company": {
        const { id, ...updateData } = args as any;
        const result = await callRestApi(`/api/v1/companies/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "delete_company": {
        const result = await callRestApi(`/api/v1/companies/${args?.id}`, {
          method: 'DELETE',
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // ========================================================================
      // CONTACT TOOLS
      // ========================================================================

      case "get_contacts": {
        const queryParams = new URLSearchParams();
        if (args?.query) queryParams.append('q', String(args.query));
        if (args?.companyId) queryParams.append('companyId', String(args.companyId));
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/contacts?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_contact_by_id": {
        const result = await callRestApi(`/api/v1/contacts/${args?.id}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_contacts_by_company": {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/contacts/by-company/${args?.companyId}?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_contact": {
        const result = await callRestApi('/api/v1/contacts', {
          method: 'POST',
          body: JSON.stringify(args),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "update_contact": {
        const { id, ...updateData } = args as any;
        const result = await callRestApi(`/api/v1/contacts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "delete_contact": {
        const result = await callRestApi(`/api/v1/contacts/${args?.id}`, {
          method: 'DELETE',
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // ========================================================================
      // TASK TOOLS
      // ========================================================================

      case "get_tasks": {
        const queryParams = new URLSearchParams();
        if (args?.query) queryParams.append('q', String(args.query));
        if (args?.companyId) queryParams.append('companyId', String(args.companyId));
        if (args?.contactId) queryParams.append('contactId', String(args.contactId));
        if (args?.taskSolverId) queryParams.append('solverId', String(args.taskSolverId));
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/tasks?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_task_by_id": {
        const result = await callRestApi(`/api/v1/tasks/${args?.id}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_task": {
        const result = await callRestApi('/api/v1/tasks', {
          method: 'POST',
          body: JSON.stringify(args),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "update_task": {
        const { id, ...updateData } = args as any;
        const result = await callRestApi(`/api/v1/tasks/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "delete_task": {
        const result = await callRestApi(`/api/v1/tasks/${args?.id}`, {
          method: 'DELETE',
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "complete_task": {
        const result = await callRestApi(`/api/v1/tasks/${args?.id}/complete`, {
          method: 'PUT',
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_tasks_by_company": {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/tasks/by-company/${args?.companyId}?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_tasks_by_contact": {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/tasks/by-contact/${args?.contactId}?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_tasks_by_solver": {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/tasks/by-solver/${args?.taskSolverId}?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_completed_tasks": {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/tasks/completed?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_pending_tasks": {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/tasks/pending?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // ========================================================================
      // LEAD TOOLS
      // ========================================================================

      case "get_leads": {
        const queryParams = new URLSearchParams();
        if (args?.query) queryParams.append('q', String(args.query));
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/leads?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_lead_by_id": {
        const result = await callRestApi(`/api/v1/leads/${args?.id}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_lead": {
        const result = await callRestApi('/api/v1/leads', {
          method: 'POST',
          body: JSON.stringify(args),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "update_lead": {
        const { id, ...updateData } = args as any;
        const result = await callRestApi(`/api/v1/leads/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "delete_lead": {
        const result = await callRestApi(`/api/v1/leads/${args?.id}`, {
          method: 'DELETE',
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_leads_by_company": {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/leads/by-company/${args?.companyId}?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // ========================================================================
      // USER TOOLS
      // ========================================================================

      case "get_users": {
        const queryParams = new URLSearchParams();
        if (args?.query) queryParams.append('q', String(args.query));
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/users?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_user_by_id": {
        const result = await callRestApi(`/api/v1/users/${args?.id}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_user": {
        const result = await callRestApi('/api/v1/users', {
          method: 'POST',
          body: JSON.stringify(args),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "update_user": {
        const { id, ...updateData } = args as any;
        const result = await callRestApi(`/api/v1/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_active_users": {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/users/active?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_users_by_supervisor": {
        const queryParams = new URLSearchParams();
        queryParams.append('supervisorId', String(args?.supervisorId));
        queryParams.append('limit', String(args?.limit || 25));
        queryParams.append('offset', String(args?.offset || 0));

        const result = await callRestApi(`/api/v1/users?${queryParams}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // ========================================================================
      // ENUM TYPE TOOLS
      // ========================================================================

      case "search_enum_types": {
        const result = await callRestApi('/api/v1/enum-types/search');

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_enum_type_by_name": {
        const result = await callRestApi(`/api/v1/enum-types/${args?.name}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_enum_types_by_folder": {
        const result = await callRestApi(`/api/v1/enum-types/folder/${args?.folderName}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_task_enum_types": {
        const result = await callRestApi('/api/v1/enum-types/tasks');

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Neznámý nástroj: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Neznámá chyba";
    logger.error(`Chyba při volání nástroje ${name}:`, error);

    return {
      content: [
        {
          type: "text",
          text: `Chyba: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// =============================================================================
// HELPER FUNCTIONS - API SERVER MANAGEMENT
// =============================================================================

/**
 * Zkontroluje, zda je port obsazený
 */
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: 'localhost' });

    socket.on('connect', () => {
      socket.end();
      resolve(true); // Port je obsazený
    });

    socket.on('error', () => {
      resolve(false); // Port je volný
    });
  });
}

/**
 * Načte MCP-specifickou konfiguraci ENV variables
 * Přečte .env.mcp soubor pokud existuje, nebo použije MCP_ prefixované proměnné
 */
function loadMcpEnvironment(): Record<string, string> {
  const mcpEnv: Record<string, string> = {};

  // Načteme všechny ENV proměnné s prefixem MCP_API_
  // Tyto budou předány API serveru (bez prefixu MCP_API_)
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('MCP_API_')) {
      // Odstraníme prefix MCP_API_ a přidáme do API env
      const apiKey = key.substring(8); // Odstraní "MCP_API_"
      mcpEnv[apiKey] = process.env[key]!;
      logger.debug(`Načtena MCP konfigurace: ${apiKey}`);
    }
  });

  return mcpEnv;
}

/**
 * Najde root adresář projektu (kde je package.json)
 */
function findProjectRoot(): string {
  const { dirname: pathDirname } = require('path');
  const { existsSync } = require('fs');

  // V CommonJS modules je __dirname dostupný - ukazuje na dist/
  // Project root je o úroveň výš
  const scriptDir = __dirname;

  // Začneme od adresáře kde je mcp-server.js (dist/)
  let currentPath = scriptDir;

  // Projdeme až 10 úrovní nahoru
  for (let i = 0; i < 10; i++) {
    const packageJsonPath = join(currentPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      return currentPath;
    }

    const parentPath = pathDirname(currentPath);
    if (parentPath === currentPath) {
      // Dosáhli jsme root file systému
      break;
    }
    currentPath = parentPath;
  }

  // Fallback: zkusíme parent adresář od scriptDir (dist/ -> root/)
  const parentOfScript = pathDirname(scriptDir);
  if (existsSync(join(parentOfScript, 'package.json'))) {
    return parentOfScript;
  }

  // Poslední fallback na working directory
  return process.cwd();
}

/**
 * Spustí REST API server jako child process
 */
async function startApiServer(port: number): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    logger.info(`Spouštím REST API server na portu ${port}...`);

    // Najdeme project root (kde je package.json)
    const projectRoot = findProjectRoot();

    // Cesta k API serveru (index.js) - bude ve stejné složce jako mcp-server.js (dist/)
    const apiServerPath = join(projectRoot, 'dist', 'index.js');

    logger.debug(`Project root: ${projectRoot}`);
    logger.debug(`API server path: ${apiServerPath}`);

    // Načteme MCP-specifickou konfiguraci
    const mcpEnv = loadMcpEnvironment();

    // Zkombinujeme ENV variables - MCP konfigurace má přednost
    const apiEnv = {
      ...process.env,  // Základní ENV
      ...mcpEnv        // MCP-specifická konfigurace (přepíše základní)
    };

    // Logujeme jaké ENV používáme (bez hesel)
    if (Object.keys(mcpEnv).length > 0) {
      logger.info(`Použita MCP konfigurace: ${Object.keys(mcpEnv).join(', ')}`);
    }

    // Spustíme API server jako child process
    const apiProcess: ChildProcess = spawn('node', [apiServerPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: apiEnv,
      cwd: projectRoot  // API server běží z project root
    });

    // Logujeme výstup API serveru
    apiProcess.stdout?.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      if (message) {
        logger.debug(`[API Server] ${message}`);
      }
    });

    apiProcess.stderr?.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      if (message) {
        logger.error(`[API Server Error] ${message}`);
      }
    });

    apiProcess.on('error', (error: Error) => {
      logger.error('Chyba při spouštění API serveru:', error);
      reject(error);
    });

    apiProcess.on('exit', (code: number | null, signal: string | null) => {
      if (code !== 0 && code !== null) {
        logger.warn(`API server skončil s kódem ${code}`);
      }
      if (signal) {
        logger.warn(`API server byl ukončen signálem ${signal}`);
      }
    });

    // Čekáme, až bude API server připraven (port bude obsazený)
    let attempts = 0;
    const maxAttempts = 30; // 30 sekund
    const checkInterval = setInterval(async () => {
      attempts++;
      const portInUse = await isPortInUse(port);

      if (portInUse) {
        clearInterval(checkInterval);
        logger.info(`✓ REST API server běží na portu ${port}`);
        resolve(apiProcess);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        apiProcess.kill();
        reject(new Error(`API server se nepodařilo spustit do ${maxAttempts} sekund`));
      }
    }, 1000);
  });
}

/**
 * Ukončí API server pokud běží
 */
function stopApiServer(): void {
  if (apiServerProcess) {
    logger.info('Ukončuji REST API server...');
    apiServerProcess.kill('SIGTERM');
    apiServerProcess = null;
  }
}

// =============================================================================
// SERVER STARTUP
// =============================================================================

async function main() {
  // Debug: Logujeme důležité ENV proměnné (bez hesel)
  logger.debug('ENV check:', {
    hasEwayApiUrl: !!process.env.EWAY_API_URL,
    hasEwayUsername: !!process.env.EWAY_USERNAME,
    hasOAuthClientId: !!process.env.EWAY_CLIENT_ID,
    hasPasswordHash: !!process.env.EWAY_PASSWORD_HASH,
    workingDir: process.cwd()
  });

  const config = configService.config;
  const apiPort = config.server.port;

  // Zkontrolujeme, zda je API server již spuštěn
  const portInUse = await isPortInUse(apiPort);

  if (portInUse) {
    logger.info(`✓ REST API server již běží na portu ${apiPort}`);
  } else {
    logger.info(`REST API server neběží, spouštím automaticky...`);
    try {
      apiServerProcess = await startApiServer(apiPort);
    } catch (error) {
      logger.error('Nepodařilo se spustit API server:', error);
      throw error;
    }
  }

  // Spustíme MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("✓ eWay-CRM MCP Server spuštěn úspěšně");
  logger.info(`  Celkem nástrojů: ${
    AUTH_TOOLS.length +
    COMPANY_TOOLS.length +
    CONTACT_TOOLS.length +
    TASK_TOOLS.length +
    LEAD_TOOLS.length +
    USER_TOOLS.length +
    ENUM_TYPE_TOOLS.length
  }`);
  logger.info(`  REST API: http://localhost:${apiPort}`);
}

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Ukončování MCP serveru...");
  stopApiServer();
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Ukončování MCP serveru...");
  stopApiServer();
  await server.close();
  process.exit(0);
});

// Ukončení při pádu parent procesu
process.on("disconnect", () => {
  logger.info("Parent proces byl ukončen, ukončuji MCP server...");
  stopApiServer();
  process.exit(0);
});

main().catch((error) => {
  logger.error("Chyba při spouštění MCP serveru:", error);
  stopApiServer();
  process.exit(1);
});
