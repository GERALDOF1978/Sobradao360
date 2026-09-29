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
}

interface AlertaMeteorologico {
  id: string;
  titulo: string;
  severidade: string;
  severidadeNivel: number;
  inicio: string | null;
  fim: string | null;
  descricao: string;
  instrucao: string;
  area: string;
  fonte: string;
}

const LOGO =
  "https://i.ibb.co/xqw1GRhg/file-0000000053bc81fd859392bfffad0801.png";

const plantao = [
  "📢 Bem-vindo ao Sobradão 360",
  "🏘️ Informação e serviços para a comunidade",
  "📣 Tem algo para anunciar? Publique no Sobradão 360",
];

function interpretarClima(codigo: number, isDay: boolean) {
  if (codigo === 0)
    return {
      condicao: isDay ? "Ensolarado" : "Céu limpo",
      icone: isDay ? "☀️" : "🌙",
    };

  if (codigo === 1)
    return {
      condicao: isDay ? "Poucas nuvens" : "Poucas nuvens",
      icone: isDay ? "🌤️" : "🌙",
    };

  if (codigo === 2)
    return {
      condicao: "Parcialmente nublado",
      icone: "⛅",
    };

  if (codigo === 3)
    return {
      condicao: "Nublado",
      icone: "☁️",
    };

  if (codigo === 45 || codigo === 48)
    return {
      condicao: "Neblina",
      icone: "🌫️",
    };

  if ([51, 53, 55, 56, 57].includes(codigo))
    return {
      condicao: "Garoa",
      icone: "🌦️",
    };

  if ([61, 63, 65, 66, 67].includes(codigo))
    return {
      condicao: codigo === 65 || codigo === 67
        ? "Chuva forte"
        : "Chuva",
      icone: "🌧️",
    };

  if ([80, 81, 82].includes(codigo))
    return {
      condicao:
        codigo === 82
          ? "Pancadas fortes"
          : "Pancadas de chuva",
      icone: "🌦️",
    };

  if ([95, 96, 97, 99].includes(codigo))
    return {
      condicao:
        codigo === 99 || codigo === 96
          ? "Tempestade com granizo"
          : codigo === 97
          ? "Tempestade forte"
          : "Tempestade",
      icone: "⛈️",
    };

  return {
    condicao: "Condição variável",
    icone: "🌤️",
  };
}

