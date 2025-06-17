# eWay-CRM JavaScript knihovna - Kompletní dokumentace

## Přehled knihovny

**eWay-CRM JavaScript knihovna** (`@eway-crm/connector`) je oficiální NPM balíček pro komunikaci s eWay-CRM webovou službou. Knihovna poskytuje wrapper nad HTTP/S komunikací a automatickou správu sessions, což vývojářům umožňuje snadnou integraci s eWay-CRM API bez nutnosti manuálního managementu relací.

eWay-CRM je komplexní CRM systém používaný tisíci firem pro správu kontaktů, obchodních příležitostí, projektů a dalších obchodních procesů. JavaScript knihovna umožňuje **přístup ke všem funkcím eWay-CRM** prostřednictvím webového API s **konzistentním rozhraním** jako PHP a C# verze.

## Instalace

```bash
npm i @eway-crm/connector
```

**Systémové požadavky:**
- Node.js prostředí
- eWay-CRM verze 6.0.1 a vyšší
- Přístup k eWay-CRM webové službě

## Základní konfigurace

### Vytvoření připojení

```javascript
import ApiConnection from '@eway-crm/connector';

// Základní konfigurace připojení
const serviceUrl = 'https://trial.eway-crm.com/31994';
const username = 'api';
const passwordHash = '470AE7216203E23E1983EF1851E72947'; // MD5 hash hesla
const appVersion = 'MojeApp1.0';
const machineId = 'AA:BB:CC:DD:EE:FF';      // MAC adresa stroje
const machineName = 'Development-Workstation';

const connection = ApiConnection.create(
  serviceUrl,
  username,
  passwordHash,
  appVersion,
  machineId,
  machineName,
  (err) => console.error('Chyba připojení:', err)
);
```

### CORS konfigurace pro webové aplikace

Pro webové aplikace běžící na jiné doméně než eWay-CRM server je nutné nakonfigurovat CORS v `web.config`:

```xml
<add key="AccessControlAllowOrigin" value="https://YOUR-ORIGIN:PORT" />
```

**Upozornění:** CORS konfigurace může způsobovat problémy s Internet Explorer v Administration Center.

## API dokumentace

### Hlavní třída ApiConnection

#### Metoda create()

Vytváří novou instanci připojení k eWay-CRM.

```typescript
ApiConnection.create(
  serviceUrl: string,
  username: string, 
  passwordHash: string,
  appVersionIdentifier: string,
  clientMachineIdentifier: string,
  clientMachineName: string,
  errorCallback: (error: any) => void
): ApiConnection
```

**Parametry:**
- `serviceUrl`: URL adresa webové služby eWay-CRM
- `username`: Uživatelské jméno
- `passwordHash`: **MD5 hash hesla** uživatele
- `appVersionIdentifier`: Identifikátor aplikace s alfanumerickými znaky
- `clientMachineIdentifier`: Jedinečný identifikátor stroje (např. MAC adresa)
- `clientMachineName`: Čitelný název klientského stroje
- `errorCallback`: Funkce volaná při neočekávaných chybách

#### Metoda callMethod()

Hlavní metoda pro volání eWay-CRM API.

```typescript
callMethod(
  methodName: string,
  parameters: {
    transmitObject?: any,
    [key: string]: any
  },
  callback: (result: ApiResult) => void
): void
```

### Dostupné API metody

#### Správa uživatelů

```javascript
// Vyhledávání uživatelů
connection.callMethod('SearchUsers', {
  transmitObject: { Username: 'admin' }
}, (result) => {
  if (result.ReturnCode === 'rcSuccess') {
    console.log('Nalezení uživatelé:', result.Data);
  }
});
```

#### Operace s položkami

**Získání položek podle GUID:**
```javascript
connection.callMethod('GetItemsByItemGuids', {
  transmitObject: {
    folderName: 'Companies',
    itemGuids: ['guid1', 'guid2']
  }
}, handleResponse);
```

