// src/app/api/alertas/route.ts

import { NextResponse } from "next/server";

const CIDADE = "RIO CLARO";
const UF = "SP";

interface AlertaINMET {
  id?: string;
  identifier?: string;
  event?: string;
  headline?: string;
  description?: string;
  instruction?: string;
  severity?: string;
  urgency?: string;
  certainty?: string;
  effective?: string;
  onset?: string;
  expires?: string;
  senderName?: string;
  areaDesc?: string;
  polygon?: string;
}

function normalizarTexto(valor: unknown): string {
  if (typeof valor !== "string") return "";

  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function alertaEhRioClaro(alerta: AlertaINMET): boolean {
  const texto = normalizarTexto(
    [
      alerta.areaDesc,
      alerta.headline,
      alerta.description,
      alerta.event,
    ].join(" ")
  );

  return (
    texto.includes(CIDADE) &&
    texto.includes(UF)
  );
}

function alertaVigente(alerta: AlertaINMET): boolean {
  const agora = Date.now();

  const inicio = alerta.onset || alerta.effective;
  const fim = alerta.expires;

  if (inicio) {
    const inicioMs = new Date(inicio).getTime();

    if (!Number.isNaN(inicioMs) && agora < inicioMs) {
      return false;
    }
  }

  if (fim) {
    const fimMs = new Date(fim).getTime();

    if (!Number.isNaN(fimMs) && agora > fimMs) {
      return false;
    }
  }

  return true;
}

function severidadeNumero(severidade?: string) {
  const valor = normalizarTexto(severidade);

  if (valor.includes("EXTREME")) return 3;
  if (valor.includes("SEVERE")) return 2;
  if (valor.includes("MODERATE")) return 1;

  return 0;
}

function severidadeTexto(severidade?: string) {
  const valor = normalizarTexto(severidade);

  if (valor.includes("EXTREME")) {
    return "Grande Perigo";
  }

  if (valor.includes("SEVERE")) {
    return "Perigo";
  }

  if (valor.includes("MODERATE")) {
    return "Perigo Potencial";
  }

  return severidade || "Aviso Meteorológico";
}

function formatarAlerta(alerta: AlertaINMET) {
  return {
    id:
      alerta.identifier ||
      alerta.id ||
      `inmet-${Date.now()}`,

    evento:
      alerta.event ||
      alerta.headline ||
      "Alerta meteorológico",

    titulo:
      alerta.headline ||
      alerta.event ||
      "Alerta meteorológico",

    severidade: severidadeTexto(alerta.severity),

    severidadeNivel: severidadeNumero(alerta.severity),

    inicio:
      alerta.onset ||
      alerta.effective ||
      null,

    fim:
      alerta.expires ||
      null,

    descricao:
      alerta.description ||
      "",

    instrucao:
      alerta.instruction ||
      "",

    area:
      alerta.areaDesc ||
      "Rio Claro e região",

    fonte:
      alerta.senderName ||
      "Instituto Nacional de Meteorologia - INMET",
  };
}

async function buscarFonte(url: string) {
  const resposta = await fetch(url, {
    headers: {
      Accept: "application/json",
    },

    next: {
      revalidate: 300,
    },
  });

  if (!resposta.ok) {
    throw new Error(
      `INMET respondeu ${resposta.status}`
    );
  }

  return resposta.json();
}

export async function GET() {
  try {
    /*
     * O INMET publica seus avisos no ecossistema WIS2
     * em formato CAP.
     *
     * A consulta abaixo tenta obter as notificações
     * recentes do WIS2.
     */

    const url =
      "https://wis2bra.inmet.gov.br/oapi/collections/messages/items" +
      "?limit=100";

    const dados = await buscarFonte(url);

    const itens = Array.isArray(dados?.features)
      ? dados.features
      : Array.isArray(dados?.items)
      ? dados.items
      : [];

    const alertas: AlertaINMET[] = [];

    for (const item of itens) {
      const properties =
        item?.properties || item || {};

      const alerta: AlertaINMET = {
        id:
          properties.id ||
          item?.id,

        identifier:
          properties.identifier ||
          properties.alertIdentifier,

        event:
          properties.event,

        headline:
          properties.headline,

        description:
          properties.description,

        instruction:
          properties.instruction,

        severity:
          properties.severity,

        urgency:
          properties.urgency,

        certainty:
          properties.certainty,

        effective:
          properties.effective,

        onset:
          properties.onset,

        expires:
          properties.expires,

        senderName:
          properties.senderName,

        areaDesc:
          properties.areaDesc,

        polygon:
          item?.geometry,
      };

      if (!alertaEhRioClaro(alerta)) {
        continue;
      }

      if (!alertaVigente(alerta)) {
        continue;
      }

      alertas.push(alerta);
    }

    const formatados = alertas
      .map(formatarAlerta)
      .sort(
        (a, b) =>
          b.severidadeNivel -
          a.severidadeNivel
      );

    return NextResponse.json({
      sucesso: true,
      cidade: "Rio Claro",
      estado: "SP",
      possuiAlerta: formatados.length > 0,
      quantidade: formatados.length,
      alertas: formatados,
      atualizadoEm: new Date().toISOString(),
      fonte: "INMET",
    });
  } catch (erro) {
    console.error(
      "Erro ao consultar alertas do INMET:",
      erro
    );

    /*
     * Importante:
     * se o serviço externo estiver indisponível,
     * não mostramos um falso alerta.
     */

    return NextResponse.json(
      {
        sucesso: false,
        cidade: "Rio Claro",
        estado: "SP",
        possuiAlerta: false,
        quantidade: 0,
        alertas: [],
        erro:
          "Não foi possível consultar os avisos meteorológicos do INMET.",
        fonte: "INMET",
      },
      {
        status: 200,
      }
    );
  }
}