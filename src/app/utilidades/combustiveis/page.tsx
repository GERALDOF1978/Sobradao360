"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Preco = {
  revenda: string; cnpj: string; endereco: string; bairro: string; cep: string;
  produto: string; dataColeta: string; valor: number; bandeira: string;
};
type Resposta = { sucesso: boolean; atualizadoEm: string | null; precos: Preco[]; aviso?: string; erro?: string };

const abas = ["GASOLINA", "ETANOL", "DIESEL S10", "DIESEL"] as const;

export default function CombustiveisPage() {
  const [dados, setDados] = useState<Resposta | null>(null);
  const [aba, setAba] = useState<string>("GASOLINA");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    fetch("/api/combustiveis").then(r => r.json()).then(setDados).catch(() =>
      setDados({ sucesso: false, atualizadoEm: null, precos: [], erro: "Não foi possível carregar os preços." })
    );
  }, []);

  const lista = useMemo(() => {
    const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    return (dados?.precos || []).filter(p => {
      const prod = norm(p.produto);
      const bateProduto = aba === "DIESEL" ? prod === "DIESEL" || prod.includes("S500") || prod.includes("S-500") :
        aba === "DIESEL S10" ? prod.includes("DIESEL") && prod.includes("S10") || prod.includes("S-10") :
        prod.includes(aba);
      const q = norm(busca);
      return bateProduto && (!q || norm(p.revenda + " " + p.bairro + " " + p.bandeira).includes(q));
    }).sort((a,b) => a.valor - b.valor);
  }, [dados, aba, busca]);

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-slate-900">
      <header className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white shadow-md">
        <div className="mx-auto max-w-md px-4 py-4 text-center">
          <div className="text-3xl">⛽</div>
          <h1 className="mt-1 text-xl font-black">Combustíveis em Rio Claro</h1>
          <p className="mt-1 text-[11px] text-white/85">Preços pesquisados oficialmente pela ANP</p>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          {abas.map(item => <button key={item} onClick={() => setAba(item)}
            className={`rounded-xl px-3 py-3 text-xs font-black ${aba === item ? "bg-emerald-700 text-white shadow" : "bg-white text-slate-700"}`}>
            {item === "ETANOL" ? "🌱 Etanol" : item === "GASOLINA" ? "⛽ Gasolina" : "🚚 " + item.replace("DIESEL ", "Diesel ")}
          </button>)}
        </div>

        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="🔎 Buscar posto, bairro ou bandeira"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600" />

        {dados?.atualizadoEm && <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-center text-[11px] font-bold text-blue-800">
          📅 Preços coletados em {dados.atualizadoEm} • Fonte: ANP
        </div>}

        {!dados && <div className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-500">Consultando a ANP...</div>}
        {dados && !dados.sucesso && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{dados.erro}</div>}
        {dados?.sucesso && lista.length === 0 && <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">{dados.aviso || "Nenhum preço encontrado para este combustível na pesquisa mais recente."}</div>}

        <div className="space-y-3">
          {lista.map((p, i) => (
            <article key={p.cnpj + p.produto + i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {i === 0 && <span className="mb-1 inline-block rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800">🏆 MENOR PREÇO PESQUISADO</span>}
                  <h2 className="text-sm font-black leading-5 text-slate-900">{p.revenda}</h2>
                  <p className="mt-0.5 text-[10px] font-bold text-slate-500">{p.bandeira}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[9px] font-black uppercase text-slate-400">{p.produto}</p>
                  <p className="text-2xl font-black text-emerald-700">R$ {p.valor.toFixed(3).replace(".", ",")}</p>
                  <p className="text-[9px] text-slate-400">por litro</p>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-600">
                <p>📍 {p.endereco}{p.bairro ? " • " + p.bairro : ""}</p>
                <p>🗓️ Coleta: {p.dataColeta}</p>
              </div>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.endereco + ", Rio Claro, SP")}`}
                target="_blank" rel="noreferrer"
                className="mt-3 block rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-black text-slate-700">
                📍 Ver no mapa
              </a>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-4 text-amber-900">
          <b>Importante:</b> os valores são da pesquisa da ANP e não são preços em tempo real. O preço na bomba pode ter mudado após a data da coleta.
        </div>
        <Link href="/utilidades" className="block text-center text-xs font-black text-blue-800">← Voltar para Utilidades</Link>
      </main>
    </div>
  );
}
