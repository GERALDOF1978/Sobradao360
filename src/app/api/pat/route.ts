import { NextResponse } from "next/server";

export async function GET() {
  try {
    // API oficial do Trampolim
    const targetUrl =
      "https://www.trampolim.sp.gov.br/api/v1/vacancy-allowany/search/?smart_filter=false&q=&type=vacancy&order_by=latest&page=1&page_limit=50&locale=Rio+Claro&operation_range=25&status=available&status=extended";

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
      next: { revalidate: 86400 },
    });

    let vagas: any[] = [];

    if (response.ok) {
      const contentType = response.headers.get("content-type");

      if (
        contentType &&
        contentType.includes("application/json")
      ) {
        const data = await response.json();

        if (data && Array.isArray(data.data)) {
          vagas = data.data.map(
            (vaga: any, index: number) => ({
              id:
                `trampolim-vaga-${vaga.id || index}`,

              titulo:
                vaga.name ||
                vaga.title ||
                "Vaga de Emprego",

              descricao:
                vaga.description ||
                "Confira os requisitos e candidate-se através do portal oficial Trampolim.",

              categoria: "Empregos",

              salario:
                vaga.salary
                  ? String(vaga.salary)
                  : "A combinar",

              oficial: true,

              autorUid: "trampolim-oficial",

              autorNome: "Trampolim",

              autorFoto:
                vaga.logo ||
                "https://www.trampolim.sp.gov.br/favicon.ico",

              createdAt:
                vaga.publication_date ||
                new Date().toISOString(),

              // Informações extras da vaga
              empresa:
                vaga.company ||
                vaga.trade_name ||
                "",

              cidade:
                vaga.city ||
                "Rio Claro",

              bairro:
                vaga.neighborhood ||
                "",

              quantidadeVagas:
                vaga.number_vacancies ||
                "",

              beneficios:
                vaga.benefits ||
                "",

              prazo:
                vaga.vacancy_viewing_deadline ||
                "",

              url:
                vaga.url ||
                "",

              idTrampolim:
                vaga.id || "",
            })
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      vagas,
      total: vagas.length,
      fonte: "Trampolim",
      cidade: "Rio Claro",
      raio: "25 km",
    });
  } catch (error) {
    console.error(
      "Erro ao buscar vagas do Trampolim:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        vagas: [],
        total: 0,
        fonte: "Trampolim",
        erro: "Não foi possível consultar as vagas do Trampolim.",
      },
      {
        status: 500,
      }
    );
  }
}