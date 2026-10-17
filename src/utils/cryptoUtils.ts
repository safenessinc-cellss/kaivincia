/**
 * Cifrado de identificadores en cliente.
 * NO cifra secretos reales: la clave maestra vive solo en backend.
 * Para cifrado de credenciales Telnyx, usa /api/telnyx/credentials/*.
 */

function getCryptoInstance(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  if (typeof globalThis !== 'undefined' && globalThis.crypto) return globalThis.crypto;
  throw new Error('Web Crypto API no disponible en este entorno.');
}

async function deriveKey(cryptoInst: Crypto, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  // Derivamos de un identificador público. No es secreto; sirve solo para ofuscar.
  const passphrase = 'kaivincia-ui-obfuscation-v1';
  const keyMaterial = await cryptoInst.subtle.importKey(
    'raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return cryptoInst.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as any, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  const c = getCryptoInstance();
  const enc = new TextEncoder();
  const salt = c.getRandomValues(new Uint8Array(16));
  const iv = c.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(c, salt);
  const buf = await c.subtle.encrypt({ name: 'AES-GCM', iv: iv as any }, key, enc.encode(plaintext));
  const hex = (u: Uint8Array) => Array.from(u).map(b => b.toString(16).padStart(2, '0')).join('');
  return `ENC_UI_V1:${hex(salt)}:${hex(iv)}:${hex(new Uint8Array(buf))}`;
}

export async function decryptData(str: string): Promise<string> {
  if (!str) return '';
  // Compatibilidad con el formato viejo ENC_V1 (credenciales ya cifradas)
  if (str.startsWith('ENC_V1:')) {
    throw new Error('Credencial cifrada con formato antiguo. Debe migrarse en backend.');
  }
  if (!str.startsWith('ENC_UI_V1:')) return str;
  const parts = str.split(':');
  if (parts.length !== 4) throw new Error('Formato ENC_UI_V1 inválido.');
  const [, saltHex, ivHex, cipherHex] = parts;
  const toBytes = (h: string) => new Uint8Array(h.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || []);
  const c = getCryptoInstance();
  const key = await deriveKey(c, toBytes(saltHex));
  const buf = await c.subtle.decrypt({ name: 'AES-GCM', iv: toBytes(ivHex) as any }, key, toBytes(cipherHex));
  return new TextDecoder().decode(buf);
}

export function maskSensitiveKey(val?: string, visibleChars = 4): string {
  if (!val) return '••••••••••••';
  if (val.length <= visibleChars * 2) return '••••••••••••';
  return `${val.slice(0, visibleChars)}••••••••${val.slice(-visibleChars)}`;
}
