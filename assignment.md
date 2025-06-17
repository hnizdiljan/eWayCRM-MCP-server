# Technické zadání: Implementace MCP serveru pro eWay-CRM

Cílem tohoto projektu je vytvořit serverovou aplikaci (MCP server) v NodeJS a TypeScriptu. Server bude fungovat jako prostředník (middle-tier) mezi externími aplikacemi a eWay-CRM REST API. Zapouzdří komplexitu proprietárního API, sjednotí datové modely a centralizuje správu autentizace.

---

## Fáze 1: Základní nastavení a architektura ✅ DOKONČENO

Tato fáze se zaměřuje na inicializaci projektu, nastavení základních nástrojů a vytvoření stabilního základu pro další vývoj.

### Úkol 1.1: Inicializace projektu ✅ DOKONČENO
- [x] Vytvořit nový NodeJS projekt (`npm init`).
- [x] Nastavit TypeScript (`tsconfig.json`) pro kompilaci do moderního JS (ES2020+).
- [x] Nainstalovat základní závislosti: `express`, `typescript`, `@types/express`, `ts-node-dev`.
- [x] Vytvořit základní strukturu adresářů:
    ```
    /src
    ├── controllers/
    ├── services/
    ├── connectors/
    ├── models/
    ├── middleware/
    └── index.ts
    ```
- [x] Vytvořit a nakonfigurovat základní Express server v `src/index.ts`.

### Úkol 1.2: Konfigurace a logování ✅ DOKONČENO
- [x] Nainstalovat a nastavit knihovnu `dotenv` pro správu konfiguračních proměnných.
- [ ] Vytvořit soubor `.env.example` se všemi potřebnými proměnnými (`EWAY_API_URL`, `EWAY_USERNAME`, `EWAY_PASSWORD_HASH`, `MCP_PORT`, `LOG_LEVEL`).
- [x] Nainstalovat a nastavit knihovnu pro logování (např. `winston` nebo `pino`).
- [x] Implementovat logovací službu a middleware pro logování všech příchozích požadavků (metoda, URL, status, doba odezvy).

### Úkol 1.3: eWay-CRM konektor a autentizace ✅ DOKONČENO
- [x] Nainstalovat oficiální wrapper `@eway-crm/connector`.
- [x] Vytvořit službu `EwayConnector` (ideálně jako singleton), která bude spravovat `Connection` objekt z `js-lib`.
- [x] Implementovat v `EwayConnector` metodu pro přihlášení (`logIn()`) a bezpečné uložení `sessionId`.
- [x] Implementovat v `EwayConnector` logiku pro automatické obnovení session při obdržení chyby `rcBadSession` od eWay-CRM API.

---

## Fáze 2: Implementace API pro Společnosti (Companies) ✅ DOKONČENO

Tato fáze slouží jako "Proof of Concept". Kompletně implementujeme jednu entitu, abychom ověřili architekturu a postupy.

### Úkol 2.1: Modely a mapování ✅ DOKONČENO
- [x] Vytvořit DTO (Data Transfer Object) pro zjednodušený MCP model společnosti v `src/models/company.dto.ts`.
- [x] Vytvořit mapovací funkci `ewayCompanyToMcpCompany` pro konverzi dat z eWay API do našeho modelu.
- [x] Vytvořit mapovací funkci `mcpCompanyToEwayCompanyTracked` pro konverzi dat z našeho modelu do formátu pro uložení (`SaveCompany`).
- [x] Nainstalovat a nastavit knihovnu `zod` pro validaci dat.
- [x] Vytvořit validační schéma pro data přicházející na `POST /companies` a `PUT /companies/:id`.

### Úkol 2.2: Služby a Controllery ✅ DOKONČENO
- [x] Vytvořit `CompanyService` (`src/services/company.service.ts`) s metodami:
    - [x] `getAll(query, limit, offset)`
    - [x] `getById(id)`
    - [x] `create(companyData)`
    - [x] `update(id, companyData)`
    - [x] `delete(id)`
- [x] Vytvořit `CompanyController` (`src/controllers/company.controller.ts`), který bude volat metody ze `CompanyService`.
- [x] Vytvořit validační middleware, který využije `zod` schémata před voláním controlleru.

### Úkol 2.3: API Endpoints ✅ DOKONČENO
- [x] Implementovat `GET /api/v1/companies` (s podporou fulltextového vyhledávání `?q=` a stránkování `?limit=&offset=`).
- [x] Implementovat `GET /api/v1/companies/:id`.
- [x] Implementovat `POST /api/v1/companies`.
- [x] Implementovat `PUT /api/v1/companies/:id`.
- [x] Implementovat `DELETE /api/v1/companies/:id`.
- [x] Propojit endpointy s příslušnými handlery v `CompanyController`.

---

## Fáze 3: Rozšíření o další klíčové entity ✅ DOKONČENO (Kontakty)

Po úspěšném dokončení Fáze 2 zopakujeme stejný postup pro další entity.

### Úkol 3.1: Kontakty (Contacts) ✅ DOKONČENO
- [x] Vytvořit DTO a mapovací funkce pro Kontakty.
- [x] Vytvořit `ContactService` a `ContactController`.
- [x] Implementovat kompletní CRUD endpointy pro `/api/v1/contacts`.

### Úkol 3.2: Příležitosti (Deals/Leads) ✅ DOKONČENO
- [x] Vytvořit DTO a mapovací funkce pro Příležitosti.
- [x] Vytvořit `DealService` a `DealController`.
- [x] Implementovat kompletní CRUD endpointy pro `/api/v1/deals`.

### Úkol 3.3: (Volitelně) Další entity ⏳ ZBÝVÁ
- [ ] Zanalyzovat a implementovat další potřebné entity (např. Projekty, Úkoly) podle stejného vzoru.

---

## Fáze 4: Dokončovací práce a zajištění kvality

V této fázi se zaměříme na robustnost, testování a přípravu na nasazení.

### Úkol 4.1: Zpracování chyb (Error Handling) ⏳ ČÁSTEČNĚ HOTOVO
- [x] Vytvořit globální error handling middleware v Expressu.
- [x] Standardizovat formát chybových odpovědí z API (např. `{ error: { code: '...', message: '...' } }`).
- [x] Zajistit, aby všechny chyby z `js-lib` (např. `rcItemNotFound`, `rcPermissionDenied`) byly správně mapovány na odpovídající HTTP status kódy (404, 403, atd.).

### Úkol 4.2: Swagger/OpenAPI dokumentace ✅ DOKONČENO
- [x] Nainstalovat a nakonfigurovat `swagger-ui-express` a `swagger-jsdoc`.
- [x] Vytvořit OpenAPI specifikaci pro všechny endpointy.
- [x] Přidat Swagger UI na `/api-docs` endpoint.
- [x] Dokumentovat všechny DTOs, request/response modely.
- [x] Přidat příklady pro všechny endpointy.

### Úkol 4.3: Konfigurace a deployment příprava ⏳ ČÁSTEČNĚ HOTOVO
- [x] Vytvořit soubor `.env.example` se všemi potřebnými proměnnými.
- [ ] Vytvořit `Dockerfile` pro sestavení a spuštění aplikace v produkčním prostředí.
- [ ] Vytvořit soubor `docker-compose.yml` pro snadné spuštění aplikace.
- [x] Vytvořit kvalitní `README.md` soubor s popisem projektu.

### Úkol 4.4: Testování ⏳ ZBÝVÁ
- [ ] Nainstalovat a nakonfigurovat testovací framework `jest` s `ts-jest` a `supertest`.
- [ ] Napsat unit testy pro všechny mapovací funkce a klíčovou business logiku v services.
- [ ] Napsat integrační testy pro API endpointy (s mockovaným `EwayConnector`, aby se nevolalo reálné API).

---

## Aktuální stav projektu:

### ✅ Hotovo:
- Základní architektura a struktura projektu
- Express server s middleware pro logování a validaci
- eWay-CRM konektor s automatickým session managementem
- Kompletní CRUD API pro Companies (Společnosti)
- Kompletní CRUD API pro Contacts (Kontakty)
- **Kompletní CRUD API pro Deals (Obchody/Příležitosti)** - nově implementováno
- Validace dat pomocí Zod
- Centralizované logování pomocí Winston
- Mapování dat mezi eWay a MCP formáty
- Error handling middleware
- **Swagger/OpenAPI dokumentace** - kompletní API dokumentace na `/api-docs`
- Konfigurační soubor `.env.example`

### ⏳ Rozpracováno:
- Deployment konfigurace (chybí Docker soubory)

### 📋 Zbývá implementovat:
1. **Testování** - unit a integrační testy  
2. **Docker konfigurace** - Dockerfile a docker-compose.yml
3. **Další entity** - podle potřeby (Projekty, Úkoly, atd.)

### 🎯 Nejbližší kroky:
1. Přidat Docker konfiguraci
2. Napsat testy
3. Optimalizovat a rozšířit podle potřeb

### 🚀 Aktuální funkce projektu:
- **API Endpointy:**
  - `GET /api/v1/companies` - seznam společností s vyhledáváním a stránkováním
  - `GET /api/v1/companies/:id` - detail společnosti
  - `POST /api/v1/companies` - vytvoření společnosti
  - `PUT /api/v1/companies/:id` - aktualizace společnosti
  - `DELETE /api/v1/companies/:id` - smazání společnosti
  - `GET /api/v1/contacts` - seznam kontaktů s filtrováním
  - `GET /api/v1/contacts/by-company/:companyId` - kontakty podle společnosti
  - `GET /api/v1/contacts/:id` - detail kontaktu
  - `POST /api/v1/contacts` - vytvoření kontaktu
  - `PUT /api/v1/contacts/:id` - aktualizace kontaktu
  - `DELETE /api/v1/contacts/:id` - smazání kontaktu
  - `GET /api/v1/deals` - seznam obchodů s vyhledáváním a stránkováním
  - `GET /api/v1/deals/by-company/:companyId` - obchody podle společnosti
  - `GET /api/v1/deals/:id` - detail obchodu
  - `POST /api/v1/deals` - vytvoření obchodu
  - `PUT /api/v1/deals/:id` - aktualizace obchodu
  - `DELETE /api/v1/deals/:id` - smazání obchodu
  - `GET /health` - zdravotní kontrola serveru
  - `GET /api-docs` - Swagger dokumentace

- **Technické funkce:**
  - Automatická validace dat pomocí Zod schémat
  - Strukturované logování všech operací
  - Automatické session management pro eWay-CRM
  - Standardizované error handling s HTTP status kódy
  - Kompletní OpenAPI dokumentace s příklady