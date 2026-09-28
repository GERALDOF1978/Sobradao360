"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

type TipoNegocio =
  | "loja"
  | "oficina"
  | "profissional"
  | "alimentacao"
  | "eventos"
  | "empresa";

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
  ativo: boolean;
}

const TIPOS: Record<
  TipoNegocio,
  {
    icon: string;
    nome: string;
    titulo: string;
    descricao: string;
  }
> = {
  loja: {
    icon: "🛒",
    nome: "Loja",
    titulo: "Produtos",
    descricao: "Confira os produtos e preços disponíveis.",
  },

  oficina: {
    icon: "🔧",
    nome: "Oficina",
    titulo: "Serviços",
    descricao: "Conheça os serviços oferecidos e solicite um orçamento.",
  },

  profissional: {
    icon: "👷",
    nome: "Profissional",
    titulo: "Serviços",
    descricao: "Conheça os serviços disponíveis.",
  },

  alimentacao: {
    icon: "🍰",
    nome: "Alimentação",
    titulo: "Produtos e encomendas",
    descricao: "Confira produtos, opções e formas de encomenda.",
  },

  eventos: {
    icon: "🎉",
    nome: "Eventos",
    titulo: "Serviços para eventos",
    descricao: "Conheça as opções oferecidas para seu evento.",
  },

  empresa: {
    icon: "🏢",
    nome: "Empresa",
    titulo: "Produtos e serviços",
    descricao: "Conheça os produtos e serviços desta empresa.",
  },
};

export default function LojaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const { id } = await params;

        if (!id) {
          setErro("Negócio não encontrado.");
          return;
        }

        const referencia = doc(db, "lojas_parceiras", id);
        const snapshot = await getDoc(referencia);

        if (!snapshot.exists()) {
          setErro("Este negócio não existe.");
          return;
        }

        const data = snapshot.data();

        if (data.ativo !== true) {
          setErro(
            "Este negócio ainda não está disponível publicamente."
          );
          return;
        }

        setNegocio({
          id: snapshot.id,
          nome: data.nome || data.titulo || "Negócio",
          titulo: data.titulo || data.nome || "Negócio",
          subtitulo: data.subtitulo || data.categoria || "",
          descricao: data.descricao || "",
          tipo: data.tipo || "empresa",
          telefone: data.telefone || "",
          whatsapp: data.whatsapp || "",
          imagemUrl: data.imagemUrl || "",
          ativo: data.ativo === true,
        });
      } catch (error) {
        console.error("Erro ao carregar negócio:", error);
        setErro("Não foi possível carregar este negócio.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [params]);

  function limparWhatsApp(numero: string) {
    return numero.replace(/\D/g, "");
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">🏪</div>

          <p className="mt-3 text-sm font-bold text-slate-600">
            Carregando página...
          </p>
        </div>
      </main>
    );
  }

  if (erro || !negocio) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">

          <div className="text-5xl">🏪</div>

          <h1 className="mt-4 text-xl font-black text-slate-900">
            Negócio indisponível
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {erro || "Não foi possível encontrar este negócio."}
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
    TIPOS[negocio.tipo] || TIPOS.empresa;

  const whatsappNumero = limparWhatsApp(
    negocio.whatsapp
  );

  const telefoneNumero = limparWhatsApp(
    negocio.telefone
  );

  return (
    <main className="min-h-screen bg-slate-100 pb-12">

      {/* TOPO DA PÁGINA */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white">

        <div className="mx-auto max-w-5xl px-4 py-5">

          <Link
            href="/"
            className="inline-flex text-xs font-bold text-blue-100 hover:text-white"
          >
            ← Sobradão 360
          </Link>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">

            {/* LOGO */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white/20 bg-white shadow-lg">

              {negocio.imagemUrl ? (
                <img
                  src={negocio.imagemUrl}
                  alt={negocio.nome}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl">
                  {tipoInfo.icon}
                </span>
              )}

            </div>

            {/* INFORMAÇÕES */}
            <div>

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase text-blue-950">
                  {tipoInfo.icon} {tipoInfo.nome}
                </span>

              </div>

              <h1 className="mt-2 text-3xl font-black">
                {negocio.titulo}
              </h1>

              {negocio.subtitulo && (
                <p className="mt-1 text-sm text-blue-100">
                  {negocio.subtitulo}
                </p>
              )}

            </div>

          </div>

        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5">

        {/* SOBRE */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <h2 className="text-sm font-black text-slate-900">
            Sobre o negócio
          </h2>

          {negocio.descricao ? (
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
              {negocio.descricao}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              Este negócio ainda não adicionou uma descrição.
            </p>
          )}

        </section>

        {/* CONTATO */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <h2 className="text-sm font-black text-slate-900">
            📞 Entre em contato
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">

            {telefoneNumero && (
              <a
                href={`tel:${telefoneNumero}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="text-2xl">📞</span>

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
              <a
                href={`https://wa.me/55${whatsappNumero}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <span className="text-2xl">📱</span>

                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    WhatsApp
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-800">
                    Conversar pelo WhatsApp
                  </p>
                </div>
              </a>
            )}

          </div>

          {!telefoneNumero && !whatsappNumero && (
            <p className="mt-3 text-xs text-slate-400">
              Os contatos ainda não foram cadastrados.
            </p>
          )}

        </section>

        {/* ÁREA PRINCIPAL DO NEGÓCIO */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
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

          {/* PLACEHOLDER DA PRÓXIMA ETAPA */}
          <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">

            <div className="text-4xl">
              {tipoInfo.icon}
            </div>

            <h3 className="mt-3 text-sm font-black text-slate-800">
              {negocio.tipo === "loja"
                ? "Produtos do negócio"
                : negocio.tipo === "alimentacao"
                ? "Produtos e encomendas"
                : negocio.tipo === "eventos"
                ? "Serviços para eventos"
                : "Serviços oferecidos"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
              O anunciante poderá cadastrar aqui seus
              produtos e serviços diretamente pelo painel.
            </p>

            <span className="mt-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black text-amber-700">
              EM BREVE
            </span>

          </div>

        </section>

        {/* PUBLICIDADE */}
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">

          <div className="flex items-center gap-3">

            <div className="text-2xl">
              📢
            </div>

            <div>
              <h2 className="text-sm font-black text-blue-950">
                Publicidade
              </h2>

              <p className="text-[11px] text-slate-600">
                Espaço para banners deste anunciante.
              </p>
            </div>

          </div>

          <div className="mt-4 rounded-2xl border-2 border-dashed border-amber-300 bg-white p-6 text-center">

            <p className="text-xs font-black text-slate-700">
              Banner do anunciante
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Será gerenciado pelo painel do anunciante.
            </p>

          </div>

        </section>

        {/* RODAPÉ */}
        <div className="text-center">

          <Link
            href="/"
            className="text-xs font-bold text-blue-700 hover:text-blue-900"
          >
            ← Voltar para o Sobradão 360
          </Link>

        </div>

      </div>
    </main>
  );
}