import { initializeApp, getApps } from "firebase/app";

/**
 * Prefer NEXT_PUBLIC_FIREBASE_* env vars. Fallbacks are the previous
 * client-side Firebase web config (safe to expose in the browser).
 */
export const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyCyHHobmWFRWb_ZnKhs3JXSCKdbTQaNHW8",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "examtracker-6731e.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "examtracker-6731e",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "examtracker-6731e.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "492165379080",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:492165379080:web:6c71aa16d2447f81348dbd",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-Z5B4SRV9H7",
};

export const app =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
