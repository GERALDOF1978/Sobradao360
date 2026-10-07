import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const revalidate = 21600;

const FONTE =
  "https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/levantamento-de-precos-de-combustiveis-ultimas-semanas-pesquisadas";

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

async function fetchANP(url: string) {
  return fetch(url, {
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,text/csv,application/octet-stream,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
  });
}

async function obterLinksRecentes() {
  const res = await fetchANP(FONTE);
  if (!res.ok) throw new Error("Não foi possível consultar o levantamento semanal da ANP.");

  const html = await res.text();
  const $ = cheerio.load(html);
  const candidatos: string[] = [];

  // A página oficial publica, semana a semana, um único arquivo completo
  // "Preços por posto revendedor (combustíveis automotivos e GLP P13)".
  // Pegamos o PRIMEIRO link correspondente, que é a semana mais recente.
  $("a").each((_, a) => {
    const texto = normalizar($(a).text());
    const href = $(a).attr("href");
    if (!href) return;

    if (
      texto.includes("PRECOS POR POSTO REVENDEDOR") ||
      (texto.includes("POSTO REVENDEDOR") && texto.includes("COMBUST"))
    ) {
      candidatos.push(new URL(href, FONTE).toString());
    }
  });

  if (!candidatos.length) {
    throw new Error("Arquivo semanal por posto revendedor não encontrado na página da ANP.");
  }

  return [candidatos[0]];
}

type CadastroANP = {
  cnpj: string;
  codigoSIMP?: string;
  autorizacao?: string;
  dataPublicacao?: string;
  razaoSocial?: string;
  endereco?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  distribuidora?: string;
  produtos?: Array<{ produto?: string; tancagem?: number; unidMedidaTancagem?: string; qtdeBicos?: number }>;
  latitude?: string;
  longitude?: string;
  latitude_ANP4C?: string;
  longitude_ANP4C?: string;
  validacao?: string;
  statusSIGAF?: string;
};

async function obterCadastrosRioClaro() {
  try {
    const url = "https://revendedoresapi.anp.gov.br/v1/combustivel?municipio=RIO%20CLARO&uf=SP";
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return new Map<string, CadastroANP>();
    const json = await res.json();
    const lista: CadastroANP[] = Array.isArray(json?.data) ? json.data : [];
    return new Map(lista.filter(x => x.cnpj).map(x => [String(x.cnpj).replace(/\D/g, ""), x]));
  } catch (error) {
    console.error("API de revendedores ANP indisponível:", error);
    return new Map<string, CadastroANP>();
  }
}

async function lerArquivo(url: string) {
  const res = await fetchANP(url);
  if (!res.ok) throw new Error(`ANP respondeu ${res.status} ao baixar o arquivo semanal.`);
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

    // Um arquivo da ANP pode ficar temporariamente indisponível. Não derruba
    // toda a rota por causa disso: usa os arquivos que responderem corretamente.
    const [resultados, cadastros] = await Promise.all([
      Promise.allSettled(links.map(lerArquivo)),
      obterCadastrosRioClaro(),
    ]);
    const grupos = resultados
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof lerArquivo>>> => r.status === "fulfilled")
      .map(r => r.value);
    const todos = grupos.flat();

    if (grupos.length === 0) {
      throw new Error("Nenhum arquivo de preços da ANP pôde ser carregado.");
    }

    if (!todos.length) {
      return NextResponse.json({ sucesso: true, cidade: "Rio Claro", uf: "SP", atualizadoEm: null, precos: [], aviso: "A pesquisa mais recente da ANP não contém postos de Rio Claro." });
    }

    // Os arquivos da ANP abrangem uma semana de pesquisa. Os postos podem ser
    // visitados em dias diferentes; filtrar apenas a maior data descartava boa
    // parte da amostra de Rio Claro (ex.: etanol aparecia com apenas 4 postos).
    const precos = todos
      .map(x => {
        const cadastro = cadastros.get(String(x.cnpj).replace(/\D/g, ""));
        const latitude = cadastro?.latitude || cadastro?.latitude_ANP4C || "";
        const longitude = cadastro?.longitude || cadastro?.longitude_ANP4C || "";
        return {
          ...x,
          cadastroANP: cadastro ? {
            codigoSIMP: cadastro.codigoSIMP || "",
            autorizacao: cadastro.autorizacao || "",
            dataPublicacao: cadastro.dataPublicacao || "",
            distribuidora: cadastro.distribuidora || "",
            produtos: cadastro.produtos || [],
            latitude,
            longitude,
            validacao: cadastro.validacao || "",
            statusSIGAF: cadastro.statusSIGAF || "",
          } : null,
        };
      })
      .sort((a, b) => a.valor - b.valor);

    const ultima = Math.max(...precos.map(x => parseData(x.dataColeta)));
    const data = precos.find(x => parseData(x.dataColeta) === ultima)?.dataColeta || "";
    return NextResponse.json(
      { sucesso: true, cidade: "Rio Claro", uf: "SP", atualizadoEm: data, precos, fonte: "ANP - Levantamento de Preços de Combustíveis" },
      { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    console.error("Erro ANP combustíveis:", error);
    const detalheBase = error instanceof Error ? error.message : String(error);
    const causa = error instanceof Error && "cause" in error
      ? (error as Error & { cause?: unknown }).cause
      : undefined;
    const detalheCausa =
      causa && typeof causa === "object" && "message" in causa
        ? String((causa as { message?: unknown }).message || "")
        : causa ? String(causa) : "";
    const detalhe = detalheCausa ? `${detalheBase}: ${detalheCausa}` : detalheBase;
    return NextResponse.json(
      {
        sucesso: false,
        erro: "Não foi possível carregar os preços da ANP agora.",
        detalhe,
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
