
import { initializeApp } from 'firebase/app';
import { getAnalytics, setAnalyticsCollectionEnabled, type Analytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth, indexedDBLocalPersistence, browserLocalPersistence, initializeAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

let analytics: Analytics | null = null;

if (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) {
  if (import.meta.env.DEV) {
    // @ts-expect-error Debug token for local development
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
  }

  if (import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

export function initAnalytics(): void {
  if (Capacitor.isNativePlatform() || typeof window === 'undefined') return;
  if (localStorage.getItem('analytics_consent') !== 'granted') return;
  if (!analytics) {
    analytics = getAnalytics(app);
  }
  setAnalyticsCollectionEnabled(analytics, true);
}

export function disableAnalytics(): void {
  if (analytics) {
    setAnalyticsCollectionEnabled(analytics, false);
  }
}

// On native iOS, use browserLocalPersistence (localStorage) instead of the default
// indexedDBLocalPersistence which can hang in Capacitor's WKWebView
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: browserLocalPersistence })
  : getAuth(app);
export const db = Capacitor.isNativePlatform()
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
export const storage = getStorage(app);
export const functions = getFunctions(app);
export { analytics };
