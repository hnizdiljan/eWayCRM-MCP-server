# OAuth2 Autorizace pro eWay-CRM MCP Server

Tento dokument popisuje implementaci OAuth2 Authorization Code flow pro autentizaci s eWay-CRM API přes Azure AD.

## Přehled

Aplikace nyní plně podporuje OAuth2 Authorization Code flow s Azure AD pro bezpečnou autentizaci. Server poskytuje kompletní sadu endpointů pro OAuth2 autorizaci, výměnu tokenů a správu session.

## Konfigurace Azure AD

### 1. Registrace aplikace v Azure AD

1. Přihlaste se do [Azure Portal](https://portal.azure.com)
2. Přejděte na **Azure Active Directory** → **App registrations**
3. Klikněte na **New registration**
4. Vyplňte:
   - **Name**: eWay-CRM MCP Server
   - **Supported account types**: Vyberte podle vašich potřeb
   - **Redirect URI**: Web → `http://localhost:3000/api/v1/oauth2/callback`
5. Po vytvoření si poznamenejte **Application (client) ID**

### 2. Vytvoření Client Secret

1. V registrované aplikaci přejděte na **Certificates & secrets**
2. Klikněte na **New client secret**
3. Nastavte popis a dobu platnosti
4. **DŮLEŽITÉ**: Okamžitě si poznamenejte hodnotu secret - zobrazí se pouze jednou!

### 3. Nastavení API Permissions

1. Přejděte na **API permissions**
2. Přidejte požadovaná oprávnění pro eWay-CRM API
3. Udělte admin consent pokud je potřeba

## Konfigurace aplikace

### 1. Nastavení proměnných prostředí

Vytvořte nebo upravte soubor `.env`:

```bash
# eWay-CRM API konfigurace
EWAY_API_URL=https://your-eway-instance.com/API.svc

# OAuth2 konfigurace z Azure AD
EWAY_CLIENT_ID=application-client-id-z-azure-ad
EWAY_CLIENT_SECRET=client-secret-z-azure-ad
EWAY_REDIRECT_URI=http://localhost:3000/api/v1/oauth2/callback

# Server konfigurace
MCP_PORT=3000
```

## OAuth2 Authorization Code Flow

### Krok 1: Inicializace autorizace

#### Přímé přesměrování (doporučeno)

Otevřete v prohlížeči:
```
http://localhost:3000/api/v1/oauth2/authorize
```

Tento endpoint vás automaticky přesměruje na Azure AD přihlašovací stránku.

#### Získání authorization URL (pro API klienty)

```bash
GET http://localhost:3000/api/v1/oauth2/authorize?json=true
```

Odpověď:
```json
{
  "status": "success",
  "authorizationUrl": "https://your-eway.com/auth/connect/authorize?...",
  "state": "unique-state-id-for-csrf-protection",
  "instructions": [...]
}
```

### Krok 2: Autorizace uživatele

1. Přihlaste se pomocí Azure AD účtu (automaticky pokud používáte přímé přesměrování)
2. Udělte aplikaci požadovaná oprávnění
3. Budete přesměrováni na callback URL s authorization code

### Krok 3: Zpracování výsledku

#### Automaticky (doporučeno)

Callback endpoint automaticky zpracuje authorization code a zobrazí HTML stránku s výsledkem:
- ✅ **Úspěch**: Pěkná HTML stránka s informacemi o tokenu a odkazy na API
- ❌ **Chyba**: HTML stránka s popisem chyby a možností opakování

#### Manuální zpracování kódu
```bash
POST http://localhost:3000/api/v1/oauth2/exchange-code
Content-Type: application/json

{
  "code": "authorization-code-from-redirect",
  "state": "state-from-step-1"
}
```

Odpověď:
```json
{
  "status": "success",
  "token": {
    "type": "Bearer",
    "expiresAt": "2024-01-01T12:00:00Z",
    "hasRefreshToken": true,
    "scope": "api offline_access"
  },
  "ewaySession": {
    "sessionId": "session-id",
    "description": "Login successful"
  }
}
```

## API Endpointy

### OAuth2 endpointy

| Endpoint | Metoda | Popis |
|----------|--------|-------|
| `/api/v1/oauth2/authorize` | GET | Získání authorization URL |
| `/api/v1/oauth2/callback` | GET | OAuth2 callback pro zpracování code |
| `/api/v1/oauth2/exchange-code` | POST | Manuální výměna code za token |
| `/api/v1/oauth2/refresh` | POST | Obnovení access tokenu |
| `/api/v1/oauth2/status` | GET | Kontrola stavu autentizace |
| `/api/v1/oauth2/logout` | POST | Odhlášení a vymazání tokenů |

### Business endpointy (vyžadují autentizaci)

- `/api/v1/companies` - Správa společností
- `/api/v1/contacts` - Správa kontaktů  
- `/api/v1/deals` - Správa obchodů

## Správa tokenů

### Access Token
- Platnost obvykle 1 hodina
- Automatická obnova před vypršením
- Uložen v paměti aplikace

### Refresh Token  
- Platnost delší (dny až týdny)
- Používá se pro obnovení access tokenu
- Bezpečně uložen v aplikaci

### Session ID
- Vrácen po úspěšném přihlášení k eWay API
- Používán pro všechna API volání
- Automaticky obnovován při vypršení

## Řešení problémů

### "OAuth2 Authorization Code flow není inicializován"
- **Příčina**: Aplikace nemá platný OAuth2 token
- **Řešení**: Projděte celý autorizační proces od kroku 1

### "Neplatný state parameter"
- **Příčina**: CSRF ochrana - state nesouhlasí nebo vypršel (30 minut)
- **Řešení**: Začněte znovu od kroku 1

### Chyba při výměně code za token
- Authorization code již byl použit
- Code vypršel (platnost 10 minut)
- Nesprávné Client ID/Secret
- Nesprávné redirect URI

### "rcBadSession" nebo "rcBadAccessToken"
- Token nebo session vypršely
- Aplikace automaticky obnoví přihlášení

## Bezpečnost

- **NIKDY** nesdílejte Client Secret
- Používejte HTTPS v produkci
- Pravidelně obnovujte Client Secret (doporučeno každých 90 dní)
- Monitorujte přístupové logy
- Používejte princip nejmenších oprávnění
- Implementujte rate limiting

## Implementační detaily

### OAuth2 Service
- Spravuje tokeny a jejich životní cyklus
- Automatická obnova tokenů
- Bezpečné ukládání v paměti

### OAuth2 Controller
- Zpracovává OAuth2 flow
- CSRF ochrana pomocí state parametru
- Automatické čištění starých state záznamů

### eWay Connector
- Integruje OAuth2 service
- Fallback na Client Secret jako Bearer token
- Automatické znovupřihlášení při vypršení

## Testování v Postman

1. Použijte Postman OAuth2 helper
2. Nastavte:
   - Auth URL: `{EWAY_API_URL}/auth/connect/authorize`
   - Access Token URL: `{EWAY_API_URL}/auth/connect/token`
   - Client ID & Secret z Azure AD
   - Redirect URL: `https://oauth.pstmn.io/v1/browser-callback`
   - Scope: `api offline_access`

## Swagger dokumentace

Kompletní API dokumentace včetně OAuth2 endpointů:
```
http://localhost:3000/api-docs
```

## Další informace

- [Azure AD OAuth2 dokumentace](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [eWay-CRM API dokumentace](https://docs.eway-crm.com/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)