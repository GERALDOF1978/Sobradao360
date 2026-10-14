import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const revalidate = 0;

const ORIGEM = "https://inovacaose.tweezer.jobs";
const PAGINA = ORIGEM + "/candidato/vaga/buscar_vaga/";

type Vaga = { id: string; titulo: string; empresa: string; descricao: string; cidade: string; salario: string | null; url: string; origem: "inovacaose" };

export async function GET() {
  try {
    const resposta = await fetch(PAGINA, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Sobradao360/1.0; vagas publicas)", Accept: "text/html" },
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!resposta.ok) throw new Error("Fonte retornou HTTP " + resposta.status);
    const html = await resposta.text();
    const $ = cheerio.load(html);
    $("script,style,nav,footer,header").remove();
    const vagas = new Map<string, Vaga>();

    // A plataforma apresenta os cargos acompanhados do código da vaga (#NNN).
    // Extraímos somente blocos em que a localidade seja explicitamente Rio Claro.
    $("body *").each((_, el) => {
      if (el.type !== "tag") return;
      const $el = $(el);
      if ($el.children().length > 4) return;
      const titulo = $el.text().replace(/\s+/g, " ").trim();
      const m = titulo.match(/^(.{3,110}?)\s*#(\d{2,8})$/);
      if (!m || vagas.has(m[2])) return;
      let bloco = $el;
      for (let n = 0; n < 5; n++) {
        const txt = bloco.text().replace(/\s+/g, " ");
        if (/Rio Claro\b/i.test(txt) && /\b\d+\s+Vagas?\b/i.test(txt) && txt.length < 1500) break;
        bloco = bloco.parent();
      }
      const texto = bloco.text().replace(/\s+/g, " ").trim();
      if (!/Rio Claro\b/i.test(texto) || !/\b\d+\s+Vagas?\b/i.test(texto) || texto.length >= 1500) return;
      const link = bloco.find("a[href]").filter((_, a) => /candidatar|detalhe|vaga/i.test($(a).text() + " " + ($(a).attr("href") || ""))).first().attr("href");
      let url = PAGINA;
      if (link) {
        try { const resolvida = new URL(link, ORIGEM); if (resolvida.hostname === "inovacaose.tweezer.jobs") url = resolvida.toString(); } catch {}
      }
      vagas.set(m[2], {
        id: m[2], titulo: m[1].trim(), empresa: "Inovação SE (recrutamento)",
        descricao: texto.slice(0, 650), cidade: "Rio Claro", salario: null, url, origem: "inovacaose",
      });
    });
    return NextResponse.json({ success: true, vagas: [...vagas.values()], total: vagas.size }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
  } catch (e) {
    console.error("Falha ao consultar vagas públicas Inovação SE:", e);
    return NextResponse.json({ success: false, vagas: [], erro: "Não foi possível consultar a fonte no momento." }, { status: 502 });
  }
}
