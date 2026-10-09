import { NextResponse } from "next/server";

export const revalidate = 600;

const ENDPOINT = "https://portal.gupy.io/api/job-search/jobs";
const PAGE_SIZE = 12;
const MAX_PAGES = 15;
const BUSCAS = ["Rio Claro SP", "Rio Claro", "Brascabos", "Assaí", "Assai"];
const DIAS_RECENTES = 15;

type GupyJob = {
  id?: number | string;
  name?: string;
  city?: string;
  state?: string;
  description?: string;
  careerPageName?: string;
  careerPageLogo?: string;
  jobUrl?: string;
  applicationDeadline?: string;
  publishedDate?: string;
  workplaceType?: string;
  type?: string;
};

function normalizar(value: unknown) {
  return String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function textoSimples(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  try {
    const encontrados = new Map<string, GupyJob>();
    const agora = Date.now();
    const limitePublicacao = agora - DIAS_RECENTES * 24 * 60 * 60 * 1000;
    let consultasValidas = 0;

    for (const termo of BUSCAS) {
      let total = Infinity;
      for (let pagina = 0; pagina < MAX_PAGES && pagina * PAGE_SIZE < total; pagina++) {
        const url = new URL(ENDPOINT);
        url.searchParams.set("jobName", termo);
        url.searchParams.set("limit", String(PAGE_SIZE));
        url.searchParams.set("offset", String(pagina * PAGE_SIZE));

        const response = await fetch(url.toString(), {
          headers: { Accept: "application/json" },
          next: { revalidate: 600 },
        });
        // Uma busca adicional falhar não deve esconder os resultados das outras.
        if (!response.ok) {
          console.warn("Busca Gupy indisponível:", termo, response.status);
          break;
        }

        const resultado = await response.json();
        if (!Array.isArray(resultado?.data)) break;
        consultasValidas++;
        if (Number.isFinite(Number(resultado?.pagination?.total))) {
          total = Number(resultado.pagination.total);
        }
        if (resultado.data.length === 0) break;

        for (const item of resultado.data as GupyJob[]) {
          if (normalizar(item.city) !== "RIO CLARO") continue;
          if (!["SAO PAULO", "SP"].includes(normalizar(item.state))) continue;
          // Apenas vagas publicadas nos últimos 15 dias, sem inventar data.
          const publicacao = Date.parse(String(item.publishedDate ?? ""));
          if (!Number.isFinite(publicacao) || publicacao < limitePublicacao || publicacao > agora) continue;
          const id = String(item.id ?? "");
          if (!/^\d+$/.test(id)) continue;
          if (typeof item.jobUrl !== "string") continue;
          try {
            const link = new URL(item.jobUrl);
            if (link.protocol !== "https:" || !link.hostname.endsWith(".gupy.io")) continue;
          } catch {
            continue;
          }
          if (item.applicationDeadline) {
            const vencimento = Date.parse(item.applicationDeadline);
            if (!Number.isNaN(vencimento) && vencimento < Date.now()) continue;
          }
          encontrados.set(id, item);
        }

        if (resultado.data.length < PAGE_SIZE) break;
      }
    }

    if (consultasValidas === 0) throw new Error("Nenhuma busca da Gupy respondeu corretamente");

    // Anúncios distintos podem ter IDs diferentes para o mesmo cargo e unidade.
    // Agrupar por empresa + título completo (inclusive bairro/unidade) + modalidade
    // + tipo de contrato. Preservar sempre o anúncio mais recente.
    const semRepeticoes = new Map<string, GupyJob>();
    const ordenadas = [...encontrados.values()].sort(
      (a, b) => Date.parse(String(b.publishedDate)) - Date.parse(String(a.publishedDate))
    );
    for (const vaga of ordenadas) {
      const chave = [
        normalizar(textoSimples(vaga.careerPageName)),
        normalizar(textoSimples(vaga.name)).replace(/\s+/g, " "),
        normalizar(vaga.city),
        normalizar(vaga.state),
        normalizar(vaga.workplaceType),
        normalizar(vaga.type),
      ].join("|");
      if (!semRepeticoes.has(chave)) semRepeticoes.set(chave, vaga);
    }

    const vagas = [...semRepeticoes.values()]
      .map((vaga) => ({
      id: String(vaga.id),
      titulo: textoSimples(vaga.name) || "Vaga Gupy",
      descricao: textoSimples(vaga.description),
      empresa: textoSimples(vaga.careerPageName) || "Empresa não informada",
      cidade: "Rio Claro",
      estado: "SP",
      imagemUrl: vaga.careerPageLogo || null,
      url: vaga.jobUrl,
      prazo: vaga.applicationDeadline || null,
      publicadaEm: vaga.publishedDate || null,
      formatoTrabalho: vaga.workplaceType || null,
      tipoContrato: vaga.type || null,
    }));

    return NextResponse.json(
      { success: true, vagas, fonte: "Gupy", total: vagas.length, periodoDias: DIAS_RECENTES },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Erro ao consultar vagas Gupy Rio Claro:", error);
    return NextResponse.json(
      { success: false, vagas: [], error: "Consulta da Gupy indisponível no momento." },
      { status: 502 }
    );
  }
}
