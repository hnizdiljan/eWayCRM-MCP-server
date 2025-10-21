# Current Status - eWay-CRM MCP Server

Aktualizováno: 20. října 2025

## Přehled projektu

eWay-CRM MCP Server je integrace s eWay-CRM systémem poskytující **dva typy rozhraní**:

1. **REST API Server** - HTTP API s Express.js pro přímé volání
2. **MCP Protocol Server** - Model Context Protocol server pro integraci s AI asistenty

## Architektura - Dva servery

### 1. REST API Server (`src/index.ts`)
- **Framework:** Express.js
- **Port:** 3000 (konfigurovatelný přes `MCP_PORT`)
- **Účel:** HTTP REST API pro správu eWay-CRM entit
- **Spuštění:** `npm start` nebo `npm run dev`
- **Dokumentace:** Swagger UI na `/api-docs`

### 2. MCP Protocol Server (`src/mcp-server.ts`)
- **Framework:** @modelcontextprotocol/sdk
- **Transport:** Stdio (pro komunikaci s AI asistenty)
- **Účel:** Integrace s Claude Desktop a dalšími MCP klienty
- **Spuštění:** `npm run mcp` nebo `npm run mcp-dev`
- **Tools:** Poskytuje nástroje pro Companies a Contacts

## Implementované funkce

### ✅ Autentizace
- **OAuth2 Authorization Code Flow** - plně implementováno
  - Authorization URL generování
  - Code exchange za access token
  - Refresh token management
  - **Token storage v paměti** (in-memory OAuth2Service singleton) 🆕
  - Automatická obnova expirovaných tokenů (před 1 minutou před vypršením)
  - Endpoints: `/api/v1/oauth2/authorize`, `/api/v1/oauth2/callback`, `/api/v1/oauth2/logout`

- **Legacy autentizace** - username/password s MD5 hash
  - Automatické hashování plaintext hesla
  - Podpora EWAY_PASSWORD i EWAY_PASSWORD_HASH
  - Session management

- **Autentizační middleware** 🆕
  - `requireAuth` middleware chrání všechny API endpointy
  - Automatická kontrola platnosti OAuth2 tokenu
  - Automatické přihlášení k eWay-CRM při prvním požadavku
  - Friendly error messages s instrukcemi pro autorizaci
  - Podpora jak OAuth2, tak legacy autentizace

- **Konfigurace:** Automatická detekce auth metody podle .env

### ✅ Companies (Společnosti) - REST API
**Kompletní CRUD operace:**
- `GET /api/v1/companies` - seznam s pagination (limit, offset, query) 🔒
- `GET /api/v1/companies/:id` - detail společnosti 🔒
- `POST /api/v1/companies` - vytvoření nové společnosti 🔒
- `PUT /api/v1/companies/:id` - aktualizace společnosti 🔒
- `DELETE /api/v1/companies/:id` - smazání společnosti 🔒

**Status:** ✅ Plně funkční
**Autentizace:** 🔒 Všechny endpointy chráněny `requireAuth` middleware 🆕

### ✅ Contacts (Kontakty) - REST API
**Implementované operace:**
- `GET /api/v1/contacts` - seznam s pagination a filtry 🔒
- `GET /api/v1/contacts/:id` - detail kontaktu 🔒
- `POST /api/v1/contacts` - vytvoření kontaktu 🔒
- `GET /api/v1/contacts/by-company/:companyId` - kontakty dle společnosti 🔒

**Částečně funkční:**
- `PUT /api/v1/contacts/:id` - aktualizace (problémy s eWay-CRM API) 🔒
- `DELETE /api/v1/contacts/:id` - smazání (problémy s eWay-CRM API) 🔒

**Search typy:** general, email, fullname

**Status:** ⚠️ CREATE/READ funkční, UPDATE/DELETE problematické
**Autentizace:** 🔒 Všechny endpointy chráněny `requireAuth` middleware 🆕

