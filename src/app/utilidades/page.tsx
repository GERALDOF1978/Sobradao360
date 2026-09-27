"use client";

import Link from "next/link";
import TelefonesUteisLista from "@/components/TelefonesUteisLista";

export default function UtilidadesPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">

      {/* HEADER */}
      <header className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 border-b border-blue-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">

          <Link
            href="/"
            className="text-white text-xs font-bold hover:text-amber-400 transition"
          >
            ← Início
          </Link>

          <h1 className="font-black text-sm text-white">
            📞 Utilidades
          </h1>

          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg shadow">
            Serviços
          </span>

        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* APRESENTAÇÃO */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
              📞
            </div>

            <div>
              <h2 className="font-black text-lg">
                Telefones úteis
              </h2>

              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Serviços públicos, emergência,
                saúde, água, energia, internet
                e outros contatos importantes.
              </p>
            </div>

          </div>

        </section>

        {/* SUBMENU */}
        <section className="bg-white border border-slate-200 rounded-3xl p-3 shadow-sm">

          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2">
            Utilidades
          </p>

          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">

            <span className="shrink-0 bg-amber-100 text-amber-800 border border-amber-200 rounded-xl px-3 py-2 text-[10px] font-black">
              💧 Água
            </span>

            <span className="shrink-0 bg-slate-100 text-slate-700 rounded-xl px-3 py-2 text-[10px] font-black">
              ⚡ Energia
            </span>

            <span className="shrink-0 bg-slate-100 text-slate-700 rounded-xl px-3 py-2 text-[10px] font-black">
              🌐 Internet
            </span>

            <span className="shrink-0 bg-slate-100 text-slate-700 rounded-xl px-3 py-2 text-[10px] font-black">
              🏥 Saúde
            </span>

            <span className="shrink-0 bg-slate-100 text-slate-700 rounded-xl px-3 py-2 text-[10px] font-black">
              🚨 Emergência
            </span>

            <span className="shrink-0 bg-slate-100 text-slate-700 rounded-xl px-3 py-2 text-[10px] font-black">
              💬 WhatsApp
            </span>

          </div>

        </section>

        {/* LISTA EXISTENTE */}
        <TelefonesUteisLista />

        {/* RODAPÉ */}
        <div className="text-center pt-3">

          <p className="text-[10px] text-slate-400">
            Sobradão 360 • Serviços úteis para a comunidade
          </p>

        </div>

      </main>
    </div>
  );
}