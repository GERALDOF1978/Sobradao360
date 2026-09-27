"use client";

import { useState } from "react";
// Importe o seu componente de formulário de anúncios aqui
// import FormularioPublicacao from "@/components/FormularioPublicacao";

export default function AnunciePage() {
  // Estado que guarda qual subcategoria foi clicada. 
  // Se for null, mostra os botões. Se tiver texto, mostra o formulário.
  const [subCategoria, setSubCategoria] = useState<string | null>(null);

  // As 4 categorias que vieram da página inicial
  const subcategorias = [
    { id: "compre-venda", nome: "Compre & Venda", icone: "🛒" },
    { id: "empregos", nome: "Empregos", icone: "💼" },
    { id: "imoveis", nome: "Imóveis", icone: "🏠" },
    { id: "automotivo", nome: "Automotivo", icone: "🚗" },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Criar Novo Anúncio</h1>

      {/* SE NENHUMA SUBCATEGORIA FOI SELECIONADA: MOSTRA OS BOTÕES */}
      {!subCategoria ? (
        <div>
          <p className="text-center mb-4 text-gray-600">O que você deseja anunciar?</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subcategorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSubCategoria(cat.nome)}
                className="flex flex-col items-center justify-center p-6 bg-white border rounded-lg shadow hover:bg-blue-50 transition-colors"
              >
                <span className="text-4xl mb-2">{cat.icone}</span>
                <span className="font-semibold text-gray-700">{cat.nome}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* SE UMA SUBCATEGORIA FOI SELECIONADA: MOSTRA O FORMULÁRIO */
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Publicando em: <span className="text-blue-600">{subCategoria}</span>
            </h2>
            <button 
              onClick={() => setSubCategoria(null)}
              className="text-sm text-red-500 hover:underline font-medium"
            >
              ← Voltar para categorias
            </button>
          </div>
          
          {/* Aqui você renderiza o seu componente de formulário passando a categoria escolhida */}
          {/* <FormularioPublicacao categoriaInicial={subCategoria} /> */}
          
          <p className="text-gray-500 text-center py-10">[ Aqui entra o seu formulário de publicação ]</p>
        </div>
      )}
    </div>
  );
}