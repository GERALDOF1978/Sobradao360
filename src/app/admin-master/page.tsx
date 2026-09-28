"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { db } from "@/lib/firebase";

type UsuarioFirebase = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

interface LojaParceira {
  id: string;

  uidDono?: string;
  nomeResponsavel?: string;
  emailDono?: string;

  nome?: string;
  titulo?: string;
  subtitulo?: string;
  descricao?: string;

  tipo?: string;

  telefone?: string;
  whatsapp?: string;

  tipoPresenca?:
    | "pagina_sobradao"
    | "site_externo"
    | "whatsapp";

  destinoDescricao?: string;
  siteUrl?: string;

  imagemUrl?: string;

  ativo?: boolean;
  status?: string;

  temLojaCriada?: boolean;
  linkLoja?: string;

  plano?: string;
  statusPagamento?: string;
  valorPlano?: number;

  mostrarMarquee?: boolean;
  mostrarCard?: boolean;
  mostrarBanner?: boolean;

  criadoEm?: unknown;
  atualizadoEm?: unknown;
}

interface Usuario {
  id: string;
  nome?: string;
  displayName?: string;
  email?: string;
  perfil?: string;
}

interface UsuarioLogado {
  uid: string;
  email: string | null;
  displayName: string | null;
}

const TIPOS: Record<string, string> = {
  loja: "Loja / Comércio",
  oficina: "Oficina / Assistência",
  profissional: "Profissional / Prestador",
  alimentacao: "Alimentação",
  eventos: "Eventos",
  empresa: "Empresa",
  tecnologia: "Tecnologia / Serviço digital",
  outros: "Outro",
};

const DESTINOS: Record<string, string> = {
  pagina_sobradao: "Página dentro do Sobradão 360",
  site_externo: "Site / Loja externa",
  whatsapp: "WhatsApp",
};

const FILTROS = [
  { valor: "todos", texto: "Todos" },
  { valor: "PENDENTE", texto: "Pendentes" },
  { valor: "APROVADO", texto: "Aprovados" },
  { valor: "SUSPENSO", texto: "Suspensos" },
];

function formatarData(valor: unknown): string {
  if (!valor) {
    return "-";
  }

  try {
    if (
      typeof valor === "object" &&
      valor !== null &&
      "toDate" in valor &&
      typeof (valor as { toDate?: unknown }).toDate === "function"
    ) {
      const data = (
        valor as {
          toDate: () => Date;
        }
      ).toDate();

      return data.toLocaleDateString("pt-BR");
    }

    if (valor instanceof Date) {
      return valor.toLocaleDateString("pt-BR");
    }

    return "-";
  } catch {
    return "-";
  }
}

function limparWhatsapp(numero: string): string {
  return numero.replace(/\D/g, "");
}

