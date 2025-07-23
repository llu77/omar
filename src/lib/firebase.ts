// @/lib/firebase.ts

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// تكوين Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCQgNa2YXS-5Wp1wAITyNg8f-FEhfm984Q",
  authDomain: "wassel-telerehab.firebaseapp.com",
  projectId: "wassel-telerehab",
  storageBucket: "wassel-telerehab.firebasestorage.app",
  messagingSenderId: "279555875363",
  appId: "1:279555875363:web:f643d98561fddc495bc796"
};

// التحقق من البيئة
console.log("Firebase Config:", {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  environment: process.env.NODE_ENV
});

let app;
let auth;
let db;

try {
  // تهيئة Firebase
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  } else {
    app = getApps()[0];
    console.log("Using existing Firebase app");
  }

  // تهيئة الخدمات
  auth = getAuth(app);
  db = getFirestore(app);

  // تعيين اللغة
  auth.languageCode = 'ar';

  console.log("Firebase services initialized");
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

export { app, auth, db };
export default app;