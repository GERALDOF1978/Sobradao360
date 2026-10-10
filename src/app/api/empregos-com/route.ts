import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const revalidate = 900;

const FONTE = "https://www.empregos.com.br/vagas/em-rio-claro-sp";
const PAGINAS = 3;
const DIAS = 15;
const HOJE = 24 * 60 * 60 * 1000;

type Anuncio = {
  id: string;
  titulo: string;
  empresa: string;
  cidade: string;
  estado: string;
  descricao: string;
  formatoTrabalho: string | null;
  salario: string | null;
  quantidadeVagas: string | null;
  publicadaEm: string | null;
  url: string;
};

function normaliza(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
function compacta(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function idadeDaVaga(fragmento: string): number | null {
  const texto = normaliza(fragmento);
  if (/publicad[ao]\s+hoje|publicad[ao]\s+agora/.test(texto)) return 0;
  if (/publicad[ao]\s+ontem/.test(texto)) return 1;
  const d = texto.match(/publicad[ao]\s+ha\s+(\d+)\s+dia/);
  if (d) return Number(d[1]);
  const h = texto.match(/publicad[ao]\s+ha\s+(\d+)\s+hora/);
  if (h) return 0;
  const m = texto.match(/publicad[ao]\s+ha\s+(\d+)\s+mes/);
  if (m) return Number(m[1]) * 30;
  return null;
}

function selecionarCard($: cheerio.CheerioAPI, elemento: any) {
  let atual = $(elemento);
  for (let nivel = 0; nivel < 9; nivel++) {
    const pai = atual.parent();
    if (!pai.length) break;
    const texto = compacta(pai.text());
    // Encontrar apenas o bloco da vaga, não um contêiner de vários resultados.
    const linksVaga = pai.find('a[href*="/vaga/"]').length;
    if (linksVaga > 1 && texto.length > 1400) break;
    atual = pai;
    if (
      /Rio Claro\s*,\s*SP/i.test(texto) &&
      /publicad[ao]/i.test(texto) &&
      texto.length >= 60 &&
      texto.length <= 4200 &&
      (pai.find("h2, h3").length > 0 || texto.length > 180)
    ) return atual;
  }
  return null;
}

export async function GET() {
  try {
    const encontrados = new Map<string, Anuncio>();
    let paginasLidas = 0;
    for (let pagina = 1; pagina <= PAGINAS; pagina++) {
      const url = pagina === 1 ? FONTE : `${FONTE}?page=${pagina}`;
      const response = await fetch(url, {
        headers: { Accept: "text/html", "Accept-Language": "pt-BR,pt;q=0.9" },
        next: { revalidate: 900 },
      });
      if (!response.ok) {
        if (pagina === 1) throw new Error(`Empregos.com.br HTTP ${response.status}`);
        break;
      }
      const html = await response.text();
      if (!html.includes("/vaga/")) {
        if (pagina === 1) throw new Error("A listagem pública não disponibilizou links de vagas");
        break;
      }
      paginasLidas++;
      const $ = cheerio.load(html);
      let novos = 0;

      $('a[href*="/vaga/"]').each((_, link) => {
        const href = $(link).attr("href") || "";
        const match = href.match(/\/vaga\/(\d+)\//);
        if (!match) return;
        const id = match[1];
        if (encontrados.has(id)) return;
        const card = selecionarCard($, link);
        if (!card) return;
        const texto = compacta(card.text());
        if (!/Rio Claro\s*,\s*SP/i.test(texto)) return;
        // A página usa datas relativas. Sem data legível, não declarar vaga recente.
        const dias = idadeDaVaga(texto);
        if (dias === null || dias > DIAS) return;

        const cabecalhos = card.find("h2, h3").toArray().map(el => compacta($(el).text())).filter(Boolean);
        const titulo = cabecalhos.find(v => !/Rio Claro\s*,\s*SP|publicad|combinar|\d+ vagas?/i.test(v)) || "";
        if (!titulo) return;
        const empresa = cabecalhos.find(v => v !== titulo && !/Rio Claro\s*,\s*SP|publicad|combinar|\d+ vagas?/i.test(v)) || "Empresa não informada";
        const salarioTexto = texto.match(/R\$\s*[\d.,]+(?:\s*[-–a]\s*R?\$?\s*[\d.,]+)?/i)?.[0] || null;
        const qtd = texto.match(/\b(\d+)\s+vagas?\b/i)?.[1] || null;
        const formato = /\bH[ií]brido\b/i.test(texto) ? "Híbrido" : /\bRemoto\b/i.test(texto) ? "Remoto" : /\bPresencial\b/i.test(texto) ? "Presencial" : null;
        // Resumo do anúncio visível; não confundir com a descrição integral.
        let descricao = compacta(card.find("p").toArray().map(el => $(el).text()).filter(t => t.trim().length > 60).join(" "));
        if (!descricao) {
          descricao = texto.replace(/^.*?publicad[ao]\s+(hoje|ontem|h[aá]\s+\d+\s+\w+)/i, "").trim();
        }
        descricao = descricao.slice(0, 1800);
        const linkCompleto = new URL(href, FONTE);
        if (linkCompleto.hostname !== "www.empregos.com.br") return;
        encontrados.set(id, {
          id, titulo, empresa, cidade: "Rio Claro", estado: "SP",
          descricao, formatoTrabalho: formato, salario: salarioTexto,
          quantidadeVagas: qtd, publicadaEm: new Date(Date.now() - dias * HOJE).toISOString(),
          url: linkCompleto.toString(),
        });
        novos++;
      });
      if (novos === 0 && pagina > 1) break;
    }

    return NextResponse.json(
      { success: true, fonte: "Empregos.com.br", total: encontrados.size, vagas: [...encontrados.values()], paginasLidas, aviso: encontrados.size === 0 ? "Nenhuma vaga recente de Rio Claro pôde ser validada na listagem pública." : null },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=900" } }
    );
  } catch (error) {
    console.error("Falha na consulta Empregos.com.br:", error);
    return NextResponse.json(
      { success: false, vagas: [], error: "Não foi possível consultar a lista pública do Empregos.com.br." },
      { status: 502 }
    );
  }
}
