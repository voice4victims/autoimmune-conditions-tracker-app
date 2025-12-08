
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAEfYZd7XX7RNNVKsx2YKTfNums_Ewcu_4",
  authDomain: "autoimmune-tracking.firebaseapp.com",
  projectId: "autoimmune-tracking",
  storageBucket: "autoimmune-tracking.firebasestorage.app",
  messagingSenderId: "501064300574",
  appId: "1:501064300574:web:831fee862c15f9fac9960f",
  measurementId: "G-FYJPCJ58VS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export { analytics };
