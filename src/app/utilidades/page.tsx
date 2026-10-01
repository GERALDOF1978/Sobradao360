"use client";

import Link from "next/link";
import TelefonesUteisLista from "@/components/TelefonesUteisLista";
import MiniCardsAnuncio from "@/components/MiniCardsAnuncio";

export default function UtilidadesPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">

      {/* CABEÇALHO */}
      <header className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 text-white shadow-md">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="text-xs font-bold text-white/90 hover:text-white">← Início</Link>
            <div className="text-center">
              <div className="text-2xl">📞</div>
              <h1 className="text-xl font-black">Telefones Úteis</h1>
            </div>
            <span className="rounded-lg bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950">Rio Claro</span>
          </div>
          <p className="mt-2 text-center text-[11px] leading-4 text-white/90">
            Telefones e canais de atendimento de Rio Claro em um só lugar.
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-3 space-y-4">
        <MiniCardsAnuncio />

        {/* MENU DE FILTROS
            O componente TelefonesUteisLista já possui
            o menu de categorias. Portanto, não criamos
            outro menu aqui para evitar duplicidade.
        */}
        <TelefonesUteisLista />

        {/* RODAPÉ */}
        <div className="text-center pt-2">
          <p className="text-[10px] text-slate-400">
            Sobradão 360 • Telefones Úteis
          </p>
        </div>

      </main>
    </div>
  );
}