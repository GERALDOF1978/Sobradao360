import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function adminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("Firebase Admin não configurado.");
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}
async function validarMaster(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return false;
  const app = adminApp();
  const decoded = await getAuth(app).verifyIdToken(token);
  const usuario = await getFirestore(app).collection("usuarios").doc(decoded.uid).get();
  return usuario.exists && usuario.data()?.perfil === "master";
}
export async function POST(request: NextRequest) {
  try {
    if (!(await validarMaster(request))) return NextResponse.json({ success: false, erro: "Acesso exclusivo do Master." }, { status: 403 });
    const corpo = await request.json();
    const fonte = typeof corpo?.fonte === "string" ? corpo.fonte.trim() : "";
    if (!fonte) return NextResponse.json({ success: false, erro: "Informe a fonte." }, { status: 400 });

    const db = getFirestore(adminApp());
    const snap = await db.collection("noticias_importadas").where("fonte", "==", fonte).get();
    const apagar = snap.docs.filter((doc) => doc.data()?.publicadoNoPortal !== true);
    const batch = db.batch();
    apagar.forEach((doc) => batch.delete(doc.ref));
    if (apagar.length) await batch.commit();

    return NextResponse.json({ success: true, excluidas: apagar.length });
  } catch (error) {
    return NextResponse.json({ success: false, erro: error instanceof Error ? error.message : "Não foi possível limpar as pendentes." }, { status: 500 });
  }
}
