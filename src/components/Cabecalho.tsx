"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface ClimaData {
  temp: number;
  condicao: string;
  icone: string;
  codigo: number;
  vento: number;
  umidade: number;
  chuva: number;
}

const LOGO =
  "https://i.ibb.co/xqw1GRhg/file-0000000053bc81fd859392bfffad0801.png";

const alertas = [
  "📢 Bem-vindo ao Sobradão 360",
  "🏘️ Informação e serviços para a comunidade",
  "📣 Tem algo para anunciar? Publique no Sobradão 360",
];

function interpretarClima(codigo: number, isDay: boolean) {
  if (codigo === 0) {
    return {
      condicao: isDay ? "Ensolarado" : "Céu limpo",
      icone: isDay ? "☀️" : "🌙",
    };
  }

  if (codigo === 1) {
    return {
      condicao: isDay ? "Predominantemente limpo" : "Poucas nuvens",
      icone: isDay ? "🌤️" : "🌙",
    };
  }

  if (codigo === 2) {
    return {
      condicao: "Parcialmente nublado",
      icone: "⛅",
    };
  }

  if (codigo === 3) {
    return {
      condicao: "Nublado",
      icone: "☁️",
    };
  }

  if (codigo === 45 || codigo === 48) {
    return {
      condicao: "Neblina",
      icone: "🌫️",
    };
  }

  if ([51, 53, 55, 56, 57].includes(codigo)) {
    return {
      condicao: "Garoa",
      icone: "🌦️",
    };
  }

  if ([61, 63, 65, 66, 67].includes(codigo)) {
    return {
      condicao:
        codigo === 65 || codigo === 67 ? "Chuva forte" : "Chuva",
      icone: "🌧️",
    };
  }

  if ([80, 81, 82].includes(codigo)) {
    return {
      condicao:
        codigo === 82 ? "Pancadas fortes" : "Pancadas de chuva",
      icone: "🌦️",
    };
  }

  if ([95, 96, 97, 99].includes(codigo)) {
    return {
      condicao:
        codigo === 99
          ? "Tempestade com granizo"
          : codigo === 96
          ? "Tempestade com granizo"
          : codigo === 97
          ? "Tempestade forte"
          : "Tempestade",
      icone: "⛈️",
    };
  }

  return {
    condicao: "Condição variável",
    icone: "🌤️",
  };
}

