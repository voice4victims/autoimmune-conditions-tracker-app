
import CryptoJS from 'crypto-js';

function getUserDerivedKey(): string {
  const stored = localStorage.getItem('_enc_dk');
  if (stored) return stored;
  const key = CryptoJS.lib.WordArray.random(32).toString();
  localStorage.setItem('_enc_dk', key);
  return key;
}

const SECRET_KEY = getUserDerivedKey();

/**
 * Encrypts data using AES encryption.
 * @param data - The data to encrypt (can be any serializable object).
 * @returns The encrypted string.
 */
export const encryptData = (data: any): string => {
  const dataString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(dataString, SECRET_KEY).toString();
};

/**
 * Decrypts data that was encrypted with AES.
 * @param encryptedData - The encrypted string.
 * @returns The decrypted data (or null if decryption fails).
 */
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

/**
 * A secure replacement for localStorage.setItem that encrypts data.
 * @param key - The key to store the data under.
 * @param value - The data to store (can be any serializable object).
 */
export const setSecureItem = (key: string, value: any) => {
  const encryptedValue = encryptData(value);
  localStorage.setItem(key, encryptedValue);
};

/**
 * A secure replacement for localStorage.getItem that decrypts data.
 * @param key - The key to retrieve the data from.
 * @returns The decrypted data (or null if not found or decryption fails).
 */
export const getSecureItem = <T,>(key: string): T | null => {
  const encryptedValue = localStorage.getItem(key);
  if (!encryptedValue) {
    return null;
  }
  return decryptData<T>(encryptedValue);
};
