"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Resumo = { tituloPainel: string; descricaoHorario: string; aguardandoTriagem: number; triagensPlantao: number; aguardandoAtendimento: number; consultasRealizadasPlantao: number };
type Profissional = { codigo: number; nome: string; situacao: string; primeiroAtendimento: string | null; ultimoAtendimento: string | null };
type Classificacao = { codigo: number; descricao: string; cor: string; quantidadeAtendimentos: number };
type Painel = { id: number; resumo: Resumo | null; profissionais: Profissional[]; classificacao: Classificacao[] };
type Dados = { sucesso: boolean; atualizadoEm: string; atualizacaoSegundos: number; fonte: string; paineis: Painel[] };

function Atendimento({ painel }: { painel: Painel }) {
  const [detalhes, setDetalhes] = useState(false);
  const r = painel.resumo;
  if (!r) return null;
  const tipo = r.tituloPainel.includes("PEDIÁTRICO") ? "Pediátrico" : "Clínico";
  const profissionaisValidos = (painel.profissionais || []).filter(p => p.nome && !p.nome.toUpperCase().includes("PROFISSIONAL IDS"));
  const emAtendimento = profissionaisValidos.filter(p => p.situacao?.toLowerCase().includes("em atendimento")).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div><h3 className="text-base font-black text-slate-900">{tipo}</h3><p className="text-[10px] text-slate-500">{r.descricaoHorario}</p></div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700">ATUALIZA 30s</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-cyan-50 p-3"><p className="text-[10px] font-bold text-cyan-800">Aguardando triagem</p><p className="mt-1 text-3xl font-black text-cyan-700">{r.aguardandoTriagem}</p></div>
        <div className="rounded-xl bg-amber-50 p-3"><p className="text-[10px] font-bold text-amber-800">Aguardando atendimento</p><p className="mt-1 text-3xl font-black text-amber-600">{r.aguardandoAtendimento}</p></div>
        <div className="rounded-xl bg-violet-50 p-3"><p className="text-[10px] font-bold text-violet-800">Triagens no plantão</p><p className="mt-1 text-xl font-black text-violet-700">{r.triagensPlantao}</p></div>
        <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[10px] font-bold text-emerald-800">Consultas realizadas</p><p className="mt-1 text-xl font-black text-emerald-700">{r.consultasRealizadasPlantao}</p></div>
      </div>

      <button onClick={() => setDetalhes(v => !v)} className="mt-3 flex w-full items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-left text-xs font-black text-slate-700">
        <span>👨‍⚕️ Profissionais do plantão {profissionaisValidos.length ? `(${profissionaisValidos.length})` : ""}</span><span>{detalhes ? "▲" : "▼"}</span>
      </button>

      {detalhes && (
        <div className="mt-2 space-y-2">
          {profissionaisValidos.length > 0 && <p className="text-[10px] font-bold text-slate-500">{emAtendimento} em atendimento neste retorno da fonte</p>}
          {profissionaisValidos.map(p => (
            <div key={p.codigo} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2"><p className="text-xs font-black text-slate-800">{p.nome}</p><span className="shrink-0 text-[9px] font-black text-emerald-700">{p.situacao}</span></div>
              <p className="mt-1 text-[9px] text-slate-500">Primeiro: {p.primeiroAtendimento || "—"} • Último: {p.ultimoAtendimento || "—"}</p>
            </div>
          ))}
          {(painel.classificacao || []).length > 0 && (
            <div className="pt-1"><p className="mb-2 text-[10px] font-black uppercase text-slate-500">Classificações registradas no período</p>
              <div className="flex flex-wrap gap-2">{painel.classificacao.map(c => <span key={c.codigo} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700">{c.descricao}: {c.quantidadeAtendimentos}</span>)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UpasPage() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  const carregar = async () => {
    try {
      const r = await fetch("/api/saude/upas", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j.sucesso) throw new Error(j.erro || "Falha");
      setDados(j); setErro("");
    } catch { setErro("Não foi possível atualizar os dados agora."); }
  };
  useEffect(() => { carregar(); const t = setInterval(carregar, 30000); return () => clearInterval(t); }, []);

  const grupos = useMemo(() => {
    const ps = dados?.paineis || [];
    return [
      { nome: "UPA 29", paineis: ps.filter(p => p.id === 1 || p.id === 2) },
      { nome: "UPA Cervezão", paineis: ps.filter(p => p.id === 3 || p.id === 4) },
    ];
  }, [dados]);

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-slate-900">
      <header className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white shadow-md">
        <div className="mx-auto max-w-md px-4 py-4 text-center">
          <div className="text-2xl">🏥</div><h1 className="text-xl font-black">UPAs Agora</h1>
          <p className="mt-1 text-[11px] text-white/80">Atendimento público em Rio Claro</p>
        </div>
      </header>
      <main className="mx-auto max-w-md space-y-4 px-3 py-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-[10px] leading-4 text-blue-900">
          <b>Dados informativos.</b> A ordem de atendimento é definida pela classificação de risco, não apenas pela quantidade de pessoas aguardando. Em emergência, ligue <b>192</b>.
        </div>
        {!dados && !erro && <div className="rounded-2xl bg-white p-6 text-center text-sm font-bold text-slate-500">Atualizando dados das UPAs...</div>}
        {erro && <div className="rounded-2xl bg-red-50 p-4 text-center text-xs font-bold text-red-700">{erro}<button onClick={carregar} className="ml-2 underline">Tentar novamente</button></div>}
        {dados && grupos.map(g => (
          <section key={g.nome} className="space-y-2">
            <div className="flex items-end justify-between px-1"><h2 className="text-lg font-black">{g.nome}</h2><span className="text-[9px] text-slate-400">Clínico + Pediátrico</span></div>
            {g.paineis.map(p => <Atendimento key={p.id} painel={p} />)}
          </section>
        ))}
        {dados && <div className="rounded-2xl bg-white p-3 text-center text-[9px] leading-4 text-slate-500">Fonte: {dados.fonte}. Atualização automática a cada 30 segundos.<br/>Os totais de triagens, consultas e classificações referem-se ao período informado pela fonte.</div>}
        <div className="text-center"><Link href="/utilidades" className="text-xs font-black text-blue-700">← Telefones e Serviços</Link></div>
      </main>
    </div>
  );
}
