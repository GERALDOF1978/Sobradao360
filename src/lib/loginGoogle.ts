import { signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

// Login por redirecionamento evita pop-ups bloqueados e pedidos concorrentes.
// A URL atual, inclusive ?solicitacao=..., é preservada pelo navegador.
let iniciando = false;

export async function loginGoogleUmaVez(): Promise<void> {
  if (iniciando) return;
  iniciando = true;
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (erro) {
    iniciando = false;
    throw erro;
  }
}
