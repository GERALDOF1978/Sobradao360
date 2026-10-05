"use client";

import Link from "next/link";

const OFICIAL_URL = "https://ip.somasig.com.br/ocorrencias/rioclaro";

export default function NovaOcorrenciaIluminacaoPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      <section className="bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500 text-white">
        <div className="mx-auto max-w-2xl px-4 py-4 text-center">
          <div className="text-3xl">💡</div>
          <h1 className="mt-1 text-lg font-black">Nova ocorrência de iluminação</h1>
          <p className="mt-1 text-xs text-white/90">Teste da integração do Sobradão 360 com o serviço de Rio Claro</p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="font-black text-amber-900">🚧 Área de teste</div>
          <p className="mt-2 text-sm leading-6 text-amber-900/80">
            Estamos preparando o formulário próprio com mapa dos pontos de iluminação, escolha do defeito e retorno do protocolo.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-black">O que teremos aqui</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-3">🗺️ Mapa com os pontos de iluminação</div>
            <div className="rounded-2xl bg-slate-50 p-3">📍 Seleção do poste/ponto correto</div>
            <div className="rounded-2xl bg-slate-50 p-3">💡 Escolha do tipo de defeito</div>
            <div className="rounded-2xl bg-slate-50 p-3">🧾 Envio e exibição do protocolo oficial</div>
          </div>
        </div>

        <a
          href={OFICIAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl bg-amber-500 px-5 py-4 text-center font-black text-white shadow-md transition hover:bg-amber-600"
        >
          💡 Abrir sistema oficial agora
        </a>

        <Link
          href="/lampada-queimada"
          className="block rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700"
        >
          Voltar para Lâmpada Queimada
        </Link>
      </section>
    </main>
  );
}
