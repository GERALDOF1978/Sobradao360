"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [cadastrado, setCadastrado] = useState(false);

  const handleCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim()) {
      setCadastrado(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setCadastrado(false);
        setNome("");
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-12 font-sans">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg">360</span>
            <h1 className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">Sobradão 360</h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-xl transition"
          >
            Entrar
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white p-6 rounded-3xl shadow-lg space-y-4 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-blue-600/30 rounded-full blur-xl pointer-events-none"></div>
          <span className="bg-amber-500/90 text-amber-950 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Portal Comunitário
          </span>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight leading-tight">
              O seu bairro, em todas as direções.
            </h2>
            <p className="text-xs text-blue-100 leading-relaxed">
              Tudo sobre a nossa região: notícias, guia comercial e conexão direta entre vizinhos.
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-3 px-4 rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            Participar da Comunidade
          </button>
        </section>

        {/* Modules Navigation */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
            Módulos Principais
          </h3>

          <div className="space-y-2.5">
            <Link href="/noticias" className="block bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg group-hover:scale-110 transition">
                  📰
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Mural & Avisos</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Segurança, melhorias e avisos da região.</p>
                </div>
              </div>
            </Link>

            <Link href="/guia" className="block bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-orange-500 dark:hover:border-orange-500 transition group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400 text-lg group-hover:scale-110 transition">
                  🛍️
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Guia Comercial</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Comércios e serviços locais pertinho de você.</p>
                </div>
              </div>
            </Link>

            <Link href="/classificados" className="block bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-lg group-hover:scale-110 transition">
                  🛒
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Classificados</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Compre, venda e troque com vizinhos.</p>
                </div>
              </div>
            </Link>

            <Link href="/eventos" className="block bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-purple-500 dark:hover:border-purple-500 transition group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 text-lg group-hover:scale-110 transition">
                  📅
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Eventos</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Agenda comunitária e encontros do bairro.</p>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>

      {/* Modal Interativo de Participação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Junte-se ao Sobradão 360</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-xs font-bold hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {cadastrado ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Bem-vindo(a), {nome}!</h4>
                <p className="text-xs text-gray-500">Seu cadastro na comunidade foi simulado com sucesso.</p>
              </div>
            ) : (
              <form onSubmit={handleCadastro} className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Insira o seu nome para participar dos avisos e interagir com os vizinhos.
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Seu Nome / Apelido</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Maria do Bairro" 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 rounded-xl text-xs transition shadow-md"
                >
                  Concluir Cadastro
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}