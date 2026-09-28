"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface Publicacao {
  id: string;
  autorUid?: string;
  autorNome?: string;
  autorFoto?: string;
  texto?: string;
  imagemUrl?: string;
  createdAt?: any;
  categoria?: string;
  tipo?: string;
  origem?: string;
  curtidas?: string[];
}

function textoSeguro(valor: any): string {
  if (valor === null || valor === undefined) return "";

  if (typeof valor === "string") return valor;

  if (typeof valor === "number" || typeof valor === "boolean") {
    return String(valor);
  }

  if (valor?.toDate) {
    return valor.toDate().toLocaleString("pt-BR");
  }

  if (Array.isArray(valor)) {
    return valor.map(textoSeguro).join(", ");
  }

  if (typeof valor === "object") {
    return Object.values(valor).map(textoSeguro).join(" ");
  }

  return "";
}

function formatarData(data: any): string {
  if (!data) return "";

  try {
    let dataFinal: Date;

    if (data?.toDate) {
      dataFinal = data.toDate();
    } else if (data instanceof Date) {
      dataFinal = data;
    } else {
      dataFinal = new Date(data);
    }

    if (Number.isNaN(dataFinal.getTime())) {
      return "";
    }

    return dataFinal.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ComunidadePage() {
  const { user } = useAuth();

  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [curtindo, setCurtindo] = useState<string | null>(null);

  async function carregarPublicacoes() {
    setCarregando(true);
    setErro("");

    try {
      const q = query(
        collection(db, "anuncios"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      const lista: Publicacao[] = snap.docs
  .map((docSnap: any) => {
    const dados = docSnap.data();

    return {
      id: docSnap.id,
      ...dados,
    } as Publicacao;
  })
  .filter((item: Publicacao) => {
          const categoria = textoSeguro(item.categoria).toLowerCase();
          const tipo = textoSeguro(item.tipo).toLowerCase();
          const origem = textoSeguro(item.origem).toLowerCase();

          return (
            categoria === "notícias" ||
            categoria === "noticias" ||
            tipo === "post" ||
            origem === "morador"
          );
        });

      setPublicacoes(lista);
    } catch (err) {
      console.error("Erro ao carregar comunidade:", err);
      setErro(
        "Não foi possível carregar as publicações da comunidade."
      );
      setPublicacoes([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPublicacoes();
  }, []);

  async function alternarCurtida(publicacao: Publicacao) {
    if (!user) {
      alert("Entre na sua conta para curtir uma publicação.");
      return;
    }

    if (!publicacao.id) return;

    setCurtindo(publicacao.id);

    try {
      const curtidasAtuais = Array.isArray(publicacao.curtidas)
        ? publicacao.curtidas
        : [];

      const usuarioCurtiu = curtidasAtuais.includes(user.uid);

      const referencia = doc(db, "anuncios", publicacao.id);

      if (usuarioCurtiu) {
        await updateDoc(referencia, {
          curtidas: arrayRemove(user.uid),
        });

        setPublicacoes((lista) =>
          lista.map((item) =>
            item.id === publicacao.id
              ? {
                  ...item,
                  curtidas: curtidasAtuais.filter(
                    (uid) => uid !== user.uid
                  ),
                }
              : item
          )
        );
      } else {
        await updateDoc(referencia, {
          curtidas: arrayUnion(user.uid),
        });

        setPublicacoes((lista) =>
          lista.map((item) =>
            item.id === publicacao.id
              ? {
                  ...item,
                  curtidas: [...curtidasAtuais, user.uid],
                }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Erro ao curtir publicação:", err);

      alert(
        "Não foi possível registrar a curtida. Tente novamente."
      );
    } finally {
      setCurtindo(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* CABEÇALHO */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"
          >
            ← Voltar para o Sobradão 360
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 text-4xl">💬</div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Voz do Morador
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
                O espaço onde os moradores do Sobradão compartilham
                informações, dúvidas, problemas, avisos e acontecimentos
                do bairro.
              </p>
            </div>

            <Link
              href="/anuncie?modo=post"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-bold text-emerald-700 shadow-lg transition hover:bg-emerald-50"
            >
              💬 Publicar
            </Link>
          </div>
        </div>
      </section>

      {/* CONTEÚDO */}
      <section className="mx-auto max-w-3xl px-4 py-6">
        {/* AVISO */}
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <div className="text-2xl">🏘️</div>

            <div>
              <h2 className="font-bold text-slate-800">
                O que está acontecendo no bairro?
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-600">
                Avise os vizinhos, faça uma pergunta, informe um problema
                ou compartilhe algo importante para a comunidade.
              </p>
            </div>
          </div>
        </div>

        {/* ERRO */}
        {erro && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erro}
          </div>
        )}

        {/* CARREGANDO */}
        {carregando && (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl bg-white p-5 shadow-sm"
              >
                <div className="mb-4 h-5 w-40 rounded bg-slate-200" />
                <div className="mb-2 h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-3/4 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* SEM PUBLICAÇÕES */}
        {!carregando && publicacoes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <div className="text-5xl">💬</div>

            <h2 className="mt-4 text-xl font-bold text-slate-800">
              Ainda não há publicações
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Seja o primeiro morador a compartilhar alguma coisa com a
              comunidade.
            </p>

            <Link
              href="/anuncie?modo=post"
              className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700"
            >
              💬 Fazer primeira publicação
            </Link>
          </div>
        )}

        {/* PUBLICAÇÕES */}
        {!carregando && publicacoes.length > 0 && (
          <div className="space-y-5">
            {publicacoes.map((publicacao) => {
              const curtidas = Array.isArray(publicacao.curtidas)
                ? publicacao.curtidas
                : [];

              const usuarioCurtiu = user
                ? curtidas.includes(user.uid)
                : false;

              const nomeAutor =
                textoSeguro(publicacao.autorNome).trim() ||
                "Morador do Sobradão";

              const texto = textoSeguro(publicacao.texto).trim();

              const imagem = textoSeguro(
                publicacao.imagemUrl
              ).trim();

              return (
                <article
                  key={publicacao.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* AUTOR */}
                  <div className="flex items-center gap-3 px-5 pt-5">
                    {publicacao.autorFoto ? (
                      <img
                        src={publicacao.autorFoto}
                        alt={nomeAutor}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl">
                        👤
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-slate-800">
                        {nomeAutor}
                      </div>

                      <div className="text-xs text-slate-500">
                        {formatarData(publicacao.createdAt)}
                      </div>
                    </div>

                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Morador
                    </div>
                  </div>

                  {/* TEXTO */}
                  {texto && (
                    <div className="px-5 py-5">
                      <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                        {texto}
                      </p>
                    </div>
                  )}

                  {/* IMAGEM */}
                  {imagem && (
                    <div className="border-y border-slate-100 bg-slate-50">
                      <img
                        src={imagem}
                        alt="Imagem da publicação"
                        className="max-h-[600px] w-full object-contain"
                      />
                    </div>
                  )}

                  {/* RODAPÉ */}
                  <div className="px-5 py-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-500">
                      <span>
                        {curtidas.length > 0
                          ? `❤️ ${curtidas.length} ${
                              curtidas.length === 1
                                ? "curtida"
                                : "curtidas"
                            }`
                          : "Seja o primeiro a curtir"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-3">
                      <button
                        type="button"
                        disabled={curtindo === publicacao.id}
                        onClick={() =>
                          alternarCurtida(publicacao)
                        }
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                          usuarioCurtiu
                            ? "bg-red-50 text-red-600"
                            : "bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600"
                        } ${
                          curtindo === publicacao.id
                            ? "cursor-wait opacity-60"
                            : ""
                        }`}
                      >
                        {usuarioCurtiu ? "❤️ Curtido" : "♡ Curtir"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          alert(
                            "Os comentários serão adicionados na próxima etapa."
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        💬 Comentar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.share) {
                            navigator
                              .share({
                                title: "Voz do Morador - Sobradão 360",
                                text:
                                  texto ||
                                  "Veja esta publicação no Sobradão 360.",
                                url: window.location.href,
                              })
                              .catch(() => {});
                          } else {
                            navigator.clipboard
                              ?.writeText(window.location.href)
                              .then(() => {
                                alert(
                                  "Link copiado para a área de transferência."
                                );
                              })
                              .catch(() => {});
                          }
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        📤 Compartilhar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ATUALIZAR */}
        {!carregando && publicacoes.length > 0 && (
          <div className="mt-7 text-center">
            <button
              type="button"
              onClick={carregarPublicacoes}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              🔄 Atualizar publicações
            </button>
          </div>
        )}
      </section>

      {/* RODAPÉ */}
      <footer className="mx-auto max-w-3xl px-4 pb-10 pt-4 text-center">
        <p className="text-xs text-slate-400">
          Sobradão 360 • A comunidade informando a comunidade
        </p>
      </footer>
    </main>
  );
}