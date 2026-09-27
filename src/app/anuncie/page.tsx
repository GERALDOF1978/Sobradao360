"use client";

import { useState } from "react";
import Link from "next/link";

export default function AnunciePage() {
  const [subCategoria, setSubCategoria] = useState<string | null>(null);

  const subcategorias = [
    {
      id: "compre-venda",
      nome: "Compre & Venda",
      icone: "🛒",
    },
    {
      id: "alimentacao",
      nome: "Alimentação",
      icone: "🍰",
    },
    {
      id: "reformas",
      nome: "Reformas",
      icone: "🛠️",
    },
    {
      id: "lazer",
      nome: "Lazer",
      icone: "🏡",
    },
    {
      id: "automotivo",
      nome: "Automotivo",
      icone: "🚗",
    },
    {
      id: "zeladoria",
      nome: "Zeladoria",
      icone: "🧹",
    },
    {
      id: "pet-saude",
      nome: "Pet & Saúde",
      icone: "🐾",
    },
    {
      id: "eventos",
      nome: "Eventos",
      icone: "🎉",
    },
  ];

  const categoriaSelecionada = subcategorias.find(
    (cat) => cat.nome === subCategoria
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4">
      <div className="max-w-4xl mx-auto">

        {/* CABEÇALHO */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-xs bg-white border border-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl shadow-sm"
          >
            ← Início
          </Link>

          <h1 className="text-lg font-black">
            📢 Anuncie
          </h1>

          <div className="w-16" />
        </div>

        {/* ESCOLHA DA SUBCATEGORIA */}
        {!subCategoria && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">
                O que você deseja anunciar?
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Escolha uma categoria para continuar.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subcategorias.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSubCategoria(cat.nome)}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center min-h-[150px]"
                >
                  <span className="text-5xl mb-3">
                    {cat.icone}
                  </span>

                  <span className="font-bold text-slate-700 text-center">
                    {cat.nome}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* CATEGORIA ESCOLHIDA */}
        {subCategoria && (
          <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-6 md:p-8 text-center">

            <div className="text-6xl mb-4">
              {categoriaSelecionada?.icone}
            </div>

            <h2 className="text-2xl font-black text-slate-900">
              {subCategoria}
            </h2>

            <p className="text-sm text-slate-500 mt-2 mb-8">
              Você escolheu esta categoria para publicar seu anúncio.
            </p>

            {/* BOTÃO QUE ABRE O FORMULÁRIO EXISTENTE */}
            <Link
              href={`/classificados?categoria=${encodeURIComponent(
                subCategoria
              )}&publicar=1`}
              className="w-full max-w-md mx-auto bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-md transition flex items-center justify-center gap-2"
            >
              📢 PUBLICAR ANÚNCIO
            </Link>

            <button
              type="button"
              onClick={() => setSubCategoria(null)}
              className="mt-5 text-sm text-red-500 hover:underline font-medium"
            >
              ← Escolher outra categoria
            </button>

          </div>
        )}

      </div>
    </div>
  );
}