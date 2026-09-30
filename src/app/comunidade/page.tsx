"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface Publicacao {
  id: string;
  autorUid?: string;
  autorNome?: string;
  autorFoto?: string;
  titulo?: string;
  descricao?: string;
  texto?: string;
  imagemUrl?: string;
  createdAt?: any;
  categoria?: string;
  tipo?: string;
  tipoPublicacao?: string;
  origem?: string;
  curtidas?: string[];
}

interface Comentario {
  id: string;
  autorUid?: string;
  autorNome?: string;
  autorFoto?: string;
  texto?: string;
  createdAt?: any;
}

const CATEGORIAS = [
  { nome: "Todas", icone: "🏘️" },
  { nome: "Compra & Venda", icone: "🛒" },
  { nome: "Serviços & Reformas", icone: "🛠️" },
  { nome: "Casa & Aluguel", icone: "🏠" },
  { nome: "Pet & Saúde", icone: "🐾" },
  { nome: "Eventos", icone: "🎉" },
  { nome: "Doações", icone: "❤️" },
];

const IMAGEM_PADRAO = "/imagens/post-padrao.svg";

function textoSeguro(valor: any): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "string") return valor;
  if (typeof valor === "number" || typeof valor === "boolean") return String(valor);
  if (valor?.toDate) return valor.toDate().toLocaleString("pt-BR");
  if (Array.isArray(valor)) return valor.map(textoSeguro).join(", ");
  if (typeof valor === "object") return Object.values(valor).map(textoSeguro).join(" ");
  return "";
}