export default function Cabecalho() {
  const { user, loginWithGoogle, logout } = useAuth();

  const [clima, setClima] = useState<ClimaData | null>(null);
  const [moradores, setMoradores] = useState<number | null>(null);

  const [perfilAberto, setPerfilAberto] = useState(false);

  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [foto, setFoto] = useState("");

  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [mensagemPerfil, setMensagemPerfil] = useState("");

  const [alertaAtual, setAlertaAtual] = useState(0);

  /*
   * ==========================================================
   * CLIMA
   * Rio Claro - SP
   * ==========================================================
   */

  useEffect(() => {
    async function buscarClima() {
      try {
        const url =
          "https://api.open-meteo.com/v1/forecast" +
          "?latitude=-22.4114" +
          "&longitude=-47.5614" +
          "&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day" +
          "&timezone=America%2FSao_Paulo";

        const resposta = await fetch(url);

        if (!resposta.ok) {
          throw new Error("Erro ao consultar clima");
        }

        const dados = await resposta.json();

        const current = dados.current;

        const interpretacao = interpretarClima(
          Number(current.weather_code),
          Number(current.is_day) === 1
        );

        setClima({
          temp: Math.round(Number(current.temperature_2m)),
          condicao: interpretacao.condicao,
          icone: interpretacao.icone,
          codigo: Number(current.weather_code),
          vento: Math.round(Number(current.wind_speed_10m)),
          umidade: Math.round(Number(current.relative_humidity_2m)),
          chuva: Number(current.precipitation || 0),
        });
      } catch (erro) {
        console.error("Erro ao buscar clima:", erro);
      }
    }

    buscarClima();

    // Atualiza o clima a cada 15 minutos
    const intervalo = setInterval(buscarClima, 15 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, []);

  /*
   * ==========================================================
   * ESTATÍSTICAS DA COMUNIDADE
   * ==========================================================
   */

  useEffect(() => {
    async function buscarEstatisticas() {
      try {
        const referencia = doc(db, "estatisticas", "comunidade");
        const snap = await getDoc(referencia);

        if (snap.exists()) {
          const dados = snap.data();

          if (typeof dados.moradores === "number") {
            setMoradores(dados.moradores);
          }
        }
      } catch (erro) {
        console.error("Erro ao buscar estatísticas:", erro);
      }
    }

    buscarEstatisticas();
  }, []);

  /*
   * ==========================================================
   * CARREGAR PERFIL
   * ==========================================================
   */

  useEffect(() => {
    if (!user) return;

    async function carregarPerfil() {
      try {
        const referencia = doc(db, "usuarios", user.uid);
        const snap = await getDoc(referencia);

        if (snap.exists()) {
          const dados = snap.data();

          setNome(dados.nome || user.displayName || "");
          setCelular(dados.celular || "");
          setFoto(dados.fotoURL || user.photoURL || "");
        } else {
          setNome(user.displayName || "");
          setFoto(user.photoURL || "");
        }
      } catch (erro) {
        console.error("Erro ao carregar perfil:", erro);
      }
    }

    carregarPerfil();
  }, [user]);

  /*
   * ==========================================================
   * PLANTÃO
   * ==========================================================
   */

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAlertaAtual((anterior) => (anterior + 1) % alertas.length);
    }, 6000);

    return () => clearInterval(intervalo);
  }, []);

  /*
   * ==========================================================
   * SALVAR PERFIL
   * ==========================================================
   */

  async function salvarPerfil() {
    if (!user) return;

    setSalvandoPerfil(true);
    setMensagemPerfil("");

    try {
      await setDoc(
        doc(db, "usuarios", user.uid),
        {
          nome: nome.trim(),
          celular: celular.trim(),
          fotoURL: foto || user.photoURL || "",
          email: user.email || "",
          atualizadoEm: new Date(),
        },
        { merge: true }
      );

      setMensagemPerfil("Perfil atualizado com sucesso!");

      setTimeout(() => {
        setMensagemPerfil("");
      }, 2500);
    } catch (erro) {
      console.error("Erro ao salvar perfil:", erro);
      setMensagemPerfil("Não foi possível salvar o perfil.");
    } finally {
      setSalvandoPerfil(false);
    }
  }

  /*
   * ==========================================================
   * FOTO DO PERFIL
   * ==========================================================
   */

  async function selecionarFoto(
    evento: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = evento.target.files?.[0];

    if (!arquivo || !user) return;

    try {
      const formData = new FormData();

      formData.append("file", arquivo);
      formData.append("folder", "usuarios");

      const resposta = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!resposta.ok) {
        throw new Error("Erro no upload");
      }

      const dados = await resposta.json();

      if (dados.url) {
        setFoto(dados.url);
      }
    } catch (erro) {
      console.error("Erro ao enviar foto:", erro);
      setMensagemPerfil("Não foi possível enviar a foto.");
    }
  }

  /*
   * ==========================================================
   * LOGIN
   * ==========================================================
   */

  async function entrar() {
    try {
      await loginWithGoogle();
    } catch (erro) {
      console.error("Erro ao entrar:", erro);
    }
  }

  /*
   * ==========================================================
   * ALERTA VISUAL PARA TEMPESTADE
   * ==========================================================
   */

  const climaSevero =
    clima &&
    [65, 67, 82, 95, 96, 97, 99].includes(clima.codigo);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="flex min-h-[68px] items-center gap-3">

            {/* LOGO */}
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="flex shrink-0 items-center"
              aria-label="Ir para o início"
            >
              <img
                src={LOGO}
                alt="Sobradão 360"
                className="h-12 w-auto object-contain sm:h-14"
              />
            </button>

            {/* NOME */}
            <div className="hidden sm:block shrink-0">
              <div className="text-lg font-black leading-none text-slate-800">
                Sobradão
              </div>

              <div className="text-xs font-bold tracking-[0.22em] text-emerald-600">
                360
              </div>
            </div>

            {/* CLIMA */}
            <div className="ml-auto flex min-w-0 items-center">
              {clima ? (
                <button
                  type="button"
                  onClick={() => {
                    alert(
                      `📍 Rio Claro - SP\n\n` +
                        `${clima.icone} ${clima.condicao}\n` +
                        `🌡️ ${clima.temp}°C\n` +
                        `💧 Umidade: ${clima.umidade}%\n` +
                        `💨 Vento: ${clima.vento} km/h`
                    );
                  }}
                  className={`rounded-xl px-2 py-1.5 text-left transition sm:px-3 ${
                    climaSevero
                      ? "bg-orange-50 hover:bg-orange-100"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">
                      {clima.icone}
                    </span>

                    <div className="leading-none">
                      <div className="flex items-center gap-1">
                        <span className="text-base font-black text-slate-800">
                          {clima.temp}°C
                        </span>

                        {climaSevero && (
                          <span
                            className="text-sm"
                            title="Condição meteorológica severa"
                          >
                            ⚠️
                          </span>
                        )}
                      </div>

                      <div className="max-w-[125px] truncate text-[10px] font-semibold text-slate-500 sm:max-w-[170px] sm:text-xs">
                        {clima.condicao}
                      </div>

                      <div className="hidden text-[9px] text-slate-400 sm:block">
                        Rio Claro
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="px-2 text-xs text-slate-400">
                  🌤️ Carregando...
                </div>
              )}
            </div>

            {/* PERFIL */}
            <div className="shrink-0">
              {user ? (
                <button
                  type="button"
                  onClick={() => setPerfilAberto(true)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-2 shadow-sm transition hover:bg-slate-50"
                  title="Meu perfil"
                >
                  {foto ? (
                    <img
                      src={foto}
                      alt="Perfil"
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-lg text-white">
                      👤
                    </div>
                  )}

                  <span className="hidden max-w-[100px] truncate text-xs font-bold text-slate-700 sm:block">
                    {nome || "Perfil"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={entrar}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  👤
                  <span className="hidden sm:inline">
                    Entrar
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* PLANTÃO */}
          <div className="flex h-7 items-center overflow-hidden border-t border-slate-100">
            <span className="mr-2 shrink-0 text-[10px] font-black uppercase tracking-wider text-emerald-700">
              PLANTÃO
            </span>

            <div className="truncate text-[10px] font-medium text-slate-500 sm:text-xs">
              {alertas[alertaAtual]}
            </div>

            {moradores !== null && (
              <div className="ml-auto hidden shrink-0 text-[10px] font-semibold text-slate-400 sm:block">
                👥 {moradores.toLocaleString("pt-BR")} moradores
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MODAL DO PERFIL */}
      {perfilAberto && user && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPerfilAberto(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Meu Perfil
                </h2>

                <p className="text-xs text-slate-500">
                  Seus dados no Sobradão 360
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPerfilAberto(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-lg text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            {/* FOTO */}
            <div className="mb-5 flex flex-col items-center">
              {foto ? (
                <img
                  src={foto}
                  alt="Foto do perfil"
                  className="h-24 w-24 rounded-full border-4 border-emerald-100 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-4xl">
                  👤
                </div>
              )}

              <label className="mt-3 cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                📷 Alterar foto

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={selecionarFoto}
                />
              </label>
            </div>

            {/* NOME */}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Nome
              </label>

              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                placeholder="Seu nome"
              />
            </div>

            {/* CELULAR */}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-bold text-slate-600">
                WhatsApp / Celular
              </label>

              <input
                type="tel"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                placeholder="(19) 99999-9999"
              />
            </div>

            {/* EMAIL */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-bold text-slate-600">
                E-mail
              </label>

              <input
                type="email"
                value={user.email || ""}
                disabled
                className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
              />
            </div>

            {mensagemPerfil && (
              <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700">
                {mensagemPerfil}
              </div>
            )}

            {/* BOTÕES */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={salvarPerfil}
                disabled={salvandoPerfil}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {salvandoPerfil ? "Salvando..." : "Salvar perfil"}
              </button>

              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setPerfilAberto(false);
                }}
                className="rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}