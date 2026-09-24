// src/app/api/noticias/route.ts
import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

export async function GET() {
  try {
    // 1. Busca notícias do Jornal Cidade
    const feedJC = await parser.parseURL("https://www.jornalcidade.net/feed/");
    
    // 2. Busca comunicados da Prefeitura
    const feedPrefeitura = await parser.parseURL("https://rioclaro.sp.gov.br/feed/");

    // Mapeia e padroniza as notícias do Jornal Cidade
    const noticiasJC = feedJC.items.slice(0, 5).map((item) => ({
      fonte: "Jornal Cidade",
      titulo: item.title,
      link: item.link,
      data: item.pubDate,
      resumo: item.contentSnippet || "",
    }));

    // Mapeia e padroniza os avisos da Prefeitura
    const noticiasPrefeitura = feedPrefeitura.items.slice(0, 5).map((item) => ({
      fonte: "Prefeitura de Rio Claro",
      titulo: item.title,
      link: item.link,
      data: item.pubDate,
      resumo: item.contentSnippet || "",
    }));

    // Une os dois arrays e ordena pela data mais recente
    const todasNoticias = [...noticiasJC, ...noticiasPrefeitura].sort(
      (a, b) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime()
    );

    return NextResponse.json({ success: true, noticias: todasNoticias });
  } catch (error: any) {
    console.error("Erro ao ler RSS:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}