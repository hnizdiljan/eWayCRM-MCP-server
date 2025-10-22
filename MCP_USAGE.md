# Použití eWay-CRM MCP Serveru

## Co je nového? ✨

**MCP server nyní automaticky spouští REST API!**

Už nemusíte spouštět dva procesy zvlášť. Stačí spustit MCP server a ten automaticky:
- ✅ Zkontroluje, zda běží REST API na portu 7777
- ✅ Pokud ne, automaticky ho spustí
- ✅ Při ukončení MCP serveru ukončí i REST API

---

## Rychlý start 🚀

### 1. Nainstalujte Claude Desktop

**Windows/Mac:**
- Stáhněte z https://claude.ai/download
- Po instalaci zavřete aplikaci

### 2. Zkonfigurujte MCP server

**Najděte konfigurační soubor:**

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
  - Plná cesta: `C:\Users\<username>\AppData\Roaming\Claude\claude_desktop_config.json`
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

**Přidejte konfiguraci:**

```json
{
  "mcpServers": {
    "eway-crm": {
      "command": "node",
      "args": [
        "C:\\Users\\hnizd\\source\\repos\\hnizdiljan\\eWayCRM-MCP-server\\dist\\mcp-server.js"
      ],
      "env": {
        "NODE_ENV": "production",

        "MCP_API_EWAY_USERNAME": "vas-uzivatel@domena.cz",
        "MCP_API_EWAY_PASSWORD_HASH": "hash-vaseho-hesla",
        "MCP_API_EWAY_API_URL": "https://trial.eway-crm.com/31994"
      }
    }
  }
}
```

**⚠️ DŮLEŽITÉ:**
- Upravte cestu k `mcp-server.js` podle vaší instalace!
- **Nakonfigurujte ENV proměnné** pro přístup k eWay-CRM (viz níže)

### 3. Spusťte Claude Desktop

- Otevřete Claude Desktop
- MCP server se automaticky připojí a spustí REST API
- V pravém dolním rohu uvidíte ikonu MCP serveru

### 4. Otestujte

V Claude Desktop zkuste:

```
Jaké nástroje máš k dispozici pro eWay-CRM?
```

Nebo:

```
Získej přihlašovací odkaz pro eWay-CRM
```

---

## Konfigurace ENV proměnných 🔧

MCP server podporuje **MCP-specifickou konfiguraci** přes ENV proměnné v Claude Desktop konfiguraci.

### Jak to funguje?

1. V `claude_desktop_config.json` přidáte ENV proměnné s prefixem `MCP_API_`
2. MCP server tyto proměnné načte a **odstraní prefix**
3. Předá je REST API serveru (bez prefixu)

**Příklad:**
```
MCP_API_EWAY_USERNAME  →  předá se API jako  →  EWAY_USERNAME
```

### Dostupné konfigurace

#### 🔐 Autentizace - Legacy (username + heslo)

```json
"env": {
  "MCP_API_EWAY_USERNAME": "uzivatel@firma.cz",
  "MCP_API_EWAY_PASSWORD_HASH": "váš-hash-hesla",
  "MCP_API_EWAY_API_URL": "https://trial.eway-crm.com/31994"
}
```

**Jak získat hash hesla:**
```bash
npm run hash-password
# Nebo
node dist/utils/hash-password.js
```

#### 🔓 Autentizace - OAuth2

```json
"env": {
  "MCP_API_EWAY_USERNAME": "uzivatel@firma.cz",
  "MCP_API_EWAY_API_URL": "https://trial.eway-crm.com/31994",
  "MCP_API_OAUTH_CLIENT_ID": "your-client-id",
  "MCP_API_OAUTH_CLIENT_SECRET": "your-client-secret",
  "MCP_API_OAUTH_REDIRECT_URI": "http://localhost:7777/api/v1/oauth2/callback"
}
```

#### ⚙️ Server konfigurace

```json
"env": {
  "MCP_API_PORT": "7777",
  "MCP_API_LOG_LEVEL": "info",
  "MCP_API_SERVER_BASE_URL": "http://localhost:7777"
}
```

### Kompletní příklad konfigurace

