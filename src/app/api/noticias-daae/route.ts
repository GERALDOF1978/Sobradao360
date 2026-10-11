import { NextResponse } from "next/server";

export const revalidate = 900;

type Post = { id?: number; date?: string; link?: string; title?: { rendered?: string }; content?: { rendered?: string }; excerpt?: { rendered?: string } };

function limparHtml(valor: string) {
  return valor.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#8211;|&#8212;/g, "–").replace(/&quot;/g, '"').replace(/&#039;|&#8217;/g, "'").trim();
}

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (id && !/^[1-9]\\d*$/.test(id)) return NextResponse.json({ noticia: null }, { status: 400 });
    const base = "https://daaerioclaro.sp.gov.br/wp-json/wp/v2/posts";
    const url = id ? `${base}/${id}?_fields=id,date,link,title,content,excerpt` : `${base}?per_page=12&_fields=id,date,link,title,content,excerpt&orderby=date&order=desc`;
    const resposta = await fetch(url, { next: { revalidate: 900 }, headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
    if (!resposta.ok) throw new Error("Fonte DAAE indisponível");
    const respostaJson = await resposta.json();
    const posts = (id ? [respostaJson] : respostaJson) as Post[];
    if (!Array.isArray(posts)) throw new Error("Resposta inválida");
    const noticias = posts.filter(p => p.link?.startsWith("https://daaerioclaro.sp.gov.br/") && p.title?.rendered).map(p => ({
      id: p.id || 0,
      titulo: limparHtml(p.title!.rendered!),
      conteudo: p.content?.rendered || "",
      resumo: limparHtml(p.excerpt?.rendered || ""),
      url: p.link!,
      data: p.date || "",
    })).filter(p => p.titulo);
    const unicas = [...new Map(noticias.filter(n => n.id > 0).map(n => [n.id, n])).values()];
    return NextResponse.json(id ? { noticia: unicas[0] || null } : { noticias: unicas }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
  } catch (error) {
    console.error("Notícias DAAE:", error);
    return NextResponse.json({ noticias: [], indisponivel: true }, { status: 503 });
  }
}
