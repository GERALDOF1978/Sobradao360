"use client";

import { useState } from "react";

export default function AnunciePage() {
  const [subCategoria, setSubCategoria] = useState<string | null>(null);

  // Subcategorias do Anuncie.
  // Empregos, Notícias e Utilidades continuam como categorias principais.
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

        <p className="text-center mb-6 text-gray-600">
          O que você deseja anunciar?
        </p>

        {!subCategoria ? (
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
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">

            <div className="flex justify-between items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Publicando em:{" "}
                <span className="text-blue-600">
                  {subCategoria}
                </span>
              </h2>

              <button
                onClick={() => setSubCategoria(null)}
                className="text-sm text-red-500 hover:underline font-medium whitespace-nowrap"
              >
                ← Voltar
              </button>
            </div>

            {/* 
              Aqui entra o formulário de publicação.
              Futuramente podemos carregar um formulário diferente
              conforme a subcategoria escolhida.
            */}

            <div className="text-center py-10">
              <p className="text-gray-500">
                Formulário de publicação
              </p>

              <p className="text-xs text-gray-400 mt-2">
                Categoria selecionada: {subCategoria}
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}