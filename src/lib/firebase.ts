
import { initializeApp } from 'firebase/app';
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "REDACTED_FIREBASE_API_KEY",
  authDomain: "pandastracker.firebaseapp.com",
  projectId: "pandastracker",
  storageBucket: "pandastracker.firebasestorage.app",
  messagingSenderId: "REDACTED_SENDER_ID",
  appId: "REDACTED_FIREBASE_APP_ID",
  measurementId: "REDACTED_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);

let analytics: Analytics | null = null;
if (!Capacitor.isNativePlatform() && typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export { analytics };