**Vyhledávání položek:**
```javascript
connection.callMethod('SearchItems', {
  transmitObject: {
    folderName: 'Contacts',
    searchFields: { FirstName: 'Jan' },
    maxRecords: 50
  }
}, handleResponse);
```

**Uložení položky:**
```javascript
connection.callMethod('SaveItem', {
  transmitObject: {
    folderName: 'Companies',
    itemData: {
      CompanyName: 'ACME s.r.o.',
      Phone: '+420 123 456 789',
      Email: 'info@acme.cz'
    }
  }
}, handleResponse);
```

#### Moduly eWay-CRM

**Konstanty názvů modulů:**
- `Companies` - Společnosti
- `Contacts` - Kontakty  
- `Deals` - Obchody
- `Projects` - Projekty
- `Tasks` - Úkoly
- `Journals` - Deníky
- `Documents` - Dokumenty
- `Users` - Uživatelé

## Praktické příklady použití

### Vytvoření nové společnosti

```javascript
async function vytvorSpolecnost() {
  return new Promise((resolve, reject) => {
    const novaSpolecnost = {
      CompanyName: 'Demo Company s.r.o.',
      FileAs: 'Demo Company s.r.o.',
      Phone: '+420 123 456 789',
      Email: 'info@demo.cz',
      // Dodatečná pole
      AdditionalFields: {
        cf_ICO: '12345678',
        cf_DIC: 'CZ12345678'
      }
    };

    connection.callMethod('SaveItem', {
      transmitObject: {
        folderName: 'Companies',
        itemData: novaSpolecnost
      }
    }, (result) => {
      if (result.ReturnCode === 'rcSuccess') {
        console.log('Společnost vytvořena:', result.Data[0]);
        resolve(result.Data[0]);
      } else {
        console.error('Chyba:', result.Description);
        reject(new Error(result.Description));
      }
    });
  });
}
```

### Propojení kontaktu se společností

```javascript
async function vytvorKontaktProSpolecnost(companyGuid) {
  const novyKontakt = {
    FirstName: 'Jan',
    LastName: 'Novák', 
    Email1Address: 'jan.novak@demo.cz',
    Phone: '+420 987 654 321',
    CompanyGUID: companyGuid  // Propojení se společností
  };

  return new Promise((resolve, reject) => {
    connection.callMethod('SaveItem', {
      transmitObject: {
        folderName: 'Contacts',
        itemData: novyKontakt
      }
    }, (result) => {
      if (result.ReturnCode === 'rcSuccess') {
        resolve(result.Data[0]);
      } else {
        reject(new Error(result.Description));
      }
    });
  });
}
```

### Aktualizace existující položky

```javascript
async function aktualizujSpolecnost(itemGuid, updates, itemVersion) {
  const updateData = {
    ItemGUID: itemGuid,
    ItemVersion: itemVersion,  // Pro řešení konfliktů
    ...updates
  };

  return new Promise((resolve, reject) => {
    connection.callMethod('SaveItem', {
      transmitObject: {
        folderName: 'Companies',
        itemData: updateData
      }
    }, (result) => {
      if (result.ReturnCode === 'rcSuccess') {
        resolve(result.Data[0]);
      } else {
        reject(new Error(result.Description));
      }
    });
  });
}

// Použití
await aktualizujSpolecnost('company-guid', {
  CompanyName: 'Aktualizovaný název',
  Phone: '+420 111 222 333'
}, 2);
```

### Komplexní CRUD manager

