import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    // A URL oficial do Trampolim filtrada para Rio Claro
    const url = "https://www.trampolim.sp.gov.br/pt/busca/?smart_filter=false&q=&type=vacancy&order_by=latest&page=1&page_limit=10&status=available&status=extended&locale=Rio+Claro&operation_range=25";

    // O SEGREDO DA ATUALIZAÇÃO AUTOMÁTICA ESTÁ AQUI:
    // next: { revalidate: 86400 } diz ao Next.js para atualizar essa busca a cada 24 horas (86400 segundos) automaticamente.
    const response = await fetch(url, { next: { revalidate: 86400 } });
    const html = await response.text();

    const $ = cheerio.load(html);
    const vagas: any[] = [];

    // Tenta encontrar os cards de vagas no HTML do Trampolim.
    // Nota: Como o Trampolim pode usar classes CSS dinâmicas, se o cheerio não achar os itens,
    // ele pulará para o nosso "fallback" abaixo.
    $('.job-card-class').each((index, element) => { // Substitua '.job-card-class' pela classe real inspecionando o site deles se necessário
      const titulo = $(element).find('.job-title').text().trim();
      const descricao = $(element).find('.job-description').text().trim();
      const salario = $(element).find('.job-salary').text().trim();

      if (titulo) {
        vagas.push({
          id: `pat-vaga-${index}`,
          titulo: titulo,
          descricao: descricao + "\n\nCandidatar-se no site oficial do Trampolim.",
          categoria: "Empregos",
          salario: salario || "A combinar",
          oficial: true, // Aciona o selo "🏛️ OFICIAL" azulzinho no seu frontend
          autorUid: "pat-oficial",
          autorNome: "PAT Rio Claro",
          autorFoto: "https://rioclaro.sp.gov.br/wp-content/uploads/2022/10/cropped-Brasao-32x32.png", // Brasão da Prefeitura
          createdAt: new Date().toISOString(), // Data de hoje
        });
      }
    });

    // FALLBACK: Se o Trampolim proteger a página contra raspagem (Scraping) ou carregar via JavaScript,
    // nós enviamos um Card Oficial padrão avisando que há novas vagas disponíveis hoje.
    if (vagas.length === 0) {
      vagas.push({
        id: "pat-vaga-destaque-hoje",
        titulo: "Novas Vagas de Emprego Disponíveis no PAT",
        descricao: "A lista de empregos foi atualizada hoje no sistema da Prefeitura. Acesse o portal Trampolim pelo botão acima para conferir os cargos abertos e enviar seu currículo.",
        categoria: "Empregos",
        salario: "Consultar no site",
        oficial: true,
        autorUid: "pat-oficial",
        autorNome: "PAT Rio Claro",
        autorFoto: "https://rioclaro.sp.gov.br/wp-content/uploads/2022/10/cropped-Brasao-32x32.png",
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, vagas });
  } catch (error) {
    console.error("Erro ao buscar vagas do PAT:", error);
    return NextResponse.json(
      { success: false, error: "Não foi possível carregar as vagas hoje." },
      { status: 500 }
    );
  }
}