function formatarData(data: any): string {
  if (!data) return "";
  try {
    const dataFinal = data?.toDate ? data.toDate() : data instanceof Date ? data : new Date(data);
    if (Number.isNaN(dataFinal.getTime())) return "";
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
  const [comentarios, setComentarios] = useState<Record<string, Comentario[]>>({});
  const [comentariosAbertos, setComentariosAbertos] = useState<Record<string, boolean>>({});
  const [novoComentario, setNovoComentario] = useState<Record<string, string>>({});
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todas");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [curtindo, setCurtindo] = useState<string | null>(null);
  const [comentando, setComentando] = useState<string | null>(null);

  async function carregarPublicacoes() {
    setCarregando(true);
    setErro("");

    try {
      const snap = await getDocs(
        query(collection(db, "anuncios"), orderBy("createdAt", "desc"))
      );

      const lista = snap.docs
        .map((docSnap: any) => ({ id: docSnap.id, ...docSnap.data() } as Publicacao))
        .filter((item: Publicacao) => {
          const tipo = textoSeguro(item.tipoPublicacao || item.tipo).toLowerCase();
          const origem = textoSeguro(item.origem).toLowerCase();
          const categoria = textoSeguro(item.categoria).toLowerCase();

          return (
            origem === "morador" ||
            tipo === "post" ||
            categoria === "notícias" ||
            categoria === "noticias" ||
            categoria === "comunidade"
          );
        });

      setPublicacoes(lista);
    } catch (err) {
      console.error("Erro ao carregar comunidade:", err);
      setErro("Não foi possível carregar as publicações da comunidade.");
      setPublicacoes([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPublicacoes();
  }, []);

  async function carregarComentarios(publicacaoId: string) {
    try {
      const snap = await getDocs(
        query(
          collection(db, "anuncios", publicacaoId, "comentarios"),
          orderBy("createdAt", "asc")
        )
      );

      setComentarios((atual) => ({
        ...atual,
        [publicacaoId]: snap.docs.map(
          (item: any) => ({ id: item.id, ...item.data() } as Comentario)
        ),
      }));
    } catch (err) {
      console.error("Erro ao carregar comentários:", err);
      alert("Não foi possível carregar os comentários.");
    }
  }

  async function abrirComentarios(publicacaoId: string) {
    const aberto = !comentariosAbertos[publicacaoId];
    setComentariosAbertos((atual) => ({ ...atual, [publicacaoId]: aberto }));
    if (aberto && !comentarios[publicacaoId]) {
      await carregarComentarios(publicacaoId);
    }
  }

  async function enviarComentario(publicacaoId: string) {
    if (!user) {
      alert("Entre na sua conta para comentar.");
      return;
    }

    const texto = (novoComentario[publicacaoId] || "").trim();
    if (!texto) return;

    setComentando(publicacaoId);

    try {
      await addDoc(collection(db, "anuncios", publicacaoId, "comentarios"), {
        texto,
        autorUid: user.uid,
        autorNome: user.displayName || "Morador",
        autorFoto: user.photoURL || "",
        createdAt: serverTimestamp(),
      });

      setNovoComentario((atual) => ({ ...atual, [publicacaoId]: "" }));
      await carregarComentarios(publicacaoId);
    } catch (err) {
      console.error("Erro ao comentar:", err);
      alert("Não foi possível publicar o comentário.");
    } finally {
      setComentando(null);
    }
  }

  async function alternarCurtida(publicacao: Publicacao) {
    if (!user) {
      alert("Entre na sua conta para curtir uma publicação.");
      return;
    }

    setCurtindo(publicacao.id);

    try {
      const curtidas = Array.isArray(publicacao.curtidas) ? publicacao.curtidas : [];
      const usuarioCurtiu = curtidas.includes(user.uid);
      const referencia = doc(db, "anuncios", publicacao.id);

      await updateDoc(referencia, {
        curtidas: usuarioCurtiu ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });

      setPublicacoes((lista) =>
        lista.map((item) =>
          item.id === publicacao.id
            ? {
                ...item,
                curtidas: usuarioCurtiu
                  ? curtidas.filter((uid) => uid !== user.uid)
                  : [...curtidas, user.uid],
              }
            : item
        )
      );
    } catch (err) {
      console.error("Erro ao curtir publicação:", err);
      alert("Não foi possível registrar a curtida. Tente novamente.");
    } finally {
      setCurtindo(null);
    }
  }

  const publicacoesFiltradas = publicacoes.filter((item) => {
    if (categoriaAtiva === "Todas") return true;
    const categoria = textoSeguro(item.categoria).trim().toLowerCase();
    return categoria === categoriaAtiva.toLowerCase();
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white">
            ← Voltar para o Sobradão 360
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 text-4xl">🏘️</div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Mural da Comunidade</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
                Notícias, avisos, pedidos, acontecimentos e informações compartilhadas pelos moradores.
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

      <section className="mx-auto max-w-3xl px-4 py-5">
        <div className="mb-5 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <h2 className="font-bold text-slate-800">O que está acontecendo no bairro?</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Escolha uma categoria, publique sua informação e converse com outros moradores.
          </p>
        </div>

        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max gap-2">
            {CATEGORIAS.map((categoria) => (
              <button
                key={categoria.nome}
                type="button"
                onClick={() => setCategoriaAtiva(categoria.nome)}
                className={
                  "rounded-full border px-4 py-2 text-xs font-black transition " +
                  (categoriaAtiva === categoria.nome
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400")
                }
              >
                {categoria.icone} {categoria.nome}
              </button>
            ))}
          </div>
        </div>

        {erro && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erro}
          </div>
        )}

        {carregando && (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 h-5 w-40 rounded bg-slate-200" />
                <div className="mb-2 h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-3/4 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {!carregando && publicacoesFiltradas.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <div className="text-5xl">🏘️</div>
            <h2 className="mt-4 text-xl font-bold text-slate-800">Nenhuma publicação nesta categoria</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Seja o primeiro morador a compartilhar alguma coisa com a comunidade.
            </p>
            <Link href="/anuncie?modo=post" className="mt-5 inline-flex rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700">
              💬 Fazer publicação
            </Link>
          </div>
        )}

        {!carregando && publicacoesFiltradas.length > 0 && (
          <div className="space-y-5">
            {publicacoesFiltradas.map((publicacao) => {
              const curtidas = Array.isArray(publicacao.curtidas) ? publicacao.curtidas : [];
              const usuarioCurtiu = user ? curtidas.includes(user.uid) : false;
              const nomeAutor = textoSeguro(publicacao.autorNome).trim() || "Morador do Sobradão";
              const titulo = textoSeguro(publicacao.titulo).trim();
              const descricao = textoSeguro(publicacao.descricao || publicacao.texto).trim();
              const imagem = textoSeguro(publicacao.imagemUrl).trim() || IMAGEM_PADRAO;
              const categoria = textoSeguro(publicacao.categoria).trim() || "Comunidade";
              const listaComentarios = comentarios[publicacao.id] || [];

              return (
                <article key={publicacao.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 px-5 pt-5">
                    {publicacao.autorFoto ? (
                      <img src={publicacao.autorFoto} alt={nomeAutor} className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl">👤</div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-slate-800">{nomeAutor}</div>
                      <div className="text-xs text-slate-500">{formatarData(publicacao.createdAt)}</div>
                    </div>

                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {categoria}
                    </div>
                  </div>

                  <div className="px-5 pt-4">
                    {titulo && <h2 className="text-lg font-black text-slate-900">{titulo}</h2>}
                    {descricao && <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{descricao}</p>}
                  </div>

                  <div className="mt-4 border-y border-slate-100 bg-slate-50">
                    <img src={imagem} alt={titulo || "Imagem da publicação"} className="max-h-[600px] w-full object-contain" />
                  </div>

                  <div className="px-5 py-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-500">
                      <span>
                        {curtidas.length > 0
                          ? `❤️ ${curtidas.length} ${curtidas.length === 1 ? "curtida" : "curtidas"}`
                          : "Seja o primeiro a curtir"}
                      </span>
                      <span>💬 {listaComentarios.length} {listaComentarios.length === 1 ? "comentário" : "comentários"}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-3">
                      <button
                        type="button"
                        disabled={curtindo === publicacao.id}
                        onClick={() => alternarCurtida(publicacao)}
                        className={
                          "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition " +
                          (usuarioCurtiu ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600")
                        }
                      >
                        {usuarioCurtiu ? "❤️ Curtido" : "♡ Curtir"}
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirComentarios(publicacao.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        💬 Comentar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: titulo || "Mural da Comunidade - Sobradão 360",
                              text: descricao || "Veja esta publicação no Sobradão 360.",
                              url: window.location.href,
                            }).catch(() => {});
                          } else {
                            navigator.clipboard?.writeText(window.location.href).then(() => {
                              alert("Link copiado para a área de transferência.");
                            }).catch(() => {});
                          }
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        📤 Compartilhar
                      </button>
                    </div>

                    {comentariosAbertos[publicacao.id] && (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <div className="space-y-3">
                          {listaComentarios.map((comentario) => (
                            <div key={comentario.id} className="flex gap-2">
                              {comentario.autorFoto ? (
                                <img src={comentario.autorFoto} alt="" className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm">👤</div>
                              )}
                              <div className="min-w-0 rounded-2xl bg-white px-3 py-2 shadow-sm">
                                <div className="text-xs font-black text-slate-800">{textoSeguro(comentario.autorNome) || "Morador"}</div>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{textoSeguro(comentario.texto)}</p>
                                <div className="mt-1 text-[10px] text-slate-400">{formatarData(comentario.createdAt)}</div>
                              </div>
                            </div>
                          ))}

                          {listaComentarios.length === 0 && (
                            <p className="text-xs text-slate-500">Ainda não há comentários. Seja o primeiro!</p>
                          )}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <input
                            type="text"
                            value={novoComentario[publicacao.id] || ""}
                            onChange={(e) => setNovoComentario((atual) => ({ ...atual, [publicacao.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                enviarComentario(publicacao.id);
                              }
                            }}
                            placeholder={user ? "Escreva um comentário..." : "Entre para comentar"}
                            disabled={!user || comentando === publicacao.id}
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={() => enviarComentario(publicacao.id)}
                            disabled={!user || comentando === publicacao.id || !(novoComentario[publicacao.id] || "").trim()}
                            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
                          >
                            {comentando === publicacao.id ? "..." : "Enviar"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!carregando && publicacoes.length > 0 && (
          <div className="mt-7 text-center">
            <button type="button" onClick={carregarPublicacoes} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
              🔄 Atualizar publicações
            </button>
          </div>
        )}
      </section>

      <footer className="mx-auto max-w-3xl px-4 pb-10 pt-4 text-center">
        <p className="text-xs text-slate-400">Sobradão 360 • A comunidade informando a comunidade</p>
      </footer>
    </main>
  );
}
