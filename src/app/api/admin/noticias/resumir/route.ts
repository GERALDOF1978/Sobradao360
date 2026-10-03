import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, erro: "GEMINI_API_KEY não configurada no Vercel." }, { status: 500 });
    }

    const corpo = await request.json();
    const id = typeof corpo.id === "string" ? corpo.id.trim() : "";
    if (!id) return NextResponse.json({ success: false, erro: "Notícia inválida." }, { status: 400 });

    const snap = await getFirestore(adminApp()).collection("noticias_importadas").doc(id).get();
    if (!snap.exists) return NextResponse.json({ success: false, erro: "Notícia não encontrada." }, { status: 404 });

    const noticia = snap.data() || {};
    if (noticia.status !== "APROVADA") {
      return NextResponse.json({ success: false, erro: "A notícia precisa estar aprovada antes de gerar o resumo." }, { status: 400 });
    }

    const material = [
      `Título original: ${String(noticia.tituloOriginal || "")}`,
      `Texto recebido da fonte: ${String(noticia.resumoFeed || "")}`,
      `Fonte: ${String(noticia.fonte || "")}`,
    ].join("\n\n");

    const prompt = `Você é o redator do portal comunitário Sobradão 360, de Rio Claro/SP.
Crie um título e um resumo jornalístico curto usando SOMENTE as informações fornecidas abaixo.
Não invente nomes, números, datas, locais, causas, consequências ou declarações.
Não copie frases longas literalmente. Reescreva de forma clara, neutra e objetiva.
O resumo deve ter de 2 a 4 frases e no máximo 700 caracteres.
Retorne APENAS JSON válido neste formato: {"titulo":"...","resumo":"..."}.

${material}`;

    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const dados = await resposta.json();
    if (!resposta.ok) {
      const detalhe = dados?.error?.message || "Falha na API Gemini.";
      throw new Error(detalhe);
    }

    const texto = dados?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) throw new Error("A IA não retornou conteúdo.");

    let gerado: { titulo?: string; resumo?: string };
    try {
      gerado = JSON.parse(texto);
    } catch {
      throw new Error("A IA retornou um formato inválido.");
    }

    const titulo = String(gerado.titulo || "").trim().slice(0, 180);
    const resumo = String(gerado.resumo || "").trim().slice(0, 700);
    if (!titulo || !resumo) throw new Error("A IA não gerou título e resumo válidos.");

    await snap.ref.update({
      resumidoPorIA: true,
      resumidoPorIAEm: new Date(),
    });

    return NextResponse.json({ success: true, titulo, resumo, resumidoPorIA: true });
  } catch (error) {
    console.error("Erro ao gerar resumo com Gemini:", error);
    return NextResponse.json(
      { success: false, erro: error instanceof Error ? error.message : "Não foi possível gerar o resumo com IA." },
      { status: 500 }
    );
  }
}
