"use client";
import { useEffect, useState } from "react";
type Semana = { semana: number; casos: number; estimados: number; nivel: number };
type Dados = { sucesso: boolean; ano: number; semanas: Semana[]; totalNotificados?: number; atualizadoEm?: string; fonte?: string; aviso?: string; erro?: string };
export default function DengueAtualizacao() {
 const [dados,setDados]=useState<Dados|null>(null);
 useEffect(()=>{let ativo=true;fetch("/api/dengue").then(async r=>{const j=await r.json();if(ativo)setDados(j)}).catch(()=>{if(ativo)setDados({sucesso:false,ano:new Date().getFullYear(),semanas:[],erro:"Não foi possível consultar os dados."})});return()=>{ativo=false}},[]);
 if(!dados)return <section className="rounded-2xl bg-white p-5 shadow-sm" aria-live="polite"><h2 className="font-black">Evolução semanal da dengue</h2><p className="mt-2 text-sm text-slate-500">Consultando InfoDengue...</p></section>;
 if(!dados.sucesso)return <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-black">Evolução semanal da dengue</h2><p className="mt-2 text-sm text-slate-600">{dados.erro || "Dados indisponíveis no momento."} O boletim municipal permanece disponível abaixo.</p></section>;
 const ultimas=dados.semanas.slice(-16);const max=Math.max(1,...ultimas.map(s=>s.casos));
 return <section className="rounded-2xl bg-white p-5 shadow-sm">
   <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Atualização automática • InfoDengue</p>
   <h2 className="mt-1 text-xl font-black">Dengue em Rio Claro — {dados.ano}</h2>
   <div className="mt-4 rounded-xl bg-emerald-50 p-4"><p className="text-xs font-semibold text-emerald-900">Notificações nas semanas disponíveis</p><p className="mt-1 text-3xl font-black text-emerald-800">{dados.totalNotificados?.toLocaleString("pt-BR")}</p></div>
   <h3 className="mt-5 text-sm font-black">Evolução por semana epidemiológica</h3>
   <p className="mt-1 text-xs text-slate-500">Últimas {ultimas.length} semanas disponíveis • casos notificados, sujeitos a revisão.</p>
   <div className="mt-4 flex h-44 items-end gap-1 border-b border-slate-200" role="img" aria-label={"Casos notificados nas últimas semanas: "+ultimas.map(s=>`semana ${s.semana%100}: ${s.casos}`).join(", ")}>
     {ultimas.map(s=><div key={s.semana} className="group relative flex min-w-0 flex-1 flex-col items-center justify-end h-full" title={`Semana ${s.semana%100}: ${s.casos} notificações`}><span className="mb-1 text-[9px] font-bold text-slate-600">{s.casos}</span><div className="w-full max-w-8 rounded-t bg-emerald-600" style={{height:`${Math.max(s.casos?4:1,(s.casos/max)*110)}px`}}/><span className="mt-1 text-[9px] text-slate-500">{s.semana%100}</span></div>)}
   </div>
   <p className="mt-5 text-xs leading-5 text-slate-600">{dados.aviso}</p>
   <p className="mt-1 text-xs text-slate-500">Consulta realizada em {dados.atualizadoEm?new Date(dados.atualizadoEm).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"}):"data não informada"}. O cache é renovado a cada 6 horas.</p>
   <a className="mt-3 inline-block text-xs font-bold text-emerald-800 underline" href={dados.fonte} target="_blank" rel="noopener noreferrer">Fonte dos dados: InfoDengue ↗</a>
 </section>;
}
