#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import companyService from "./services/company.service.js";
import contactService from "./services/contact.service.js";
import configService from "./services/config.service.js";
import logger from "./services/logger.service.js";
import "./config/dotenv.config.js";

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

// Nástroje pro správu společností
const COMPANY_TOOLS: Tool[] = [
  {
    name: "get_companies",
    description: "Získat seznam společností s možností vyhledávání a stránkování",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Vyhledávací dotaz (volitelný)",
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
          description: "ID společnosti (GUID)",
        },
      },
      required: ["id"],
    },
  },
];

// Nástroje pro správu kontaktů
const CONTACT_TOOLS: Tool[] = [
  {
    name: "get_contacts",
    description: "Získat seznam kontaktů s možností vyhledávání a stránkování",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Vyhledávací dotaz (volitelný)",
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
          description: "ID kontaktu (GUID)",
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
];

// Registrace nástrojů
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [...COMPANY_TOOLS, ...CONTACT_TOOLS],
  };
});

// Obsluha volání nástrojů
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Nástroje pro společnosti
      case "get_companies": {
        const result = await companyService.getAll(
          args?.query as string,
          args?.limit as number || 25,
          args?.offset as number || 0
        );
        
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
        const company = await companyService.getById(args?.id as string);
        
        if (!company) {
          return {
            content: [
              {
                type: "text", 
                text: `Společnost s ID ${args?.id} nebyla nalezena.`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(company, null, 2),
            },
          ],
        };
      }

      // Nástroje pro kontakty
      case "get_contacts": {
        const result = await contactService.getAll(
          args?.query as string,
          args?.limit as number || 25,
          args?.offset as number || 0,
          args?.searchType as string || "general",
          args?.companyId as string
        );
        
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
        const contact = await contactService.getById(args?.id as string);
        
        if (!contact) {
          return {
            content: [
              {
                type: "text",
                text: `Kontakt s ID ${args?.id} nebyl nalezen.`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text", 
              text: JSON.stringify(contact, null, 2),
            },
          ],
        };
      }

      case "get_contacts_by_company": {
        const result = await contactService.getByCompanyId(
          args?.companyId as string,
          args?.limit as number || 25,
          args?.offset as number || 0
        );
        
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

// Spuštění serveru
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info("eWay-CRM MCP Server spuštěn úspěšně");
}

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Ukončování MCP serveru...");
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Ukončování MCP serveru...");
  await server.close();
  process.exit(0);
});

main().catch((error) => {
  logger.error("Chyba při spouštění MCP serveru:", error);
  process.exit(1);
});