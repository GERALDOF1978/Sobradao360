import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 1800;

type JoobleJob = { id?: string | number; title?: string; company?: string; location?: string; snippet?: string; salary?: string; link?: string; updated?: string; type?: string };
type JoobleResponse = { jobs?: JoobleJob[] };

export async function GET() {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return NextResponse.json({ success: false, vagas: [], erro: "Jooble ainda não configurada." }, { status: 503 });
  try {
    const response = await fetch("https://jooble.org/api/" + encodeURIComponent(key), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ keywords: "", location: "Rio Claro, São Paulo, Brasil", radius: "25", page: "1" }),
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error("Jooble HTTP " + response.status);
    const data: JoobleResponse = await response.json();
    if (!Array.isArray(data.jobs)) throw new Error("Resposta Jooble inesperada.");
    const vagas = data.jobs.filter(job => {
      if (!job.title || !job.link) return false;
      try { const u = new URL(job.link); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; }
    }).map(job => ({
      id: String(job.id || job.link),
      titulo: String(job.title),
      empresa: String(job.company || "Empresa não informada"),
      descricao: String(job.snippet || "").replace(/<[^>]*>/g, " ").trim().slice(0, 1000),
      cidade: String(job.location || ""),
      salario: job.salary ? String(job.salary) : null,
      url: String(job.link),
      publicadaEm: job.updated || null,
      tipoContrato: job.type || null,
      origem: "jooble",
    }));
    return NextResponse.json({ success: true, vagas });
  } catch (error) {
    console.error("Erro ao consultar Jooble:", error);
    return NextResponse.json({ success: false, vagas: [], erro: "Não foi possível consultar vagas da Jooble." }, { status: 502 });
  }
}
