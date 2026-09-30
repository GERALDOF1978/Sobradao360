"use client";

import Link from "next/link";

const tipos = [
  {
    icone: "🛒",
    titulo: "Loja de produtos",
    texto: "Cadastre produtos, preços, fotos e formas de contato para seus clientes.",
  },
  {
    icone: "🔧",
    titulo: "Oficina e automotivo",
    texto: "Mostre serviços, especialidades, endereço, horário e WhatsApp.",
  },
  {
    icone: "🧱",
    titulo: "Profissionais e serviços",
    texto: "Pedreiros, eletricistas, diaristas, técnicos e outros profissionais podem apresentar seus serviços.",
  },
  {
    icone: "🍰",
    titulo: "Alimentação",
    texto: "Divulgue bolos, salgados, marmitas, lanches, cardápios e encomendas.",
  },
  {
    icone: "🎉",
    titulo: "Eventos e lazer",
    texto: "Apresente espaços, festas, chácaras, serviços e atrações da região.",
  },
  {
    icone: "📱",
    titulo: "Contato direto",
    texto: "Facilite o contato pelo WhatsApp, telefone e localização do estabelecimento.",
  },
];

export default function LojaExplicativaPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      <header className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 border-b border-emerald-700 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-white text-xs font-bold hover:text-amber-300 transition"
          >
            ← Início
          </Link>

          <h1 className="font-black text-sm text-white">
            🏪 Página do Parceiro
          </h1>

          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg">
            Sobradão 360
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 rounded-3xl p-6 text-white shadow-lg">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -right-12 bottom-0 w-40 h-40 rounded-full bg-white/5" />

          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-3xl mb-4">
              🏪
            </div>

            <h2 className="text-2xl font-black leading-tight">
              Tenha sua própria página no Sobradão 360
            </h2>

            <p className="text-sm text-emerald-50 mt-3 leading-relaxed">
              Seu negócio merece um espaço próprio dentro do portal da
              comunidade. Apresente o que você faz e facilite o contato com
              moradores da região.
            </p>

            <Link
              href="/quero-divulgar"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm px-5 py-3.5 rounded-2xl shadow-md transition"
            >
              📢 Quero divulgar meu negócio
            </Link>

            <Link
              href="/planos-anunciante"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20"
            >
              💳 Ver planos e condições
            </Link>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
              💡
            </div>

            <div>
              <h3 className="font-black text-base">
                Não é apenas um anúncio
              </h3>

              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                A ideia é criar um ambiente próprio para cada parceiro. O
                formato da página pode acompanhar o tipo de negócio.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3">
          {tipos.map((item) => (
            <div
              key={item.titulo}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">
                {item.icone}
              </div>

              <div>
                <h3 className="font-black text-sm text-slate-900">
                  {item.titulo}
                </h3>

                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {item.texto}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section className="bg-slate-900 rounded-3xl p-5 text-white shadow-sm">
          <h3 className="font-black text-base">
            Como funciona?
          </h3>

          <div className="mt-4 space-y-3">
            {[
              ["1", "Cadastre ou divulgue seu negócio"],
              ["2", "Informe o tipo de atividade"],
              ["3", "Monte sua página com as informações do negócio"],
              ["4", "Moradores encontram você pelo Sobradão 360"],
            ].map(([numero, texto]) => (
              <div key={numero} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                  {numero}
                </span>

                <span className="text-xs text-slate-200">
                  {texto}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-amber-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📍</div>

            <div>
              <h3 className="font-black text-sm">
                Feito para a comunidade
              </h3>

              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                O Sobradão 360 conecta moradores e negócios locais em um só
                lugar, valorizando quem trabalha e empreende na região.
              </p>
            </div>
          </div>
        </section>

        <Link
          href="/"
          className="block text-center text-xs font-bold text-slate-500 hover:text-emerald-600 transition py-2"
        >
          ← Voltar para o Sobradão 360
        </Link>
      </main>
    </div>
  );
}