import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function adminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("Firebase Admin não configurado no servidor.");
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
    if (!(await validarMaster(request))) {
      return NextResponse.json({ success: false, erro: "Acesso exclusivo do Master." }, { status: 403 });
    }

    const corpo = await request.json();
    const id = typeof corpo.id === "string" ? corpo.id.trim() : "";
    const acao = ["SALVAR", "PUBLICAR", "RETIRAR"].includes(corpo.acao) ? corpo.acao : "";
    const titulo = typeof corpo.titulo === "string" ? corpo.titulo.trim().slice(0, 180) : "";
    const resumo = typeof corpo.resumo === "string" ? corpo.resumo.trim().slice(0, 1200) : "";

    if (!id || !acao) {
      return NextResponse.json({ success: false, erro: "Notícia ou ação inválida." }, { status: 400 });
    }

    const db = getFirestore(adminApp());
    const ref = db.collection("noticias_importadas").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, erro: "Notícia não encontrada." }, { status: 404 });
    }
    if (snap.data()?.status !== "APROVADA") {
      return NextResponse.json({ success: false, erro: "A notícia precisa estar aprovada antes desta etapa." }, { status: 400 });
    }

    if (acao !== "RETIRAR" && (!titulo || !resumo)) {
      return NextResponse.json({ success: false, erro: "Preencha o título e o resumo." }, { status: 400 });
    }

    if (acao === "PUBLICAR" && snap.data()?.resumidoPorIA !== true) {
      return NextResponse.json(
        { success: false, erro: "Gere o resumo com IA antes de publicar esta notícia." },
        { status: 400 }
      );
    }

    const publicado = acao === "PUBLICAR" ? true : acao === "RETIRAR" ? false : Boolean(snap.data()?.publicadoNoPortal);
    await ref.update({
      tituloPortal: titulo || snap.data()?.tituloPortal || "",
      resumoPortal: resumo || snap.data()?.resumoPortal || "",
      publicadoNoPortal: publicado,
      ...(acao === "PUBLICAR" ? { publicadoEm: FieldValue.serverTimestamp() } : {}),
      atualizadoEm: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, publicadoNoPortal: publicado });
  } catch (error) {
    console.error("Erro ao publicar notícia:", error);
    return NextResponse.json({ success: false, erro: error instanceof Error ? error.message : "Não foi possível salvar a notícia." }, { status: 500 });
  }
}
