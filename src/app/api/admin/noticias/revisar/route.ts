import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function adminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin não configurado no servidor.");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
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
      return NextResponse.json(
        { success: false, erro: "Acesso exclusivo do Master." },
        { status: 403 }
      );
    }

    const corpo = await request.json();
    const id = typeof corpo.id === "string" ? corpo.id.trim() : "";
    const acao = corpo.acao === "APROVAR" || corpo.acao === "RECUSAR" ? corpo.acao : "";

    if (!id || !acao) {
      return NextResponse.json(
        { success: false, erro: "Notícia ou ação inválida." },
        { status: 400 }
      );
    }

    const db = getFirestore(adminApp());
    const ref = db.collection("noticias_importadas").doc(id);
    const noticia = await ref.get();

    if (!noticia.exists) {
      return NextResponse.json(
        { success: false, erro: "Notícia não encontrada." },
        { status: 404 }
      );
    }

    const status = acao === "APROVAR" ? "APROVADA" : "RECUSADA";

    await ref.update({
      status,
      publicadoNoPortal: false,
      revisadoEm: FieldValue.serverTimestamp(),
      atualizadoEm: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      id,
      status,
      mensagem:
        status === "APROVADA"
          ? "Notícia aprovada e pronta para a etapa de resumo."
          : "Notícia recusada.",
    });
  } catch (error) {
    console.error("Erro ao revisar notícia:", error);
    return NextResponse.json(
      {
        success: false,
        erro: error instanceof Error ? error.message : "Não foi possível revisar a notícia.",
      },
      { status: 500 }
    );
  }
}
