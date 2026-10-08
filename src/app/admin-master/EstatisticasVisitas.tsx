"use client";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";

type Dados = {hoje:number;total:number;ativos:number;atualizadoEm:string};
export default function EstatisticasVisitas() {
  const [dados,setDados] = useState<Dados|null>(null);
  const [erro,setErro] = useState("");
  useEffect(()=>{
    let ativo = true;
    const carregar = async () => {
      try {
        const usuario = getAuth().currentUser;
        if(!usuario) throw new Error("Faça login como Master.");
        const token = await usuario.getIdToken();
        const res = await fetch("/api/metricas-visitas",{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
        if(!res.ok) throw new Error("Não foi possível consultar as estatísticas.");
        const resultado:Dados = await res.json();
        if(ativo) {setDados(resultado);setErro("");}
      } catch(e) {if(ativo)setErro(e instanceof Error?e.message:"Erro ao carregar");}
    };
    void carregar();
    const timer = window.setInterval(()=>void carregar(),30000);
    return ()=>{ativo=false;clearInterval(timer);};
  },[]);
  return <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="text-xl font-black">📊 Visitas do portal</h2>
    <p className="mt-1 text-sm text-slate-500">Informações exclusivas do Master. Atualização a cada 30 segundos.</p>
    {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {([["👥 Ativos agora",dados?.ativos,"Sessões com atividade nos últimos 5 minutos"],["📅 Visitas hoje",dados?.hoje,"Sessões iniciadas ou retomadas hoje"],["🌐 Total de visitas",dados?.total,"Desde a ativação da medição"]] as const).map(([titulo,valor,sub])=>
        <div key={titulo} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-600">{titulo}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{valor ?? "—"}</p>
          <p className="mt-1 text-xs text-slate-500">{sub}</p>
        </div>
      )}
    </div>
    <p className="mt-4 text-xs text-slate-500">Valores aproximados: abas abertas e bloqueadores podem afetar a contagem. Nenhum dado histórico anterior à instalação é recuperado.</p>
  </section>;
}
