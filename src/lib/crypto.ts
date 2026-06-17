/**
 * AES-256-GCM client-side encryption for at-rest data protection.
 *
 * Key lifecycle:
 *   login → GET /api/auth/encryption-key → sessionStorage("expenstream-ek")
 *   logout → sessionStorage.removeItem("expenstream-ek")
 *
 * Encrypted payloads are stored as base64 strings: `iv:ciphertext`
 */

const EK_SESSION_KEY = "expenstream-ek";
const ALGO = "AES-GCM";
const IV_BYTES = 12; // 96-bit IV recommended for GCM

// ── Key Management ──

let _cachedKey: CryptoKey | null = null;

/** Import a raw base64 secret into a CryptoKey, caching in memory. */
async function importKey(rawB64: string): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;
  const raw = Uint8Array.from(atob(rawB64), (c) => c.charCodeAt(0));
  _cachedKey = await crypto.subtle.importKey("raw", raw, { name: ALGO }, false, [
    "encrypt",
    "decrypt",
  ]);
  return _cachedKey;
}

/** Store base64 key in sessionStorage (cleared on tab close). */
export function storeEncryptionKey(keyB64: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(EK_SESSION_KEY, keyB64);
  _cachedKey = null; // force re-import on next use
}

/** Clear the encryption key from sessionStorage and memory. */
export function clearEncryptionKey(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(EK_SESSION_KEY);
  _cachedKey = null;
}

/** Get the stored key string, or null if missing. */
function getStoredKeyB64(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(EK_SESSION_KEY);
}

/** Check whether an encryption key is available in this session. */
export function hasEncryptionKey(): boolean {
  return getStoredKeyB64() !== null;
}

// ── Encrypt / Decrypt ──

/**
 * Encrypt a plaintext string. Returns `base64(iv):base64(ciphertext)`.
 * Returns the original string if no encryption key is available (graceful degradation).
 */
export async function encryptString(plaintext: string): Promise<string> {
  const keyB64 = getStoredKeyB64();
  if (!keyB64) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[crypto] encryptString called without an encryption key — storing plaintext (migration fallback).",
      );
    }
    return plaintext;
  }
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded);

  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuf)));
  return `enc:${ivB64}:${ctB64}`;
}

/**
 * Decrypt a string produced by `encryptString`. If the string doesn't
 * start with `enc:`, it's assumed to be plaintext (migration-friendly).
 */
export async function decryptString(payload: string): Promise<string> {
  if (!payload.startsWith("enc:")) return payload;

  const keyB64 = getStoredKeyB64();
  if (!keyB64) return payload; // can't decrypt without key

  const parts = payload.split(":");
  if (parts.length !== 3) return payload;

  const key = await importKey(keyB64);
  const iv = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));

  const plainBuf = await crypto.subtle.decrypt({ name: ALGO, iv }, key, ct);
  return new TextDecoder().decode(plainBuf);
}

// ── JSON helpers ──

/** Encrypt a JSON-serializable object. */
export async function encryptJSON(obj: unknown): Promise<string> {
  return encryptString(JSON.stringify(obj));
}

/** Decrypt a string back into a parsed JSON object. */
export async function decryptJSON<T = unknown>(payload: string): Promise<T> {
  const plain = await decryptString(payload);
  return JSON.parse(plain) as T;
}
