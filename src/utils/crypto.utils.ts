import { createHash } from 'crypto';

/**
 * Vytvoří MD5 hash z plaintext hesla pro eWay-CRM API
 * @param password - Heslo v plaintextu
 * @returns MD5 hash hesla ve formátu uppercase HEX
 */
export function createPasswordHash(password: string): string {
  return createHash('md5')
    .update(password)
    .digest('hex')
    .toUpperCase();
}

/**
 * Detekuje zda je hodnota již hashovaná (32 znakový HEX string)
 * @param value - Hodnota k ověření
 * @returns true pokud je hodnota MD5 hash
 */
export function isPasswordHash(value: string): boolean {
  // MD5 hash je 32 znakový hexadecimální string
  return /^[A-F0-9]{32}$/i.test(value);
}