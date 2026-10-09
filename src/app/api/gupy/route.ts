import { NextResponse } from "next/server";

export const revalidate = 600;

const ENDPOINT = "https://portal.gupy.io/api/job-search/jobs";
const PAGE_SIZE = 12;
const MAX_PAGES = 15;

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
    let total = Infinity;

    for (let pagina = 0; pagina < MAX_PAGES && pagina * PAGE_SIZE < total; pagina++) {
      const url = new URL(ENDPOINT);
      url.searchParams.set("jobName", "Rio Claro SP");
      url.searchParams.set("limit", String(PAGE_SIZE));
      url.searchParams.set("offset", String(pagina * PAGE_SIZE));

      const response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        next: { revalidate: 600 },
      });
      if (!response.ok) throw new Error(`Gupy retornou HTTP ${response.status}`);

      const resultado = await response.json();
      if (!Array.isArray(resultado?.data)) throw new Error("Formato inesperado da Gupy");
      if (Number.isFinite(Number(resultado?.pagination?.total))) {
        total = Number(resultado.pagination.total);
      }
      if (resultado.data.length === 0) break;

      for (const item of resultado.data as GupyJob[]) {
        if (normalizar(item.city) !== "RIO CLARO") continue;
        if (!["SAO PAULO", "SP"].includes(normalizar(item.state))) continue;
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

    const vagas = [...encontrados.values()].map((vaga) => ({
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
      { success: true, vagas, fonte: "Gupy", total: vagas.length },
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
