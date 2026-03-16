import { Capacitor } from '@capacitor/core';
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { secureGet, secureSet, secureRemove } from './secureStorageService';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_UID_KEY = 'biometric_uid';

export async function isBiometricAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const result = await BiometricAuth.checkBiometry();
    return result.isAvailable;
  } catch {
    return false;
  }
}

export async function getBiometryType(): Promise<string> {
  if (!Capacitor.isNativePlatform()) return 'none';
  try {
    const result = await BiometricAuth.checkBiometry();
    switch (result.biometryType) {
      case BiometryType.touchId: return 'Touch ID';
      case BiometryType.faceId: return 'Face ID';
      case BiometryType.fingerprintAuthentication: return 'Fingerprint';
      case BiometryType.faceAuthentication: return 'Face Unlock';
      case BiometryType.irisAuthentication: return 'Iris';
      default: return 'Biometric';
    }
  } catch {
    return 'none';
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  const val = await secureGet(BIOMETRIC_ENABLED_KEY);
  return val === 'true';
}

export async function enableBiometric(uid: string): Promise<boolean> {
  try {
    await BiometricAuth.authenticate({ reason: 'Verify your identity to enable biometric login' });
    await secureSet(BIOMETRIC_ENABLED_KEY, 'true');
    await secureSet(BIOMETRIC_UID_KEY, uid);
    return true;
  } catch {
    return false;
  }
}

export async function disableBiometric(): Promise<void> {
  await secureRemove(BIOMETRIC_ENABLED_KEY);
  await secureRemove(BIOMETRIC_UID_KEY);
}

export async function authenticateWithBiometric(): Promise<string | null> {
  try {
    const enabled = await isBiometricEnabled();
    if (!enabled) return null;
    await BiometricAuth.authenticate({ reason: 'Sign in to PANDAS Tracker' });
    return await secureGet(BIOMETRIC_UID_KEY);
  } catch {
    return null;
  }
}
