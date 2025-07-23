// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "wassel-telerehab",
  "appId": "1:279555875363:web:f643d98561fddc495bc796",
  "storageBucket": "wassel-telerehab.firebasestorage.app",
  "apiKey": "AIzaSyCQgNa2YXS-5Wp1wAITyNg8f-FEhfm984Q",
  "authDomain": "wassel-telerehab.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "279555875363"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