```json
{
  "mcpServers": {
    "eway-crm": {
      "command": "node",
      "args": [
        "C:\\cesta\\k\\projektu\\dist\\mcp-server.js"
      ],
      "env": {
        "NODE_ENV": "production",

        "// eWay-CRM API": "",
        "MCP_API_EWAY_USERNAME": "uzivatel@firma.cz",
        "MCP_API_EWAY_PASSWORD_HASH": "hash-hesla",
        "MCP_API_EWAY_API_URL": "https://trial.eway-crm.com/31994",

        "// OAuth2 (volitelné)": "",
        "MCP_API_OAUTH_CLIENT_ID": "client-id",
        "MCP_API_OAUTH_CLIENT_SECRET": "client-secret",

        "// Server": "",
        "MCP_API_PORT": "7777",
        "MCP_API_LOG_LEVEL": "info"
      }
    }
  }
}
```

### 💡 Výhody tohoto přístupu

- ✅ **Separace konfigurací** - můžete mít různou konfiguraci pro MCP a přímé API
- ✅ **Bezpečnost** - ENV proměnné nejsou v repozitáři
- ✅ **Jednoduchost** - vše nastaveno na jednom místě
- ✅ **Přenositelnost** - snadno sdílejte konfiguraci mezi počítači

### ⚠️ Bezpečnostní upozornění

- **NIKDY** necommitujte `claude_desktop_config.json` s hesly do Gitu!
- Použijte hash hesla, ne plaintext heslo
- Pro produkci doporučujeme OAuth2

---

## Co MCP server umí? 🛠️

MCP server poskytuje **37 nástrojů** pro práci s eWay-CRM:

### AUTH (2 nástroje)
- `get_login_url` - Získání přihlašovacího odkazu
- `get_auth_status` - Kontrola stavu přihlášení

### COMPANIES (5 nástrojů)
- `get_companies` - Seznam společností
- `get_company_by_id` - Detail společnosti
- `create_company` - Vytvoření společnosti
- `update_company` - Aktualizace společnosti
- `delete_company` - Smazání společnosti

### CONTACTS (6 nástrojů)
- `get_contacts` - Seznam kontaktů
- `get_contact_by_id` - Detail kontaktu
- `get_contacts_by_company` - Kontakty podle společnosti
- `create_contact` - Vytvoření kontaktu
- `update_contact` - Aktualizace kontaktu
- `delete_contact` - Smazání kontaktu

### TASKS (11 nástrojů)
- `get_tasks` - Seznam úkolů
- `get_task_by_id` - Detail úkolu
- `create_task` - Vytvoření úkolu
- `update_task` - Aktualizace úkolu
- `delete_task` - Smazání úkolu
- `complete_task` - Uzavření úkolu
- `get_tasks_by_company` - Úkoly podle společnosti
- `get_tasks_by_contact` - Úkoly podle kontaktu
- `get_tasks_by_solver` - Úkoly podle řešitele
- `get_completed_tasks` - Dokončené úkoly
- `get_pending_tasks` - Nedokončené úkoly

### LEADS (6 nástrojů)
- `get_leads` - Seznam příležitostí
- `get_lead_by_id` - Detail příležitosti
- `create_lead` - Vytvoření příležitosti
- `update_lead` - Aktualizace příležitosti
- `delete_lead` - Smazání příležitosti
- `get_leads_by_company` - Příležitosti podle společnosti

### USERS (6 nástrojů)
- `get_users` - Seznam uživatelů
- `get_user_by_id` - Detail uživatele
- `create_user` - Vytvoření uživatele
- `update_user` - Aktualizace uživatele
- `get_active_users` - Aktivní uživatelé
- `get_users_by_supervisor` - Uživatelé podle nadřízeného

### ENUM TYPES (4 nástroje)
- `search_enum_types` - Vyhledání číselníků
- `get_enum_type_by_name` - Číselník podle názvu
- `get_enum_types_by_folder` - Číselníky podle složky
- `get_task_enum_types` - Číselníky pro úkoly

---

## Příklady použití 💡

### Základní operace

```
"Zobraz mi všechny nedokončené úkoly"
→ Použije get_pending_tasks

"Vytvoř novou společnost ACME s.r.o. s emailem info@acme.cz"
→ Použije create_company

"Najdi všechny kontakty ve společnosti XYZ"
→ Použije get_contacts_by_company
```