```javascript
class EWayCRMManager {
  constructor(serviceUrl, username, passwordHash) {
    this.connection = ApiConnection.create(
      serviceUrl,
      username,
      passwordHash,
      'CRMApp1.0',
      '00:00:00:00:00:00',
      'JS-Client',
      (err) => console.error('Chyba připojení:', err)
    );
  }

  // Promise wrapper pro API volání
  callAPI(method, params) {
    return new Promise((resolve, reject) => {
      this.connection.callMethod(method, params, (result) => {
        if (result.ReturnCode === 'rcSuccess') {
          resolve(result.Data);
        } else {
          reject(new Error(`${result.ReturnCode}: ${result.Description}`));
        }
      });
    });
  }

  // CREATE - Vytvoření nové položky
  async create(folderName, itemData) {
    return await this.callAPI('SaveItem', {
      transmitObject: { folderName, itemData }
    });
  }

  // READ - Čtení položek
  async search(folderName, searchFields, maxRecords = 100) {
    return await this.callAPI('SearchItems', {
      transmitObject: { folderName, searchFields, maxRecords }
    });
  }

  // UPDATE - Aktualizace položky
  async update(folderName, itemGuid, updates, itemVersion) {
    const itemData = {
      ItemGUID: itemGuid,
      ItemVersion: itemVersion,
      ...updates
    };
    
    return await this.callAPI('SaveItem', {
      transmitObject: { folderName, itemData }
    });
  }

  // DELETE - Smazání (označení jako smazané)
  async delete(folderName, itemGuid, itemVersion) {
    return await this.update(folderName, itemGuid, {
      IsDeleted: true
    }, itemVersion);
  }

  // Získání změn pro synchronizaci
  async getChanges(folderNames, fromChangeId, toChangeId) {
    return await this.callAPI('GetChangedItems', {
      transmitObject: {
        folderNames,
        baseChangeId: fromChangeId,
        targetChangeId: toChangeId,
        includeForeignKeys: true
      }
    });
  }
}

// Použití CRM manageru
const crm = new EWayCRMManager(
  'https://trial.eway-crm.com/31994',
  'api',
  '470AE7216203E23E1983EF1851E72947'
);

// Demonstrace použití
async function demo() {
  try {
    // Vytvoření společnosti
    const company = await crm.create('Companies', {
      CompanyName: 'Tech Solutions s.r.o.',
      Phone: '+420 123 456 789'
    });

    console.log('Společnost vytvořena:', company[0]);

    // Vyhledání společností
    const companies = await crm.search('Companies', {
      CompanyName: 'Tech'
    });

    console.log('Nalezené společnosti:', companies);

  } catch (error) {
    console.error('Chyba:', error.message);
  }
}
```

## Konfigurace možností

### Struktura objektu ApiResult

```typescript
interface ApiResult {
  ReturnCode: string;        // 'rcSuccess' pro úspěch
  Description: string;       // Popis výsledku
  Data: any[];              // Pole s daty
  TotalCount?: number;      // Celkový počet záznamů
  ErrorMessage?: string;    // Chybová zpráva
}
```

### Správa verzí položek (ItemVersion)

eWay-CRM používá **ItemVersion** pro řešení konfliktů při současných úpravách:

```javascript
// Automatické řešení konfliktů (doporučeno)
const itemData = {
  ItemGUID: 'existing-guid',
  CompanyName: 'Nový název'
  // ItemVersion vynecháme - API automaticky vyřeší konflikty
};

// Manuální kontrola verzí
const itemData = {
  ItemGUID: 'existing-guid',
  ItemVersion: 3,  // Konkrétní verze
  CompanyName: 'Nový název'
};
```

### Dodatečná pole (Additional Fields)

```javascript
const itemWithCustomFields = {
  CompanyName: 'ACME s.r.o.',
  AdditionalFields: {
    cf_ICO: '12345678',           // IČO společnosti
    cf_DIC: 'CZ12345678',         // DIČ společnosti
    cf_CustomField: 'Hodnota'     // Vlastní pole
  }
};
```

## Zpracování chyb

### Centrální error handling

