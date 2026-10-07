import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const revalidate = 21600;

const FONTE =
  "https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/serie-historica-de-precos-de-combustiveis";

function linhaCsv(linha: string) {
  const saida: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (ch === '"') {
      if (aspas && linha[i + 1] === '"') { atual += '"'; i++; }
      else aspas = !aspas;
    } else if (ch === ";" && !aspas) {
      saida.push(atual.trim());
      atual = "";
    } else atual += ch;
  }
  saida.push(atual.trim());
  return saida.map(v => v.replace(/^"|"$/g, ""));
}

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}

function parseData(valor: string) {
  const [d, m, a] = valor.split("/");
  if (!a) return 0;
  return new Date(Number(a), Number(m) - 1, Number(d)).getTime();
}

async function obterLinksRecentes() {
  const res = await fetch(FONTE, { next: { revalidate: 21600 } });
  if (!res.ok) throw new Error("Não foi possível consultar a página de dados da ANP.");
  const html = await res.text();
  const $ = cheerio.load(html);
  const links: string[] = [];

  $("h3").each((_, el) => {
    if (!normalizar($(el).text()).includes("QUATRO ULTIMAS SEMANAS")) return;
    let no = $(el).next();
    for (let i = 0; i < 6 && no.length; i++, no = no.next()) {
      no.find("a").each((__, a) => {
        const texto = normalizar($(a).text());
        const href = $(a).attr("href");
        if (href && (texto.includes("ETANOL") || texto.includes("DIESEL"))) {
          links.push(new URL(href, FONTE).toString());
        }
      });
    }
  });

  if (!links.length) {
    $("a").each((_, a) => {
      const href = $(a).attr("href") || "";
      const texto = normalizar($(a).text());
      if (href.toLowerCase().includes(".csv") && (texto.includes("ETANOL") || texto.includes("DIESEL"))) {
        links.push(new URL(href, FONTE).toString());
      }
    });
  }
  return [...new Set(links)].slice(-2);
}

async function lerArquivo(url: string) {
  const res = await fetch(url, { next: { revalidate: 21600 } });
  if (!res.ok) throw new Error("Não foi possível baixar os preços da ANP.");
  const buffer = await res.arrayBuffer();
  const texto = new TextDecoder("windows-1252").decode(buffer);
  const linhas = texto.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (linhas.length < 2) return [];

  const cab = linhaCsv(linhas[0]).map(normalizar);
  const idx = (...nomes: string[]) => cab.findIndex(c => nomes.some(n => c === normalizar(n)));
  const pos = {
    regiao: idx("Regiao - Sigla", "Regiao"),
    estado: idx("Estado - Sigla", "Estado"),
    municipio: idx("Municipio"),
    revenda: idx("Revenda"),
    cnpj: idx("CNPJ da Revenda", "CNPJ"),
    rua: idx("Nome da Rua", "Endereco"),
    numero: idx("Numero Rua", "Numero"),
    complemento: idx("Complemento"),
    bairro: idx("Bairro"),
    cep: idx("Cep"),
    produto: idx("Produto"),
    data: idx("Data da Coleta"),
    preco: idx("Valor de Venda"),
    bandeira: idx("Bandeira"),
  };

  return linhas.slice(1).map(linhaCsv).filter(cols =>
    pos.estado >= 0 && pos.municipio >= 0 &&
    normalizar(cols[pos.estado] || "") === "SP" &&
    normalizar(cols[pos.municipio] || "") === "RIO CLARO"
  ).map(cols => ({
    revenda: cols[pos.revenda] || "Posto revendedor",
    cnpj: cols[pos.cnpj] || "",
    endereco: [cols[pos.rua], cols[pos.numero], cols[pos.complemento]].filter(Boolean).join(", "),
    bairro: cols[pos.bairro] || "",
    cep: cols[pos.cep] || "",
    produto: cols[pos.produto] || "",
    dataColeta: cols[pos.data] || "",
    valor: Number((cols[pos.preco] || "0").replace(",", ".")),
    bandeira: cols[pos.bandeira] || "",
  })).filter(x => x.valor > 0);
}

export async function GET() {
  try {
    const links = await obterLinksRecentes();
    if (!links.length) throw new Error("A ANP não publicou os arquivos esperados.");

    const grupos = await Promise.all(links.map(lerArquivo));
    const todos = grupos.flat();

    if (!todos.length) {
      return NextResponse.json({ sucesso: true, cidade: "Rio Claro", uf: "SP", atualizadoEm: null, precos: [], aviso: "A pesquisa mais recente da ANP não contém postos de Rio Claro." });
    }

    const ultima = Math.max(...todos.map(x => parseData(x.dataColeta)));
    const precos = todos
      .filter(x => parseData(x.dataColeta) === ultima)
      .sort((a, b) => a.valor - b.valor);

    const data = precos[0]?.dataColeta || "";
    return NextResponse.json(
      { sucesso: true, cidade: "Rio Claro", uf: "SP", atualizadoEm: data, precos, fonte: "ANP - Levantamento de Preços de Combustíveis" },
      { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    console.error("Erro ANP combustíveis:", error);
    return NextResponse.json({ sucesso: false, erro: "Não foi possível carregar os preços da ANP agora." }, { status: 502 });
  }
}
