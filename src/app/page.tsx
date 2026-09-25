"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs, query } from "firebase/firestore";

interface ClimaData {
  temp: number;
  condicao: string;
}

interface Anuncio {
  id: string;
  titulo: string;
  descricao?: string;
  categoria?: string;
  imagemUrl?: string;
  autorNome?: string;
  autorFoto?: string;
  criadoEm?: any;
}

export default function Home() {
  const [celular, setCelular] = useState<string>("");

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

  const [clima, setClima] = useState<ClimaData | null>(null);
  const [moradoresReais, setMoradoresReais] = useState<number>(0);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [salvando, setSalvando] = useState(false);
  const [perfilSalvo, setPerfilSalvo] = useState(false);

  const [alertaAtual, setAlertaAtual] = useState(0);
  const alertas = [
    "⚠️ Manutenção na rede de água no Residencial Gracioli nesta quinta-feira.",
    "📢 Feira noturna e encontro de food trucks neste sábado!",
    "🐾 Alerta de pet perdido: Cachorrinho Poodle branco visto perto do Recanto dos Pássaros."
  ];

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

    async function carregarMoradoresEMultimidia() {
      try {
        const snapUsuarios = await getDocs(collection(db, "usuarios"));
        setMoradoresReais(snapUsuarios.size);

        const qAnuncios = query(collection(db, "anuncios"));
        const snapAnuncios = await getDocs(qAnuncios);

        const listaAnuncios: Anuncio[] = snapAnuncios.docs.map((docSnap: any) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setAnuncios(listaAnuncios);
      } catch (err) {
        console.error("Erro ao consultar Firestore:", err);
      } finally {
        setLoadingDados(false);
      }
    }

    carregarClimaReal();
    carregarMoradoresEMultimidia();
  }, []);

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

  const handleCompletarCadastro = async () => {
    if (!user) return;

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
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">
      {/* HEADER TEMA CLARO COM BLUE GRADIENT */}
      <header className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 border-b border-blue-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-lg shadow">360</span>
            <h1 className="font-black text-sm tracking-tight text-white">Sobradão 360</h1>
          </div>

          <div className="flex items-center gap-1.5 bg-blue-950/40 border border-blue-700/50 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-blue-100">
            <span>{clima ? clima.condicao : "⛅"}</span>
            <span>{clima ? `${clima.temp}°C` : "26°C"}</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <img
                src={profileImageUrl || user.photoURL || "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao"}
                alt="Avatar"
                className="w-7 h-7 rounded-full border border-amber-400 object-cover shadow-sm"
              />
              <button onClick={logout} className="text-[11px] font-bold bg-blue-950 hover:bg-blue-900 text-blue-100 px-3 py-1 rounded-xl shadow transition">
                Sair
              </button>
            </div>
          ) : (
            <button onClick={() => setIsModalOpen(true)} className="text-[11px] font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 px-3 py-1 rounded-xl shadow transition">
              Entrar
            </button>
          )}
        </div>
      </header>

      {/* TICKER DE ALERTAS */}
      <div className="bg-amber-50 border-b border-amber-200 py-1.5 px-4 overflow-hidden">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 shadow-sm">Plantão</span>
          <p className="text-[11px] text-amber-900 font-semibold truncate animate-pulse">{alertas[alertaAtual]}</p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-4 space-y-5">
        {/* BANNER PRINCIPAL */}
        <section className="bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-950 text-white rounded-3xl shadow-xl overflow-hidden border border-blue-700/50 flex flex-col">
          <div className="w-full bg-slate-900 p-2 relative flex flex-col items-center">
            <img
              src="https://i.ibb.co/zTTKfgLt/banner-s360-webp.webp"
              alt="Banner Sobradão 360"
              className="w-full h-auto object-contain rounded-2xl"
            />

            <div className="w-full mt-2 px-2 flex items-center justify-between gap-2">
              <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow shrink-0">
                Portal Oficial
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-full border border-emerald-500/30 shadow shrink-0">
                ● {loadingDados ? "..." : `${moradoresReais} moradores ativos`}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-xs text-blue-100 text-center font-medium leading-relaxed">
              Conectando comércios, avisos e moradores do nosso bairro.
            </p>

            <button
              onClick={user ? () => setIsModalOpen(true) : loginWithGoogle}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-slate-950 font-black py-3 px-4 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              {user ? "🚀 Meu Perfil & Avisos" : "🚀 Participe da Comunidade!"}
            </button>
          </div>
        </section>

        {/* SERVIÇOS RÁPIDOS (CARDS CLAROS) */}
        <section className="space-y-2.5">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Categorias & Serviços</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {servicosRapidos.map((s, index) => (
              <Link 
                key={index} 
                href={s.link} 
                className="bg-white hover:bg-slate-50 border border-slate-200/90 p-2 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 shadow-sm hover:border-amber-400 transition group min-h-[85px]"
              >
                <div className={`w-9 h-9 rounded-xl ${s.cor} flex items-center justify-center text-white text-base shadow-md group-hover:scale-110 transition shrink-0`}>
                  {s.icone}
                </div>
                <span className="text-[9px] font-bold text-slate-700 leading-tight text-center break-words w-full group-hover:text-slate-900">
                  {s.titulo}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* FEED DE ANÚNCIOS (CARDS BRANCOS COM SOMBRA) */}
        <section className="space-y-4 pt-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Publicações Recentes</h3>
          </div>

          {loadingDados ? (
            <p className="text-center text-xs text-slate-500 py-6">A carregar publicações...</p>
          ) : anuncios.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">Nenhuma publicação encontrada.</p>
          ) : (
            <div className="space-y-4">
              {anuncios.map((anuncio) => (
                <div
                  key={anuncio.id}
                  className="bg-white border border-slate-200/80 rounded-3xl p-4 space-y-3 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-200/80">
                      {anuncio.categoria || "Anúncio"}
                    </span>
                    {anuncio.autorNome && (
                      <div className="flex items-center gap-1.5">
                        <img
                          src={anuncio.autorFoto || "https://api.dicebear.com/7.x/thumbs/svg?seed=user"}
                          alt={anuncio.autorNome}
                          className="w-5 h-5 rounded-full object-cover border border-slate-300"
                        />
                        <span className="text-[11px] font-semibold text-slate-600">{anuncio.autorNome}</span>
                      </div>
                    )}
                  </div>

                  {anuncio.imagemUrl && (
                    <div className="w-full bg-slate-100 rounded-2xl border border-slate-200/70 overflow-hidden p-1 flex items-center justify-center">
                      <img
                        src={anuncio.imagemUrl}
                        alt={anuncio.titulo || "Imagem da publicação"}
                        className="w-full h-auto max-h-80 object-contain mx-auto rounded-xl"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900">{anuncio.titulo}</h4>
                    {anuncio.descricao && (
                      <p className="text-xs text-slate-600 leading-relaxed">{anuncio.descricao}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MODAL CLARO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center sticky top-0 bg-white py-1 z-10 border-b border-slate-100">
              <h3 className="font-bold text-base text-blue-900">
                {user ? `Olá, ${user.displayName}` : "Junte-se ao Sobradão 360"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {!user ? (
              <div className="py-6 text-center space-y-4">
                <p className="text-sm text-slate-600">Para participar dos avisos, interagir no portal e cadastrar seu negócio, faça login com sua conta Google.</p>
                <button
                  onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md hover:bg-slate-800 transition"
                >
                  <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5" />
                  Entrar com Google
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="relative group">
                    <img
                      src={profileImageUrl || "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao"}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full border-4 border-slate-200 shadow-md object-cover"
                    />
                    <label
                      htmlFor="uploadAvatar"
                      className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer text-[10px] font-bold text-white transition"
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
                    <p className="font-bold text-lg text-slate-900">{user.displayName}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>

                {uploading && <p className="text-xs text-amber-600 text-center animate-pulse font-semibold">⚙️ Alterando foto e salvando no perfil...</p>}

                <div className="space-y-1 text-left">
                  <label htmlFor="celularInput" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    Celular / WhatsApp <span className="text-amber-500">*</span>
                  </label>
                  <input
                    id="celularInput"
                    type="tel"
                    required
                    placeholder="(19) 99999-9999"
                    maxLength={15}
                    value={celular}
                    onChange={handleCelularChange}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1 border border-slate-200">
                  <p className="text-xs text-slate-700 font-semibold">Sobre sua participação:</p>
                  <p className="text-[11px] text-slate-500">Você agora faz parte da comunidade Sobradão 360. Seu perfil está ativo no Firestore.</p>
                </div>

                <button
                  onClick={handleCompletarCadastro}
                  disabled={salvando}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-slate-950 font-black py-3.5 px-4 rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
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