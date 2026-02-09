/**
 * Client-side AES-GCM helpers for encrypting and decrypting JSON exports with PBKDF2 keys.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const PBKDF2_ITERATIONS = 150_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

/** Encodes binary data into a base64 string. */
function toBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  // Process in chunks to avoid call stack limits on large arrays (65k+ bytes)
  const CHUNK_SIZE = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/** Decodes a base64 string back into a byte array. */
function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/** Derives an AES-GCM key using PBKDF2 with the provided passphrase and salt. */
async function deriveKey(passphrase: string, salt: BufferSource): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Encrypts a JSON payload and returns a serialised envelope (including salt/iv). */
export async function encryptExport(payload: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt.slice());
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(payload));
  return JSON.stringify({ v: 1, s: toBase64(salt), i: toBase64(iv), d: toBase64(cipher) });
}

/** Decrypts a previously serialized export using the same passphrase. */
export async function decryptExport(serialized: string, passphrase: string): Promise<string> {
  try {
    const parsed = JSON.parse(serialized);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.s !== 'string' ||
      typeof parsed.i !== 'string' ||
      typeof parsed.d !== 'string'
    ) {
      throw new Error('missing fields');
    }
    const salt = fromBase64(parsed.s);
    const iv = fromBase64(parsed.i);
    const key = await deriveKey(passphrase, salt.slice());
    const encrypted = fromBase64(parsed.d);
    const buffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.slice() },
      key,
      encrypted.slice()
    );
    return decoder.decode(buffer);
  } catch {
    throw new Error('Invalid file or passphrase.');
  }
}
