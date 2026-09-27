"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  DocumentData,
  getDocs,
  orderBy,
  QueryDocumentSnapshot,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Publicacao {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  tipoPublicacao?: "anuncio" | "post";
  imagemUrl?: string;
  autorUid?: string;
  autorNome?: string;
  autorFoto?: string;
  createdAt?: any;
  origem?: string;
  preco?: string | null;
}

const categorias = [
  { id: "Todas", nome: "Todas", icone: "📰" },
  { id: "Notícias", nome: "Posts", icone: "📢" },
  { id: "Compre & Venda", nome: "Compre & Venda", icone: "🛒" },
  { id: "Alimentação", nome: "Alimentação", icone: "🍰" },
  { id: "Reformas", nome: "Reformas", icone: "🛠️" },
  { id: "Lazer", nome: "Lazer", icone: "🏡" },
  { id: "Automotivo", nome: "Automotivo", icone: "🚗" },
  { id: "Zeladoria", nome: "Zeladoria", icone: "🧹" },
  { id: "Pet & Saúde", nome: "Pet & Saúde", icone: "🐾" },
  { id: "Eventos", nome: "Eventos", icone: "🎉" },
];

const imagemPadrao =
  "https://i.ibb.co/zTTKfgLt/banner-s360-webp.webp";

