"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type TipoNegocio =
  | "loja"
  | "oficina"
  | "profissional"
  | "alimentacao"
  | "eventos"
  | "empresa"
  | "tecnologia"
  | "outros";

interface Negocio {
  id: string;

  nome: string;
  titulo: string;
  subtitulo: string;
  descricao: string;

  tipo: TipoNegocio;

  telefone: string;
  whatsapp: string;

  imagemUrl: string;
  bannerUrl: string;
  slogan: string;
  corMarca: string;

  ativo: boolean;

  mostrarBanner: boolean;
  carrinhoCompras: boolean;
}

interface Produto {
  id: string;
  lojaId: string;

  nome: string;
  descricao: string;
  preco: number;
  imagemUrl: string;

  ativo: boolean;
}

const TIPOS: Record<
  TipoNegocio,
  {
    icon: string;
    nome: string;
    titulo: string;
    descricao: string;
    botao: string;
  }
> = {
  loja: {
    icon: "🛒",
    nome: "Loja",
    titulo: "Produtos",
    descricao:
      "Confira os produtos e preços disponíveis.",
    botao: "Consultar",
  },

  oficina: {
    icon: "🔧",
    nome: "Oficina",
    titulo: "Serviços",
    descricao:
      "Conheça os serviços oferecidos e solicite um orçamento.",
    botao: "Solicitar orçamento",
  },

  profissional: {
    icon: "👷",
    nome: "Profissional",
    titulo: "Serviços",
    descricao:
      "Conheça os serviços disponíveis.",
    botao: "Solicitar orçamento",
  },

  alimentacao: {
    icon: "🍰",
    nome: "Alimentação",
    titulo: "Produtos e encomendas",
    descricao:
      "Confira produtos, opções e formas de encomenda.",
    botao: "Fazer pedido",
  },

  eventos: {
    icon: "🎉",
    nome: "Eventos",
    titulo: "Serviços para eventos",
    descricao:
      "Conheça as opções oferecidas para seu evento.",
    botao: "Consultar",
  },

  empresa: {
    icon: "🏢",
    nome: "Empresa",
    titulo: "Produtos e serviços",
    descricao:
      "Conheça os produtos e serviços desta empresa.",
    botao: "Consultar",
  },

  tecnologia: {
    icon: "💻",
    nome: "Tecnologia",
    titulo: "Produtos e serviços",
    descricao:
      "Confira os produtos e serviços disponíveis.",
    botao: "Consultar",
  },

  outros: {
    icon: "📌",
    nome: "Outros",
    titulo: "Produtos e serviços",
    descricao:
      "Confira o que este anunciante oferece.",
    botao: "Consultar",
  },
};

