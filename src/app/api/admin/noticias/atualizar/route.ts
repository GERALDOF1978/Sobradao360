import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) return false;

  const app = adminApp();
  const decoded = await getAuth(app).verifyIdToken(token);
  const usuario = await getFirestore(app)
    .collection("usuarios")
    .doc(decoded.uid)
    .get();

  return usuario.exists && usuario.data()?.perfil === "master";
}

export async function POST(request: NextRequest) {
  try {
    const master = await validarMaster(request);

    if (!master) {
      return NextResponse.json(
        { success: false, erro: "Acesso exclusivo do Master." },
        { status: 403 }
      );
    }

    // Primeira etapa: estrutura segura do Master.
    // A coleta de uma fonte real será ligada na próxima etapa,
    // depois de validarmos RSS/API e as condições de uso da fonte.
    return NextResponse.json({
      success: true,
      fontes: 0,
      encontradas: 0,
      novas: 0,
      duplicadas: 0,
      aguardando: 0,
      mensagem:
        "Área de notícias criada. Agora podemos conectar a primeira fonte para o teste sem publicar automaticamente.",
      atualizadoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro na atualização de notícias:", error);

    return NextResponse.json(
      {
        success: false,
        erro: "Não foi possível iniciar a atualização das notícias.",
      },
      { status: 500 }
    );
  }
}