```javascript
const connection = ApiConnection.create(
  // ... ostatní parametry
  (err) => {
    console.error('Kritická chyba připojení:', err);
    
    // Implementace vlastní logiky
    if (err.code === 'NETWORK_ERROR') {
      // Síťová chyba - zkusit znovu
      retryConnection();
    } else if (err.code === 'AUTH_ERROR') {
      // Chyba autentifikace - přesměrovat na login
      redirectToLogin();
    }
  }
);
```

### Typy chyb a jejich řešení

**Chyby autentifikace:**
```javascript
// rcWrongLogin, rcUserAccountDisabled, rcWrongPassword
if (result.ReturnCode.startsWith('rcWrong') || 
    result.ReturnCode === 'rcUserAccountDisabled') {
  console.error('Problém s přihlášením:', result.Description);
  // Zkontrolujte username, passwordHash a oprávnění účtu
}
```

**Session chyby:**
```javascript
// "Too many sessions" - častá chyba
if (result.Description.includes('Too many sessions')) {
  console.error('Příliš mnoho sessions. Používejte jednu instanci ApiConnection.');
  // Řešení: Ukončete nepoužívané session nebo restartujte službu
}
```

**Konflikt verzí:**
```javascript
if (result.ReturnCode === 'rcItemConflict') {
  console.log('Konflikt verzí - API automaticky sloučí změny');
  // eWay-CRM automaticky řeší většinu konfliktů
}
```

### Implementace retry mechanismu

```javascript
class RobustApiClient {
  constructor(connection) {
    this.connection = connection;
    this.maxRetries = 3;
  }

  async callWithRetry(method, params) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.promisifiedCall(method, params);
      } catch (error) {
        console.warn(`Pokus ${attempt} selhal:`, error.message);
        
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await this.sleep(delay);
        } else {
          throw error; // Poslední pokus selhal
        }
      }
    }
  }

  promisifiedCall(method, params) {
    return new Promise((resolve, reject) => {
      this.connection.callMethod(method, params, (result) => {
        if (result.ReturnCode === 'rcSuccess') {
          resolve(result.Data);
        } else {
          reject(new Error(`${result.ReturnCode}: ${result.Description}`));
        }
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Nejlepší praktiky

### Session management

```javascript
// ✅ Správně - jedna instance pro celou aplikaci
const globalConnection = ApiConnection.create(/* ... */);

// Použijte ji pro všechna API volání
globalConnection.callMethod('SearchUsers', /* ... */);
globalConnection.callMethod('GetItems', /* ... */);

// ❌ Špatně - vytváření nových instancí
// Způsobuje "Too many sessions" chybu
```

### Bezpečnostní doporučení

**Ochrana přihlašovacích údajů:**
```javascript
// ❌ Nikdy neukládejte hesla v plain textu
const password = 'plainPassword123';

// ✅ Používejte MD5 hash
const crypto = require('crypto');
const passwordHash = crypto
  .createHash('md5')
  .update('plainPassword123', 'utf8')
  .digest('hex');
```

**Validace vstupních dat:**
```javascript
function validateAndSanitize(data) {
  // Validace povinných polí
  if (!data.CompanyName || data.CompanyName.trim() === '') {
    throw new Error('CompanyName je povinné pole');
  }

  // Sanitizace vstupů
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      data[key] = data[key].trim();
      
      // Odstranění nebezpečných znaků
      data[key] = data[key].replace(/[<>]/g, '');
    }
  });

  return data;
}
```

### Performance optimalizace

**Batch operace pro velké množství dat:**
```javascript
async function batchCreateContacts(contacts) {
  const batchSize = 50; // Zpracovávat po 50 položkách
  const results = [];

  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize);
    
    const batchPromises = batch.map(contact => 
      crm.create('Contacts', contact)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Pauza mezi batchi
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}
```

**Monitorování výkonu:**
```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  startTimer(operation) {
    this.metrics.set(operation, { startTime: Date.now() });
  }

  endTimer(operation) {
    const metric = this.metrics.get(operation);
    if (metric) {
      metric.duration = Date.now() - metric.startTime;
      console.log(`${operation} trval ${metric.duration}ms`);
    }
  }

  getStats() {
    return Array.from(this.metrics.entries())
      .map(([operation, data]) => ({
        operation,
        duration: data.duration
      }));
  }
}