function formatarData(timestamp: any): string {
  try {
    if (!timestamp) return "";

    let data: Date;

    if (
      timestamp?.toDate &&
      typeof timestamp.toDate === "function"
    ) {
      data = timestamp.toDate();
    } else if (timestamp?.seconds) {
      data = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      data = timestamp;
    } else {
      data = new Date(timestamp);
    }

    if (Number.isNaN(data.getTime())) {
      return "";
    }

    return data.toLocaleDateString("pt-BR", {
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

function transformarPublicacao(
  docSnap: QueryDocumentSnapshot<DocumentData>
): Publicacao {
  const dados = docSnap.data();

  return {
    id: docSnap.id,
    titulo: dados.titulo || "Sem título",
    descricao: dados.descricao || "",
    categoria: dados.categoria || "Notícias",
    tipoPublicacao:
      dados.tipoPublicacao || "anuncio",
    imagemUrl: dados.imagemUrl || "",
    autorUid: dados.autorUid || "",
    autorNome: dados.autorNome || "Morador",
    autorFoto:
      dados.autorFoto ||
      "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao",
    createdAt: dados.createdAt,
    origem: dados.origem || "morador",
    preco: dados.preco || null,
  };
}

async function buscarPublicacoes(): Promise<Publicacao[]> {
  const publicacoesRef = collection(db, "anuncios");

  const q = query(
    publicacoesRef,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  const lista: Publicacao[] = [];

  snapshot.forEach(
    (docSnap: QueryDocumentSnapshot<DocumentData>) => {
      lista.push(transformarPublicacao(docSnap));
    }
  );

  return lista;
}

export default function NoticiasPage() {
  const [publicacoes, setPublicacoes] = useState<
    Publicacao[]
  >([]);

  const [categoriaAtiva, setCategoriaAtiva] =
    useState("Todas");

  const [busca, setBusca] = useState("");

  const [loading, setLoading] = useState(true);

  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarPublicacoes() {
      setLoading(true);
      setErro("");

      try {
        const lista = await buscarPublicacoes();

        setPublicacoes(lista);
      } catch (error) {
        console.error(
          "Erro ao buscar publicações:",
          error
        );

        setErro(
          "Não foi possível carregar as publicações."
        );
      } finally {
        setLoading(false);
      }
    }

    carregarPublicacoes();
  }, []);

  const publicacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return publicacoes.filter((publicacao) => {
      let passaCategoria = true;

      if (categoriaAtiva !== "Todas") {
        passaCategoria =
          publicacao.categoria === categoriaAtiva;
      }

      if (!passaCategoria) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const textoBusca = [
        publicacao.titulo,
        publicacao.descricao,
        publicacao.categoria,
        publicacao.autorNome,
      ]
        .join(" ")
        .toLowerCase();

      return textoBusca.includes(termo);
    });
  }, [
    publicacoes,
    categoriaAtiva,
    busca,
  ]);

  const recarregar = async () => {
    setLoading(true);
    setErro("");

    try {
      const lista = await buscarPublicacoes();

      setPublicacoes(lista);
    } catch (error) {
      console.error(
        "Erro ao atualizar publicações:",
        error
      );

      setErro(
        "Não foi possível atualizar as publicações."
      );
    } finally {
      setLoading(false);
    }
  };

  const obterIcone = (categoria: string) => {
    const encontrada = categorias.find(
      (cat) => cat.id === categoria
    );

    return encontrada?.icone || "📢";
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">

      {/* HEADER */}
      <header className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 border-b border-blue-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">

          <Link
            href="/"
            className="text-white text-xs font-bold flex items-center gap-1 hover:text-amber-400 transition"
          >
            ← Início
          </Link>

          <h1 className="font-black text-sm text-white tracking-tight">
            Notícias
          </h1>

          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg shadow">
            Comunidade
          </span>

        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* APRESENTAÇÃO */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl">
              📰
            </div>

            <div>
              <h2 className="font-black text-lg">
                Notícias e Informes
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Tudo que a comunidade publicou no
                Sobradão 360.
              </p>
            </div>

          </div>

        </section>

        {/* BUSCA */}
        <div className="relative">

          <input
            type="text"
            placeholder="Buscar nas publicações..."
            value={busca}
            onChange={(e) =>
              setBusca(e.target.value)
            }
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 pl-10 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <span className="absolute left-3.5 top-3 text-slate-400 text-sm">
            🔍
          </span>

          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500 text-sm"
            >
              ✕
            </button>
          )}

        </div>

        {/* CATEGORIAS */}
        <section className="space-y-1.5">

          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
            Filtrar publicações
          </p>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">

            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setCategoriaAtiva(cat.id)
                }
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5 shrink-0 ${
                  categoriaAtiva === cat.id
                    ? "bg-amber-400 text-slate-950 font-black shadow-md scale-105"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                }`}
              >

                <span>{cat.icone}</span>

                <span>{cat.nome}</span>

              </button>
            ))}

          </div>

        </section>

        {/* LINK PARA PUBLICAR */}
        <Link
          href="/anuncie"
          className="block w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-3 text-center text-xs font-black shadow-sm transition"
        >
          📢 Quero publicar alguma coisa
        </Link>

        {/* CONTADOR */}
        <div className="flex items-center justify-between px-1">

          <p className="text-xs text-slate-500">

            {loading
              ? "Carregando publicações..."
              : `${publicacoesFiltradas.length} publicação${
                  publicacoesFiltradas.length === 1
                    ? ""
                    : "ões"
                }`}

          </p>

          {!loading && (
            <button
              type="button"
              onClick={recarregar}
              className="text-xs font-bold text-blue-700 hover:text-blue-900"
            >
              ↻ Atualizar
            </button>
          )}

        </div>

        {/* ERRO */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">

            <div className="text-2xl mb-1">
              ⚠️
            </div>

            <p className="text-xs font-bold text-red-700">
              {erro}
            </p>

            <button
              type="button"
              onClick={recarregar}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black"
            >
              Tentar novamente
            </button>

          </div>
        )}

        {/* CARREGANDO */}
        {loading && (
          <section className="space-y-4">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-pulse"
              >

                <div className="h-48 bg-slate-200" />

                <div className="p-4 space-y-3">

                  <div className="h-3 bg-slate-200 rounded w-1/3" />

                  <div className="h-5 bg-slate-200 rounded w-4/5" />

                  <div className="h-3 bg-slate-200 rounded w-full" />

                  <div className="h-3 bg-slate-200 rounded w-3/4" />

                </div>

              </div>
            ))}

          </section>
        )}

        {/* PUBLICAÇÕES */}
        {!loading &&
          !erro &&
          publicacoesFiltradas.length > 0 && (
            <section className="space-y-4">

              {publicacoesFiltradas.map(
                (publicacao) => (
                  <article
                    key={publicacao.id}
                    className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
                  >

                    {/* IMAGEM */}
                    {publicacao.imagemUrl ? (
                      <div className="w-full bg-slate-100">

                        <img
                          src={publicacao.imagemUrl}
                          alt={publicacao.titulo}
                          className="w-full max-h-[380px] object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const img =
                              e.currentTarget;

                            if (
                              img.src !==
                              imagemPadrao
                            ) {
                              img.src =
                                imagemPadrao;
                            }
                          }}
                        />

                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-blue-800 to-slate-900 flex items-center justify-center">

                        <span className="text-5xl">
                          {obterIcone(
                            publicacao.categoria
                          )}
                        </span>

                      </div>
                    )}

                    {/* CONTEÚDO */}
                    <div className="p-4">

                      {/* CATEGORIA + DATA */}
                      <div className="flex items-center justify-between gap-2 mb-2">

                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-xl text-[10px] font-black">

                          {obterIcone(
                            publicacao.categoria
                          )}

                          {publicacao.categoria ||
                            "Notícias"}

                        </span>

                        <span className="text-[9px] text-slate-400">
                          {formatarData(
                            publicacao.createdAt
                          )}
                        </span>

                      </div>

                      {/* TÍTULO */}
                      <h2 className="text-lg font-black text-slate-900 leading-tight">
                        {publicacao.titulo}
                      </h2>

                      {/* DESCRIÇÃO */}
                      {publicacao.descricao && (
                        <p className="text-sm text-slate-600 leading-relaxed mt-3 whitespace-pre-line">
                          {publicacao.descricao}
                        </p>
                      )}

                      {/* PREÇO */}
                      {publicacao.preco && (
                        <div className="mt-3">

                          <span className="inline-block bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl text-sm font-black">
                            💰 {publicacao.preco}
                          </span>

                        </div>
                      )}

                      {/* AUTOR */}
                      <div className="border-t border-slate-100 mt-4 pt-3 flex items-center gap-2">

                        <img
                          src={
                            publicacao.autorFoto ||
                            "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao"
                          }
                          alt={
                            publicacao.autorNome ||
                            "Morador"
                          }
                          className="w-8 h-8 rounded-full object-cover bg-slate-100"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao";
                          }}
                        />

                        <div>

                          <p className="text-[10px] font-black text-slate-700">
                            Publicado por{" "}
                            {publicacao.autorNome ||
                              "Morador"}
                          </p>

                          <p className="text-[9px] text-slate-400">
                            Comunidade Sobradão 360
                          </p>

                        </div>

                      </div>

                    </div>

                  </article>
                )
              )}

            </section>
          )}

        {/* NENHUMA PUBLICAÇÃO */}
        {!loading &&
          !erro &&
          publicacoesFiltradas.length === 0 && (
            <section className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">

              <div className="text-5xl mb-4">
                📰
              </div>

              <h3 className="font-black text-lg text-slate-900">
                Nenhuma publicação encontrada
              </h3>

              <p className="text-xs text-slate-500 mt-2 leading-relaxed">

                {busca
                  ? "Não encontramos nenhuma publicação com essa busca."
                  : categoriaAtiva !== "Todas"
                  ? `Ainda não existem publicações na categoria "${categoriaAtiva}".`
                  : "Ainda não existem publicações na comunidade."}

              </p>

              {(busca ||
                categoriaAtiva !==
                  "Todas") && (
                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    setCategoriaAtiva(
                      "Todas"
                    );
                  }}
                  className="mt-4 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black"
                >
                  Ver todas as publicações
                </button>
              )}

            </section>
          )}

        {/* RODAPÉ */}
        <div className="text-center pt-4">

          <p className="text-[10px] text-slate-400">
            Sobradão 360 • Informação feita pela
            comunidade
          </p>

        </div>

      </main>
    </div>
  );
}