### ✅ Deals (Obchody) - REST API
**Kompletní CRUD operace:**
- `GET /api/v1/deals` - seznam s pagination 🔒
- `GET /api/v1/deals/:id` - detail obchodu 🔒
- `POST /api/v1/deals` - vytvoření obchodu 🔒
- `PUT /api/v1/deals/:id` - aktualizace obchodu 🔒
- `DELETE /api/v1/deals/:id` - smazání obchodu 🔒
- `GET /api/v1/deals/by-company/:companyId` - obchody dle společnosti 🔒

**Status:** ✅ Plně funkční
**Autentizace:** 🔒 Všechny endpointy chráněny `requireAuth` middleware 🆕

### ✅ MCP Protocol Tools

**Company Tools:**
- `get_companies` - získání seznamu společností
- `get_company_by_id` - detail společnosti

**Contact Tools:**
- `get_contacts` - získání seznamu kontaktů
- `get_contact_by_id` - detail kontaktu
- `get_contacts_by_company` - kontakty dle společnosti

**Status:** ✅ Read operace funkční, zatím bez CREATE/UPDATE/DELETE

## Technická implementace

### Struktura projektu

```
src/
├── index.ts                          # REST API Express server
├── mcp-server.ts                     # MCP Protocol server
├── config/
│   ├── dotenv.config.ts              # Environment variables
│   └── swagger.config.ts             # OpenAPI/Swagger konfigurace
├── constants/
│   └── api.constants.ts              # API konstanty (endpoints, typy)
├── connectors/
│   └── eway-http.connector.ts        # HTTP konektor k eWay-CRM API
├── controllers/                       # REST API controllery
│   ├── company.controller.ts
│   ├── contact.controller.ts
│   ├── deal.controller.ts
│   └── oauth2.controller.ts
├── routes/                            # Express routy
│   ├── company.routes.ts
│   ├── contact.routes.ts
│   ├── deal.routes.ts
│   └── oauth2.routes.ts
├── services/                          # Business logika
│   ├── base.service.ts               # Abstraktní service třída
│   ├── company.service.ts
│   ├── contact.service.ts
│   ├── deal.service.ts
│   ├── oauth2.service.ts             # OAuth2 token management
│   ├── config.service.ts             # Konfigurace z .env
│   └── logger.service.ts             # Winston logging
├── models/                            # Data Transfer Objects
│   ├── company.dto.ts                # Zod schémata + TypeScript typy
│   ├── company.mapper.ts             # eWay-CRM ↔ DTO mapování
│   ├── contact.dto.ts
│   ├── contact.mapper.ts
│   ├── deal.dto.ts
│   └── deal.mapper.ts
├── middleware/
│   ├── auth.middleware.ts            # OAuth2/Legacy autentizační middleware 🆕
│   ├── logging.middleware.ts         # HTTP request logging
│   └── validation.middleware.ts      # Query/body validace
└── utils/                             # Utility funkce
    ├── cache.utils.ts                # In-memory cache
    ├── crypto.utils.ts               # MD5 hashování hesla
    ├── error.utils.ts                # Error handling
    └── validation.utils.ts           # Validační utility
```

### Technologický stack

**Backend:**
- Node.js + TypeScript 5.8.3
- Express.js 5.1.0 - REST API framework
- @modelcontextprotocol/sdk 1.17.4 - MCP server

**eWay-CRM integrace:**
- Axios 1.10.0 - HTTP client
- Custom HTTP konektor (obešel problémy s oficiální knihovnou)

**Validace a typy:**
- Zod 3.25.64 - Runtime validace + TypeScript typy
- Kompletní type safety

**Dokumentace:**
- Swagger UI Express 5.0.1
- swagger-jsdoc 6.2.8
- OpenAPI 3.0 specifikace

**Security:**
- OAuth2 Authorization Code Flow
- MD5 password hashing pro legacy auth
- Token refresh management

