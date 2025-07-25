
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// This function ensures that the firebase config is read only when needed
// and after the environment variables have been loaded.
const getFirebaseConfig = () => {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  // Throw an error if the API key is missing, which is a common setup issue.
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase API Key is missing. Please check your .env.local file and ensure NEXT_PUBLIC_FIREBASE_API_KEY is set.");
  }

  return firebaseConfig;
};


// Initialize Firebase using a robust singleton pattern
const app: FirebaseApp = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApp();

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
let analytics: Analytics | null = null;

// Set auth language to Arabic
if (auth) {
  auth.languageCode = 'ar';
}

// Initialize analytics only on the client side and when needed
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
