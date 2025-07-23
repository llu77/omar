import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQgNa2YXS-5Wp1wAITyNg8f-FEhfm984Q",
  authDomain: "wassel-telerehab.firebaseapp.com",
  projectId: "wassel-telerehab",
  storageBucket: "wassel-telerehab.firebasestorage.app",
  messagingSenderId: "279555875363",
  appId: "1:279555875363:web:f643d98561fddc495bc796"
};

// Initialize Firebase using a singleton pattern
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
let analytics: Analytics | null = null;

// Set auth language to Arabic
auth.languageCode = 'ar';

// Initialize Analytics only in the browser
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics };
