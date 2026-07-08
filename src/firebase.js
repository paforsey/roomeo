import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyAKgDFi9B8Sd4wXz3q9u-w1jR6oByHB_yM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "myroomeo-7a9cc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "myroomeo-7a9cc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "myroomeo-7a9cc.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "12645114821",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:12645114821:web:142d69e810da46285fa1ac",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-673TG19TX0",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
