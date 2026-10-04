// src/app/api/alertas/route.ts

import { NextResponse } from "next/server";

const CIDADE = "RIO CLARO";
const CODIGO_IBGE = "3543907";
const UF = "SP";

interface AlertaNormalizado {
  id: string;
  titulo: string;
  severidade: string;
  severidadeNivel: number;
  inicio: string | null;
  fim: string | null;
  descricao: string;
  instrucao: string;
  area: string;
  fonte: string;
}

function normalizarTexto(valor: unknown): string {
  if (typeof valor !== "string") return "";

  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function textoDoObjeto(valor: unknown): string {
  try {
    return normalizarTexto(JSON.stringify(valor));
  } catch {
    return "";
  }
}

function extrairLista(dados: unknown): unknown[] {
  if (Array.isArray(dados)) {
    return dados;
  }

  if (!dados || typeof dados !== "object") {
    return [];
  }

  const objeto = dados as Record<string, unknown>;

  const chaves = [
    "avisos",
    "alertas",
    "data",
    "items",
    "itens",
    "results",
    "features",
  ];

  for (const chave of chaves) {
    const valor = objeto[chave];

    if (Array.isArray(valor)) {
      return valor;
    }
  }

  return Object.values(objeto).filter(
    (valor) =>
      valor &&
      typeof valor === "object" &&
      !Array.isArray(valor)
  );
}

function campo(objeto: Record<string, unknown>, chaves: string[]) {
  for (const chave of chaves) {
    const valor = objeto[chave];

    if (
      typeof valor === "string" ||
      typeof valor === "number"
    ) {
      return String(valor);
    }
  }

  return "";
}

function severidadeNumero(valor: unknown): number {
  const texto = normalizarTexto(valor);

  if (
    texto.includes("EXTREME") ||
    texto.includes("GRANDE PERIGO") ||
    texto.includes("VERMELHO")
  ) {
    return 3;
  }

  if (
    texto.includes("SEVERE") ||
    texto.includes("PERIGO") ||
    texto.includes("LARANJA")
  ) {
    return 2;
  }

  if (
    texto.includes("MODERATE") ||
    texto.includes("PERIGO POTENCIAL") ||
    texto.includes("AMARELO")
  ) {
    return 1;
  }

  return 0;
}

function severidadeTexto(valor: unknown): string {
  const texto = normalizarTexto(valor);

  if (
    texto.includes("EXTREME") ||
    texto.includes("GRANDE PERIGO") ||
    texto.includes("VERMELHO")
  ) {
    return "Grande Perigo";
  }

  if (
    texto.includes("SEVERE") ||
    texto === "PERIGO" ||
    texto.includes("LARANJA")
  ) {
    return "Perigo";
  }

  if (
    texto.includes("MODERATE") ||
    texto.includes("PERIGO POTENCIAL") ||
    texto.includes("AMARELO")
  ) {
    return "Perigo Potencial";
  }

  return (
    typeof valor === "string" && valor.trim()
      ? valor
      : "Aviso Meteorológico"
  );
}

function encontrarObjetoAlerta(item: unknown): Record<string, unknown> {
  if (!item || typeof item !== "object") {
    return {};
  }

  const objeto = item as Record<string, unknown>;

  if (
    objeto.properties &&
    typeof objeto.properties === "object" &&
    !Array.isArray(objeto.properties)
  ) {
    return {
      ...(objeto.properties as Record<string, unknown>),
      geometry: objeto.geometry,
    };
  }

  return objeto;
}

function alertaEhRioClaro(item: unknown): boolean {
  const texto = textoDoObjeto(item);

  return (
    texto.includes(CIDADE) ||
    texto.includes(CODIGO_IBGE)
  );
}

function alertaVigente(item: Record<string, unknown>): boolean {
  const agora = Date.now();

  const inicio = campo(item, [
    "inicio",
    "início",
    "onset",
    "effective",
    "data_inicio",
    "dataInicio",
    "validade_inicio",
  ]);

  const fim = campo(item, [
    "fim",
    "término",
    "termino",
    "expires",
    "data_fim",
    "dataFim",
    "validade_fim",
  ]);

  // O endpoint /avisos/ativos do INMET também pode devolver avisos
  // já publicados cujo período de validade começa nas próximas horas.
  // Esses avisos precisam aparecer no portal antes do início para que
  // a comunidade seja alertada com antecedência. Por isso, não
  // descartamos o aviso apenas porque \"inicio\" ainda é futuro.
  // Mantemos somente a proteção contra avisos já encerrados.
  void inicio;

  if (fim) {
    const fimMs = new Date(fim).getTime();

    if (!Number.isNaN(fimMs) && agora > fimMs) {
      return false;
    }
  }

  return true;
}

function formatarAlerta(item: unknown): AlertaNormalizado {
  const alerta = encontrarObjetoAlerta(item);

  const severidadeValor = campo(alerta, [
    "severidade",
    "severity",
    "nivel",
    "nivel_severidade",
    "nivelSeveridade",
    "cor",
  ]);

  const titulo =
    campo(alerta, [
      "titulo",
      "título",
      "headline",
      "event",
      "evento",
      "descricao_evento",
      "descricaoEvento",
    ]) || "Alerta meteorológico";

  const inicio =
    campo(alerta, [
      "inicio",
      "início",
      "onset",
      "effective",
      "data_inicio",
      "dataInicio",
      "validade_inicio",
    ]) || null;

  const fim =
    campo(alerta, [
      "fim",
      "término",
      "termino",
      "expires",
      "data_fim",
      "dataFim",
      "validade_fim",
    ]) || null;

  return {
    id:
      campo(alerta, [
        "id",
        "identifier",
        "id_aviso",
        "idAviso",
        "codigo",
      ]) ||
      `inmet-${Date.now()}-${Math.random().toString(36).slice(2)}`,

    titulo,

    severidade: severidadeTexto(severidadeValor),

    severidadeNivel: severidadeNumero(severidadeValor),

    inicio,

    fim,

    descricao:
      campo(alerta, [
        "descricao",
        "description",
        "texto",
        "detalhes",
      ]) || "",

    instrucao:
      campo(alerta, [
        "instrucao",
        "instrução",
        "instruction",
        "recomendacao",
        "recomendação",
      ]) || "",

    area:
      campo(alerta, [
        "area",
        "área",
        "areaDesc",
        "municipios",
        "municipios_afetados",
        "municipiosAfetados",
      ]) || "Rio Claro e região",

    fonte:
      campo(alerta, [
        "fonte",
        "senderName",
        "orgao",
        "órgão",
      ]) || "Instituto Nacional de Meteorologia - INMET",
  };
}

async function buscarFonte(url: string) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 8000);
  try {
    const resposta = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: controlador.signal,
    });
    if (!resposta.ok) throw new Error(`INMET respondeu ${resposta.status}`);
    return await resposta.json();
  } finally { clearTimeout(temporizador); }
}

