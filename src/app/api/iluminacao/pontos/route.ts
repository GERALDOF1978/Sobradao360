import { NextResponse } from "next/server";

const SOMASIG_URL =
  "https://ip.somasig.com.br/api/ponto-iluminacao/featureCollection/rioclaro";

export async function GET() {
  try {
    const resposta = await fetch(SOMASIG_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!resposta.ok) {
      return NextResponse.json(
        { sucesso: false, erro: "Não foi possível consultar os pontos de iluminação." },
        { status: resposta.status }
      );
    }

    const dados = await resposta.json();

    return NextResponse.json(dados, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (erro) {
    console.error("Erro ao consultar pontos de iluminação:", erro);
    return NextResponse.json(
      { sucesso: false, erro: "Serviço de iluminação indisponível no momento." },
      { status: 502 }
    );
  }
}