### Pokročilé operace

```
"Vytvoř úkol 'Připravit prezentaci' pro společnost ACME s termínem do konce týdne"
→ Použije create_task s companyId

"Uzavři úkol s ID abc-123"
→ Použije complete_task

"Zobraz mi všechny aktivní uživatele"
→ Použije get_active_users
```

### Autentizace

```
"Potřebuji se přihlásit do eWay-CRM"
→ Použije get_login_url a poskytne odkaz

"Jsem přihlášený?"
→ Použije get_auth_status
```

---

## Jak to funguje 🔧

```
┌─────────────────┐
│  Claude Desktop │  ← Zde píšete příkazy
└────────┬────────┘
         │ MCP Protocol (stdio)
         │
┌────────▼────────┐
│   MCP Server    │  ← Automaticky se spustí
│  (mcp-server.js)│
└────────┬────────┘
         │ Automaticky spustí ↓
┌────────▼────────┐
│   REST API      │  ← Běží na portu 7777
│   (index.js)    │
└────────┬────────┘
         │ HTTP API
┌────────▼────────┐
│   eWay-CRM      │  ← Vaše CRM data
└─────────────────┘
```

---

## Troubleshooting 🔍

### MCP server se nepřipojí

1. **Zkontrolujte cestu v konfiguraci:**
   - Otevřete `claude_desktop_config.json`
   - Ověřte, že cesta k `mcp-server.js` je správná
   - Použijte absolutní cestu s dvojitými backslashi (`\\`) na Windows

2. **Zkontrolujte Node.js:**
   ```bash
   node --version
   ```
   Musíte mít Node.js 16 nebo novější

3. **Restartujte Claude Desktop úplně:**
   - Zavřete aplikaci
   - Ukončete proces v Task Manageru (pokud běží)
   - Znovu spusťte

### REST API se nespustilo automaticky

1. **Zkontrolujte logy:**
   - **Windows:** `%APPDATA%\Claude\logs\`
   - **Mac:** `~/Library/Logs/Claude/`

2. **Port 7777 je obsazený:**
   - MCP server detekuje, že API už běží
   - To je normální - použije existující API

3. **Spusťte API manuálně (pro debugging):**
   ```bash
   npm start
   ```

### Claude nevidí nástroje

1. **Zkontrolujte, že MCP server běží:**
   - Ikona v pravém dolním rohu Claude Desktop

2. **Zeptejte se Claude:**
   ```
   Jaké nástroje máš k dispozici?
   ```

3. **Zkontrolujte autentizaci:**
   ```
   Získej mi přihlašovací odkaz
   ```

---

## Bezpečnost 🔐

**MCP server vyžaduje OAuth2 autentizaci!**

Před prvním použitím:
1. Claude vás vyzve k přihlášení
2. Použije nástroj `get_login_url`
3. Otevřete URL v prohlížeči
4. Přihlaste se přes Azure AD
5. Poté budou všechny nástroje funkční

---

## Ruční spouštění (není potřeba)

Pokud z nějakého důvodu nechcete automatické spouštění:

### 1. Spusťte REST API:
```bash
npm start
```

### 2. Spusťte MCP server:
```bash
npm run mcp
```

MCP server detekuje že API už běží a nepokoušel se ho znovu spustit.

---

## Další MCP klienty

MCP protocol podporují i další klienty:

- **Cline** - VS Code extension s MCP podporou
- **Continue.dev** - VS Code + JetBrains (beta MCP)
- **Vlastní klient** - použijte `@modelcontextprotocol/sdk`

---

## Technické informace

- **MCP Protocol:** stdio transport
- **REST API Port:** 7777
- **Node.js:** 16+
- **TypeScript:** 5.x
- **MCP SDK:** @modelcontextprotocol/sdk@1.17.4

---

## Potřebujete pomoc?

- **GitHub Issues:** https://github.com/eway-crm/...
- **Dokumentace:** Viz README.md
- **Swagger API Docs:** http://localhost:7777/api-docs (když API běží)

---

**Vytvořeno:** 2025-01-21
**Verze:** 1.0.0 s auto-start API
**Autor:** eWay-CRM Team
