import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQgNa2YXS-5Wp1wAITyNg8f-FEhfm984Q",
  authDomain: "wassel-telerehab.firebaseapp.com",
  projectId: "wassel-telerehab",
  storageBucket: "wassel-telerehab.firebasestorage.app",
  messagingSenderId: "279555875363",
  appId: "1:279555875363:web:f643d98561fddc495bc796"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized");
} else {
  app = getApp();
  console.log("Using existing Firebase app");
}

auth = getAuth(app);
db = getFirestore(app);
auth.languageCode = 'ar';

export { app, auth, db };
export default app;