**Logging:**
- Winston 3.17.0 - Structured logging
- File rotation support
- Log levels (error, warn, info, debug)

**Development:**
- ts-node-dev 2.0.0 - Hot reload
- dotenv 16.5.0 - Environment management

## Konfigurace (.env)

### OAuth2 autentizace (doporučeno):
```env
# eWay-CRM API
EWAY_API_URL=https://trial.eway-crm.com/31994/API.svc

# OAuth2
EWAY_CLIENT_ID=váš-client-id
EWAY_CLIENT_SECRET=váš-client-secret
EWAY_REDIRECT_URI=https://oauth.pstmn.io/v1/browser-callback
EWAY_USERNAME=api  # Potřebné i pro OAuth2

# Server
MCP_PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# App Info
APP_VERSION=MCP-Server-1.0
CLIENT_MACHINE_NAME=MCP-Server
CLIENT_MACHINE_ID=AA:BB:CC:DD:EE:FF
```

### Legacy autentizace (fallback):
```env
# eWay-CRM API
EWAY_API_URL=https://trial.eway-crm.com/31994/API.svc

# Legacy Auth
EWAY_USERNAME=api
EWAY_PASSWORD=vase-heslo-zde  # Automaticky se hashuje na MD5
# NEBO
# EWAY_PASSWORD_HASH=470AE7216203E23E1983EF1851E72947  # Už hashované heslo

# Zbytek stejný jako u OAuth2...
```

### Automatická detekce auth metody:
1. Pokud existují `EWAY_CLIENT_ID` + `EWAY_CLIENT_SECRET` → použije OAuth2
2. Jinak pokud existují `EWAY_USERNAME` + `EWAY_PASSWORD` → použije Legacy
3. Jinak → chyba

## OAuth2 Flow - Jak to funguje

### Krok 1: Autorizace
```bash
# Navštivte authorization endpoint
GET http://localhost:3000/api/v1/oauth2/authorize
```
- Server vygeneruje authorization URL s client_id a redirect_uri
- Uživatel je přesměrován na Azure AD login
- Po úspěšném přihlášení je přesměrován zpět s authorization code

### Krok 2: Callback
```bash
# eWay-CRM automaticky zavolá callback s code
GET http://localhost:3000/api/v1/oauth2/callback?code=...&state=...
```
- Server přijme authorization code
- Vymění code za access_token a refresh_token
- **Tokeny se uloží do paměti** (OAuth2Service singleton)
- Server se automaticky přihlásí k eWay-CRM API s access tokenem
- Zobrazí se úspěšná HTML stránka

### Krok 3: Použití API
```bash
# Nyní můžete volat chráněné endpointy
GET http://localhost:3000/api/v1/companies
GET http://localhost:3000/api/v1/contacts
POST http://localhost:3000/api/v1/deals
```

**Autentizační middleware automaticky:**
1. Zkontroluje, zda má OAuth2Service platný token v paměti
2. Pokud token expiruje brzy (< 1 min), automaticky ho refreshne
3. Pokud není token, vrátí 401 Unauthorized s instrukcemi
4. Pokud vše OK, přihlásí eWay konektor a pustí request dále

### Token Management v paměti

**OAuth2Service** (singleton):
- `storedToken: StoredToken | null` - token uložený v RAM
- `getValidAccessToken()` - vrátí platný token, automaticky refreshne pokud expiruje
- `hasValidToken()` - zkontroluje platnost bez refresh
- `refreshAccessToken()` - manuální refresh pomocí refresh_token
- `clearToken()` - vymaže token (logout)

**Důležité:**
- Tokeny jsou uloženy **pouze v paměti** (ne v databázi/filesystemu)
- Po restartu serveru je potřeba znovu projít OAuth2 flow
- Pro produkci doporučujeme implementovat perzistentní úložiště (Redis/DB)

### Autentizační middleware

**requireAuth middleware** (`src/middleware/auth.middleware.ts`):
```typescript
// Automaticky aplikován na všechny API endpointy
router.get('/', requireAuth, validateQuery(...), controller.getAll)
```

**Co dělá:**
1. Pro OAuth2: zkontroluje `oauth2Service.hasValidToken()`
2. Pokud není token → vrátí 401 s authorization URL
3. Pokud konektor není připojen → zavolá `ewayConnector.logIn()`
4. Pro Legacy: automaticky se přihlásí s username/password
5. Při úspěchu → pustí request dále
6. Při chybě → vrátí 401 nebo 500 s detailními error messages

## Známé problémy a omezení

### 1. Contact UPDATE/DELETE nefunguje spolehlivě
- **Problém:** HTTP 404 nebo 500 při volání SaveItem pro kontakty
- **Důvod:** eWay-CRM API limitace nebo trial instance omezení
- **Workaround:** CREATE a READ funguje bez problémů

### 2. SearchContacts vrací prázdné výsledky
- **Problém:** Trial instance má málo testovacích dat
- **Řešení:** Vlastní contact CREATE funguje, lze testovat s vlastními daty

### 3. Company názvy jsou často prázdné
- **Problém:** Trial data nemají vyplněné CompanyName pole
- **Řešení:** API vrací ostatní data správně, jen názvy chybí v testovacích datech

### 4. OAuth2 Client Credentials flow nepodporován
- **Problém:** eWay-CRM vyžaduje Authorization Code flow
- **Řešení:** Implementován správný flow, funguje s client secret jako Bearer token fallback

## API Endpointy

### System endpoints
- `GET /health` - Health check (status serveru, eWay-CRM připojení)
- `GET /api/v1` - API info a seznam endpointů
- `GET /api/v1/test-connection` - Test eWay-CRM připojení
- `GET /api-docs` - Swagger UI dokumentace

### OAuth2 endpoints
- `GET /api/v1/oauth2/authorize` - Získat authorization URL
- `GET /api/v1/oauth2/callback` - OAuth2 callback (přijme code)
- `POST /api/v1/oauth2/logout` - Odhlášení (vymazání tokenu)
- `GET /api/v1/oauth2/token` - Info o aktuálním tokenu

### Companies endpoints
- `GET /api/v1/companies?limit=25&offset=0&q=search`
- `GET /api/v1/companies/:id`
- `POST /api/v1/companies`
- `PUT /api/v1/companies/:id`
- `DELETE /api/v1/companies/:id`

### Contacts endpoints
- `GET /api/v1/contacts?limit=25&offset=0&q=search`
- `GET /api/v1/contacts/:id`
- `POST /api/v1/contacts`
- `PUT /api/v1/contacts/:id` (⚠️ nestabilní)
- `DELETE /api/v1/contacts/:id` (⚠️ nestabilní)
- `GET /api/v1/contacts/by-company/:companyId`

### Deals endpoints
- `GET /api/v1/deals?limit=25&offset=0&q=search`
- `GET /api/v1/deals/:id`
- `POST /api/v1/deals`
- `PUT /api/v1/deals/:id`
- `DELETE /api/v1/deals/:id`
- `GET /api/v1/deals/by-company/:companyId`

## MCP Protocol Tools

Server poskytuje následující tools pro MCP klienty (např. Claude Desktop):

### Companies
- `get_companies` - seznam společností (s pagination a search)
- `get_company_by_id` - detail společnosti

### Contacts
- `get_contacts` - seznam kontaktů (s pagination, search typy, company filter)
- `get_contact_by_id` - detail kontaktu
- `get_contacts_by_company` - kontakty dle společnosti

## Testování

### Automatické testy
PowerShell test suite pro testování všech endpointů:
```powershell
.\test-mcp-server.ps1
```

Testy pokrývají:
- Health check
- API overview
- Companies CRUD
- Contacts CREATE/READ
- Deals CRUD
- Connection test

