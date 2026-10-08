import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

// Compartilha uma única tentativa de login entre componentes,
// impedindo pop-ups concorrentes.
let tentativa: ReturnType<typeof signInWithPopup> | null = null;

export function loginGoogleUmaVez(): ReturnType<typeof signInWithPopup> {
  if (tentativa !== null) return tentativa;

  const login = signInWithPopup(auth, googleProvider);
  tentativa = login;
  void login.then(
    () => { if (tentativa === login) tentativa = null; },
    () => { if (tentativa === login) tentativa = null; }
  );
  return login;
}
