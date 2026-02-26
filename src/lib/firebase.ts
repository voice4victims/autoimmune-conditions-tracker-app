
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBlGsSeqm6JsGbt_-60pfMJ4EVrasvXpzI",
  authDomain: "pandastracker.firebaseapp.com",
  projectId: "pandastracker",
  storageBucket: "pandastracker.firebasestorage.app",
  messagingSenderId: "762054249819",
  appId: "1:762054249819:web:9533358b27a47fb7d21e7e",
  measurementId: "G-VEK2EPF1Y6"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export { analytics };