// Použití
const monitor = new PerformanceMonitor();

monitor.startTimer('SearchCompanies');
const companies = await crm.search('Companies', { CompanyName: 'Test' });
monitor.endTimer('SearchCompanies');
```

## Integrace s Microsoft Account

Pro **Microsoft Account Authentication** je nutné implementovat vlastní OAuth2 klienta, protože knihovna nepodporuje automatickou Microsoft autentifikaci:

```javascript
// Příklad OAuth2 konfigurace (vyžaduje vlastní implementaci)
const oauthConfig = {
  clientId: 'your-azure-app-id',
  clientSecret: 'your-azure-app-secret',
  redirectUri: 'https://your-app.com/oauth/callback',
  scope: 'openid profile email'
};

// OAuth2 tok musí být implementován mimo eWay-CRM knihovnu
async function authenticateWithMicrosoft() {
  // 1. Přesměrování na Microsoft OAuth
  // 2. Získání authorization code
  // 3. Výměna za access token
  // 4. Použití tokenu pro eWay-CRM API
}
```

## Troubleshooting

### Časté problémy a řešení

**Problem: CORS chyby v browseru**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Řešení:**
1. Nakonfigurujte CORS v eWay-CRM web.config
2. Nebo používejte server-side proxy
3. Nebo deployujte aplikaci na stejnou doménu

**Problem: "Too many sessions"**
```
ReturnCode: rcSessionError
Description: Too many sessions
```
**Řešení:**
- Používejte jednu instanci `ApiConnection`
- Volitelně implementujte connection pooling
- Ukončete sessions voláním `logOut()` metody

**Problem: Pomalé API odpovědi**
**Diagnostika:**
- Zkontrolujte síťové připojení
- Ověřte zátěž eWay-CRM serveru
- Analyzujte velikost přenášených dat
- Použijte browser dev tools pro network monitoring

**Problem: ItemVersion konflikty**
```
ReturnCode: rcItemConflict
```
**Řešení:**
- Vynechejte `ItemVersion` pro automatické řešení
- Nebo implementujte vlastní conflict resolution logiku

### Debug mode

```javascript
// Zapnutí podrobného logování
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  const originalCallMethod = connection.callMethod;
  connection.callMethod = function(method, params, callback) {
    console.log(`🚀 API Call: ${method}`, params);
    const startTime = Date.now();
    
    return originalCallMethod.call(this, method, params, (result) => {
      const duration = Date.now() - startTime;
      console.log(`✅ API Response (${duration}ms):`, {
        method,
        returnCode: result.ReturnCode,
        dataCount: result.Data?.length || 0
      });
      
      if (result.ReturnCode !== 'rcSuccess') {
        console.error(`❌ API Error:`, result);
      }
      
      callback(result);
    });
  };
}
```

## Další zdroje

**Oficiální dokumentace:**
- GitHub repository: https://github.com/eway-crm/js-lib
- NPM balíček: `@eway-crm/connector`
- Swagger API dokumentace: `/WcfService/Service.svc/help` na vaší eWay-CRM instanci

**Komunitní zdroje:**
- eWay-CRM Development Center
- Postman kolekce pro testování API
- Code samples a tutoriály

**Související knihovny:**
- `@eway-crm/gui` - React komponenty pro webové projekty
- PHP knihovna: `eway-crm/php-lib`
- C# knihovna: `eWayCRM.API` NuGet balíček

---

Tato dokumentace pokrývá všechny klíčové aspekty práce s eWay-CRM JavaScript knihovnou. Pro nejnovější informace a aktualizace API doporučujeme pravidelně konzultovat oficiální GitHub repository a Swagger dokumentaci na vaší eWay-CRM instanci.