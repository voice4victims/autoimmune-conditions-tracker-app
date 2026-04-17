import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const ENTITLEMENT_PRO = 'entitlement_pro';
const ENTITLEMENT_FAMILY = 'entitlement_family';

const getApiKey = (): string | null => {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return import.meta.env.VITE_REVENUECAT_APPLE_KEY || null;
  if (platform === 'android') return import.meta.env.VITE_REVENUECAT_GOOGLE_KEY || null;
  return null;
};

let configured = false;

export async function initRevenueCat(): Promise<boolean> {
  if (configured) return true;

  const apiKey = getApiKey();
  if (!apiKey) return false;

  try {
    if (import.meta.env.DEV) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }
    await Purchases.configure({ apiKey });
    configured = true;
    return true;
  } catch {
    return false;
  }
}

async function hashUid(uid: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`rc_${uid}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeRcId(uid: string): Promise<string> {
  return hashUid(uid);
}

export async function identifyUser(uid: string): Promise<string | null> {
  if (!configured) return null;
  try {
    const appUserID = await hashUid(uid);
    await Purchases.logIn({ appUserID });
    await setDoc(doc(db, 'users', uid), { rcId: appUserID }, { merge: true }).catch(() => {});
    return appUserID;
  } catch {
    return null;
  }
}

export async function isRcUserIdentified(expectedAppUserID: string): Promise<boolean> {
  if (!configured) return false;
  try {
    const { appUserID } = await Purchases.getAppUserID();
    return appUserID === expectedAppUserID;
  } catch {
    return false;
  }
}

export async function resetUser(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // silent
  }
}

export function isRevenueCatAvailable(): boolean {
  return Capacitor.isNativePlatform() && !!getApiKey();
}

export const TIER_LIMITS = {
  free: { maxCaregivers: 1, allowedRoles: ['viewer'] as const },
  pro: { maxCaregivers: 3, allowedRoles: ['viewer', 'caregiver'] as const },
  family: { maxCaregivers: Infinity, allowedRoles: ['viewer', 'caregiver', 'admin', 'parent'] as const },
} as const;

export { Purchases, ENTITLEMENT_PRO, ENTITLEMENT_FAMILY };
