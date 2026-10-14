import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const revalidate = 0;

const ORIGEM = "https://inovacaose.tweezer.jobs";
const PAGINA = ORIGEM + "/candidato/vaga/buscar_vaga/";
const VERSAO_INTEGRACAO = "inovacaose-20261014-3";
const LINKS_CONFIRMADOS: Record<string, string> = {
  "402": ORIGEM + "/candidato/vaga/ver_vaga/495b36b2-05e4-4ddc-b9f0-098143b5c2ef/",
};

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
        if (node.type !== "tag" && node.type !== "script" && node.type !== "style") return;
        const atributos = Object.values($(node).attr() || {}).join(" ");
        const candidato = atributos.match(/candidato\/vaga\/ver_vaga\/[a-f0-9-]{36}\/?/i);
        if (candidato) link = candidato[0];
      });
      // Verificar primeiro links específicos, sem atribuir um link de outra vaga.
      let url = LINKS_CONFIRMADOS[m[2]] || PAGINA;
      if (link) {
        try {
          const resolvida = new URL("/" + link.split("/").filter(Boolean).join("/"), ORIGEM);
          if (resolvida.hostname === "inovacaose.tweezer.jobs") url = resolvida.toString();
        } catch {}
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
          detalhe("script,style,nav,footer,header,form").remove();
          const corpo = detalhe("main").first().length ? detalhe("main").first() : detalhe("body");
          const linhas = corpo.text().split(/\\n+/).map(linha => linha.replace(/\\s+/g, " ").trim()).filter(Boolean);
          const texto = linhas.join("\n");
          // Os títulos variam conforme o modelo de cadastro da empresa.
          const inicio = linhas.findIndex(linha => /^(?:descri[cç][aã]o(?:\\s+da\\s+vaga)?|atividades|responsabilidades|atribui[cç][oõ]es|requisitos|sobre\\s+a\\s+vaga|detalhes\\s+da\\s+vaga)\\s*:?$/i.test(linha));
          const textoCandidato = inicio >= 0 ? linhas.slice(inicio).join("\n") : "";
          const descricao = textoCandidato.length > 70 ? textoCandidato : "";
          if (descricao) vaga.descricao = descricao.slice(0, 4500);
          else console.warn("Inovação SE: página individual sem seção reconhecida", vaga.id, { status: resp.status, linhas: linhas.length, caracteres: texto.length });

        } catch (erro) { console.warn("Detalhes indisponíveis para vaga Inovação SE", vaga.id, erro); }
      }));
    }
    return NextResponse.json({ success: true, versao: VERSAO_INTEGRACAO, vagas: lista, total: vagas.size }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (e) {
    console.error("Falha ao consultar vagas públicas Inovação SE:", e);
    return NextResponse.json({ success: false, vagas: [], erro: "Não foi possível consultar a fonte no momento." }, { status: 502 });
  }
}
