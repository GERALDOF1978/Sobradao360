"use client";

import Link from "next/link";

const OCORRENCIAS_URL = "https://ip.somasig.com.br/ocorrencias/rioclaro";

export default function LampadaQueimadaPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500 text-white">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Link href="/" className="inline-flex mb-5 text-sm font-semibold text-white/90 hover:text-white">
            ← Voltar para o Sobradão 360
          </Link>
          <div className="text-5xl mb-3">💡</div>
          <h1 className="text-3xl font-black">Lâmpada Queimada</h1>
          <p className="mt-2 text-sm leading-6 text-white/90">
            Solicite atendimento para iluminação pública com acesso organizado pelo Sobradão 360.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="text-4xl">💡</div>
          <h2 className="mt-3 text-xl font-black">Lâmpada apagada na rua?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use o canal de ocorrências de Rio Claro para informar o endereço e solicitar o reparo da iluminação pública.
          </p>

          <a
            href={OCORRENCIAS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block rounded-2xl bg-amber-500 px-5 py-4 text-center font-black text-white shadow-md hover:bg-amber-600 transition"
          >
            💡 Solicitar reparo
          </a>

          <p className="mt-3 text-center text-xs text-slate-400">
            Você será direcionado ao sistema oficial de ocorrências de Rio Claro.
          </p>
        </div>
      </section>
    </main>
  );
}
