
import CryptoJS from 'crypto-js';
import { getCachedSecure, setCachedSecure } from './secureStorageService';

function getUserDerivedKey(): string {
  const stored = getCachedSecure('_enc_dk');
  if (stored) return stored;
  const key = CryptoJS.lib.WordArray.random(32).toString();
  setCachedSecure('_enc_dk', key);
  return key;
}

const SECRET_KEY = getUserDerivedKey();

export const encryptData = (data: any): string => {
  const dataString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(dataString, SECRET_KEY).toString();
};

export const decryptData = <T,>(encryptedData: string): T | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) {
      return null;
    }
    return JSON.parse(decryptedString) as T;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

export const setSecureItem = (key: string, value: any) => {
  const encryptedValue = encryptData(value);
  localStorage.setItem(key, encryptedValue);
};

export const getSecureItem = <T,>(key: string): T | null => {
  const encryptedValue = localStorage.getItem(key);
  if (!encryptedValue) {
    return null;
  }
  return decryptData<T>(encryptedValue);
};
