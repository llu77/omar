
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// This function ensures that the firebase config is read only when needed
// and after the environment variables have been loaded.
const getFirebaseConfig = () => {
  const firebaseConfig = {
  "projectId": "wassel-telerehab",
  "appId": "1:279555875363:web:f643d98561fddc495bc796",
  "storageBucket": "wassel-telerehab.appspot.com",
  "apiKey": "AIzaSyCQgNa2YXS-5Wp1wAITyNg8f-FEhfm984Q",
  "authDomain": "wassel-telerehab.firebaseapp.com",
  "messagingSenderId": "279555875363"
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