### Manuální testování
```bash
# Health check
curl http://localhost:3000/health

# Companies list
curl http://localhost:3000/api/v1/companies?limit=5

# Create company
curl -X POST http://localhost:3000/api/v1/companies \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Company", "email": "test@example.com"}'
```

### Swagger UI
Interaktivní API dokumentace a testování na:
```
http://localhost:3000/api-docs
```

## Spuštění projektu

### Development mode
```bash
# REST API server s hot reload
npm run dev

# MCP Protocol server s hot reload
npm run mcp-dev
```

### Production mode
```bash
# Build TypeScript → JavaScript
npm run build

# Spustit REST API server
npm start

# Spustit MCP server
npm run mcp
```

### Clean build
```bash
npm run clean
npm run build
```

## Git historie

Poslední commity (od nejnovějšího):

1. **OAuth2 autentizace** (7bfc978)
   - Implementován kompletní OAuth2 Authorization Code Flow
   - OAuth2 service pro token management
   - OAuth2 controller a routes
   - Podpora refresh tokenů
   - Konfigurace pro OAuth2 + Legacy fallback
   - Crypto utils pro MD5 hashování

2. **Deals CRUD API** (d33d906)
   - Kompletní CRUD pro obchody/příležitosti
   - Deal DTO a mapper
   - Deal service a controller
   - Testy pro deal endpoints

3. **Mapování vylepšení** (55373ad)
   - Fallback pro prázdné company názvy
   - Client-side pagination pro kontakty
   - Lepší search parametry

4. **Základní struktura** (bc6a26f)
   - Initial setup projektu
   - Companies a Contacts API
   - TypeScript konfigurace
   - Swagger dokumentace

## Stav implementace podle zadání

### ✅ Splněno
- ✅ MCP Server (dva typy - REST + MCP Protocol)
- ✅ eWay-CRM integrace (HTTP konektor)
- ✅ Companies kompletní CRUD
- ✅ Contacts CREATE/READ (UPDATE/DELETE problematické)
- ✅ Deals kompletní CRUD
- ✅ OAuth2 autentizace
- ✅ Legacy autentizace fallback
- ✅ TypeScript s kompletní type safety
- ✅ Zod validace
- ✅ Winston logging
- ✅ Error handling
- ✅ Swagger dokumentace
- ✅ Health checks
- ✅ Pagination
- ✅ Test suite

### 🚧 Částečně implementováno
- ⚠️ Contact UPDATE/DELETE - API limitace
- ⚠️ MCP Tools - zatím jen read operace

### 🔮 Připraveno pro rozšíření
- 🔧 MCP Tools pro CREATE/UPDATE/DELETE
- 🔧 Deals v MCP Protocol serveru
- 🔧 Projects, Tasks, Calendar (další eWay-CRM entity)
- 🔧 Database caching (Redis)
- 🔧 Rate limiting
- 🔧 WebSocket support pro real-time updates
- 🔧 Batch operations
- 🔧 File attachments

## Závěr

Projekt je **plně funkční a připravený k použití** pro:
- ✅ REST API integrace s eWay-CRM
- ✅ MCP Protocol integrace s AI asistenty
- ✅ OAuth2 autentizaci i legacy fallback
- ✅ Správu Companies a Deals s kompletním CRUD
- ✅ Správu Contacts (CREATE/READ spolehlivé)

**Klíčové přednosti:**
- Dva typy rozhraní (REST + MCP Protocol)
- Moderní TypeScript architektura
- Kompletní type safety a validace
- OAuth2 + Legacy dual auth support
- Swagger dokumentace
- Structured logging
- Error handling
- Připraveno pro rozšíření

**Doporučení pro produkci:**
1. Použít produkční eWay-CRM instanci (ne trial)
2. Nastavit OAuth2 autentizaci
3. Implementovat rate limiting
4. Přidat monitoring a alerting
5. Rozšířit MCP Tools o write operace
6. Přidat další eWay-CRM entity dle potřeby
