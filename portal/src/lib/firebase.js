import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAZaS-k3UaFplZrVY4_C7icF-0hgi-AaFg",
  authDomain: "sobradao360.firebaseapp.com",
  projectId: "sobradao360",
  storageBucket: "sobradao360.firebasestorage.app",
  messagingSenderId: "347059664490",
  appId: "1:347059664490:web:141a8034bab79f902a3c13",
  measurementId: "G-D5J6EDH39Q"
};

// Inicializa o Firebase apenas 1 vez (evita erros de duplicação no Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializa o Analytics apenas no navegador (evita erros no servidor)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((yes) => yes && (analytics = getAnalytics(app)));
}

// Exporta o Banco de Dados e a Autenticação para usarmos no resto do site
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };