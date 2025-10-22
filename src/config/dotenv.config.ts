import dotenv from 'dotenv';
import { resolve } from 'path';

// Načtení proměnných prostředí z working directory
// Tento soubor musí být importován PRVNÍ před všemi ostatními!

// Načteme .env z working directory (odkud se spouští příkaz)
const envPath = resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });

// DŮLEŽITÉ: Pokud máme ENV proměnné s prefixem MCP_API_*, odstraníme prefix
// Toto umožňuje použít stejnou konfiguraci jako v Claude Desktop
Object.keys(process.env).forEach(key => {
  if (key.startsWith('MCP_API_')) {
    const newKey = key.substring(8); // Odstraní "MCP_API_"
    process.env[newKey] = process.env[key];

    // Debug logging jen pokud není production a není MCP mód
    if (process.env.NODE_ENV !== 'production' && process.env.MCP_MODE !== 'true') {
      console.error(`[dotenv] Přemapováno: ${key} -> ${newKey}`);
    }
  }
});

// Debug logging pokud není production a není MCP mód
// V MCP módu NESMÍ nic jít na stdout/stderr mimo JSON-RPC!
if (process.env.NODE_ENV !== 'production' && process.env.MCP_MODE !== 'true') {
  console.error('[dotenv] Working directory:', process.cwd());
  console.error('[dotenv] .env path:', envPath);
  console.error('[dotenv] Loaded successfully:', !result.error);
  if (result.error) {
    console.error('[dotenv] Warning:', result.error.message);
  }
  console.error('[dotenv] Has EWAY_CLIENT_ID:', !!process.env.EWAY_CLIENT_ID);
  console.error('[dotenv] Has EWAY_CLIENT_SECRET:', !!process.env.EWAY_CLIENT_SECRET);
  console.error('[dotenv] Has EWAY_API_URL:', !!process.env.EWAY_API_URL);
}

export default dotenv;