// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA6Bitwcz1u3gfJbaBTDM8zknt5DO5RPD0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sobradao360-33f45.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sobradao360-33f45",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sobradao360-33f45.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "376694229495",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:376694229495:web:a427f5a8828898ad3fc6f2",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-F44M3M1D7D"
};

// Inicializa o Firebase de forma segura (evita múltiplas instâncias no Next.js)
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Exportando os módulos que o Sobradão 360 vai usar
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db: Firestore = getFirestore(app);

// Analytics roda apenas no lado do cliente (browser)
export let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}