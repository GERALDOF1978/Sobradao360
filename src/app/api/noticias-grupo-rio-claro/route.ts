import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 600;

type PostWP = {
  id: number;
  date?: string;
  link?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
};

function limparHtml(texto: string): string {
  return texto.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#0?39;/g, "'").replace(/&hellip;/gi, "…").replace(/\s+/g, " ").trim();
}

export async function GET() {
  try {
    // Endpoint geral do WordPress: sem filtro de categoria, em ordem decrescente de publicação.
    const url = "https://www.gruporioclarosp.com.br/wp-json/wp/v2/posts?per_page=12&orderby=date&order=desc&_fields=id,date,link,title,excerpt";
    const resposta = await fetch(url, { next: { revalidate: 600 }, headers: { Accept: "application/json", "User-Agent": "Sobradao360-News/1.0" }, signal: AbortSignal.timeout(10000) });
    if (!resposta.ok) throw new Error("Fonte indisponível: " + resposta.status);
    const posts: unknown = await resposta.json();
    if (!Array.isArray(posts)) throw new Error("Formato de notícias inválido.");
    const noticias = (posts as PostWP[]).filter(p => typeof p.link === "string" && /^https:\/\/([\w-]+\.)?gruporioclarosp\.com\.br\//i.test(p.link)).map(p => ({
      id: "grupo-" + p.id,
      titulo: limparHtml(p.title?.rendered || ""),
      resumo: limparHtml(p.excerpt?.rendered || "").slice(0, 360),
      fonte: "Grupo Rio Claro SP",
      linkOriginal: p.link,
      dataPublicacao: p.date || null,
    })).filter(p => p.titulo);
    return NextResponse.json({ success: true, noticias });
  } catch (erro) {
    console.error("Notícias Grupo Rio Claro SP:", erro);
    return NextResponse.json({ success: false, noticias: [], mensagem: "Fonte temporariamente indisponível." }, { status: 502 });
  }
}
