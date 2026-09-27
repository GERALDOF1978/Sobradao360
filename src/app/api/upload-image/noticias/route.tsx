"use client";

import { useState } from "react";
// Importe o seu componente de lista de notícias aqui
// import ListaNoticias from "@/components/ListaNoticias";

export default function NoticiasPage() {
  const [subCategoria, setSubCategoria] = useState<string | null>(null);

  const subcategoriasNoticias = [
    { id: "esportes", nome: "Esportes", icone: "⚽" },
    { id: "comunicados", nome: "Comunicados Oficiais", icone: "📢" },
    { id: "eventos", nome: "Eventos", icone: "🎉" },
    { id: "bairro", nome: "Acontecimentos do Bairro", icone: "🏘️" },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Notícias Sobradão 360</h1>

      {!subCategoria ? (
        <div>
          <p className="text-center mb-4 text-gray-600">Selecione o assunto que deseja ler:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subcategoriasNoticias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSubCategoria(cat.nome)}
                className="flex flex-col items-center justify-center p-6 bg-white border rounded-lg shadow hover:bg-green-50 transition-colors"
              >
                <span className="text-4xl mb-2">{cat.icone}</span>
                <span className="font-semibold text-gray-700">{cat.nome}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold">
              Notícias sobre: <span className="text-green-600">{subCategoria}</span>
            </h2>
            <button 
              onClick={() => setSubCategoria(null)}
              className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Trocar de Assunto
            </button>
          </div>
          
          {/* Aqui você chama o componente que faz o fetch no Firebase buscando apenas a subcategoria selecionada */}
          {/* <ListaNoticias filtroCategoria={subCategoria} /> */}
          
          <p className="text-gray-500 text-center py-10">
            [ Aqui aparecerão as notícias filtradas do banco de dados ]
          </p>
        </div>
      )}
    </div>
  );
}