export default function Cabecalho() {
  const { user, loginWithGoogle, logout } = useAuth();

  const [clima, setClima] = useState<ClimaData | null>(null);

  const [alertasMeteorologicos, setAlertasMeteorologicos] =
    useState<AlertaMeteorologico[]>([]);

  const [alertaSelecionado, setAlertaSelecionado] =
    useState<AlertaMeteorologico | null>(null);

  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [foto, setFoto] = useState("");

  const [perfilAberto, setPerfilAberto] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [mensagemPerfil, setMensagemPerfil] = useState("");

  const [plantaoAtual, setPlantaoAtual] = useState(0);

  /*
   * =========================================================
   * CLIMA
   * =========================================================
   */

  useEffect(() => {
    async function buscarClima() {
      try {
        const url =
          "https://api.open-meteo.com/v1/forecast" +
          "?latitude=-22.4114" +
          "&longitude=-47.5614" +
          "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day" +
          "&timezone=America%2FSao_Paulo";

        const resposta = await fetch(url);

        if (!resposta.ok) {
          throw new Error("Erro ao consultar clima");
        }

        const dados = await resposta.json();
        const atual = dados.current;

        const interpretacao = interpretarClima(
          Number(atual.weather_code),
          Number(atual.is_day) === 1
        );

        setClima({
          temp: Math.round(Number(atual.temperature_2m)),
          condicao: interpretacao.condicao,
          icone: interpretacao.icone,
          codigo: Number(atual.weather_code),
          vento: Math.round(Number(atual.wind_speed_10m)),
          umidade: Math.round(
            Number(atual.relative_humidity_2m)
          ),
        });
      } catch (erro) {
        console.error("Erro ao buscar clima:", erro);
      }
    }

    buscarClima();

    const intervalo = setInterval(
      buscarClima,
      15 * 60 * 1000
    );

    return () => clearInterval(intervalo);
  }, []);

  /*
   * =========================================================
   * ALERTAS INMET
   * =========================================================
   */

  useEffect(() => {
    async function buscarAlertas() {
      try {
        const resposta = await fetch("/api/alertas", {
          cache: "no-store",
        });

        if (!resposta.ok) return;

        const dados = await resposta.json();

        if (
          dados?.sucesso &&
          Array.isArray(dados.alertas)
        ) {
          setAlertasMeteorologicos(dados.alertas);
        } else {
          setAlertasMeteorologicos([]);
        }
      } catch (erro) {
        console.error(
          "Erro ao buscar alertas:",
          erro
        );

        setAlertasMeteorologicos([]);
      }
    }

    buscarAlertas();

    const intervalo = setInterval(
      buscarAlertas,
      5 * 60 * 1000
    );

    return () => clearInterval(intervalo);
  }, []);

  /*
   * =========================================================
   * PERFIL
   * =========================================================
   */

  useEffect(() => {
    if (!user) {
      setNome("");
      setCelular("");
      setFoto("");
      return;
    }

    async function carregarPerfil() {
      try {
        const referencia = doc(
          db,
          "usuarios",
          user.uid
        );

        const snap = await getDoc(referencia);

        if (snap.exists()) {
          const dados = snap.data();

          setNome(
            dados.nome ||
              user.displayName ||
              ""
          );

          setCelular(dados.celular || "");

          setFoto(
            dados.fotoURL ||
              user.photoURL ||
              ""
          );
        } else {
          setNome(user.displayName || "");
          setFoto(user.photoURL || "");
        }
      } catch (erro) {
        console.error(
          "Erro ao carregar perfil:",
          erro
        );
      }
    }

    carregarPerfil();
  }, [user]);

  /*
   * =========================================================
   * PLANTÃO
   * =========================================================
   */

  useEffect(() => {
    const intervalo = setInterval(() => {
      setPlantaoAtual(
        (anterior) =>
          (anterior + 1) % plantao.length
      );
    }, 6000);

    return () => clearInterval(intervalo);
  }, []);

  /*
   * =========================================================
   * SALVAR PERFIL
   * =========================================================
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
          fotoURL:
            foto ||
            user.photoURL ||
            "",
          email: user.email || "",
          atualizadoEm: new Date(),
        },
        { merge: true }
      );

      setMensagemPerfil(
        "Perfil atualizado com sucesso!"
      );

      setTimeout(() => {
        setMensagemPerfil("");
      }, 2500);
    } catch (erro) {
      console.error(
        "Erro ao salvar perfil:",
        erro
      );

      setMensagemPerfil(
        "Não foi possível salvar o perfil."
      );
    } finally {
      setSalvandoPerfil(false);
    }
  }

  /*
   * =========================================================
   * FOTO
   * =========================================================
   */

  async function selecionarFoto(
    evento: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      evento.target.files?.[0];

    if (!arquivo || !user) return;

    try {
      const formData = new FormData();

      formData.append(
        "file",
        arquivo
      );

      formData.append(
        "folder",
        "usuarios"
      );

      const resposta = await fetch(
        "/api/upload-image",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!resposta.ok) {
        throw new Error(
          "Erro no upload"
        );
      }

      const dados =
        await resposta.json();

      if (dados.url) {
        setFoto(dados.url);
      }
    } catch (erro) {
      console.error(
        "Erro ao enviar foto:",
        erro
      );

      setMensagemPerfil(
        "Não foi possível enviar a foto."
      );
    }
  }

  /*
   * =========================================================
   * LOGIN
   * =========================================================
   */

  async function entrar() {
    try {
      await loginWithGoogle();
    } catch (erro) {
      console.error(
        "Erro ao entrar:",
        erro
      );
    }
  }

  const alertaPrincipal =
    alertasMeteorologicos.length > 0
      ? alertasMeteorologicos[0]
      : null;

  function estiloAlerta() {
    if (!alertaPrincipal) {
      return "bg-emerald-50 text-emerald-700";
    }

    if (
      alertaPrincipal.severidadeNivel >= 3
    ) {
      return "bg-red-100 text-red-700";
    }

    if (
      alertaPrincipal.severidadeNivel === 2
    ) {
      return "bg-orange-100 text-orange-700";
    }

    return "bg-yellow-100 text-yellow-800";
  }

  return (
    <>
      {/* =====================================================
          CABEÇALHO COMPACTO
          ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">

        <div className="mx-auto max-w-7xl px-2 sm:px-4">

          <div className="flex h-[64px] items-center gap-2">

            {/* LOGO */}

            <button
              type="button"
              onClick={() =>
                (window.location.href = "/")
              }
              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
              aria-label="Página inicial"
            >
              <img
                src={LOGO}
                alt="Sobradão 360"
                className="h-12 w-12 object-contain"
              />
            </button>

            {/* PLANTÃO */}

            <div className="min-w-0 flex-1 px-1">
              <div className="flex h-10 items-center">
                <span className="mr-2 shrink-0 text-[8px] font-black tracking-wider text-emerald-700 sm:text-[9px]">
                  PLANTÃO
                </span>

                <span className="truncate text-[9px] text-slate-500 sm:text-[10px]">
                  {plantao[plantaoAtual]}
                </span>
              </div>
            </div>

            {/* CLIMA */}

            <div className="ml-auto flex items-center">

              {clima ? (
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      `📍 Sobradão • Rio Claro/SP\n\n` +
                        `${clima.icone} ${clima.condicao}\n` +
                        `🌡️ ${clima.temp}°C\n` +
                        `💧 Umidade: ${clima.umidade}%\n` +
                        `💨 Vento: ${clima.vento} km/h`
                    )
                  }
                  className="flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-slate-100"
                  title="Ver clima"
                >
                  <span className="text-lg">
                    {clima.icone}
                  </span>

                  <div className="leading-none text-left">
                    <div className="text-sm font-black text-slate-800">
                      {clima.temp}°C
                    </div>

                    <div className="max-w-[90px] truncate text-[9px] font-semibold text-slate-500 sm:max-w-[130px] sm:text-[10px]">
                      {clima.condicao}
                    </div>
                  </div>
                </button>
              ) : (
                <span className="text-[10px] text-slate-400">
                  🌤️ ...
                </span>
              )}

              {/* ALERTA */}

              <button
                type="button"
                disabled={!alertaPrincipal}
                onClick={() => {
                  if (alertaPrincipal) {
                    setAlertaSelecionado(
                      alertaPrincipal
                    );
                  }
                }}
                className={`ml-1 rounded-lg px-2 py-1 text-[9px] font-black sm:text-[10px] ${estiloAlerta()}`}
              >
                {alertaPrincipal
                  ? "⚠️ ALERTA"
                  : "✓ SEM ALERTAS"}
              </button>

            </div>

            {/* PERFIL */}

            <button
              type="button"
              onClick={() => {
                if (user) {
                  setPerfilAberto(true);
                } else {
                  entrar();
                }
              }}
              className="ml-1 shrink-0 rounded-full border border-slate-200 bg-white p-0.5 shadow-sm"
              title={
                user
                  ? "Meu perfil"
                  : "Entrar"
              }
            >
              {user && foto ? (
                <img
                  src={foto}
                  alt="Perfil"
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-base text-white">
                  👤
                </div>
              )}
            </button>

          </div>

        </div>
      </header>

      {/* =====================================================
          MODAL ALERTA
          ===================================================== */}

      {alertaSelecionado && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          onClick={() =>
            setAlertaSelecionado(null)
          }
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >

            <div className="flex items-start justify-between gap-3">

              <div>
                <div className="text-xs font-black uppercase tracking-wider text-orange-600">
                  ⚠️ Aviso Meteorológico
                </div>

                <h2 className="mt-1 text-xl font-black text-slate-800">
                  {alertaSelecionado.titulo}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAlertaSelecionado(null)
                }
                className="rounded-full bg-slate-100 px-3 py-1 text-lg text-slate-500"
              >
                ×
              </button>

            </div>

            <div
              className={`mt-4 rounded-xl px-4 py-3 text-sm font-black ${estiloAlerta()}`}
            >
              ⚠️ {alertaSelecionado.severidade}
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-600">

              <p>
                <strong>📍 Área:</strong>{" "}
                {alertaSelecionado.area}
              </p>

              {alertaSelecionado.inicio && (
                <p>
                  <strong>🕐 Início:</strong>{" "}
                  {new Date(
                    alertaSelecionado.inicio
                  ).toLocaleString("pt-BR")}
                </p>
              )}

              {alertaSelecionado.fim && (
                <p>
                  <strong>⏰ Término:</strong>{" "}
                  {new Date(
                    alertaSelecionado.fim
                  ).toLocaleString("pt-BR")}
                </p>
              )}

              {alertaSelecionado.descricao && (
                <div>
                  <strong>
                    📋 Informações:
                  </strong>

                  <p className="mt-1 whitespace-pre-line leading-relaxed">
                    {alertaSelecionado.descricao}
                  </p>
                </div>
              )}

              {alertaSelecionado.instrucao && (
                <div className="rounded-xl bg-slate-50 p-3">
                  <strong>
                    🛡️ Recomendações:
                  </strong>

                  <p className="mt-1 whitespace-pre-line">
                    {alertaSelecionado.instrucao}
                  </p>
                </div>
              )}

            </div>

            <div className="mt-5 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
              Fonte: {alertaSelecionado.fonte}
            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          MODAL PERFIL
          ===================================================== */}

      {perfilAberto && user && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() =>
            setPerfilAberto(false)
          }
        >

          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(evento) =>
              evento.stopPropagation()
            }
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
                onClick={() =>
                  setPerfilAberto(false)
                }
                className="rounded-full bg-slate-100 px-3 py-1 text-lg text-slate-500"
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

              <label className="mt-3 cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
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
                onChange={(e) =>
                  setNome(e.target.value)
                }
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
                onChange={(e) =>
                  setCelular(e.target.value)
                }
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
                {salvandoPerfil
                  ? "Salvando..."
                  : "Salvar perfil"}
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