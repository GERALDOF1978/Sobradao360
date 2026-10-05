"use client";

import Link from "next/link";
import MiniCardsAnuncio from "@/components/MiniCardsAnuncio";

const OCORRENCIAS_URL = "https://ip.somasig.com.br/ocorrencias/rioclaro";

export default function LampadaQueimadaPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500 text-white">
        <div className="mx-auto max-w-2xl px-4 py-2.5">
          <div className="relative flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg">💡</div>
              <h1 className="text-base font-black">Lâmpada Queimada</h1>
            </div>
            <span className="absolute right-0 rounded-lg bg-white/20 px-2 py-1 text-[9px] font-black">Rio Claro</span>
          </div>
          <p className="mt-1 text-center text-[10px] leading-3 text-white/85">
            Solicite reparo da iluminação pública.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-3 space-y-4">
        <MiniCardsAnuncio />
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="text-4xl">💡</div>
          <h2 className="mt-3 text-xl font-black">Lâmpada apagada na rua?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use o canal de ocorrências de Rio Claro para informar o endereço e solicitar o reparo da iluminação pública.
          </p>

          <Link
            href="/lampada-queimada/nova"
            className="mt-5 block rounded-2xl bg-amber-500 px-5 py-4 text-center font-black text-white shadow-md transition hover:bg-amber-600"
          >
            ✨ Testar novo formulário
          </Link>

          <p className="mt-2 text-center text-[11px] leading-4 text-slate-500">
            Nova opção do Sobradão 360. O canal oficial continua disponível abaixo.
          </p>

          <a
            href={OCORRENCIAS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block rounded-2xl border-2 border-amber-400 bg-white px-5 py-3.5 text-center text-sm font-black text-amber-700 transition hover:bg-amber-50"
          >
            💡 Usar sistema oficial
          </a>

          <p className="mt-3 text-center text-xs text-slate-400">
            Se o novo formulário não funcionar, use normalmente o sistema oficial de ocorrências de Rio Claro.
          </p>
        </div>
      </section>
    </main>
  );
}
