"use client";

import Link from "next/link";
import TelefonesUteisLista from "@/components/TelefonesUteisLista";
import MiniCardsAnuncio from "@/components/MiniCardsAnuncio";

export default function UtilidadesPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">
      <header className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 text-white shadow-md">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="text-xs font-bold text-white/90 hover:text-white">← Início</Link>
            <div className="text-center"><div className="text-2xl">📞</div><h1 className="text-xl font-black">Telefones e Serviços</h1></div>
            <span className="rounded-lg bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950">Rio Claro</span>
          </div>
          <p className="mt-2 text-center text-[11px] leading-4 text-white/90">Telefones públicos, profissionais e serviços da nossa região em um só lugar.</p>
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-3 space-y-4">
        <MiniCardsAnuncio />
        <Link href="/utilidades/transporte" className="block rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm hover:bg-sky-100">
          <div className="flex items-center gap-3"><div className="text-3xl">🚌</div><div className="flex-1"><p className="text-sm font-black text-slate-900">Transporte Público</p><p className="text-[11px] text-slate-600">Linha 06: horários, itinerário e ônibus em tempo real.</p></div><span className="font-black text-sky-700">›</span></div>
        </Link>
        <Link href="/utilidades/coleta-lixo" className="block rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm hover:bg-emerald-100">
          <div className="flex items-center gap-3"><div className="text-3xl">🗑️</div><div className="flex-1"><p className="text-sm font-black text-slate-900">Coleta de Lixo</p><p className="text-[11px] text-slate-600">Consulte seu bairro e veja os dias e o horário da coleta.</p></div><span className="font-black text-emerald-700">›</span></div>
        </Link>
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-slate-800">Conhece um profissional ou serviço?</p><p className="mt-0.5 text-[10px] text-slate-500">Envie as informações básicas para aprovação.</p></div><Link href="/utilidades/cadastrar" className="shrink-0 rounded-xl bg-amber-500 px-3 py-2 text-[10px] font-black text-white shadow-sm hover:bg-amber-600">➕ Cadastrar contato</Link></div>
        </section>
        <TelefonesUteisLista />
        <div className="text-center pt-2"><p className="text-[10px] text-slate-400">Sobradão 360 • Telefones e Serviços</p></div>
      </main>
    </div>
  );
}
