
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration is read from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase using a robust singleton pattern
let app: FirebaseApp;
if (getApps().length === 0) {
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase API Key is missing. Check your environment variables.");
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
let analytics: Analytics | null = null;

// Set auth language to Arabic
if (auth) {
  auth.languageCode = 'ar';
}

const initializeAnalytics = async () => {
    if (typeof window !== 'undefined') {
        const isAnalyticsSupported = await isSupported();
        if (isAnalyticsSupported && !analytics) {
            analytics = getAnalytics(app);
        }
    }
    return analytics;
};


export { app, auth, db, storage, analytics, initializeAnalytics };