export default function AdminMasterPage() {
  const [user, setUser] = useState<UsuarioLogado | null>(null);

  const [autorizado, setAutorizado] = useState(false);

  const [carregando, setCarregando] = useState(true);

  const [lojas, setLojas] = useState<LojaParceira[]>([]);

  const [selecionada, setSelecionada] =
    useState<LojaParceira | null>(null);

  const [processando, setProcessando] =
    useState<string | null>(null);

  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    const auth = getAuth();

    const cancelar = auth.onAuthStateChanged(
  async (usuario: UsuarioFirebase | null) => {
      if (!usuario) {
        setUser(null);
        setAutorizado(false);
        setCarregando(false);
        return;
      }

      const usuarioAtual: UsuarioLogado = {
        uid: usuario.uid,
        email: usuario.email,
        displayName: usuario.displayName,
      };

      setUser(usuarioAtual);

      try {
        const usuarioRef = doc(
          db,
          "usuarios",
          usuario.uid
        );

        const usuarioSnapshot = await getDoc(usuarioRef);

        if (!usuarioSnapshot.exists()) {
          setAutorizado(false);
          setCarregando(false);
          return;
        }

        const dados = usuarioSnapshot.data() as {
          nome?: string;
          displayName?: string;
          email?: string;
          perfil?: string;
        };

        if (dados.perfil !== "master") {
          setAutorizado(false);
          setCarregando(false);
          return;
        }

        setAutorizado(true);

        await carregarLojas();
      } catch (error: unknown) {
        console.error(
          "Erro ao verificar acesso Master:",
          error
        );

        setAutorizado(false);
      } finally {
        setCarregando(false);
      }
    });

    return () => cancelar();
  }, []);

  async function carregarLojas() {
    try {
      const lojasRef = collection(
        db,
        "lojas_parceiras"
      );

      const consulta = query(
        lojasRef,
        orderBy("criadoEm", "desc")
      );

      const snapshot = await getDocs(consulta);

      const usuariosSnapshot = await getDocs(
        collection(db, "usuarios")
      );

      const usuariosMap = new Map<
        string,
        Usuario
      >();

      usuariosSnapshot.docs.forEach(
  (usuarioDoc: {
    id: string;
    data: () => Record<string, unknown>;
  }) => {
        const dados = usuarioDoc.data() as {
          nome?: string;
          displayName?: string;
          email?: string;
          perfil?: string;
        };

        usuariosMap.set(usuarioDoc.id, {
          id: usuarioDoc.id,
          ...dados,
        });
      });

      const lista: LojaParceira[] =
        snapshot.docs.map(
  (item: {
    id: string;
    data: () => Record<string, unknown>;
  }) => {
          const dados = item.data() as Omit<
            LojaParceira,
            "id"
          >;

          const usuario = dados.uidDono
            ? usuariosMap.get(dados.uidDono)
            : undefined;

          return {
            id: item.id,
            ...dados,

            nomeResponsavel:
              dados.nomeResponsavel ||
              usuario?.nome ||
              usuario?.displayName ||
              "",

            emailDono:
              dados.emailDono ||
              usuario?.email ||
              "",
          };
        });

      setLojas(lista);
    } catch (error: unknown) {
      console.error(
        "Erro ao carregar lojas parceiras:",
        error
      );
    }
  }

  async function aprovarLoja(id: string) {
    setProcessando(id);

    try {
      const lojaRef = doc(
        db,
        "lojas_parceiras",
        id
      );

      await updateDoc(lojaRef, {
        status: "APROVADO",
        ativo: true,
        atualizadoEm: serverTimestamp(),
      });

      setLojas((lista) =>
        lista.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "APROVADO",
                ativo: true,
              }
            : item
        )
      );

      setSelecionada((item) =>
        item && item.id === id
          ? {
              ...item,
              status: "APROVADO",
              ativo: true,
            }
          : item
      );
    } catch (error: unknown) {
      console.error(
        "Erro ao aprovar loja:",
        error
      );

      alert(
        "Não foi possível aprovar este parceiro."
      );
    } finally {
      setProcessando(null);
    }
  }

  async function suspenderLoja(id: string) {
    setProcessando(id);

    try {
      const lojaRef = doc(
        db,
        "lojas_parceiras",
        id
      );

      await updateDoc(lojaRef, {
        status: "SUSPENSO",
        ativo: false,
        atualizadoEm: serverTimestamp(),
      });

      setLojas((lista) =>
        lista.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "SUSPENSO",
                ativo: false,
              }
            : item
        )
      );

      setSelecionada((item) =>
        item && item.id === id
          ? {
              ...item,
              status: "SUSPENSO",
              ativo: false,
            }
          : item
      );
    } catch (error: unknown) {
      console.error(
        "Erro ao suspender loja:",
        error
      );

      alert(
        "Não foi possível suspender este parceiro."
      );
    } finally {
      setProcessando(null);
    }
  }

  async function reativarLoja(id: string) {
    setProcessando(id);

    try {
      const lojaRef = doc(
        db,
        "lojas_parceiras",
        id
      );

      await updateDoc(lojaRef, {
        status: "APROVADO",
        ativo: true,
        atualizadoEm: serverTimestamp(),
      });

      setLojas((lista) =>
        lista.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "APROVADO",
                ativo: true,
              }
            : item
        )
      );

      setSelecionada((item) =>
        item && item.id === id
          ? {
              ...item,
              status: "APROVADO",
              ativo: true,
            }
          : item
      );
    } catch (error: unknown) {
      console.error(
        "Erro ao reativar loja:",
        error
      );

      alert(
        "Não foi possível reativar este parceiro."
      );
    } finally {
      setProcessando(null);
    }
  }

  function abrirDestino(item: LojaParceira) {
    if (
      item.tipoPresenca === "site_externo" &&
      item.siteUrl
    ) {
      const url =
        item.siteUrl.startsWith("http://") ||
        item.siteUrl.startsWith("https://")
          ? item.siteUrl
          : `https://${item.siteUrl}`;

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    if (
      item.tipoPresenca === "whatsapp" &&
      item.whatsapp
    ) {
      const numero = limparWhatsapp(
        item.whatsapp
      );

      if (numero) {
        window.open(
          `https://wa.me/55${numero}`,
          "_blank",
          "noopener,noreferrer"
        );
      }

      return;
    }

    window.open(
      `/loja/${item.id}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const lojasFiltradas =
    filtro === "todos"
      ? lojas
      : lojas.filter(
          (item) =>
            (item.status || "PENDENTE") ===
            filtro
        );

  const total = lojas.length;

  const pendentes = lojas.filter(
    (item) =>
      (item.status || "PENDENTE") ===
      "PENDENTE"
  ).length;

  const aprovadas = lojas.filter(
    (item) =>
      item.status === "APROVADO"
  ).length;

  const suspensas = lojas.filter(
    (item) =>
      item.status === "SUSPENSO"
  ).length;

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow">
            Carregando painel Master...
          </div>
        </div>
      </main>
    );
  }

  if (!autorizado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">

          <div className="mb-4 text-5xl">
            🔒
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Acesso restrito
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Esta área é exclusiva
            para o usuário Master.
          </p>

          {user?.email && (
            <p className="mt-4 text-xs text-slate-400">
              Usuário: {user.email}
            </p>
          )}

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">

      <div className="mx-auto max-w-7xl">

        <header className="mb-6">
          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>
                <div className="mb-1 text-sm font-semibold uppercase tracking-wider text-amber-400">
                  Sobradão 360
                </div>

                <h1 className="text-2xl font-bold md:text-3xl">
                  Painel Master
                </h1>

                <p className="mt-1 text-sm text-slate-300">
                  Administração dos anunciantes parceiros
                </p>
              </div>

              <div className="rounded-xl bg-white/10 px-4 py-3 text-sm">
                Logado como:
                <div className="font-bold text-white">
                  {user?.email || "Master"}
                </div>
              </div>

            </div>

          </div>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">
              Total
            </div>
            <div className="mt-1 text-3xl font-bold text-slate-900">
              {total}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">
              Pendentes
            </div>
            <div className="mt-1 text-3xl font-bold text-amber-500">
              {pendentes}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">
              Aprovados
            </div>
            <div className="mt-1 text-3xl font-bold text-green-600">
              {aprovadas}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">
              Suspensos
            </div>
            <div className="mt-1 text-3xl font-bold text-red-600">
              {suspensas}
            </div>
          </div>

        </section>

        <section className="mb-6 flex flex-wrap gap-2">

          {FILTROS.map((filtroItem) => (
            <button
              key={filtroItem.valor}
              type="button"
              onClick={() =>
                setFiltro(filtroItem.valor)
              }
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                filtro === filtroItem.valor
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              }`}
            >
              {filtroItem.texto}
            </button>
          ))}

        </section>

        <section className="space-y-4">

          {lojasFiltradas.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

              <div className="mb-2 text-4xl">
                🏪
              </div>

              <h2 className="font-bold text-slate-800">
                Nenhum anunciante encontrado
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Não existem parceiros neste filtro.
              </p>

            </div>
          ) : (
            lojasFiltradas.map((item) => {

              const status =
                item.status || "PENDENTE";

              return (
                <article
                  key={item.id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div className="min-w-0 flex-1">

                      <div className="mb-2 flex flex-wrap items-center gap-2">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            status === "APROVADO"
                              ? "bg-green-100 text-green-700"
                              : status === "SUSPENSO"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {status}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {TIPOS[item.tipo || ""] ||
                            "Parceiro"}
                        </span>

                      </div>

                      <h2 className="text-xl font-bold text-slate-900">
                        {item.nome ||
                          item.titulo ||
                          "Sem nome"}
                      </h2>

                      {item.subtitulo && (
                        <p className="mt-1 text-sm text-slate-500">
                          {item.subtitulo}
                        </p>
                      )}

                      <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">

                        <div>
                          <span className="font-semibold text-slate-700">
                            Responsável:
                          </span>{" "}
                          {item.nomeResponsavel ||
                            "Não informado"}
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            E-mail:
                          </span>{" "}
                          {item.emailDono ||
                            "Não informado"}
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            Telefone:
                          </span>{" "}
                          {item.telefone ||
                            "Não informado"}
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            WhatsApp:
                          </span>{" "}
                          {item.whatsapp ||
                            "Não informado"}
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            Presença:
                          </span>{" "}
                          {DESTINOS[
                            item.tipoPresenca || ""
                          ] ||
                            "Página Sobradão 360"}
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            Cadastro:
                          </span>{" "}
                          {formatarData(
                            item.criadoEm
                          )}
                        </div>

                      </div>

                      {item.siteUrl && (
                        <div className="mt-3 break-all text-sm">
                          <span className="font-semibold text-slate-700">
                            Site:
                          </span>{" "}
                          {item.siteUrl}
                        </div>
                      )}

                      {item.descricao && (
                        <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                          {item.descricao}
                        </p>
                      )}

                    </div>

                    <div className="flex flex-wrap gap-2 lg:w-[270px] lg:justify-end">

                      <button
                        type="button"
                        onClick={() =>
                          setSelecionada(item)
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Detalhes
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          abrirDestino(item)
                        }
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                      >
                        Abrir
                      </button>

                      {status !== "APROVADO" && (
                        <button
                          type="button"
                          disabled={
                            processando === item.id
                          }
                          onClick={() =>
                            aprovarLoja(item.id)
                          }
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {processando === item.id
                            ? "..."
                            : "Aprovar"}
                        </button>
                      )}

                      {status === "APROVADO" && (
                        <button
                          type="button"
                          disabled={
                            processando === item.id
                          }
                          onClick={() =>
                            suspenderLoja(item.id)
                          }
                          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {processando === item.id
                            ? "..."
                            : "Suspender"}
                        </button>
                      )}

                      {status === "SUSPENSO" && (
                        <button
                          type="button"
                          disabled={
                            processando === item.id
                          }
                          onClick={() =>
                            reativarLoja(item.id)
                          }
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {processando === item.id
                            ? "..."
                            : "Reativar"}
                        </button>
                      )}

                    </div>

                  </div>

                </article>
              );
            })
          )}

        </section>

      </div>

      {selecionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() =>
            setSelecionada(null)
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="mb-5 flex items-start justify-between gap-4">

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Detalhes do parceiro
                </div>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {selecionada.nome ||
                    selecionada.titulo ||
                    "Sem nome"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelecionada(null)
                }
                className="rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>

            </div>

            <div className="space-y-4 text-sm">

              <div className="rounded-xl bg-slate-50 p-4">

                <h3 className="mb-2 font-bold text-slate-800">
                  Proprietário
                </h3>

                <p>
                  <strong>Nome:</strong>{" "}
                  {selecionada.nomeResponsavel ||
                    "Não informado"}
                </p>

                <p>
                  <strong>E-mail:</strong>{" "}
                  {selecionada.emailDono ||
                    "Não informado"}
                </p>

                <p className="break-all">
                  <strong>UID:</strong>{" "}
                  {selecionada.uidDono ||
                    "Não informado"}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <h3 className="mb-2 font-bold text-slate-800">
                  Negócio
                </h3>

                <p>
                  <strong>Tipo:</strong>{" "}
                  {TIPOS[
                    selecionada.tipo || ""
                  ] ||
                    "Não informado"}
                </p>

                <p>
                  <strong>Telefone:</strong>{" "}
                  {selecionada.telefone ||
                    "Não informado"}
                </p>

                <p>
                  <strong>WhatsApp:</strong>{" "}
                  {selecionada.whatsapp ||
                    "Não informado"}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <h3 className="mb-2 font-bold text-slate-800">
                  Presença no portal
                </h3>

                <p>
                  <strong>Destino:</strong>{" "}
                  {DESTINOS[
                    selecionada.tipoPresenca ||
                      ""
                  ] ||
                    "Página dentro do Sobradão 360"}
                </p>

                {selecionada.siteUrl && (
                  <p className="mt-1 break-all">
                    <strong>Site:</strong>{" "}
                    {selecionada.siteUrl}
                  </p>
                )}

                {selecionada.destinoDescricao && (
                  <p className="mt-1">
                    <strong>Descrição:</strong>{" "}
                    {selecionada.destinoDescricao}
                  </p>
                )}

              </div>

              {selecionada.descricao && (
                <div className="rounded-xl bg-slate-50 p-4">

                  <h3 className="mb-2 font-bold text-slate-800">
                    Descrição
                  </h3>

                  <p className="whitespace-pre-wrap text-slate-600">
                    {selecionada.descricao}
                  </p>

                </div>
              )}

            </div>

            <div className="mt-6 flex justify-end gap-2">

              <button
                type="button"
                onClick={() =>
                  abrirDestino(selecionada)
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700"
              >
                Abrir destino
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelecionada(null)
                }
                className="rounded-xl bg-slate-900 px-5 py-2.5 font-bold text-white hover:bg-slate-800"
              >
                Fechar
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}