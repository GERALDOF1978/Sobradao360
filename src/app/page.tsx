"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; // Importamos o hook de autenticação
import { db } from "@/lib/firebase"; // Importamos o Firestore
import { doc, setDoc, getDoc } from "firebase/firestore"; // Funções do Firestore

import PainelComunitario from "@/components/PainelComunitario";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-gray-100 p-4 max-w-md mx-auto space-y-4">
      <header className="flex justify-between items-center border-b border-blue-900/40 pb-3">
        <h1 className="text-base font-black text-amber-400">Sobradão 360 🏙️</h1>
      </header>

      {/* Painel com Clima em Tempo Real e Dados Demográficos Reais */}
      <PainelComunitario />

      {/* Restante dos módulos da página inicial (Classificados, Avisos, etc.) */}
    </main>
  );
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Usamos o contexto de autenticação
  const { user, loginWithGoogle, logout } = useAuth(); 
  
  // Estados de Upload e Perfil (agora associados ao user logado)
  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [salvando, setSalvando] = useState(false);
  const [perfilSalvo, setPerfilSalvo] = useState(false);

  // Ticker de alertas
  const [alertaAtual, setAlertaAtual] = useState(0);
  const alertas = [
    "⚠️ Manutenção na rede de água no Residencial Gracioli nesta quinta-feira.",
    "📢 Feira noturna e encontro de food trucks neste sábado!",
    "🐾 Alerta de pet perdido: Cachorrinho Poodle branco visto perto do Recanto dos Pássaros."
  ];

  // Efeito para carregar a foto do perfil do Firestore ao logar
  useEffect(() => {
    async function carregarPerfil() {
      if (user) {
        const userRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileImageUrl(data.fotoUrl || user.photoURL || "");
        } else {
          // Se for o primeiro login, usa a foto do Google como padrão
          setProfileImageUrl(user.photoURL || "");
        }
      }
    }
    carregarPerfil();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAlertaAtual((prev) => (prev + 1) % alertas.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [alertas.length]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    const file = files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Chama a nossa API Route interna que criamos
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Atualiza o estado da imagem no componente
        setProfileImageUrl(result.url); 
        
        // Atualiza a foto no Firestore (para persistir)
        const userRef = doc(db, "usuarios", user.uid);
        await setDoc(userRef, { fotoUrl: result.url }, { merge: true });
        
        alert(`Avatar atualizado e salvo com sucesso!`);
      } else {
        alert(`Erro no upload: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro ao conectar com a API de upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleCompletarCadastro = async () => {
    if (!user) return;
    setSalvando(true);
    try {
      // Salva os dados do usuário no Firestore
      const userRef = doc(db, "usuarios", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        nome: user.displayName,
        email: user.email,
        fotoUrl: profileImageUrl || user.photoURL, // Usa a foto otimizada ou a do Google
        dataCadastro: new Date().toISOString(),
      }, { merge: true }); // Merge para não sobrescrever dados existentes

      setPerfilSalvo(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setPerfilSalvo(false);
      }, 2000);

    } catch (error) {
      console.error("Erro ao salvar no Firestore:", error);
      alert("Ocorreu um erro ao salvar seus dados.");
    } finally {
      setSalvando(false);
    }
  };


  // Configuração Mock (Clima, Bairros, Serviços)
  const clima = { temp: "26°C", icone: "⛅" };
  const bairrosGrupo1 = ["Jardim Dona Regina Picelli", "Residencial Gracioli", "Jardim São Caetano II"];
  const bairrosGrupo2 = ["Residencial Recanto dos Pássaros", "Clube Villas", "Cond. Villa dos Lírios"];
  const servicosRapidos = [
    { titulo: "Anuncie", icone: "📢", cor: "bg-emerald-600", link: "/guia" },
    { titulo: "Compre & Venda", icone: "🛍️", cor: "bg-orange-500", link: "/classificados" },
    { titulo: "Lazer", icone: "🏡", cor: "bg-purple-700", link: "/classificados" },
    { titulo: "Reformas", icone: "🛠️", cor: "bg-blue-600", link: "/guia" },
    { titulo: "Alimentação", icone: "🎂", cor: "bg-pink-600", link: "/guia" },
    { titulo: "Automotivo", icone: "🚗", cor: "bg-cyan-600", link: "/classificados" },
    { titulo: "Zeladoria", icone: "⚠️", cor: "bg-red-600", link: "/noticias" },
    { titulo: "Utilidades", icone: "📞", cor: "bg-slate-700", link: "/guia" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 pb-16 font-sans">
      
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

          {/* Botão Entrar/Sair Dinâmico */}
          {user ? (
            <div className="flex items-center gap-2">
              <img 
                src={profileImageUrl || user.photoURL || "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao"} 
                alt="Avatar" 
                className="w-7 h-7 rounded-full border border-amber-400" 
              />
              <button onClick={logout} className="text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-gray-300 px-3 py-1 rounded-xl shadow transition">
                Sair
              </button>
            </div>
          ) : (
            <button onClick={() => setIsModalOpen(true)} className="text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-blue-950 px-3 py-1 rounded-xl shadow transition">
              Entrar
            </button>
          )}
        </div>
      </header>

      {/* TICKER DE ALERTAS */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 py-1.5 px-4 overflow-hidden">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <span className="text-[10px] bg-amber-500 text-blue-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Plantão</span>
          <p className="text-[11px] text-amber-200 font-medium truncate animate-pulse">{alertas[alertaAtual]}</p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        
        {/* BANNER PRINCIPAL */}
        <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white rounded-3xl shadow-2xl overflow-hidden border border-blue-700/50 relative">
          <div className="w-full h-36 bg-blue-950 relative overflow-hidden border-b border-blue-700/40">
            <img src={"https://i.ibb.co/bRqYV9df/file-00000000ff0482068cac048de4c99341.png"} alt="Banner" className="w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-transparent to-transparent"></div>
            <div className="absolute bottom-2 left-3">
              <span className="bg-amber-400 text-blue-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">Portal Oficial</span>
            </div>
          </div>

          <div className="p-4 space-y-3.5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black tracking-tight leading-none text-white">SOBRADÃO <span className="text-amber-400">360</span></h2>
                <span className="text-[10px] font-semibold text-blue-200">O portal do nosso bairro</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-amber-300 italic block">Aqui o seu bairro</span>
                <span className="text-[11px] font-black bg-blue-700/80 px-2 py-0.5 rounded-lg text-white inline-block mt-0.5 shadow">é notícia!</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-blue-950/50 px-3 py-2 rounded-xl border border-blue-800/60 text-[11px] text-blue-200">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><strong className="text-white">+1.250</strong> moradores ativos</span>
              <span className="text-amber-300 font-semibold">85+ comércios</span>
            </div>

            <div className="bg-blue-950/60 p-3 rounded-2xl border border-blue-800/40 space-y-1.5">
              <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px] uppercase tracking-wide">📍 Nossos Bairros</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-blue-100">
                <ul>{bairrosGrupo1.map(b => <li key={b} className="truncate">📍 {b}</li>)}</ul>
                <ul>{bairrosGrupo2.map(b => <li key={b} className="truncate">📍 {b}</li>)}</ul>
              </div>
            </div>

            {/* Botão de Ação Principal - Se Logado, abre o modal de perfil */}
            <button 
              onClick={user ? () => setIsModalOpen(true) : loginWithGoogle}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-blue-950 font-black py-3 px-4 rounded-xl text-sm shadow-lg transition flex items-center justify-center gap-2"
            >
              {user ? "🚀 Meu Perfil & Avisos" : "🚀 Participe da Comunidade!"}
            </button>
          </div>
        </section>

        {/* SERVIÇOS RÁPIDOS */}
        <section className="space-y-2.5 pt-1">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Categorias & Serviços</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {servicosRapidos.map((s, index) => (
              <Link key={index} href={s.link} className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/60 p-2 rounded-2xl flex flex-col items-center text-center gap-1.5 shadow-sm hover:border-amber-400 transition group">
                <div className={`w-9 h-9 rounded-xl ${s.cor} flex items-center justify-center text-white text-base shadow-md group-hover:scale-110 transition`}>{s.icone}</div>
                <span className="text-[10px] font-semibold text-gray-200 leading-tight">{s.titulo}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* MODAL DE LOGIN / PERFIL (ATUALIZADO) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 text-white">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-amber-400">
                {user ? `Olá, ${user.displayName}` : "Junte-se ao Sobradão 360"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-800 text-gray-400 flex items-center justify-center text-xs font-bold hover:bg-slate-700">✕</button>
            </div>

            {!user ? (
              // FLUXO DE LOGIN
              <div className="py-8 text-center space-y-4">
                <p className="text-sm text-gray-400">Para participar dos avisos, interagir no portal e cadastrar seu negócio, faça login com sua conta Google.</p>
                <button 
                  onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-bold py-3 px-4 rounded-xl text-sm shadow-md hover:bg-gray-100 transition"
                >
                  <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5" />
                  Entrar com Google
                </button>
              </div>
            ) : (
              // FLUXO DE PERFIL (Pós-Login)
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  {/* UPLOAD DE AVATAR */}
                  <div className="relative group">
                    <img 
                      src={profileImageUrl || "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao"} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-full border-4 border-slate-700 shadow-lg object-cover" 
                    />
                    <label 
                      htmlFor="uploadAvatar" 
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer text-[10px] font-bold text-white transition"
                    >
                      {uploading ? "..." : "Alterar"}
                    </label>
                    <input 
                      type="file" 
                      id="uploadAvatar" 
                      accept="image/jpeg, image/png, image/webp"
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{user.displayName}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                
                {uploading && <p className="text-xs text-amber-500 text-center animate-pulse">⚙️ Alterando foto e salvando no perfil...</p>}

                <div className="bg-slate-800 p-4 rounded-2xl space-y-2">
                  <p className="text-xs text-gray-300 font-semibold">Sobre sua participação:</p>
                  <p className="text-[11px] text-gray-500">Você agora faz parte da comunidade Sobradão 360. Seu perfil está ativo no Firestore.</p>
                </div>

                <button 
                  onClick={handleCompletarCadastro} // Garante o salvamento final dos dados
                  disabled={salvando}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-blue-950 font-black py-3.5 px-4 rounded-2xl text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : (perfilSalvo ? "Perfil Confirmado! ✓" : "Confirmar Perfil")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}