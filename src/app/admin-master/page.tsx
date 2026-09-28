"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface Anunciante {
  id: string;
  nome: string;
  titulo: string;
  subtitulo: string;
  tipo: string;
  telefone: string;
  whatsapp: string;
  descricao: string;
  status: string;
  ativo: boolean;
  uidDono: string;
  criadoEm?: any;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  foto: string;
  status: string;
  perfil: string;
}

export default function AdminMasterPage() {
  const { user, loading: authLoading } = useAuth();

  const [autorizado, setAutorizado] = useState(false);
  const [verificando, setVerificando] = useState(true);

  const [anunciantes, setAnunciantes] = useState<Anunciante[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [aba, setAba] = useState<
    "anunciantes" | "moradores" | "publicidades" | "denuncias"
  >("anunciantes");

  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState("");

  useEffect(() => {
    async function verificarMaster() {
      if (!user) {
        setAutorizado(false);
        setVerificando(false);
        return;
      }

      try {
        const usuarioRef = doc(db, "usuarios", user.uid);
        const { getDoc } = await import("firebase/firestore");

        const snapshot = await getDoc(usuarioRef);

        if (
          snapshot.exists() &&
          snapshot.data()?.perfil === "master"
        ) {
          setAutorizado(true);
        } else {
          setAutorizado(false);
        }
      } catch (error) {
        console.error("Erro ao verificar administrador:", error);
        setAutorizado(false);
      } finally {
        setVerificando(false);
      }
    }

    if (!authLoading) {
      verificarMaster();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (autorizado) {
      carregarDados();
    }
  }, [autorizado]);

  async function carregarDados() {
    try {
      setCarregando(true);

      const lojasQuery = query(
        collection(db, "lojas_parceiras"),
        orderBy("criadoEm", "desc")
      );

      const usuariosQuery = query(
        collection(db, "usuarios")
      );

      const [lojasSnapshot, usuariosSnapshot] =
        await Promise.all([
          getDocs(lojasQuery),
          getDocs(usuariosQuery),
        ]);

      const listaLojas: Anunciante[] =
        lojasSnapshot.docs.map((item: any) => {
          const data = item.data();

          return {
            id: item.id,
            nome: data.nome || data.titulo || "Negócio",
            titulo: data.titulo || data.nome || "Negócio",
            subtitulo: data.subtitulo || "",
            tipo: data.tipo || "empresa",
            telefone: data.telefone || "",
            whatsapp: data.whatsapp || "",
            descricao: data.descricao || "",
            status: data.status || "PENDENTE",
            ativo: data.ativo === true,
            uidDono: data.uidDono || "",
            criadoEm: data.criadoEm,
          };
        });

      const listaUsuarios: Usuario[] =
        usuariosSnapshot.docs.map((item: any) => {
          const data = item.data();

          return {
            id: item.id,
            nome: data.nome || data.displayName || "Morador",
            email: data.email || "",
            foto: data.foto || data.photoURL || "",
            status: data.status || "ATIVO",
            perfil: data.perfil || "morador",
          };
        });

      setAnunciantes(listaLojas);
      setUsuarios(listaUsuarios);
    } catch (error) {
      console.error("Erro ao carregar painel:", error);
    } finally {
      setCarregando(false);
    }
  }

  async function aprovarAnunciante(item: Anunciante) {
    try {
      setProcessando(item.id);

      await updateDoc(
        doc(db, "lojas_parceiras", item.id),
        {
          status: "APROVADO",
          ativo: true,
          temLojaCriada: true,
          linkLoja: `/loja/${item.id}`,
          atualizadoEm: serverTimestamp(),
        }
      );

      await carregarDados();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      alert("Não foi possível aprovar este anunciante.");
    } finally {
      setProcessando("");
    }
  }

  async function suspenderAnunciante(item: Anunciante) {
    const motivo = window.prompt(
      "Informe o motivo da suspensão:"
    );

    if (!motivo?.trim()) {
      return;
    }

    try {
      setProcessando(item.id);

      await updateDoc(
        doc(db, "lojas_parceiras", item.id),
        {
          status: "SUSPENSO",
          ativo: false,
          motivoSuspensao: motivo.trim(),
          atualizadoEm: serverTimestamp(),
        }
      );

      await carregarDados();
    } catch (error) {
      console.error("Erro ao suspender:", error);
      alert("Não foi possível suspender.");
    } finally {
      setProcessando("");
    }
  }

  async function reativarAnunciante(item: Anunciante) {
    try {
      setProcessando(item.id);

      await updateDoc(
        doc(db, "lojas_parceiras", item.id),
        {
          status: "APROVADO",
          ativo: true,
          atualizadoEm: serverTimestamp(),
        }
      );

      await carregarDados();
    } catch (error) {
      console.error("Erro ao reativar:", error);
      alert("Não foi possível reativar.");
    } finally {
      setProcessando("");
    }
  }

  async function alterarStatusMorador(
    usuario: Usuario,
    novoStatus: "ATIVO" | "SUSPENSO" | "BLOQUEADO"
  ) {
    let motivo = "";

    if (novoStatus !== "ATIVO") {
      const resposta = window.prompt(
        `Informe o motivo para ${novoStatus.toLowerCase()}:`
      );

      if (!resposta?.trim()) {
        return;
      }

      motivo = resposta.trim();
    }

    try {
      setProcessando(usuario.id);

      await updateDoc(
        doc(db, "usuarios", usuario.id),
        {
          status: novoStatus,
          motivoStatus: motivo,
          alteradoPor: user?.uid || "",
          atualizadoEm: serverTimestamp(),
        }
      );

      await carregarDados();
    } catch (error) {
      console.error("Erro ao alterar morador:", error);
      alert("Não foi possível alterar o status.");
    } finally {
      setProcessando("");
    }
  }

  if (authLoading || verificando) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">👑</div>
          <p className="mt-3 text-sm font-bold text-slate-500">
            Verificando acesso...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">🔐</div>

          <h1 className="mt-4 text-xl font-black text-blue-950">
            Área administrativa
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Faça login para acessar o sistema.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-blue-900 px-5 py-3 text-xs font-black text-white"
          >
            ← Voltar
          </Link>
        </div>
      </main>
    );
  }

  if (!autorizado) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">⛔</div>

          <h1 className="mt-4 text-xl font-black text-red-700">
            Acesso não autorizado
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Esta área é exclusiva do Administrador Master
            do Sobradão 360.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-blue-900 px-5 py-3 text-xs font-black text-white"
          >
            ← Voltar para o portal
          </Link>
        </div>
      </main>
    );
  }

  const pendentes = anunciantes.filter(
    (item) =>
      item.status === "PENDENTE" ||
      (!item.status && !item.ativo)
  );

  const ativos = anunciantes.filter(
    (item) =>
      item.status === "APROVADO" &&
      item.ativo === true
  );

  const suspensos = anunciantes.filter(
    (item) =>
      item.status === "SUSPENSO" ||
      item.status === "BLOQUEADO"
  );

  const moradores = usuarios.filter(
    (item) => item.perfil !== "master"
  );

  return (
    <main className="min-h-screen bg-slate-100 pb-12">

      {/* CABEÇALHO */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white">

        <div className="mx-auto max-w-6xl px-4 py-6">

          <Link
            href="/"
            className="text-xs font-bold text-blue-200"
          >
            ← Sobradão 360
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                SOBRADÃO 360
              </p>

              <h1 className="mt-1 text-3xl font-black">
                👑 Admin Master
              </h1>

              <p className="mt-1 text-xs text-blue-200">
                Controle geral do portal
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-[10px] font-bold text-blue-200">
                ADMINISTRADOR
              </p>

              <p className="mt-1 text-xs font-black">
                {user.email}
              </p>
            </div>

          </div>

        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-5">

        {/* RESUMO */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-black text-amber-500">
              {pendentes.length}
            </p>
            <p className="mt-1 text-[10px] font-black uppercase text-slate-500">
              Pendentes
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-black text-emerald-600">
              {ativos.length}
            </p>
            <p className="mt-1 text-[10px] font-black uppercase text-slate-500">
              Ativos
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-black text-red-600">
              {suspensos.length}
            </p>
            <p className="mt-1 text-[10px] font-black uppercase text-slate-500">
              Suspensos
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-black text-blue-700">
              {moradores.length}
            </p>
            <p className="mt-1 text-[10px] font-black uppercase text-slate-500">
              Moradores
            </p>
          </div>

        </section>

        {/* MENU */}
        <div className="mt-5 overflow-x-auto">

          <div className="flex min-w-max gap-2">

            <button
              onClick={() => setAba("anunciantes")}
              className={`rounded-xl px-4 py-3 text-xs font-black ${
                aba === "anunciantes"
                  ? "bg-blue-900 text-white"
                  : "bg-white text-slate-600"
              }`}
            >
              🏪 Anunciantes
            </button>

            <button
              onClick={() => setAba("moradores")}
              className={`rounded-xl px-4 py-3 text-xs font-black ${
                aba === "moradores"
                  ? "bg-blue-900 text-white"
                  : "bg-white text-slate-600"
              }`}
            >
              👤 Moradores
            </button>

            <button
              onClick={() => setAba("publicidades")}
              className={`rounded-xl px-4 py-3 text-xs font-black ${
                aba === "publicidades"
                  ? "bg-blue-900 text-white"
                  : "bg-white text-slate-600"
              }`}
            >
              📢 Publicidades
            </button>

            <button
              onClick={() => setAba("denuncias")}
              className={`rounded-xl px-4 py-3 text-xs font-black ${
                aba === "denuncias"
                  ? "bg-blue-900 text-white"
                  : "bg-white text-slate-600"
              }`}
            >
              🚩 Denúncias
            </button>

          </div>
        </div>

        {/* ANUNCIANTES */}
        {aba === "anunciantes" && (
          <section className="mt-5 space-y-4">

            <div className="rounded-2xl bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    🏪 Anunciantes
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Aprove ou gerencie os negócios cadastrados.
                  </p>
                </div>

                <button
                  onClick={carregarDados}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600"
                >
                  🔄 Atualizar
                </button>

              </div>

            </div>

            {carregando ? (
              <div className="rounded-2xl bg-white p-8 text-center">
                <p className="text-sm font-bold text-slate-500">
                  Carregando...
                </p>
              </div>
            ) : anunciantes.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center">
                <div className="text-4xl">🏪</div>
                <p className="mt-3 text-sm font-black">
                  Nenhum anunciante cadastrado.
                </p>
              </div>
            ) : (
              anunciantes.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl bg-white p-5 shadow-sm"
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="text-lg font-black text-slate-900">
                          {item.nome}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                            item.status === "APROVADO"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "SUSPENSO"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.status || "PENDENTE"}
                        </span>

                      </div>

                      <p className="mt-1 text-xs font-bold text-blue-700">
                        {item.tipo}
                      </p>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.descricao || "Sem descrição."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500">

                        {item.telefone && (
                          <span className="rounded-lg bg-slate-100 px-2 py-1">
                            📞 {item.telefone}
                          </span>
                        )}

                        {item.whatsapp && (
                          <span className="rounded-lg bg-slate-100 px-2 py-1">
                            📱 {item.whatsapp}
                          </span>
                        )}

                      </div>

                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">

                      {item.status === "PENDENTE" && (
                        <button
                          onClick={() =>
                            aprovarAnunciante(item)
                          }
                          disabled={processando === item.id}
                          className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white disabled:opacity-50"
                        >
                          {processando === item.id
                            ? "..."
                            : "✓ Aprovar"}
                        </button>
                      )}

                      {item.status === "APROVADO" &&
                        item.ativo && (
                          <button
                            onClick={() =>
                              suspenderAnunciante(item)
                            }
                            disabled={processando === item.id}
                            className="rounded-xl bg-red-600 px-4 py-3 text-xs font-black text-white disabled:opacity-50"
                          >
                            Suspender
                          </button>
                        )}

                      {(item.status === "SUSPENSO" ||
                        !item.ativo) && (
                        <button
                          onClick={() =>
                            reativarAnunciante(item)
                          }
                          disabled={processando === item.id}
                          className="rounded-xl bg-blue-700 px-4 py-3 text-xs font-black text-white disabled:opacity-50"
                        >
                          Reativar
                        </button>
                      )}

                      {item.ativo && (
                        <Link
                          href={`/loja/${item.id}`}
                          target="_blank"
                          className="rounded-xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700"
                        >
                          👁 Ver página
                        </Link>
                      )}

                    </div>

                  </div>

                </article>
              ))
            )}

          </section>
        )}

        {/* MORADORES */}
        {aba === "moradores" && (
          <section className="mt-5 space-y-4">

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">
                👤 Moradores
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Gerencie o acesso dos moradores ao portal.
              </p>
            </div>

            {moradores.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center">
                <p className="text-sm text-slate-500">
                  Nenhum morador cadastrado.
                </p>
              </div>
            ) : (
              moradores.map((usuario) => (
                <article
                  key={usuario.id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-100">

                        {usuario.foto ? (
                          <img
                            src={usuario.foto}
                            alt={usuario.nome}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">
                            👤
                          </span>
                        )}

                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-800">
                          {usuario.nome}
                        </p>

                        <p className="text-[10px] text-slate-400">
                          {usuario.email}
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-1 text-[9px] font-black ${
                            usuario.status === "ATIVO"
                              ? "bg-emerald-100 text-emerald-700"
                              : usuario.status === "SUSPENSO"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {usuario.status}
                        </span>
                      </div>

                    </div>

                    <div className="flex flex-wrap gap-2">

                      {usuario.status !== "ATIVO" && (
                        <button
                          onClick={() =>
                            alterarStatusMorador(
                              usuario,
                              "ATIVO"
                            )
                          }
                          disabled={
                            processando === usuario.id
                          }
                          className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white disabled:opacity-50"
                        >
                          ✓ Liberar
                        </button>
                      )}

                      {usuario.status === "ATIVO" && (
                        <button
                          onClick={() =>
                            alterarStatusMorador(
                              usuario,
                              "SUSPENSO"
                            )
                          }
                          disabled={
                            processando === usuario.id
                          }
                          className="rounded-xl bg-amber-500 px-4 py-3 text-xs font-black text-white disabled:opacity-50"
                        >
                          Suspender
                        </button>
                      )}

                      {usuario.status !== "BLOQUEADO" && (
                        <button
                          onClick={() =>
                            alterarStatusMorador(
                              usuario,
                              "BLOQUEADO"
                            )
                          }
                          disabled={
                            processando === usuario.id
                          }
                          className="rounded-xl bg-red-600 px-4 py-3 text-xs font-black text-white disabled:opacity-50"
                        >
                          Bloquear
                        </button>
                      )}

                    </div>

                  </div>

                </article>
              ))
            )}

          </section>
        )}

        {/* PUBLICIDADES */}
        {aba === "publicidades" && (
          <section className="mt-5">

            <div className="rounded-3xl bg-white p-7 shadow-sm">

              <div className="text-4xl">
                📢
              </div>

              <h2 className="mt-4 text-xl font-black text-slate-900">
                Publicidades
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Aqui vamos administrar os banners vendidos
                pelo Sobradão 360.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">

                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center">
                  <p className="text-2xl">▭</p>
                  <p className="mt-2 text-xs font-black">
                    Banner grande
                  </p>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center">
                  <p className="text-2xl">▭ ▭</p>
                  <p className="mt-2 text-xs font-black">
                    Dois banners
                  </p>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center">
                  <p className="text-2xl">▦</p>
                  <p className="mt-2 text-xs font-black">
                    Quatro banners
                  </p>
                </div>

              </div>

              <div className="mt-6 rounded-2xl bg-amber-50 p-4">
                <p className="text-xs font-black text-blue-950">
                  🚧 Próxima etapa
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-600">
                  Vamos criar o cadastro de banners,
                  período da publicidade, anunciante,
                  posição e ativação automática.
                </p>
              </div>

            </div>

          </section>
        )}

        {/* DENÚNCIAS */}
        {aba === "denuncias" && (
          <section className="mt-5">

            <div className="rounded-3xl bg-white p-7 shadow-sm">

              <div className="text-4xl">
                🚩
              </div>

              <h2 className="mt-4 text-xl font-black text-slate-900">
                Denúncias
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Aqui serão exibidas as publicações denunciadas
                pelos moradores.
              </p>

              <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">

                <p className="text-3xl">
                  🚩
                </p>

                <p className="mt-3 text-sm font-black text-slate-700">
                  Sistema de denúncias
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Na próxima etapa vamos conectar esta área
                  à Voz do Morador, permitindo denunciar,
                  analisar, manter ou remover publicações.
                </p>

              </div>

            </div>

          </section>
        )}

      </div>

    </main>
  );
}