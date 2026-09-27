"use client";

import { useState } from "react";
import Link from "next/link";

export default function NoticiasPage() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("Todas");
  const [busca, setBusca] = useState<string>("");

  const subcategoriasNoticias = [
    { id: "Todas", nome: "Todas", icone: "📰" },
    { id: "Bairro", nome: "No Bairro", icone: "🏡" },
    { id: "Cidade", nome: "Rio Claro", icone: "🏛️" },
    { id: "Esportes", nome: "Esportes", icone: "⚽" },
    { id: "Cultura", nome: "Cultura & Eventos", icone: "🎭" },
    { id: "Segurança", nome: "Segurança", icone: "🚨" },
    { id: "Utilidade", nome: "Utilidade Pública", icone: "📢" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 border-b border-blue-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-white text-xs font-bold flex items-center gap-1 hover:text-amber-400 transition">
            ← Voltar
          </Link>
          <h1 className="font-black text-sm text-white tracking-tight">Notícias e Informes</h1>
          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg shadow">
            Ao Vivo
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* BARRA DE PESQUISA */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar notícia, evento ou informe..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 pl-10 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <span className="absolute left-3.5 top-3 text-slate-400 text-sm">🔍</span>
        </div>

        {/* SUBCATEGORIAS COM O MESMO PADRÃO VISUAL */}
        <section className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
            Categorias de Notícias
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {subcategoriasNoticias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5 shrink-0 ${
                  categoriaAtiva === cat.id
                    ? "bg-amber-400 text-slate-950 font-black shadow-md scale-105"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                <span>{cat.icone}</span>
                <span>{cat.nome}</span>
              </button>
            ))}
          </div>
        </section>

        {/* FEED DE NOTÍCIAS */}
        <section className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 text-center space-y-2 shadow-sm">
            <span className="text-3xl">📰</span>
            <h3 className="font-extrabold text-sm text-slate-900">
              A exibir notícias da categoria "{categoriaAtiva}"
            </h3>
            <p className="text-xs text-slate-500">
              Acompanhe as atualizações da comunidade em tempo real.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}