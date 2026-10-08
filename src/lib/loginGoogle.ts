import { signInWithPopup, type UserCredential } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

// Compartilha uma única tentativa de login entre componentes e evita que
// chamadas simultâneas cancelem a janela do Google umas das outras.
let tentativa: Promise<UserCredential> | null = null;

export function loginGoogleUmaVez(): Promise<UserCredential> {
  if (tentativa) return tentativa;
  tentativa = signInWithPopup(auth, googleProvider).finally(() => {
    tentativa = null;
  });
  return tentativa;
}
