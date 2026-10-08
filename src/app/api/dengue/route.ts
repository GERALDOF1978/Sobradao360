import { NextResponse } from "next/server";

export const revalidate = 21600;
const IBGE_RIO_CLARO = "3543907";
type Registro = Record<string, unknown>;
function numero(v: unknown): number { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; }
export async function GET() {
  const ano = new Date().getUTCFullYear();
  const params = new URLSearchParams({ geocode: IBGE_RIO_CLARO, disease: "dengue", format: "json", ew_start: "1", ew_end: "53", ey_start: String(ano), ey_end: String(ano) });
  const fonte = `https://info.dengue.mat.br/api/alertcity?${params.toString()}`;
  try {
    const resposta = await fetch(fonte, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(15000), headers: { Accept: "application/json" } });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const json: unknown = await resposta.json();
    if (!Array.isArray(json)) throw new Error("Formato inesperado");
    const semanas = (json as Registro[]).map((r) => ({
      semana: numero(r.SE ?? r.se),
      casos: numero(r.casos),
      estimados: numero(r.casos_est),
      data: typeof (r.data_iniSE ?? r.data_ini_SE) === "string" ? String(r.data_iniSE ?? r.data_ini_SE) : null,
      nivel: numero(r.nivel),
    })).filter(r => r.semana >= ano * 100 + 1 && r.semana <= ano * 100 + 53).sort((a,b) => a.semana - b.semana);
    if (!semanas.length) throw new Error("Sem semanas disponíveis");
    return NextResponse.json({ sucesso: true, ano, municipio: "Rio Claro", ibge: IBGE_RIO_CLARO, fonte, atualizadoEm: new Date().toISOString(), semanas, totalNotificados: semanas.reduce((s,r) => s+r.casos,0), aviso: "Dados semanais de notificações do InfoDengue, sujeitos a revisão. Não equivalem necessariamente aos casos confirmados pela Prefeitura." });
  } catch {
    return NextResponse.json({ sucesso: false, ano, semanas: [], erro: "Os dados automáticos estão temporariamente indisponíveis." }, { status: 503 });
  }
}
