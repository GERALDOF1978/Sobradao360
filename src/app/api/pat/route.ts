import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Tenta requisitar a API de busca do Trampolim
    const targetUrl = "https://www.trampolim.sp.gov.br/pt/busca/?smart_filter=false&q=&type=vacancy&order_by=latest&page=1&page_limit=15&status=available&status=extended&locale=Rio+Claro&operation_range=25";

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
      },
      next: { revalidate: 86400 } // Atualiza a cada 24 horas
    });

    let vagas: any[] = [];

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data && Array.isArray(data.items)) {
          vagas = data.items.map((vaga: any, index: number) => ({
            id: `pat-vaga-${vaga.id || index}`,
            titulo: vaga.title || vaga.occupation_name || "Vaga de Emprego PAT",
            descricao: vaga.description || "Consulte os requisitos e candidate-se através do portal oficial Trampolim.",
            categoria: "Empregos",
            salario: vaga.salary ? `R$ ${vaga.salary}` : "A combinar",
            oficial: true,
            autorUid: "pat-oficial",
            autorNome: "PAT Rio Claro",
            autorFoto: "https://rioclaro.sp.gov.br/wp-content/uploads/2022/10/cropped-Brasao-32x32.png",
            createdAt: new Date().toISOString(),
          }));
        }
      }
    }

    // Se a raspagem direta do SPA for bloqueada pela proteção do Governo,
    // garantimos a exibição de cards oficiais individuais atualizados
    if (vagas.length === 0) {
      vagas = [
        {
          id: "pat-vaga-1",
          titulo: "Vagas Abertas no PAT - Consultar Mural Oficial",
          descricao: "O Posto de Atendimento ao Trabalhador de Rio Claro atualizou o quadro de oportunidades. Clique no botão acima para visualizar e enviar seu currículo diretamente.",
          categoria: "Empregos",
          salario: "Consultar no Trampolim",
          oficial: true,
          autorUid: "pat-oficial",
          autorNome: "PAT Rio Claro",
          autorFoto: "https://rioclaro.sp.gov.br/wp-content/uploads/2022/10/cropped-Brasao-32x32.png",
          createdAt: new Date().toISOString(),
        }
      ];
    }

    return NextResponse.json({ success: true, vagas });
  } catch (error) {
    console.error("Erro ao buscar vagas do PAT:", error);
    return NextResponse.json({ success: false, vagas: [] }, { status: 500 });
  }
}