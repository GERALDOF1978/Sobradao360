"use client";

import Link from "next/link";

import NegociosMarquee from "@/components/NegociosMarquee";

const servicosRapidos = [
  {
    titulo: "Anuncie",
    icone: "📢",
    cor: "bg-emerald-600",
    link: "/anuncie",
  },
  {
    titulo: "Empregos",
    icone: "💼",
    cor: "bg-indigo-600",
    link: "/empregos",
  },
  {
    titulo: "Voz do Morador",
    icone: "💬",
    cor: "bg-emerald-700",
    link: "/comunidade",
  },
  {
    titulo: "Notícias",
    icone: "📰",
    cor: "bg-teal-600",
    link: "/noticias",
  },
  {
    titulo: "Utilidades",
    icone: "📞",
    cor: "bg-slate-700",
    link: "/utilidades",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">

      <main className="max-w-md mx-auto px-3 sm:px-4 py-4 space-y-5">

        {/* ==========================================
            1. BANNER PRINCIPAL
            SOMENTE A ARTE
        ========================================== */}

        <section className="w-full overflow-hidden rounded-3xl shadow-xl border border-slate-200 bg-white">

          <img
            src="https://i.ibb.co/zTTKfgLt/banner-s360-webp.webp"
            alt="Banner Sobradão 360"
            className="w-full h-auto object-cover block"
          />

        </section>

        {/* ==========================================
            2. CATEGORIAS PRINCIPAIS
            UMA ÚNICA LINHA
        ========================================== */}

        <section className="space-y-2">

          <div className="px-1">

            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Categorias principais
            </h2>

          </div>

          <div className="w-full overflow-x-auto scrollbar-hide">

            <div className="flex gap-2 min-w-max">

              {servicosRapidos.map(
                (servico) => (
                  <Link
                    key={servico.titulo}
                    href={servico.link}
                    className="bg-white border border-slate-200 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-sm hover:border-amber-400 hover:shadow-md transition group w-[78px] min-h-[82px] shrink-0"
                  >

                    <div
                      className={`w-9 h-9 rounded-xl ${servico.cor} flex items-center justify-center text-white text-base shadow-md group-hover:scale-110 transition`}
                    >
                      {servico.icone}
                    </div>

                    <span className="text-[9px] font-bold text-slate-700 leading-tight text-center">
                      {servico.titulo}
                    </span>

                  </Link>
                )
              )}

            </div>

          </div>

        </section>

        {/* ==========================================
            3. NEGÓCIOS DO SOBRADÃO
            MARQUEE
        ========================================== */}

        <NegociosMarquee />

        {/* ==========================================
            4. PUBLICIDADE
            BANNER RETANGULAR
        ========================================== */}

        <section className="space-y-2">

          <div className="px-1">

            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Publicidade
            </h2>

          </div>

          <Link
            href="/loja-explicativa?anunciante=novo"
            className="block w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-amber-400 hover:shadow-md transition"
          >

            <div className="aspect-[3/1] bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">

              <div className="text-center px-4">

                <p className="text-[10px] text-amber-300 font-black uppercase tracking-widest">
                  Banner Retangular
                </p>

                <p className="text-lg font-black text-white mt-1">
                  Sua empresa aqui
                </p>

                <p className="text-[10px] text-blue-100 mt-1">
                  Clique e saiba como anunciar
                </p>

              </div>

            </div>

          </Link>

        </section>

        {/* ==========================================
            5. PUBLICIDADE
            2 POR LINHA
        ========================================== */}

        <section className="space-y-2">

          <div className="px-1">

            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Destaques
            </h2>

          </div>

          <div className="grid grid-cols-2 gap-3">

            <Link
              href="/loja-explicativa?anunciante=novo"
              className="aspect-[3/2] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-amber-400 transition"
            >

              <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center p-3 text-center">

                <div>

                  <p className="text-[9px] text-emerald-100 font-bold uppercase">
                    Anuncie
                  </p>

                  <p className="text-sm font-black text-white">
                    Sua marca
                  </p>

                </div>

              </div>

            </Link>

            <Link
              href="/loja-explicativa?anunciante=novo"
              className="aspect-[3/2] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-amber-400 transition"
            >

              <div className="w-full h-full bg-gradient-to-br from-indigo-700 to-indigo-950 flex items-center justify-center p-3 text-center">

                <div>

                  <p className="text-[9px] text-indigo-100 font-bold uppercase">
                    Anuncie
                  </p>

                  <p className="text-sm font-black text-white">
                    Seu negócio
                  </p>

                </div>

              </div>

            </Link>

          </div>

        </section>

        {/* ==========================================
            6. PUBLICIDADE
            4 POR TELA
        ========================================== */}

        <section className="space-y-2">

          <div className="px-1">

            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Parceiros
            </h2>

          </div>

          <div className="grid grid-cols-4 gap-2">

            {[
              "Sua marca",
              "Seu negócio",
              "Seu serviço",
              "Anuncie aqui",
            ].map((titulo) => (
              <Link
                key={titulo}
                href="/loja-explicativa?anunciante=novo"
                className="aspect-square bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-amber-400 transition"
              >

                <div className="w-full h-full bg-slate-800 flex items-center justify-center p-2 text-center">

                  <span className="text-[9px] font-black text-white leading-tight">
                    {titulo}
                  </span>

                </div>

              </Link>
            ))}

          </div>

        </section>

      </main>

    </div>
  );
}