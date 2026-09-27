"use client";

import { useState } from "react";

export default function AnunciePage() {
  const [subCategoria, setSubCategoria] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-2xl font-bold mb-2 text-center text-slate-900">
          Criar Novo Anúncio
        </h1>

        {!subCategoria ? (
          <>
            <p className="text-center mb-6 text-gray-600">
              O que você deseja anunciar?
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subcategorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSubCategoria(cat.nome)}
                  className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <span className="text-4xl mb-3">
                    {cat.icone}
                  </span>

                  <span className="font-semibold text-gray-700 text-center">
                    {cat.nome}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : !publicando ? (
          <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 text-center">

            <div className="text-5xl mb-4">
              {subcategorias.find(
                (cat) => cat.nome === subCategoria
              )?.icone}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {subCategoria}
            </h2>

            <p className="text-gray-500 mb-8">
              Você está criando um anúncio nesta categoria.
            </p>

            <button
              onClick={() => setPublicando(true)}
              className="w-full max-w-md mx-auto block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-md transition"
            >
              📢 PUBLICAR ANÚNCIO
            </button>

            <button
              onClick={() => setSubCategoria(null)}
              className="mt-4 text-sm text-red-500 hover:underline font-medium"
            >
              ← Voltar para categorias
            </button>

          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">

            <div className="flex justify-between items-center mb-6 gap-4">
              <div>
                <p className="text-xs text-gray-500">
                  Categoria
                </p>

                <h2 className="text-xl font-bold text-blue-600">
                  {subCategoria}
                </h2>
              </div>

              <button
                onClick={() => setPublicando(false)}
                className="text-sm text-red-500 hover:underline font-medium whitespace-nowrap"
              >
                ← Voltar
              </button>
            </div>

            <div className="border-t pt-6">

              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Novo anúncio
              </h3>

              <p className="text-sm text-gray-500 mb-6">
                Preencha as informações do seu anúncio.
              </p>

              {/* FORMULÁRIO SERÁ COLOCADO AQUI */}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                <p className="text-gray-500 text-sm">
                  O formulário de publicação será carregado aqui.
                </p>

                <p className="text-xs text-gray-400 mt-2">
                  Categoria selecionada: {subCategoria}
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}