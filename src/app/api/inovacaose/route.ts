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
      // O detalhe individual da Tweezer usa /candidato/vaga/ver_vaga/<uuid>/.
      // Identificar o endereço dentro do card, inclusive em atributos onclick/data-*.
      const elementos = bloco.find("*").addBack();
      let link: string | undefined;
      elementos.each((_, node) => {
        if (link) return;
        const atributos = Object.values(node.attribs || {}).join(" ");
        const candidato = atributos.match(/(?:https?:\\/\\/[^"'\\s]+)?\\/?candidato\\/vaga\\/ver_vaga\\/[a-f0-9-]{36}\\/?/i);
        if (candidato) link = candidato[0];
      });
      let url = PAGINA;
      if (link) {
        try { const resolvida = new URL(link, ORIGEM); if (resolvida.hostname === "inovacaose.tweezer.jobs") url = resolvida.toString(); } catch {}
      }
      vagas.set(m[2], {
        id: m[2], titulo: m[1].trim(), empresa: "Inovação SE (recrutamento)",
        descricao: texto.slice(0, 650), cidade: "Rio Claro", salario: null, url, origem: "inovacaose",
      });
    });
    // Consultar apenas URLs individuais confirmadas no HTML público.
    // Não substituir informações ausentes por descrições inventadas.
    const lista = [...vagas.values()];
    for (let i = 0; i < lista.length; i += 5) {
      await Promise.all(lista.slice(i, i + 5).map(async (vaga) => {
        if (vaga.url === PAGINA) return;
        try {
          const resp = await fetch(vaga.url, { headers: { Accept: "text/html" }, signal: AbortSignal.timeout(7000), cache: "no-store" });
          if (!resp.ok) return;
          const detalhe = cheerio.load(await resp.text());
          const cabecalho = detalhe("h1,h2,h3,h4,h5").first().text();
          if (cabecalho && !cabecalho.includes("#" + vaga.id)) {
            const codigoPagina = detalhe("body").text().match(/#(\\d{2,8})/);
            if (codigoPagina && codigoPagina[1] !== vaga.id) return;
          }
          const secao = detalhe("body").text().replace(/\\r/g, "").replace(/[ \\t]+/g, " ").trim();
          const inicio = secao.search(/Especifica[cç][aã]o da Vaga/i);
          const fim = secao.search(/Informa[cç][oõ]es adicionais/i);
          if (inicio >= 0) {
            const descricao = secao.slice(inicio, fim > inicio ? fim : inicio + 4500).trim().slice(0, 4500);
            if (descricao.length > 45) vaga.descricao = descricao;
          }
        } catch (erro) { console.warn("Detalhes indisponíveis para vaga Inovação SE", vaga.id, erro); }
      }));
    }
    return NextResponse.json({ success: true, vagas: lista, total: vagas.size }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
  } catch (e) {
    console.error("Falha ao consultar vagas públicas Inovação SE:", e);
    return NextResponse.json({ success: false, vagas: [], erro: "Não foi possível consultar a fonte no momento." }, { status: 502 });
  }
}
