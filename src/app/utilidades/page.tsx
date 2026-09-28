"use client";

import Link from "next/link";
import TelefonesUteisLista from "@/components/TelefonesUteisLista";

export default function UtilidadesPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">

      {/* CABEÇALHO */}
      <header className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">

          <Link
            href="/"
            className="text-white text-xs font-bold hover:text-amber-400 transition"
          >
            ← Início
          </Link>

          <h1 className="font-black text-sm text-white">
            📞 Telefones Úteis
          </h1>

          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg">
            Rio Claro
          </span>

        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* APRESENTAÇÃO */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl">
              📞
            </div>

            <div>
              <h2 className="font-black text-lg">
                Telefones Úteis
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Encontre rapidamente telefones e canais de atendimento de Rio Claro.
              </p>
            </div>

          </div>

        </section>

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