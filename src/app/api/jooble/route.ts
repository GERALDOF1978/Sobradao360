import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 1800;

type JoobleJob = { id?: string | number; title?: string; company?: string; location?: string; snippet?: string; salary?: string; link?: string; updated?: string; type?: string };
type JoobleResponse = { jobs?: JoobleJob[] };

export async function GET() {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return NextResponse.json({ success: false, vagas: [], erro: "Jooble ainda não configurada." }, { status: 503 });
  try {
    const response = await fetch("https://br.jooble.org/api/" + encodeURIComponent(key), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ keywords: "", location: "Rio Claro", radius: "26", page: "1" }),
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      const mensagem = response.status === 403 ? "Acesso negado pela Jooble (403). Verifique se a chave foi emitida em br.jooble.org e está correta." : response.status === 404 ? "Endereço da API Jooble não encontrado (404)." : `Jooble retornou HTTP ${response.status}.`;
      return NextResponse.json({ success: false, vagas: [], erro: mensagem, codigoHttp: response.status }, { status: 502 });
    }
    const data: JoobleResponse = await response.json();
    if (!Array.isArray(data.jobs)) throw new Error("A Jooble retornou uma resposta sem lista de vagas.");
    // Excluir solicitações avulsas de serviços (corridas, orçamentos e eventos)
    // sem bloquear vagas legítimas de motorista, entregador ou trabalho temporário.
    const parecePedidoDeServico = (job: JoobleJob) => {
      const texto = [job.title, job.snippet].filter(Boolean).join(" ")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const titulo = String(job.title || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const origemServico = /cronoshare|habitissimo|fixando|zaask/.test(String(job.link || "").toLowerCase());
      const tituloServico = /(?:orcamento|solicitacao|preciso de|procurando|contratar|servico de|servicos de|para evento|para festa|para casamento|sem veiculo proprio)/.test(titulo);
      const pedidoPontual = /(?:voce esta disponivel|hoje\\s*(?:as|\\d)|uma corrida|uma viagem|qual o tipo de veiculo|qual veiculo voce precisa|atendimento em ate 24 horas|servico unico|servico pontual|orcamento para)/.test(texto);
      return origemServico || (tituloServico && pedidoPontual);
    };
    const vagas = data.jobs.filter(job => {
      if (parecePedidoDeServico(job)) return false;
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
    return NextResponse.json({ success: true, vagas, totalEncontrado: Number((data as JoobleResponse & { totalCount?: number }).totalCount || 0) });
  } catch (error) {
    console.error("Erro ao consultar Jooble:", error);
    return NextResponse.json({ success: false, vagas: [], erro: error instanceof Error && error.name === "TimeoutError" ? "Tempo de resposta da Jooble esgotado." : "Não foi possível consultar vagas da Jooble. Verifique os logs da Vercel." }, { status: 502 });
  }
}
