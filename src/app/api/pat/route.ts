import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  try {
    const url = "https://www.trampolim.sp.gov.br/pt/busca/?smart_filter=false&q=&type=vacancy&order_by=latest&page=1&page_limit=15&status=available&status=extended&locale=Rio+Claro&operation_range=25";

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 86400 } // Revalida e atualiza automaticamente a cada 24 horas
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    const vagas: any[] = [];

    // 1. Tenta extrair a lista direta de vagas do JSON embutido na página (Next.js / Nuxt data)
    $('script').each((_, element) => {
      const content = $(element).html() || '';
      if (element.attribs.id === '__NEXT_DATA__' || content.includes('vacancies')) {
        try {
          const parsed = JSON.parse(content);
          // Procura dentro da estrutura do JSON por arrays de vagas
          const listaBruta = parsed?.props?.pageProps?.vacancies || parsed?.props?.pageProps?.initialState?.vacancies || [];
          
          listaBruta.forEach((vaga: any, index: number) => {
            vagas.push({
              id: `pat-vaga-${vaga.id || index}`,
              titulo: vaga.title || vaga.occupation || vaga.name,
              descricao: vaga.description || `Vaga de ${vaga.title || "emprego"} disponibilizada pelo PAT de Rio Claro. Acesse o Trampolim para candidatar-se.`,
              categoria: "Empregos",
              salario: vaga.salary ? `R$ ${vaga.salary}` : "A combinar",
              oficial: true,
              autorUid: "pat-oficial",
              autorNome: "PAT Rio Claro",
              autorFoto: "https://rioclaro.sp.gov.br/wp-content/uploads/2022/10/cropped-Brasao-32x32.png",
              createdAt: new Date().toISOString(),
            });
          });
        } catch (e) {
          // Ignora erros de parse de scripts irrelevantes
        }
      }
    });

    // 2. Se a extração via JSON não encontrar itens, varre os blocos visíveis do HTML
    if (vagas.length === 0) {
      $('article, div[class*="vacancy"], div[class*="job"], div[class*="card"]').each((index, element) => {
        const titulo = $(element).find('h2, h3, h4, [class*="title"]').first().text().trim();
        const descricao = $(element).find('p, [class*="description"], [class*="summary"]').first().text().trim();
        const salario = $(element).find('[class*="salary"], [class*="wage"]').first().text().trim();

        // Evita duplicados e títulos vazios ou irrelevantes
        if (titulo && titulo.length > 3 && !vagas.some(v => v.titulo === titulo)) {
          vagas.push({
            id: `pat-html-${index}`,
            titulo: titulo,
            descricao: descricao || "Vaga oficial capturada do sistema do Posto de Atendimento ao Trabalhador de Rio Claro.",
            categoria: "Empregos",
            salario: salario || "A combinar",
            oficial: true,
            autorUid: "pat-oficial",
            autorNome: "PAT Rio Claro",
            autorFoto: "https://rioclaro.sp.gov.br/wp-content/uploads/2022/10/cropped-Brasao-32x32.png",
            createdAt: new Date().toISOString(),
          });
        }
      });
    }

    return NextResponse.json({ success: true, vagas });
  } catch (error) {
    console.error("Erro na busca de vagas do PAT:", error);
    return NextResponse.json({ success: false, vagas: [] }, { status: 500 });
  }
}