import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

const isNative = () => Capacitor.isNativePlatform();

export async function secureSet(key: string, value: string): Promise<void> {
  if (isNative()) {
    await SecureStoragePlugin.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

export async function secureGet(key: string): Promise<string | null> {
  if (isNative()) {
    try {
      const result = await SecureStoragePlugin.get({ key });
      return result.value;
    } catch {
      return null;
    }
  }
  return localStorage.getItem(key);
}

export async function secureRemove(key: string): Promise<void> {
  if (isNative()) {
    try {
      await SecureStoragePlugin.remove({ key });
    } catch {
      // key didn't exist
    }
  } else {
    localStorage.removeItem(key);
  }
}

export function secureSetSync(key: string, value: string): void {
  if (isNative()) {
    SecureStoragePlugin.set({ key, value }).catch(() => {});
  } else {
    localStorage.setItem(key, value);
  }
}

export function secureGetSync(key: string): string | null {
  if (!isNative()) {
    return localStorage.getItem(key);
  }
  return null;
}

let _keyCache: Record<string, string> = {};

export async function initSecureStorage(): Promise<void> {
  if (!isNative()) return;
  const keys = ['_enc_dk', '_crypto_mk', 'currentUserId', 'currentSessionId'];
  for (const key of keys) {
    try {
      const result = await SecureStoragePlugin.get({ key });
      _keyCache[key] = result.value;
    } catch {
      // not stored yet
    }
  }
}

export function getCachedSecure(key: string): string | null {
  if (isNative()) {
    return _keyCache[key] ?? null;
  }
  return localStorage.getItem(key);
}

export function setCachedSecure(key: string, value: string): void {
  if (isNative()) {
    _keyCache[key] = value;
    SecureStoragePlugin.set({ key, value }).catch(() => {});
  } else {
    localStorage.setItem(key, value);
  }
}

export function removeCachedSecure(key: string): void {
  if (isNative()) {
    delete _keyCache[key];
    SecureStoragePlugin.remove({ key }).catch(() => {});
  } else {
    localStorage.removeItem(key);
  }
}
