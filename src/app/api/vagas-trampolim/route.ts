import { NextResponse } from "next/server";

const TRAMPOLIM_API =
  "https://www.trampolim.sp.gov.br/api/v1/vacancy-allowany/search/";

export async function GET() {
  try {
    const params = new URLSearchParams({
      smart_filter: "false",
      q: "",
      type: "vacancy",
      order_by: "latest",
      page: "1",
      page_limit: "50",
      status: "available",
      status: "extended",
      locale: "Rio Claro",
      operation_range: "25",
    });

    const response = await fetch(
      `${TRAMPOLIM_API}?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Trampolim retornou HTTP ${response.status}`
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      fonte: "Trampolim",
      cidade: "Rio Claro",
      raio: "25 km",
      total: data.count ?? 0,
      paginas: data.pages ?? 1,
      vagas: data.data ?? [],
    });
  } catch (error) {
    console.error(
      "Erro ao buscar vagas do Trampolim:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível consultar as vagas do Trampolim.",
      },
      {
        status: 500,
      }
    );
  }
}