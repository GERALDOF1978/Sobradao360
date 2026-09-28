"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Negocio {
  id: string;
  nome?: string;
  titulo?: string;
  subtitulo?: string;
  descricao?: string;
  tipo?: string;
  telefone?: string;
  whatsapp?: string;
  imagemUrl?: string;

  tipoPresenca?:
    | "pagina_sobradao"
    | "site_externo"
    | "whatsapp";

  destinoDescricao?: string;
  siteUrl?: string;

  ativo?: boolean;
  status?: string;

  temLojaCriada?: boolean;
  linkLoja?: string;
}

const TIPOS: Record<string, string> = {
  loja: "Comércio",
  oficina: "Oficina",
  profissional: "Profissional",
  alimentacao: "Alimentação",
  eventos: "Eventos",
  empresa: "Empresa",
  tecnologia: "Tecnologia",
  outros: "Serviço",
};

function normalizarUrl(url: string): string {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `https://${url}`;
}

function limparWhatsapp(numero: string): string {
  return numero.replace(/\D/g, "");
}

function obterDestino(item: Negocio): string {
  if (
    item.tipoPresenca === "site_externo" &&
    item.siteUrl
  ) {
    return normalizarUrl(item.siteUrl);
  }

  if (
    item.tipoPresenca === "whatsapp" &&
    item.whatsapp
  ) {
    const numero = limparWhatsapp(
      item.whatsapp
    );

    if (numero) {
      return `https://wa.me/55${numero}`;
    }
  }

  if (
    item.tipoPresenca === "pagina_sobradao"
  ) {
    return `/loja/${item.id}`;
  }

  if (
    item.temLojaCriada &&
    item.linkLoja
  ) {
    return item.linkLoja;
  }

  return `/loja/${item.id}`;
}

export default function NegociosMarquee() {
  const router = useRouter();

  const [negocios, setNegocios] =
    useState<Negocio[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    async function carregarNegocios() {
      try {
        const referencia = collection(
          db,
          "lojas_parceiras"
        );

        const consulta = query(
          referencia,
          where("ativo", "==", true)
        );

        const snapshot =
          await getDocs(consulta);

        const lista: Negocio[] =
          snapshot.docs.map(
            (
              doc: QueryDocumentSnapshot<DocumentData>
            ) => ({
              id: doc.id,
              ...(doc.data() as Omit<
                Negocio,
                "id"
              >),
            })
          );

        setNegocios(lista);
      } catch (error: unknown) {
        console.error(
          "Erro ao carregar negócios parceiros:",
          error
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarNegocios();
  }, []);

  function abrirNegocio(item: Negocio) {
    const destino =
      obterDestino(item);

    if (
      destino.startsWith("http://") ||
      destino.startsWith("https://")
    ) {
      window.open(
        destino,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    router.push(destino);
  }

  if (carregando) {
    return (
      <section className="w-full py-6">
        <div className="mx-auto max-w-7xl px-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            Carregando parceiros...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-6">
      <div className="mx-auto max-w-7xl px-4">

        <div className="mb-4 flex items-center justify-between gap-4">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Parceiros do Sobradão
            </h2>

            <p className="text-sm text-slate-500">
              Empresas e profissionais da
              nossa comunidade
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/cadastro-anunciante"
              )
            }
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-600"
          >
            Anuncie aqui
          </button>

        </div>

        {negocios.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">

            <div className="mb-2 text-3xl">
              🏪
            </div>

            <h3 className="font-bold text-slate-800">
              Seu negócio pode aparecer aqui
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Cadastre sua empresa, loja ou
              serviço no Sobradão 360.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/cadastro-anunciante"
                )
              }
              className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Quero anunciar
            </button>

          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex gap-4 overflow-x-auto p-4">

              {negocios.map(
                (item: Negocio) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      abrirNegocio(item)
                    }
                    className="group min-w-[250px] max-w-[250px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >

                    <div className="h-32 w-full overflow-hidden bg-slate-100">

                      {item.imagemUrl ? (
                        <img
                          src={item.imagemUrl}
                          alt={
                            item.nome ||
                            item.titulo ||
                            "Parceiro"
                          }
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl">
                          🏪
                        </div>
                      )}

                    </div>

                    <div className="p-4">

                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
                        {TIPOS[
                          item.tipo || ""
                        ] || "Parceiro"}
                      </div>

                      <h3 className="line-clamp-1 text-base font-bold text-slate-900">
                        {item.nome ||
                          item.titulo ||
                          "Parceiro Sobradão"}
                      </h3>

                      {item.subtitulo && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {item.subtitulo}
                        </p>
                      )}

                      <div className="mt-3 text-sm font-bold text-blue-600">
                        Conhecer →
                      </div>

                    </div>
                  </button>
                )
              )}

            </div>
          </div>
        )}

      </div>
    </section>
  );
}