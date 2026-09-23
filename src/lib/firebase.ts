// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZaS-k3UaFplZrVY4_C7icF-0hgi-AaFg",
  authDomain: "sobradao360.firebaseapp.com",
  projectId: "sobradao360",
  storageBucket: "sobradao360.firebasestorage.app",
  messagingSenderId: "347059664490",
  appId: "1:347059664490:web:141a8034bab79f902a3c13",
  measurementId: "G-D5J6EDH39Q"
};

// Inicializa o Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export let analytics: any = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}