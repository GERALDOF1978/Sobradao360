import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import Parser from "rss-parser";
import crypto from "crypto";

const FONTE = {
  nome: "Jornal Cidade",
  url: "https://www.jornalcidade.net/",
  feed: "https://www.jornalcidade.net/feed/",
};

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

function limparTexto(valor?: string | null) {
  return String(valor || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;|&#8212;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function idDaNoticia(link: string) {
  return crypto
    .createHash("sha256")
    .update(`${FONTE.nome}|${link}`)
    .digest("hex");
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

    const parser = new Parser({
      timeout: 12000,
      headers: {
        "User-Agent": "Sobradão360/1.0 (+https://sobradao360-sgvm.vercel.app)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });

    const feed = await parser.parseURL(FONTE.feed);
    const itens = (feed.items || []).slice(0, 30);
    const db = getFirestore(adminApp());

    let novas = 0;
    let duplicadas = 0;

    for (const item of itens) {
      const link = String(item.link || item.guid || "").trim();
      const titulo = limparTexto(item.title);

      if (!link || !titulo) continue;

      const id = idDaNoticia(link);
      const ref = db.collection("noticias_importadas").doc(id);
      const existente = await ref.get();

      if (existente.exists) {
        duplicadas++;
        continue;
      }

      await ref.set({
        fonte: FONTE.nome,
        fonteUrl: FONTE.url,
        linkOriginal: link,
        tituloOriginal: titulo,
        resumoFeed: limparTexto(
          (item as { contentSnippet?: string }).contentSnippet ||
            (item as { content?: string }).content ||
            ""
        ).slice(0, 600),
        dataPublicacao:
          item.isoDate || item.pubDate || null,
        categorias: Array.isArray(item.categories)
          ? item.categories.map((categoria) => limparTexto(String(categoria))).filter(Boolean)
          : [],
        status: "AGUARDANDO_REVISAO",
        origem: "rss",
        publicadoNoPortal: false,
        criadoEm: FieldValue.serverTimestamp(),
        atualizadoEm: FieldValue.serverTimestamp(),
      });

      novas++;
    }

    return NextResponse.json({
      success: true,
      fontes: 1,
      encontradas: itens.length,
      novas,
      duplicadas,
      aguardando: novas,
      mensagem:
        novas > 0
          ? `Jornal Cidade consultado: ${novas} notícia(s) nova(s) salva(s) para revisão.`
          : "Jornal Cidade consultado. Nenhuma notícia nova desde a última atualização.",
      fonte: FONTE.nome,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro na atualização de notícias:", error);

    return NextResponse.json(
      {
        success: false,
        erro:
          error instanceof Error
            ? `Falha ao consultar o Jornal Cidade: ${error.message}`
            : "Não foi possível atualizar as notícias.",
      },
      { status: 500 }
    );
  }
}