function codigoMunicipioNoAlerta(item: unknown): boolean {
  const texto = textoDoObjeto(item);
  return texto.includes(CODIGO_IBGE) || texto.includes(CIDADE);
}

async function buscarAlertasInmetSP(): Promise<unknown[]> {
  // Endpoint atual de avisos por UF. O "0" solicita os avisos vigentes.
  const dados = await buscarFonte("https://apitempo.inmet.gov.br/api/v3/avisos/0/SP");
  return extrairLista(dados);
}

async function buscarAlertasLegado(): Promise<unknown[]> {
  const dados = await buscarFonte("https://apiprevmet3.inmet.gov.br/avisos/ativos");
  return extrairLista(dados);
}

export async function GET() {
  const erros: string[] = [];
  let itens: unknown[] = [];
  let endpoint = "INMET API v3";

  try {
    itens = await buscarAlertasInmetSP();
  } catch (erro) {
    erros.push(erro instanceof Error ? erro.message : "Falha na API v3");
    endpoint = "INMET legado";
    try {
      itens = await buscarAlertasLegado();
    } catch (erroLegado) {
      erros.push(erroLegado instanceof Error ? erroLegado.message : "Falha no endpoint legado");
      return NextResponse.json({
        sucesso: false, cidade: "Rio Claro", estado: UF,
        possuiAlerta: false, quantidade: 0, alertas: [],
        indisponivel: true,
        erro: "Não foi possível confirmar os avisos do INMET agora.",
        fonte: "INMET", detalhes: erros,
      }, { status: 200 });
    }
  }

  const alertas = itens
    .filter(codigoMunicipioNoAlerta)
    .map((item) => encontrarObjetoAlerta(item))
    .filter(alertaVigente)
    .map((item) => formatarAlerta(item))
    .sort((a, b) => b.severidadeNivel - a.severidadeNivel);

  return NextResponse.json({
    sucesso: true, cidade: "Rio Claro", estado: UF,
    possuiAlerta: alertas.length > 0, quantidade: alertas.length, alertas,
    atualizadoEm: new Date().toISOString(), fonte: "INMET", endpoint,
  });
}
