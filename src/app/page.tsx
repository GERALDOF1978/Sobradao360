"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [cadastrado, setCadastrado] = useState(false);
  

  const [termoBusca, setTermoBusca] = useState("");
  const [clima] = useState({ temp: "26°C", condicao: "Parcialmente Nublado", icone: "⛅" });
  const [alertaAtual, setAlertaAtual] = useState(0);

  // --- BLOCO A ADICIONAR AQUI ---
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);
    setUploadedImageUrl("");

    // Criar o FormData para enviar para a API
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Chamar a nossa API Route interna que criamos
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        console.log('URL da imagem otimizada:', result.url);
        setUploadedImageUrl(result.url);
        // DICA: Para o admin do portal, um alerta visual é bom,
        // mas você também pode copiar o URL automaticamente para a área de transferência se quiser.
        alert(`Sucesso! Imagem compactada para ${result.sizeKb} KB e enviada para o ImgBB.`);
      } else {
        alert(`Erro no upload: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao conectar com a API de upload. Verifique o console.');
    } finally {
      setUploading(false);
    }
  };
  // --- FIM DO BLOCO A ADICIONAR ---

  const alertas = [
    "⚠️ Manutenção na rede de água no Residencial Gracioli nesta quinta-feira das 8h às 14h.",
    "📢 Feira noturna e encontro de food trucks neste sábado na praça principal!",
    "🐾 Alerta de pet perdido: Cachorrinho Poodle branco visto perto do Recanto dos Pássaros."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setAlertaAtual((prev) => (prev + 1) % alertas.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [alertas.length]);

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

  const handleBusca = (e: React.FormEvent) => {
    e.preventDefault();
    if (termoBusca.trim()) {
      alert(`Buscando por: "${termoBusca}" no portal Sobradão 360...`);
    }
  };

  const bannerImgWebp = "https://i.ibb.co/bRqYV9df/file-00000000ff0482068cac048de4c99341.png";

  const bairrosGrupo1 = [
    "Jardim Dona Regina Picelli",
    "Residencial Gracioli",
    "Jardim São Caetano II",
    "Jardim Santa Clara II",
    "Cond. Villa dos Campos"
  ];

  const bairrosGrupo2 = [
    "Residencial Recanto dos Pássaros",
    "Clube Villas",
    "Cond. Villa dos Lírios",
    "Cond. Villa das Flores",
    "Residencial Quirino"
  ];

  // Serviços com categorias amplas e não engessadas
  const servicosRapidos = [
    { titulo: "Anuncie Aqui", icone: "📢", cor: "bg-emerald-600", link: "/guia" },
    { titulo: "Compre & Venda", icone: "🛍️", cor: "bg-orange-500", link: "/classificados" },
    { titulo: "Chácaras & Lazer", icone: "🏡", cor: "bg-purple-700", link: "/classificados" },
    { titulo: "Reformas & Obras", icone: "🛠️", cor: "bg-blue-600", link: "/guia" },
    { titulo: "Alimentação & Festas", icone: "🎂", cor: "bg-pink-600", link: "/guia" },
    { titulo: "Automotivo", icone: "🚗", cor: "bg-cyan-600", link: "/classificados" },
    { titulo: "Zeladoria & Avisos", icone: "⚠️", cor: "bg-red-600", link: "/noticias" },
    { titulo: "Plantão & Úteis", icone: "📞", cor: "bg-slate-700", link: "/guia" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 pb-16 font-sans">
      
      {/* TOPO COM CLIMA E HEADER */}
      <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-b border-blue-800/80 sticky top-0 z-40 shadow-xl">
        <div className="max-w-md mx-auto px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-blue-950 text-xs font-black px-2 py-0.5 rounded-lg shadow">360</span>
            <h1 className="font-black text-sm tracking-tight text-white">Sobradão 360</h1>
          </div>
          
          <div className="flex items-center gap-1.5 bg-blue-900/60 border border-blue-700/50 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-blue-200">
            <span>{clima.icone}</span>
            <span>{clima.temp}</span>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-blue-950 px-3 py-1 rounded-xl shadow transition"
          >
            Entrar
          </button>
        </div>
      </header>

      {/* TICKER DE ALERTAS URGENTES */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 py-1.5 px-4 overflow-hidden">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <span className="text-[10px] bg-amber-500 text-blue-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
            Plantão
          </span>
          <p className="text-[11px] text-amber-200 font-medium truncate animate-pulse">
            {alertas[alertaAtual]}
          </p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        
        {/* BANNER PRINCIPAL COM IMGBB (WEBP) */}
        <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white rounded-3xl shadow-2xl overflow-hidden border border-blue-700/50 relative">
          
          <div className="w-full h-36 bg-blue-950 relative overflow-hidden border-b border-blue-700/40">
            <img 
              src={bannerImgWebp} 
              alt="Sobradão 360 Banner Oficial" 
              className="w-full h-full object-cover opacity-90 hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-transparent to-transparent"></div>
            <div className="absolute bottom-2 left-3">
              <span className="bg-amber-400 text-blue-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                Portal Oficial
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3.5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black tracking-tight leading-none text-white">
                  SOBRADÃO <span className="text-amber-400">360</span>
                </h2>
                <span className="text-[10px] font-semibold text-blue-200">O portal do nosso bairro</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-amber-300 italic block">Aqui o seu bairro</span>
                <span className="text-[11px] font-black bg-blue-700/80 px-2 py-0.5 rounded-lg text-white inline-block mt-0.5 shadow">é notícia!</span>
              </div>
            </div>

            {/* BARRA DE BUSCA INTELIGENTE */}
            <form onSubmit={handleBusca} className="relative">
              <input 
                type="text"
                placeholder="O que você procura hoje? (Ex: Eletricista, Marmitex, Chácara...)"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full bg-blue-950/80 border border-blue-700/60 rounded-xl py-2 pl-3 pr-9 text-xs text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button type="submit" className="absolute right-2.5 top-2 text-amber-400 text-xs hover:scale-110 transition">
                🔍
              </button>
            </form>

            {/* CONTADOR DE PROVA SOCIAL */}
            <div className="flex items-center justify-between bg-blue-950/50 px-3 py-2 rounded-xl border border-blue-800/60 text-[11px] text-blue-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <strong className="text-white">+1.250</strong> moradores ativos
              </span>
              <span className="text-amber-300 font-semibold">85+ comércios</span>
            </div>

            {/* BAIRROS ATENDIDOS */}
            <div className="bg-blue-950/60 p-3 rounded-2xl border border-blue-800/40 space-y-1.5">
              <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px] uppercase tracking-wide">
                <span>📍</span> Nossos Bairros Também Aqui!
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-blue-100">
                <ul className="space-y-0.5">
                  {bairrosGrupo1.map((b, i) => (
                    <li key={i} className="flex items-center gap-1 truncate">
                      <span className="text-amber-400 text-[9px]">📍</span> {b}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-0.5">
                  {bairrosGrupo2.map((b, i) => (
                    <li key={i} className="flex items-center gap-1 truncate">
                      <span className="text-amber-400 text-[9px]">📍</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-blue-950 font-black py-2.5 px-3 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-1.5"
              >
                🚀 Participe
              </button>
              
              <a 
                href="https://whatsapp.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-1.5"
              >
                💬 Grupo Zap
              </a>
            </div>

          </div>
        </section>

        {/* GRADE DE CATEGORIAS AMPLIADAS */}
        <section className="space-y-2.5 pt-1">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Categorias & Serviços
            </h3>
            <span className="text-[10px] text-amber-400 font-semibold">Toque para explorar</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {servicosRapidos.map((s, index) => (
              <Link 
                key={index} 
                href={s.link}
                className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/60 p-2 rounded-2xl flex flex-col items-center text-center gap-1.5 shadow-sm hover:border-amber-400 transition group"
              >
                <div className={`w-9 h-9 rounded-xl ${s.cor} flex items-center justify-center text-white text-base shadow-md group-hover:scale-110 transition`}>
                  {s.icone}
                </div>
                <span className="text-[10px] font-semibold text-gray-200 leading-tight">
                  {s.titulo}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* MÓDULOS DO PORTAL */}
        <section className="space-y-2 pt-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
            Módulos do Portal
          </h3>

          <div className="space-y-2">
            <Link href="/noticias" className="block bg-slate-800/90 p-3 rounded-2xl shadow-sm border border-slate-700 hover:border-blue-500 transition group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-900/60 flex items-center justify-center text-blue-400 text-sm group-hover:scale-110 transition">
                  📰
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Mural & Avisos</h4>
                  <p className="text-[11px] text-gray-400">Segurança, melhorias e avisos da região.</p>
                </div>
              </div>
            </Link>

            <Link href="/guia" className="block bg-slate-800/90 p-3 rounded-2xl shadow-sm border border-slate-700 hover:border-orange-500 transition group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-950/60 flex items-center justify-center text-orange-400 text-sm group-hover:scale-110 transition">
                  🛍️
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Guia Comercial</h4>
                  <p className="text-[11px] text-gray-400">Comércios e serviços locais pertinho de você.</p>
                </div>
              </div>
            </Link>

            <Link href="/classificados" className="block bg-slate-800/90 p-3 rounded-2xl shadow-sm border border-slate-700 hover:border-emerald-500 transition group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/60 flex items-center justify-center text-emerald-400 text-sm group-hover:scale-110 transition">
                  🛒
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">Classificados</h4>
                  <p className="text-[11px] text-gray-400">Compre, venda e troque com vizinhos.</p>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>

      {/* MODAL DE PARTICIPAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-amber-400">Junte-se ao Sobradão 360</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-gray-400 flex items-center justify-center text-xs font-bold hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            {cadastrado ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-emerald-500/30">✓</div>
                <h4 className="font-bold text-white">Bem-vindo(a), {nome}!</h4>
                <p className="text-xs text-gray-400">Seu cadastro na comunidade foi realizado com sucesso.</p>
              </div>
            ) : (
              <form onSubmit={handleCadastro} className="space-y-3">
                <p className="text-xs text-gray-400">
                  Informe seu nome para participar dos avisos e interagir no portal do bairro.
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Seu Nome / Apelido</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Carlos do Recanto" 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 text-white"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-blue-950 font-black py-3 rounded-xl text-xs transition shadow-md"
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