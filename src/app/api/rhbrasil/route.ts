import { NextResponse } from "next/server";

export const revalidate = 300;

const RHBRASIL_API =
  "https://www.rhbrasil.com.br/portaldocandidato/service/ajax_service.php?action=getVagas&filtros%5Bid_vagas_pcd%5D=N&filtros%5Bcd_uf%5D=SP&filtros%5Bnm_cidade%5D=RIO%20CLARO";

export async function GET() {
  try {
    const response = await fetch(RHBRASIL_API, {
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36",
        Referer:
          "https://www.rhbrasil.com.br/portaldocandidato/view/buscar-vagas-publica.php",
        "X-Requested-With": "XMLHttpRequest",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`RHBrasil respondeu ${response.status}`);
    }

    const dados = await response.json();
    const vagas = Array.isArray(dados?.vagas) ? dados.vagas : [];

    return NextResponse.json(
      { success: true, vagas, fonte: "RHBrasil" },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Erro ao consultar vagas da RHBrasil:", error);
    return NextResponse.json(
      { success: false, vagas: [], error: "Não foi possível consultar a RHBrasil agora." },
      { status: 502 }
    );
  }
}
