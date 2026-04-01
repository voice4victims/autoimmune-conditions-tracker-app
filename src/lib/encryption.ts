const DB_NAME = '_enc_store';
const STORE_NAME = 'keys';
const KEY_ID = 'master';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getOrCreateKey(): Promise<CryptoKey> {
  const db = await openDB();

  const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(KEY_ID);
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
    req.onerror = () => reject(req.error);
  });

  if (existing) {
    db.close();
    return existing;
  }

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(key, KEY_ID);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  db.close();
  return key;
}

let cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  cachedKey = await getOrCreateKey();
  return cachedKey;
}

export const encryptData = async (data: any): Promise<string> => {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
};

export const decryptData = async <T,>(encryptedData: string): Promise<T | null> => {
  try {
    const key = await getKey();
    const raw = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = raw.slice(0, 12);
    const ciphertext = raw.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(decrypted)) as T;
  } catch {
    return null;
  }
};

export const setSecureItem = async (key: string, value: any): Promise<void> => {
  const encrypted = await encryptData(value);
  localStorage.setItem(key, encrypted);
};

export const getSecureItem = async <T,>(key: string): Promise<T | null> => {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;
  return decryptData<T>(encrypted);
};
