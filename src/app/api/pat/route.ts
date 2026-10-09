import { NextResponse } from "next/server";

function campo(v:any,...chaves:string[]):any {
  for(const chave of chaves) {
    const valor=chave.split(".").reduce((obj,k)=>obj?.[k],v);
    if(valor!==null&&valor!==undefined&&valor!=="") return valor;
  }
  return null;
}
function texto(v:any):string {
  if(v==null) return "";
  if(typeof v==="string"||typeof v==="number") return String(v);
  if(typeof v==="object") return texto(v.name??v.trade_name??v.label??v.value??v.title);
  return "";
}
function salario(v:any):string|null {
  if(v==null||v==="") return null;
  if(typeof v==="object") {
    const min=v.min??v.minimum??v.from;
    const max=v.max??v.maximum??v.to;
    if(min!=null||max!=null) return [min,max].filter(x=>x!=null).map(salario).join(" a ");
    return salario(v.value??v.amount??v.label);
  }
  const n=Number(v);
  if(typeof v==="number"||(typeof v==="string"&&/^\\d+(?:\\.\\d+)?$/.test(v.trim()))) return n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  return texto(v);
}
function imagem(v:any):string {
  const s=texto(v);
  return s.startsWith("https://") || s.startsWith("http://") ? s : "";
}
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
      next: { revalidate: 300 },
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
          vagas = data.data.map((vaga: any, index: number) => {
            const empresa = texto(campo(vaga,"company.trade_name","company.name","company_name","company","trade_name","employer.name","employer","business.name"));
            const foto = imagem(campo(vaga,"company.logo.url","company.logo","company.image","company.avatar","company_logo","logo_url","logo","image_url","image","employer.logo"));
            return {
              id:`trampolim-vaga-${vaga.id??index}`,
              titulo:texto(campo(vaga,"name","title","job_title"))||"Vaga de Emprego",
              descricao:texto(campo(vaga,"description","details"))||"Confira os requisitos e candidate-se através do portal oficial Trampolim.",
              categoria:"Empregos",
              salario:salario(campo(vaga,"salary","salary_value","salary_amount","remuneration","salary_range","salary_min")),
              oficial:true,
              autorUid:"trampolim-oficial",
              autorNome:empresa||"Trampolim",
              autorFoto:foto||"",
              imagemUrl:foto||null,
              createdAt:campo(vaga,"publication_date","published_at","publishedAt","date_published","created_at","createdAt","publicationDate","published_date")||null,
              empresa:empresa||null,
              cidade:texto(campo(vaga,"city.name","city","location.city"))||"Rio Claro",
              bairro:texto(campo(vaga,"neighborhood","district")),
              quantidadeVagas:campo(vaga,"number_vacancies","vacancies_count","quantity"),
              beneficios:texto(campo(vaga,"benefits","benefits_description")),
              prazo:campo(vaga,"vacancy_viewing_deadline","deadline"),
              url:texto(campo(vaga,"url","link")),
              idTrampolim:vaga.id??"",
            };
          });
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