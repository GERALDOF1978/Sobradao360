"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Noticia = { id: number; titulo: string; data: string; resumo: string };

export default function NoticiasDaaePage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [status, setStatus] = useState("carregando");
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const resposta = await fetch("/api/noticias-daae");
        if (!resposta.ok) throw new Error("Falha");
        const dados = await resposta.json();
        if (!Array.isArray(dados.noticias)) throw new Error("Resposta inválida");
        if (ativo) { setNoticias(dados.noticias); setStatus("ok"); }
      } catch { if (ativo) setStatus("erro"); }
    }
    carregar();
    const intervalo = setInterval(carregar, 15 * 60 * 1000);
    return () => { ativo = false; clearInterval(intervalo); };
  }, []);
  return <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-900">
    <div className="mx-auto max-w-3xl">
      <Link href="/daae" className="text-xs font-bold text-cyan-700">← Voltar ao DAAE</Link>
      <h1 className="mt-3 text-xl font-black">💧 Notícias e avisos do DAAE</h1>
      <p className="mt-1 text-xs text-slate-500">Publicações oficiais · atualização automática a cada 15 minutos</p>
      <section className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
        {status === "carregando" && <p className="py-4 text-sm">Carregando notícias...</p>}
        {status === "erro" && <p className="py-4 text-sm text-slate-500">As notícias estão temporariamente indisponíveis.</p>}
        {status === "ok" && noticias.length === 0 && <p className="py-4 text-sm">Nenhuma notícia disponível.</p>}
        {noticias.map(n => <Link key={n.id} href={`/utilidades/daae/noticias/${n.id}`} className="flex items-start justify-between gap-3 py-4 hover:text-cyan-700">
          <span><strong className="block text-sm">{n.titulo}</strong><span className="mt-1 block text-[11px] text-slate-500">{n.data ? new Date(n.data).toLocaleDateString("pt-BR") : ""}</span></span>
          <span className="shrink-0 text-xs font-black text-cyan-700">Ler →</span>
        </Link>)}
      </section>
      <p className="mt-3 text-xs text-slate-500">Fonte: Departamento Autônomo de Água e Esgoto de Rio Claro.</p>
    </div>
  </main>;
}
