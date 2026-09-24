// src/app/api/sync-noticias/route.ts
import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";

const parser = new Parser();

export async function GET() {
  try {
    // 1. Obter dados dos Feeds RSS
    const feedJC = await parser.parseURL("https://www.jornalcidade.net/feed/");
    const feedPrefeitura = await parser.parseURL("https://rioclaro.sp.gov.br/feed/");

    let novasAdicionadas = 0;

    // Função interna para guardar itens no Firestore
    const guardarItems = async (items: any[], fonte: string) => {
      for (const item of items) {
        if (!item.title || !item.link) continue;

        // Gera um ID único baseado na URL do artigo
        const docId = Buffer.from(item.link).toString("base64").replace(/=/g, "").slice(-30);
        const docRef = doc(db, "noticias_locais", docId);

        // Guarda ou atualiza sem duplicar
        await setDoc(
          docRef,
          {
            titulo: item.title,
            link: item.link,
            resumo: item.contentSnippet || item.description || "",
            fonte: fonte,
            categoria: item.categories?.[0] || "Geral",
            dataPublicacao: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            sincronizadoEm: serverTimestamp(),
          },
          { merge: true } // Merge evita duplicados se a notícia já existir
        );

        novasAdicionadas++;
      }
    };

    // Processa os 5 artigos mais recentes de cada fonte
    await guardarItems(feedJC.items.slice(0, 5), "Jornal Cidade");
    await guardarItems(feedPrefeitura.items.slice(0, 5), "Prefeitura de Rio Claro");

    
    return NextResponse.json({
      success: true,
      mensagem: `Sincronização concluída com sucesso! Items processados.`,
    });
  } catch (error: any) {
    console.error("Erro na sincronização:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}