"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

interface ClimaData {
  temp: number;
  condicao: string;
}

export default function Cabecalho() {
  const { user, loginWithGoogle, logout } = useAuth();

  const [clima, setClima] = useState<ClimaData | null>(null);
  const [moradoresReais, setMoradoresReais] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [celular, setCelular] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [perfilSalvo, setPerfilSalvo] = useState(false);

  const [alertaAtual, setAlertaAtual] = useState(0);

  const alertas = [
    "⚠️ Manutenção na rede de água no Residencial Gracioli nesta quinta-feira.",
    "📢 Feira noturna e encontro de food trucks neste sábado!",
    "🐾 Alerta de pet perdido: Cachorrinho Poodle branco visto perto do Recanto dos Pássaros.",
  ];

  const formatarCelular = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, "");

    return apenasNumeros
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleCelularChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCelular(formatarCelular(e.target.value));
  };

  // ==========================================
  // PERFIL DO USUÁRIO
  // ==========================================

  useEffect(() => {
    async function carregarPerfil() {
      if (!user) {
        setProfileImageUrl("");
        setCelular("");
        return;
      }

      try {
        const userRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setProfileImageUrl(
            data.fotoUrl || user.photoURL || ""
          );

          setCelular(data.celular || "");
        } else {
          setProfileImageUrl(user.photoURL || "");
        }
      } catch (error) {
        console.error(
          "Erro ao carregar perfil:",
          error
        );

        setProfileImageUrl(user.photoURL || "");
      }
    }

    carregarPerfil();
  }, [user]);

  // ==========================================
  // CLIMA
  // ==========================================

  useEffect(() => {
    async function carregarClimaReal() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-22.4111&longitude=-47.5614&current=temperature_2m,weather_code"
        );

        const data = await res.json();

        if (data?.current) {
          setClima({
            temp: Math.round(
              data.current.temperature_2m
            ),
            condicao:
              data.current.weather_code <= 3
                ? "⛅"
                : "🌧️",
          });
        }
      } catch (error) {
        console.error(
          "Erro ao carregar clima:",
          error
        );
      }
    }

    carregarClimaReal();
  }, []);

  // ==========================================
  // ESTATÍSTICAS
  // ==========================================

  useEffect(() => {
    async function carregarEstatisticas() {
      try {
        const estatisticasRef = doc(
          db,
          "estatisticas",
          "comunidade"
        );

        const snap = await getDoc(
          estatisticasRef
        );

        if (snap.exists()) {
          const dados = snap.data();

          setMoradoresReais(
            Number(dados.moradores) || 0
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar estatísticas:",
          error
        );
      }
    }

    carregarEstatisticas();
  }, []);

  // ==========================================
  // PLANTÃO
  // ==========================================

  useEffect(() => {
    const timer = setInterval(() => {
      setAlertaAtual(
        (prev) => (prev + 1) % alertas.length
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [alertas.length]);

  // ==========================================
  // UPLOAD DA FOTO
  // ==========================================

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;

    if (
      !files ||
      files.length === 0 ||
      !user
    ) {
      return;
    }

    const file = files[0];

    setUploading(true);

    const formData = new FormData();

    formData.append("file", file);

    try {
      const response = await fetch(
        "/api/upload-image",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        setProfileImageUrl(result.url);

        const userRef = doc(
          db,
          "usuarios",
          user.uid
        );

        await setDoc(
          userRef,
          {
            fotoUrl: result.url,
          },
          {
            merge: true,
          }
        );

        alert(
          "Avatar atualizado e salvo com sucesso!"
        );
      } else {
        alert(
          `Erro no upload: ${result.error}`
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "Ocorreu um erro ao conectar com a API de upload."
      );
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // SALVAR PERFIL
  // ==========================================

  const handleCompletarCadastro = async () => {
    if (!user) return;

    const numerosApenas =
      celular.replace(/\D/g, "");

    if (
      !numerosApenas ||
      numerosApenas.length < 11
    ) {
      alert(
        "Por favor, preencha um número de celular válido com DDD."
      );

      return;
    }

    setSalvando(true);

    try {
      const userRef = doc(
        db,
        "usuarios",
        user.uid
      );

      await setDoc(
        userRef,
        {
          uid: user.uid,
          nome: user.displayName,
          email: user.email,
          fotoUrl:
            profileImageUrl ||
            user.photoURL,
          celular,
          dataCadastro:
            new Date().toISOString(),
        },
        {
          merge: true,
        }
      );

      setPerfilSalvo(true);

      setTimeout(() => {
        setIsModalOpen(false);
        setPerfilSalvo(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Erro ao salvar no Firestore:",
        error
      );

      alert(
        "Ocorreu um erro ao salvar seus dados."
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      {/* ==========================================
          CABEÇALHO GLOBAL
      ========================================== */}

      <header className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 border-b border-blue-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto px-4 py-2.5 flex justify-between items-center gap-2">

          {/* LOGO */}

          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-lg shadow shrink-0">
              360
            </span>

            <h1 className="font-black text-sm tracking-tight text-white truncate">
              Sobradão 360
            </h1>
          </div>

          {/* CLIMA */}

          <div className="flex items-center gap-1.5 bg-blue-950/40 border border-blue-700/50 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-blue-100 shrink-0">
            <span>
              {clima
                ? clima.condicao
                : "⛅"}
            </span>

            <span>
              {clima
                ? `${clima.temp}°C`
                : "--°C"}
            </span>
          </div>

          {/* USUÁRIO */}

          {user ? (
            <button
              onClick={() =>
                setIsModalOpen(true)
              }
              className="flex items-center gap-1.5 shrink-0"
              aria-label="Abrir meu perfil"
            >
              <img
                src={
                  profileImageUrl ||
                  user.photoURL ||
                  "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao"
                }
                alt="Avatar"
                className="w-7 h-7 rounded-full border border-amber-400 object-cover shadow-sm"
              />
            </button>
          ) : (
            <button
              onClick={() =>
                setIsModalOpen(true)
              }
              className="text-[11px] font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 px-3 py-1 rounded-xl shadow transition shrink-0"
            >
              Entrar
            </button>
          )}

        </div>
      </header>

      {/* ==========================================
          PLANTÃO GLOBAL
      ========================================== */}

      <div className="bg-amber-50 border-b border-amber-200 py-1.5 px-4 overflow-hidden">
        <div className="max-w-md mx-auto flex items-center gap-2">

          <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 shadow">
            Plantão
          </span>

          <p className="text-[11px] text-amber-900 font-semibold truncate animate-pulse">
            {alertas[alertaAtual]}
          </p>

        </div>
      </div>

      {/* ==========================================
          MODAL DO PERFIL
      ========================================== */}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 text-slate-900 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-center sticky top-0 bg-white py-1 z-10 border-b border-slate-100">

              <h3 className="font-bold text-base text-blue-900">
                {user
                  ? `Olá, ${user.displayName}`
                  : "Junte-se ao Sobradão 360"}
              </h3>

              <button
                onClick={() =>
                  setIsModalOpen(false)
                }
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold hover:bg-slate-200"
              >
                ✕
              </button>

            </div>

            {!user ? (
              <div className="py-6 text-center space-y-4">

                <p className="text-sm text-slate-600">
                  Para participar dos avisos,
                  interagir no portal e cadastrar
                  seu negócio, faça login com sua
                  conta Google.
                </p>

                <button
                  onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md hover:bg-slate-800 transition"
                >
                  <img
                    src="https://authjs.dev/img/providers/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />

                  Entrar com Google
                </button>

              </div>
            ) : (

              <div className="space-y-4 pt-2">

                {/* FOTO */}

                <div className="flex flex-col items-center gap-3 text-center">

                  <div className="relative group">

                    <img
                      src={
                        profileImageUrl ||
                        "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao"
                      }
                      alt="Avatar"
                      className="w-20 h-20 rounded-full border-4 border-slate-200 shadow-md object-cover"
                    />

                    <label
                      htmlFor="uploadAvatarGlobal"
                      className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer text-[10px] font-bold text-white transition"
                    >
                      {uploading
                        ? "..."
                        : "Alterar"}
                    </label>

                    <input
                      id="uploadAvatarGlobal"
                      type="file"
                      accept="image/*"
                      onChange={
                        handleFileChange
                      }
                      className="hidden"
                    />

                  </div>

                  <div>

                    <p className="font-bold text-lg text-slate-900">
                      {user.displayName}
                    </p>

                    <p className="text-xs text-slate-500">
                      {user.email}
                    </p>

                  </div>

                </div>

                {uploading && (
                  <p className="text-xs text-amber-600 text-center animate-pulse font-semibold">
                    ⚙️ Alterando foto e salvando no perfil...
                  </p>
                )}

                {/* CELULAR */}

                <div className="space-y-1 text-left">

                  <label
                    htmlFor="celularInputGlobal"
                    className="text-xs font-semibold text-slate-700 flex items-center gap-1"
                  >
                    Celular / WhatsApp

                    <span className="text-amber-500">
                      *
                    </span>
                  </label>

                  <input
                    id="celularInputGlobal"
                    type="tel"
                    required
                    placeholder="(19) 99999-9999"
                    maxLength={15}
                    value={celular}
                    onChange={
                      handleCelularChange
                    }
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
                  />

                </div>

                {/* STATUS */}

                <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 border border-slate-200">

                  <p className="text-xs text-slate-700 font-semibold">
                    Sua participação
                  </p>

                  <p className="text-[11px] text-slate-500">
                    Você faz parte da comunidade
                    Sobradão 360.
                  </p>

                  <p className="text-[11px] text-emerald-600 font-semibold">
                    ● {moradoresReais} moradores
                    cadastrados
                  </p>

                </div>

                {/* CONFIRMAR */}

                <button
                  onClick={
                    handleCompletarCadastro
                  }
                  disabled={salvando}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-slate-950 font-black py-3.5 px-4 rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {salvando
                    ? "Salvando..."
                    : perfilSalvo
                    ? "Perfil Confirmado! ✓"
                    : "Confirmar Perfil"}
                </button>

                {/* SAIR */}

                <button
                  onClick={async () => {
                    setIsModalOpen(false);
                    await logout();
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-sm transition"
                >
                  Sair da conta
                </button>

              </div>
            )}

          </div>

        </div>
      )}
    </>
  );
}