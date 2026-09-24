"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

interface ClimaData {
  temp: number;
  condicao: string;
}

export default function Home() {
  // Estado para o número de celular
  const [celular, setCelular] = useState<string>("");

  // Função para aplicar a máscara (19) 99999-9999 automaticamente
  const formatarCelular = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, "");
    return apenasNumeros
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCelular(formatarCelular(e.target.value));
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, loginWithGoogle, logout } = useAuth();

  // Estados de dados dinâmicos reais (Clima e Moradores)
  const [clima, setClima] = useState<ClimaData | null>(null);
  const [moradoresReais, setMoradoresReais] = useState<number>(0);
  const [loadingDados, setLoadingDados] = useState(true);

  // Estados de Upload e Perfil
  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [salvando, setSalvando] = useState(false);
  const [perfilSalvo, setPerfilSalvo] = useState(false);

  // Ticker de alertas do plantão
  const [alertaAtual, setAlertaAtual] = useState(0);
  const alertas = [
    "⚠️ Manutenção na rede de água no Residencial Gracioli nesta quinta-feira.",
    "📢 Feira noturna e encontro de food trucks neste sábado!",
    "🐾 Alerta de pet perdido: Cachorrinho Poodle branco visto perto do Recanto dos Pássaros."
  ];

  // 1. Carrega dados do perfil (foto e celular) quando o usuário está logado
  useEffect(() => {
    async function carregarPerfil() {
      if (user) {
        const userRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileImageUrl(data.fotoUrl || user.photoURL || "");
          setCelular(data.celular || "");
        } else {
          setProfileImageUrl(user.photoURL || "");
        }
      }
    }
    carregarPerfil();
  }, [user]);

  // 2. Busca clima real de Rio Claro/SP + Total de moradores reais do Firestore
  useEffect(() => {
    async function carregarClimaReal() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-22.4111&longitude=-47.5614&current=temperature_2m,weather_code"
        );
        const data = await res.json();
        if (data?.current) {
          setClima({
            temp: Math.round(data.current.temperature_2m),
            condicao: data.current.weather_code <= 3 ? "⛅" : "🌧️",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar clima:", err);
      }
    }

    async function carregarMoradoresReais() {
      try {
        const snapshot = await getDocs(collection(db, "usuarios"));
        setMoradoresReais(snapshot.size);
      } catch (err) {
        console.error("Erro ao consultar usuários no Firestore:", err);
      } finally {
        setLoadingDados(false);
      }
    }

    carregarClimaReal();
    carregarMoradoresReais();
  }, []);

  // 3. Timer do ticker de alertas
  useEffect(() => {
    const timer = setInterval(() => {
      setAlertaAtual((prev) => (prev + 1) % alertas.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [alertas.length]);

  // Handler de upload de foto de avatar
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    const file = files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setProfileImageUrl(result.url);
        const userRef = doc(db, "usuarios", user.uid);
        await setDoc(userRef, { fotoUrl: result.url }, { merge: true });
        alert(`Avatar atualizado e salvo com sucesso!`);
      } else {
        alert(`Erro no upload: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao conectar com a API de upload.");
    } finally {
      setUploading(false);
    }
  };

  // Handler para salvar/confirmar perfil
  const handleCompletarCadastro = async () => {
    if (!user) return;

    // Validação: verifica se tem 11 dígitos numéricos
    const numerosApenas = celular.replace(/\D/g, "");
    if (!numerosApenas || numerosApenas.length < 11) {
      alert("Por favor, preencha um número de celular válido com DDD.");
      return;
    }

    setSalvando(true);
    try {
      const userRef = doc(db, "usuarios", user.uid);
      await setDoc(
        userRef,
        {
          uid: user.uid,
          nome: user.displayName,
          email: user.email,
          fotoUrl: profileImageUrl || user.photoURL,
          celular: celular,
          dataCadastro: new Date().toISOString(),
        },
        { merge: true }
      );

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

  const servicosRapidos = [
    { titulo: "Anuncie", icone: "📢", cor: "bg-emerald-600", link: "/classificados?categoria=Anuncie" },
    { titulo: "Empregos", icone: "💼", cor: "bg-indigo-600", link: "/classificados?categoria=Empregos" },
    { titulo: "Compre & Venda", icone: "🛍️", cor: "bg-orange-500", link: "/classificados?categoria=Compre%20%26%20Venda" },
    { titulo: "Alimentação", icone: "🎂", cor: "bg-pink-600", link: "/classificados?categoria=Alimenta%C3%A7%C3%A3o" },
    { titulo: "Reformas", icone: "🛠️", cor: "bg-blue-600", link: "/classificados?categoria=Reformas" },
    { titulo: "Lazer", icone: "🏡", cor: "bg-purple-700", link: "/classificados?categoria=Lazer" },
    { titulo: "Automotivo", icone: "🚗", cor: "bg-cyan-600", link: "/classificados?categoria=Automotivo" },
    { titulo: "Zeladoria", icone: "⚠️", cor: "bg-red-600", link: "/classificados?categoria=Zeladoria" },
    { titulo: "Notícias", icone: "📰", cor: "bg-teal-600", link: "/classificados?categoria=Not%C3%ADcias" },
    { titulo: "Pet & Saúde", icone: "🐾", cor: "bg-amber-600", link: "/classificados?categoria=Pet%20%26%20Sa%C3%BAde" },
    { titulo: "Eventos", icone: "🎉", cor: "bg-fuchsia-600", link: "/classificados?categoria=Eventos" },
    { titulo: "Utilidades", icone: "📞", cor: "bg-slate-700", link: "/classificados?categoria=Utilidades" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 pb-16 font-sans">
      {/* TOPO COM CLIMA EM TEMPO REAL E HEADER */}
      <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-b border-blue-800/80 sticky top-0 z-40 shadow-xl">
        <div className="max-w-md mx-auto px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-blue-950 text-xs font-black px-2 py-0.5 rounded-lg shadow">360</span>
            <h1 className="font-black text-sm tracking-tight text-white">Sobradão 360</h1>
          </div>

          <div className="flex items-center gap-1.5 bg-blue-900/60 border border-blue-700/50 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-blue-200">
            <span>{clima ? clima.condicao : "⛅"}</span>
            <span>{clima ? `${clima.temp}°C` : "26°C"}</span>
          </div>

          {/* Botão Entrar/Sair Dinâmico */}
          {user ? (
            <div className="flex items-center gap-2">
              <img
                src={profileImageUrl || user.photoURL || "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao"}
                alt="Avatar"
                className="w-7 h-7 rounded-full border border-amber-400 object-cover"
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
        {/* BANNER PRINCIPAL FLUIDO E ADAPTÁVEL */}
        <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white rounded-3xl shadow-2xl overflow-hidden border border-blue-700/50 relative">
          <div className="w-full bg-slate-950 p-2 flex items-center justify-center relative">
            <img
              src="https://i.ibb.co/zTTKfgLt/banner-s360-webp.webp"
              alt="Banner Sobradão 360"
              className="w-full h-auto max-h-[480px] object-contain rounded-2xl"
            />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <span className="bg-amber-400 text-blue-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                Portal Oficial
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-slate-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30 backdrop-blur-sm shadow">
                ● {loadingDados ? "..." : `${moradoresReais} moradores ativos`}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-xs text-blue-200 text-center font-medium">
              Conectando comércios, avisos e moradores do nosso bairro.
            </p>

            <button
              onClick={user ? () => setIsModalOpen(true) : loginWithGoogle}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-blue-950 font-black py-3 px-4 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
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

      {/* MODAL DE LOGIN / PERFIL */}
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
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 text-center">
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
                      id="uploadAvatar"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <p className="font-bold text-lg">{user.displayName}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>

                {uploading && <p className="text-xs text-amber-500 text-center animate-pulse">⚙️ Alterando foto e salvando no perfil...</p>}

                {/* Campo de Celular Formatado e Obrigatório */}
                <div className="space-y-1 text-left">
                  <label htmlFor="celularInput" className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                    Celular / WhatsApp <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="celularInput"
                    type="tel"
                    required
                    placeholder="(19) 99999-9999"
                    maxLength={15}
                    value={celular}
                    onChange={handleCelularChange}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition"
                  />
                </div>

                <div className="bg-slate-800 p-4 rounded-2xl space-y-2">
                  <p className="text-xs text-gray-300 font-semibold">Sobre sua participação:</p>
                  <p className="text-[11px] text-gray-500">Você agora faz parte da comunidade Sobradão 360. Seu perfil está ativo no Firestore.</p>
                </div>

                <button
                  onClick={handleCompletarCadastro}
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