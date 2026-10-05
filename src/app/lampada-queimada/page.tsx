"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import MiniCardsAnuncio from "@/components/MiniCardsAnuncio";

const OCORRENCIAS_URL = "https://ip.somasig.com.br/ocorrencias/rioclaro";

type Consulta = {
  protocolo:string;
  ocorrencia:{
    id:number; ordemServico:number|null; situacao:string; status:string; prazo:string|null; data:string|null;
    ponto:{ id:number|null; codigo:string|null; tipoLogradouro:string; logradouro:string; numero:string; bairro:string; cep:string; luminarias:number|null; potencia:number|null };
  };
};

function dataBR(v:string|null) {
  if(!v) return "—";
  const d=new Date(v.replace(" ","T"));
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString("pt-BR");
}

export default function LampadaQueimadaPage() {
  const [protocolo,setProtocolo]=useState("");
  const [consulta,setConsulta]=useState<Consulta|null>(null);
  const [erro,setErro]=useState("");
  const [buscando,setBuscando]=useState(false);

  async function consultar(e:FormEvent) {
    e.preventDefault();
    const p=protocolo.replace(/\D/g,"");
    setErro(""); setConsulta(null);
    if(p.length!==9){ setErro("Digite os 9 números do protocolo."); return; }
    setBuscando(true);
    try{
      const r=await fetch(`/api/iluminacao/protocolo?protocolo=${encodeURIComponent(p)}`,{cache:"no-store"});
      const d=await r.json();
      if(!r.ok || !d?.sucesso) throw new Error(d?.erro || "Protocolo não encontrado.");
      setConsulta(d);
    }catch(x){ setErro(x instanceof Error ? x.message : "Não foi possível consultar agora."); }
    finally{ setBuscando(false); }
  }

  const o=consulta?.ocorrencia;
  const pt=o?.ponto;

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      <section className="bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500 text-white">
        <div className="mx-auto max-w-2xl px-4 py-5 text-center">
          <div className="text-3xl">💡</div>
          <h1 className="mt-1 text-xl font-black">Iluminação Pública</h1>
          <p className="mt-1 text-xs text-white/90">Registre e acompanhe solicitações de Rio Claro</p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <MiniCardsAnuncio />

        <div className="grid grid-cols-2 gap-3">
          <Link href="/lampada-queimada/nova" className="rounded-3xl bg-amber-500 p-5 text-white shadow-sm">
            <div className="text-3xl">➕</div><h2 className="mt-3 font-black">Nova ocorrência</h2>
            <p className="mt-1 text-[11px] leading-4 text-white/90">Informe um problema de iluminação.</p>
          </Link>
          <a href="#consultar" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-3xl">🔎</div><h2 className="mt-3 font-black">Consultar</h2>
            <p className="mt-1 text-[11px] leading-4 text-slate-500">Veja situação e prazo pelo protocolo.</p>
          </a>
        </div>

        <div id="consultar" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><div className="rounded-2xl bg-amber-100 p-3 text-2xl">📋</div><div><h2 className="font-black">Consultar protocolo</h2><p className="text-xs text-slate-500">Consulte uma solicitação já registrada.</p></div></div>
          <form onSubmit={consultar} className="mt-4">
            <label htmlFor="protocolo" className="text-xs font-black">Número do protocolo</label>
            <div className="mt-2 flex gap-2">
              <input id="protocolo" inputMode="numeric" maxLength={9} value={protocolo} onChange={e=>setProtocolo(e.target.value.replace(/\D/g,"").slice(0,9))} placeholder="Ex.: 261005038" className="min-w-0 flex-1 rounded-2xl border border-slate-300 px-4 py-3.5 text-base font-bold tracking-wider outline-none focus:border-amber-500" />
              <button disabled={buscando} className="rounded-2xl bg-slate-900 px-5 text-sm font-black text-white disabled:opacity-50">{buscando?"Buscando…":"Buscar"}</button>
            </div>
          </form>
          {erro && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{erro}</div>}

          {o && pt && (
            <div className="mt-5 overflow-hidden rounded-3xl border border-emerald-200">
              <div className="bg-emerald-50 p-5">
                <p className="text-[10px] font-black uppercase text-emerald-700">Protocolo oficial</p>
                <div className="mt-1 flex items-end justify-between gap-3"><p className="text-2xl font-black text-emerald-800">{consulta?.protocolo}</p><span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-700">{o.situacao || "Consultar"}</span></div>
                {o.status && <p className="mt-2 text-xs font-bold text-emerald-700">⏱️ {o.status}</p>}
              </div>
              <div className="space-y-4 p-5">
                <div><p className="text-[10px] font-black uppercase text-slate-400">Local</p><p className="mt-1 text-sm font-black">📍 {[pt.tipoLogradouro,pt.logradouro,pt.numero && `nº ${pt.numero}`].filter(Boolean).join(" ")}</p><p className="text-xs text-slate-500">{[pt.bairro,pt.cep && `CEP ${pt.cep}`].filter(Boolean).join(" • ")}</p></div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-2xl bg-slate-50 p-3"><b>Ocorrência</b><br/>#{o.id}</div>
                  <div className="rounded-2xl bg-slate-50 p-3"><b>Ordem de serviço</b><br/>{o.ordemServico ? `#${o.ordemServico}` : "—"}</div>
                  <div className="rounded-2xl bg-slate-50 p-3"><b>Registrada</b><br/>{dataBR(o.data)}</div>
                  <div className="rounded-2xl bg-slate-50 p-3"><b>Prazo informado</b><br/>{dataBR(o.prazo)}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-2xl bg-amber-50 p-3"><b>Ponto</b><br/>{pt.codigo ? `#${pt.codigo}` : pt.id ? `#${pt.id}` : "—"}</div>
                  <div className="rounded-2xl bg-amber-50 p-3"><b>Luminárias</b><br/>{pt.luminarias ?? "—"}</div>
                  <div className="rounded-2xl bg-amber-50 p-3"><b>Potência</b><br/>{pt.potencia!=null ? `${pt.potencia} W` : "—"}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-black">💡 Já existe um pedido para esse local?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Se você tiver o protocolo de uma solicitação anterior, consulte acima antes de abrir outra ocorrência. Assim você acompanha o andamento e evita pedidos duplicados.</p>
        </div>

        <a href={OCORRENCIAS_URL} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border-2 border-amber-400 bg-white px-5 py-3.5 text-center text-sm font-black text-amber-700">Abrir sistema oficial</a>
      </section>
    </main>
  );
}