function formatarPreco(
  valor: number
) {
  return valor.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

export default function LojaPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const [negocio, setNegocio] =
    useState<Negocio | null>(
      null
    );

  const [produtos, setProdutos] =
    useState<Produto[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [
    carregandoProdutos,
    setCarregandoProdutos,
  ] = useState(true);

  const [erro, setErro] =
    useState("");

  const [erroProdutos, setErroProdutos] =
    useState("");

  const [sobreExpandido, setSobreExpandido] =
    useState(false);

  const [carrinho, setCarrinho] = useState<Record<string, number>>({});

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const { id } =
          await params;

        if (!id) {
          setErro(
            "Negócio não encontrado."
          );
          return;
        }

        const referencia =
          doc(
            db,
            "lojas_parceiras",
            id
          );

        const snapshot =
          await getDoc(
            referencia
          );

        if (!snapshot.exists()) {
          setErro(
            "Este negócio não existe."
          );
          return;
        }

        const data =
          snapshot.data() as Record<
            string,
            unknown
          >;

        if (
          data.ativo !== true
        ) {
          setErro(
            "Este negócio ainda não está disponível publicamente."
          );
          return;
        }

        const tipo =
          typeof data.tipo ===
          "string"
            ? data.tipo
            : "empresa";

        const tiposValidos: TipoNegocio[] =
          [
            "loja",
            "oficina",
            "profissional",
            "alimentacao",
            "eventos",
            "empresa",
            "tecnologia",
            "outros",
          ];

        const tipoValido =
          tiposValidos.includes(
            tipo as TipoNegocio
          )
            ? (tipo as TipoNegocio)
            : "empresa";

        setNegocio({
          id: snapshot.id,

          nome:
            typeof data.nome ===
            "string"
              ? data.nome
              : "Negócio",

          titulo:
            typeof data.titulo ===
            "string"
              ? data.titulo
              : typeof data.nome ===
                "string"
              ? data.nome
              : "Negócio",

          subtitulo:
            typeof data.subtitulo ===
            "string"
              ? data.subtitulo
              : "",

          descricao:
            typeof data.descricao ===
            "string"
              ? data.descricao
              : "",

          tipo:
            tipoValido,

          telefone:
            typeof data.telefone ===
            "string"
              ? data.telefone
              : "",

          whatsapp:
            typeof data.whatsapp ===
            "string"
              ? data.whatsapp
              : "",

          imagemUrl:
            typeof data.imagemUrl ===
            "string"
              ? data.imagemUrl
              : "",

          bannerUrl:
            typeof data.bannerUrl ===
            "string"
              ? data.bannerUrl
              : "",

          slogan:
            typeof data.slogan ===
            "string"
              ? data.slogan
              : "",

          corMarca:
            typeof data.corMarca ===
            "string"
              ? data.corMarca
              : "#0f172a",

          ativo: true,

          mostrarBanner:
            data.mostrarBanner !==
            false,

          carrinhoCompras:
            data.carrinhoCompras === true,
        });

        try {
          setCarregandoProdutos(true);
          setErroProdutos("");

          const produtosRef =
            collection(
              db,
              "produtos"
            );

          const consultaProdutos =
            query(
              produtosRef,
              where(
                "lojaId",
                "==",
                id
              )
            );

          const snapshotProdutos =
            await getDocs(
              consultaProdutos
            );

          const lista:
            Produto[] = [];

          for (
            const produtoDoc
            of snapshotProdutos.docs
          ) {
            const dados =
              produtoDoc.data() as Record<
                string,
                unknown
              >;

            if (
              dados.ativo !== true
            ) {
              continue;
            }

            lista.push({
              id:
                produtoDoc.id,

              lojaId:
                typeof dados.lojaId ===
                "string"
                  ? dados.lojaId
                  : id,

              nome:
                typeof dados.nome ===
                "string"
                  ? dados.nome
                  : "",

              descricao:
                typeof dados.descricao ===
                "string"
                  ? dados.descricao
                  : "",

              preco:
                typeof dados.preco ===
                "number"
                  ? dados.preco
                  : 0,

              imagemUrl:
                typeof dados.imagemUrl ===
                "string"
                  ? dados.imagemUrl
                  : "",

              ativo: true,
            });
          }

          lista.sort(
            (a, b) =>
              a.nome.localeCompare(
                b.nome,
                "pt-BR"
              )
          );

          setProdutos(
            lista
          );
        } catch (error) {
          console.error(
            "Erro ao carregar produtos:",
            error
          );

          setErroProdutos(
            "Não foi possível carregar os produtos ou serviços."
          );
        } finally {
          setCarregandoProdutos(
            false
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar negócio:",
          error
        );

        setErro(
          "Não foi possível carregar este negócio."
        );
      } finally {
        setCarregando(
          false
        );
      }
    }

    void carregar();
  }, [params]);

  function limparWhatsApp(
    numero: string
  ) {
    return numero.replace(
      /\D/g,
      ""
    );
  }

  function abrirWhatsApp(
    mensagem: string
  ) {
    if (!negocio) {
      return;
    }

    const numero =
      limparWhatsApp(
        negocio.whatsapp
      );

    if (!numero) {
      return;
    }

    const numeroBrasil =
      numero.startsWith("55")
        ? numero
        : `55${numero}`;

    window.open(
      `https://wa.me/${numeroBrasil}?text=${encodeURIComponent(
        mensagem
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function alterarCarrinho(produtoId: string, delta: number) {
    setCarrinho((atual) => {
      const quantidade = Math.max(0, (atual[produtoId] || 0) + delta);
      const proximo = { ...atual };
      if (quantidade === 0) delete proximo[produtoId];
      else proximo[produtoId] = quantidade;
      return proximo;
    });
  }

  function enviarCarrinho() {
    if (!negocio || !negocio.carrinhoCompras) return;
    const itens = produtos.filter((p) => (carrinho[p.id] || 0) > 0);
    if (itens.length === 0) return;

    const linhas = itens.map((p) => {
      const qtd = carrinho[p.id];
      return `${qtd}x ${p.nome} — ${formatarPreco(p.preco * qtd)}`;
    });
    const total = itens.reduce((soma, p) => soma + p.preco * carrinho[p.id], 0);
    abrirWhatsApp(`Olá! Montei um pedido na página de ${negocio.nome} no Sobradão 360.\n\n${linhas.join("\n")}\n\nTotal: ${formatarPreco(total)}\n\nGostaria de confirmar este pedido.`);
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-sm">

          <div className="text-4xl">
            🏪
          </div>

          <p className="mt-3 text-sm font-bold text-slate-600">
            Carregando página...
          </p>

        </div>
      </main>
    );
  }

  if (
    erro ||
    !negocio
  ) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">

        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">

          <div className="text-4xl">
            🏪
          </div>

          <h1 className="mt-4 text-xl font-black text-slate-900">
            Negócio indisponível
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {erro ||
              "Não foi possível encontrar este negócio."}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-blue-900 px-5 py-3 text-xs font-black text-white"
          >
            ← Voltar para o Sobradão 360
          </Link>

        </div>

      </main>
    );
  }

  const tipoInfo =
    TIPOS[
      negocio.tipo
    ] || TIPOS.empresa;

  const whatsappNumero =
    limparWhatsApp(
      negocio.whatsapp
    );

  const telefoneNumero =
    limparWhatsApp(
      negocio.telefone
    );

  const cor =
    negocio.corMarca ||
    "#0f172a";

  return (
    <main className="min-h-screen bg-slate-100 pb-12">

      {/* BANNER */}

      <section
        className="relative overflow-hidden text-white"
        style={{
          backgroundColor: cor,
        }}
      >

        {negocio.mostrarBanner &&
          negocio.bannerUrl && (
            <div className="relative">
              <img
                src={negocio.bannerUrl}
                alt={`Banner ${negocio.nome}`}
                className="block h-auto max-h-[400px] w-full object-contain"
              />

              <div className="absolute inset-0 bg-black/10" />
            </div>
          )}

        <div className="absolute left-4 top-4 z-10">
          <Link
            href="/"
            className="inline-flex rounded-full bg-black/45 px-3 py-2 text-xs font-bold text-white backdrop-blur hover:bg-black/60"
          >
            ← Voltar
          </Link>
        </div>

        {!negocio.mostrarBanner || !negocio.bannerUrl ? (
          <div className="px-4 py-5">
            <Link
              href="/"
              className="inline-flex rounded-full bg-black/25 px-3 py-2 text-xs font-bold text-white hover:bg-black/40"
            >
              ← Voltar
            </Link>
          </div>
        ) : null}

      </section>

      <div className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {negocio.imagemUrl ? (
              <img
                src={negocio.imagemUrl}
                alt={"Logo " + negocio.nome}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="text-2xl">
                {tipoInfo.icon}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-black text-slate-900">
              {negocio.nome}
            </h1>

            {negocio.slogan && (
              <p className="truncate text-xs text-slate-500">
                {negocio.slogan}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5">

        {/* CONTATO */}

        <section className="rounded-3xl bg-white p-4 shadow-sm">

          <h2 className="text-sm font-black text-slate-900">
            📞 Entre em contato
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-2">

            {telefoneNumero && (
              <a
                href={`tel:${telefoneNumero}`}
                className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition hover:border-blue-300 hover:bg-blue-50"
              >

                <span className="text-2xl">
                  📞
                </span>

                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Telefone
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-800">
                    {negocio.telefone}
                  </p>
                </div>

              </a>
            )}

            {whatsappNumero && (
              <button
                type="button"
                onClick={() =>
                  abrirWhatsApp(
                    `Olá! Vi a página de ${negocio.nome} no Sobradão 360 e gostaria de mais informações.`
                  )
                }
                className="flex min-w-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-left transition hover:bg-emerald-100"
              >

                <span className="text-2xl">
                  📱
                </span>

                <div>
                  <p className="text-[10px] font-bold uppercase text-emerald-600">
                    WhatsApp
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-800">
                    Conversar pelo WhatsApp
                  </p>
                </div>

              </button>
            )}

          </div>

        </section>

        {/* PRODUTOS / SERVIÇOS */}

        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
              style={{
                backgroundColor:
                  `${cor}15`,
              }}
            >
              {tipoInfo.icon}
            </div>

            <div>

              <h2 className="text-lg font-black text-slate-900">
                {tipoInfo.titulo}
              </h2>

              <p className="text-xs text-slate-500">
                {tipoInfo.descricao}
              </p>

            </div>

          </div>

          {erroProdutos && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
              {erroProdutos}
            </div>
          )}

          {carregandoProdutos ? (

            <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center">

              <div className="text-3xl">
                📦
              </div>

              <p className="mt-2 text-xs font-bold text-slate-500">
                Carregando produtos e serviços...
              </p>

            </div>

          ) : produtos.length === 0 ? (

            <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">

              <div className="text-4xl">
                {tipoInfo.icon}
              </div>

              <h3 className="mt-3 text-sm font-black text-slate-800">
                {negocio.tipo === "loja"
                  ? "Nenhum produto cadastrado"
                  : "Nenhum item cadastrado"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
                Este anunciante ainda não cadastrou produtos ou serviços para exibição.
              </p>

            </div>

          ) : (

            <div className="mt-5 grid grid-cols-2 gap-4">

              {produtos.map(
                (produto) => (
                  <article
                    key={produto.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >

                    <div className="h-40 bg-slate-100">

                      {produto.imagemUrl ? (
                        <img
                          src={produto.imagemUrl}
                          alt={produto.nome}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl">
                          {tipoInfo.icon}
                        </div>
                      )}

                    </div>

                    <div className="p-4">

                      <h3 className="text-base font-black text-slate-900">
                        {produto.nome}
                      </h3>

                      {produto.descricao && (
                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">
                          {produto.descricao}
                        </p>
                      )}

                      <div className="mt-4">

                        <p
                          className="text-base font-black sm:text-lg"
                          style={{
                            color: cor,
                          }}
                        >
                          {formatarPreco(
                            produto.preco
                          )}
                        </p>

                        {whatsappNumero && (
                          <button
                            type="button"
                            onClick={() =>
                              abrirWhatsApp(
                                `Olá! Vi o item "${produto.nome}" no Sobradão 360 e gostaria de mais informações.`
                              )
                            }
                            className="mt-3 flex w-full items-center justify-center rounded-xl px-2 py-2.5 text-[10px] font-black leading-tight text-white hover:opacity-90"
                            style={{
                              backgroundColor:
                                cor,
                            }}
                          >
                            📱{" "}
                            {tipoInfo.botao}
                          </button>
                        )}

                        {negocio.carrinhoCompras && whatsappNumero && (
                          <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-100 p-1.5">
                            <button type="button" onClick={() => alterarCarrinho(produto.id, -1)} className="h-8 w-8 rounded-lg bg-white font-black shadow-sm">−</button>
                            <span className="text-xs font-black">{carrinho[produto.id] || 0}</span>
                            <button type="button" onClick={() => alterarCarrinho(produto.id, 1)} className="h-8 w-8 rounded-lg bg-white font-black shadow-sm">+</button>
                          </div>
                        )}

                      </div>

                    </div>

                  </article>
                )
              )}

            </div>

          )}

        </section>

        {negocio.carrinhoCompras && whatsappNumero && Object.values(carrinho).some((qtd) => qtd > 0) && (
          <section className="sticky bottom-3 z-30 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900">🛒 Seu carrinho</p>
                <p className="text-xs text-slate-500">
                  {Object.values(carrinho).reduce((a, b) => a + b, 0)} item(ns) · {formatarPreco(produtos.reduce((total, p) => total + p.preco * (carrinho[p.id] || 0), 0))}
                </p>
              </div>
              <button type="button" onClick={enviarCarrinho} className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white">
                📱 Enviar pedido
              </button>
            </div>
          </section>
        )}

        {/* SOBRE */}

        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

              {negocio.imagemUrl ? (
                <img
                  src={negocio.imagemUrl}
                  alt={"Logo " + negocio.nome}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <span className="text-3xl">
                  {tipoInfo.icon}
                </span>
              )}

            </div>

            <div className="min-w-0">

              <h2 className="text-lg font-black text-slate-900">
                {negocio.nome}
              </h2>

              {negocio.titulo && negocio.titulo !== negocio.nome && (
                <p className="mt-0.5 text-xs font-bold text-slate-500">
                  {negocio.titulo}
                </p>
              )}

              {negocio.slogan && (
                <p className="mt-1 text-xs italic text-slate-400">
                  {negocio.slogan}
                </p>
              )}

            </div>

          </div>

          <div className="mt-4">

            <h3 className="text-sm font-black text-slate-800">
              Sobre o negócio
            </h3>

            {negocio.descricao ? (
              <>
                <p
                  className={
                    sobreExpandido
                      ? "mt-2 whitespace-pre-line text-sm leading-6 text-slate-600"
                      : "mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 line-clamp-4"
                  }
                >
                  {negocio.descricao}
                </p>

                {negocio.descricao.length > 260 && (
                  <button
                    type="button"
                    onClick={() =>
                      setSobreExpandido(
                        (valor) => !valor
                      )
                    }
                    className="mt-2 text-xs font-black text-blue-700 hover:text-blue-900"
                  >
                    {sobreExpandido
                      ? "Mostrar menos"
                      : "Ler mais"}
                  </button>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                Este negócio ainda não adicionou uma descrição.
              </p>
            )}

          </div>

        </section>

        {/* BANNER SECUNDÁRIO */}

        {negocio.mostrarBanner &&
          negocio.bannerUrl && (
            <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

              <img
                src={negocio.bannerUrl}
                alt={`Banner ${negocio.nome}`}
                className="max-h-[350px] w-full object-cover"
              />

            </section>
          )}

        {/* RODAPÉ */}

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-sm">

          <p className="text-[11px] leading-5 text-slate-500">
            As informações apresentadas nesta página, incluindo produtos,
            serviços, preços, contatos e demais dados, são de
            <strong className="font-black text-slate-700">
              responsabilidade exclusiva do anunciante {negocio.nome}.
            </strong>
            O Portal Sobradão 360 disponibiliza este espaço para divulgação
            e não se responsabiliza pelo conteúdo, negociação, qualidade,
            disponibilidade ou cumprimento das ofertas anunciadas.
          </p>

          <Link
            href="/"
            className="mt-4 inline-flex text-xs font-bold text-blue-700 hover:text-blue-900"
          >
            ← Voltar para o Sobradão 360
          </Link>

        </div>

      </div>

    </main>
  );
}