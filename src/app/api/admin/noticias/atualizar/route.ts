import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import Parser from "rss-parser";
import crypto from "crypto";

const FONTES = [
  { id: "jornal-cidade", nome: "Jornal Cidade", url: "https://www.jornalcidade.net/", feed: "https://www.jornalcidade.net/feed/" },
  { id: "diario-rio-claro", nome: "Diário do Rio Claro", url: "https://www.j1diario.com.br/", feed: "https://www.j1diario.com.br/feed/" },
  { id: "cidade-azul", nome: "Cidade Azul Notícias", url: "https://cidadeazulnoticias.com.br/", feed: "https://cidadeazulnoticias.com.br/feed/" },
  { id: "prefeitura-rio-claro", nome: "Prefeitura de Rio Claro", url: "https://rioclaro.sp.gov.br/", feed: "https://rioclaro.sp.gov.br/feed/" },
] as const;

const LIMITE_NOVAS_POR_FONTE = 5;

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

function limparTexto(valor?: string | null) {
  return String(valor || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;|&#8212;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&#8230;/g, "…")
    .replace(/\s+/g, " ")
    .trim();
}

function idDaNoticia(fonte: string, link: string) {
  return crypto.createHash("sha256").update(`${fonte}|${link}`).digest("hex");
}

function normalizarTitulo(titulo: string) {
  return titulo.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function possivelSemelhante(titulo: string, titulos: string[]) {
  const ignorar = new Set(["de","da","do","das","dos","e","em","no","na","nos","nas","para","por","com","um","uma","a","o"]);
  const palavras = normalizarTitulo(titulo).split(" ").filter((p) => p.length > 3 && !ignorar.has(p));
  if (palavras.length < 3) return false;
  return titulos.some((outro) => {
    const conjunto = new Set(normalizarTitulo(outro).split(" "));
    const comuns = palavras.filter((p) => conjunto.has(p)).length;
    return comuns >= 3 && comuns / palavras.length >= 0.55;
  });
}

async function importarFonte(parser: Parser, fonte: (typeof FONTES)[number], db: FirebaseFirestore.Firestore) {
  const feed = await parser.parseURL(fonte.feed);
  const itens = (feed.items || []).slice(0, 30);
  const existentesSnap = await db.collection("noticias_importadas").get();
  const titulosExistentes = existentesSnap.docs.map((d) => String(d.data()?.tituloOriginal || "")).filter(Boolean);

  let novas = 0;
  let duplicadas = 0;
  let ignoradas = 0;

  for (const item of itens) {
    if (novas >= LIMITE_NOVAS_POR_FONTE) break;
    const link = String(item.link || item.guid || "").trim();
    const titulo = limparTexto(item.title);
    if (!link || !titulo) continue;

    if (fonte.id === "diario-rio-claro" && (/^edição de /i.test(titulo) || (item.categories || []).some((c) => String(c).toLowerCase() === "jornal online") && /^edição/i.test(titulo))) {
      ignoradas++;
      continue;
    }

    const id = idDaNoticia(fonte.nome, link);
    const ref = db.collection("noticias_importadas").doc(id);
    if ((await ref.get()).exists) {
      duplicadas++;
      continue;
    }

    const semelhante = possivelSemelhante(titulo, titulosExistentes);
    await ref.set({
      fonte: fonte.nome,
      fonteId: fonte.id,
      fonteUrl: fonte.url,
      linkOriginal: link,
      tituloOriginal: titulo,
      resumoFeed: limparTexto((item as { contentSnippet?: string }).contentSnippet || (item as { content?: string }).content || "").slice(0, 700),
      dataPublicacao: item.isoDate || item.pubDate || null,
      categorias: Array.isArray(item.categories) ? item.categories.map((c) => limparTexto(String(c))).filter(Boolean) : [],
      status: "AGUARDANDO_REVISAO",
      origem: "rss",
      publicadoNoPortal: false,
      possivelDuplicidade: semelhante,
      criadoEm: FieldValue.serverTimestamp(),
      atualizadoEm: FieldValue.serverTimestamp(),
    });
    titulosExistentes.push(titulo);
    novas++;
  }

  return { fonte: fonte.nome, fonteId: fonte.id, encontradas: itens.length, novas, duplicadas, ignoradas, sucesso: true };
}

export async function POST(request: NextRequest) {
  try {
    if (!(await validarMaster(request))) return NextResponse.json({ success: false, erro: "Acesso exclusivo do Master." }, { status: 403 });

    let fonteId = "todas";
    try {
      const corpo = await request.json();
      if (typeof corpo?.fonteId === "string") fonteId = corpo.fonteId;
    } catch {}

    const selecionadas = fonteId === "todas" ? [...FONTES] : FONTES.filter((f) => f.id === fonteId);
    if (!selecionadas.length) return NextResponse.json({ success: false, erro: "Fonte inválida." }, { status: 400 });

    const parser = new Parser({
      timeout: 12000,
      headers: { "User-Agent": "Sobradão360/1.0 (+https://www.sobradao360.com.br)", Accept: "application/rss+xml, application/xml, text/xml" },
    });
    const db = getFirestore(adminApp());
    const resultados: any[] = [];

    for (const fonte of selecionadas) {
      try {
        resultados.push(await importarFonte(parser, fonte, db));
      } catch (error) {
        resultados.push({ fonte: fonte.nome, fonteId: fonte.id, encontradas: 0, novas: 0, duplicadas: 0, ignoradas: 0, sucesso: false, erro: error instanceof Error ? error.message : "Falha ao consultar fonte." });
      }
    }

    const ok = resultados.filter((r) => r.sucesso).length;
    const encontradas = resultados.reduce((s, r) => s + r.encontradas, 0);
    const novas = resultados.reduce((s, r) => s + r.novas, 0);
    const duplicadas = resultados.reduce((s, r) => s + r.duplicadas, 0);

    return NextResponse.json({
      success: ok > 0,
      fontes: ok,
      fontesSolicitadas: selecionadas.length,
      encontradas,
      novas,
      duplicadas,
      aguardando: novas,
      resultados,
      mensagem: `${ok} fonte(s) consultada(s). ${novas} notícia(s) nova(s) enviada(s) para revisão.`,
      atualizadoEm: new Date().toISOString(),
    }, { status: ok > 0 ? 200 : 502 });
  } catch (error) {
    console.error("Erro na atualização de notícias:", error);
    return NextResponse.json({ success: false, erro: error instanceof Error ? error.message : "Não foi possível atualizar as notícias." }, { status: 500 });
  }
}
