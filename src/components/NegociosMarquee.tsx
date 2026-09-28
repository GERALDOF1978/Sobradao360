"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { useRouter } from "next/navigation";

import { db } from "@/lib/firebase";

type Negocio = {
  id: string;

  nome?: string;
  titulo?: string;
  subtitulo?: string;
  slogan?: string;

  tipo?: string;

  whatsapp?: string;
  imagemUrl?: string;
  bannerUrl?: string;
  corMarca?: string;

  ativo?: boolean;
  status?: string;

  mostrarMarquee?: boolean;

  tipoPresenca?: string;
  siteUrl?: string;
};

export default function NegociosMarquee() {
  const router = useRouter();

  const [negocios, setNegocios] =
    useState<Negocio[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregarNegocios() {
      try {
        const referencia =
          collection(
            db,
            "lojas_parceiras"
          );

        const consulta =
          query(
            referencia,
            where(
              "ativo",
              "==",
              true
            )
          );

        const snapshot =
          await getDocs(
            consulta
          );

        const lista: Negocio[] = [];

        for (
          const firestoreDoc
          of snapshot.docs
        ) {
          const dados =
            firestoreDoc.data() as Record<
              string,
              unknown
            >;

          /*
           * IMPORTANTE:
           *
           * Negócios antigos que ainda não
           * possuem mostrarMarquee continuam
           * aparecendo.
           *
           * Quando o anunciante salvar o
           * painel, o campo passa a existir.
           */

          if (
            dados.mostrarMarquee === false
          ) {
            continue;
          }

          const negocio: Negocio = {
            id: firestoreDoc.id,

            nome:
              typeof dados.nome ===
              "string"
                ? dados.nome
                : "",

            titulo:
              typeof dados.titulo ===
              "string"
                ? dados.titulo
                : "",

            subtitulo:
              typeof dados.subtitulo ===
              "string"
                ? dados.subtitulo
                : "",

            slogan:
              typeof dados.slogan ===
              "string"
                ? dados.slogan
                : "",

            tipo:
              typeof dados.tipo ===
              "string"
                ? dados.tipo
                : "",

            whatsapp:
              typeof dados.whatsapp ===
              "string"
                ? dados.whatsapp
                : "",

            imagemUrl:
              typeof dados.imagemUrl ===
              "string"
                ? dados.imagemUrl
                : "",

            bannerUrl:
              typeof dados.bannerUrl ===
              "string"
                ? dados.bannerUrl
                : "",

            corMarca:
              typeof dados.corMarca ===
              "string"
                ? dados.corMarca
                : "#0f172a",

            ativo:
              dados.ativo === true,

            status:
              typeof dados.status ===
              "string"
                ? dados.status
                : "",

            mostrarMarquee:
              dados.mostrarMarquee !==
              false,

            tipoPresenca:
              typeof dados.tipoPresenca ===
              "string"
                ? dados.tipoPresenca
                : "",

            siteUrl:
              typeof dados.siteUrl ===
              "string"
                ? dados.siteUrl
                : "",
          };

          lista.push(
            negocio
          );
        }

        if (ativo) {
          setNegocios(lista);
        }
      } catch (erro) {
        console.error(
          "Erro ao buscar negócios parceiros:",
          erro
        );

        if (ativo) {
          setNegocios([]);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregarNegocios();

    return () => {
      ativo = false;
    };
  }, []);

  function abrirNegocio(
    negocio: Negocio
  ) {
    if (
      negocio.tipoPresenca ===
        "site_externo" &&
      negocio.siteUrl
    ) {
      window.open(
        negocio.siteUrl,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    if (
      negocio.tipoPresenca ===
        "whatsapp" &&
      negocio.whatsapp
    ) {
      const numero =
        negocio.whatsapp.replace(
          /\D/g,
          ""
        );

      if (numero) {
        const numeroBrasil =
          numero.startsWith("55")
            ? numero
            : `55${numero}`;

        window.open(
          `https://wa.me/${numeroBrasil}`,
          "_blank",
          "noopener,noreferrer"
        );
      }

      return;
    }

    router.push(
      `/loja/${negocio.id}`
    );
  }

  if (carregando) {
    return null;
  }

  if (negocios.length === 0) {
    return null;
  }

  return (
    <section className="w-full overflow-hidden">

      <div className="relative w-full overflow-hidden">

        <div
          className="
            flex
            w-max
            animate-marquee
            gap-4
            py-2
          "
        >

          {[...negocios, ...negocios].map(
            (
              negocio,
              indice
            ) => {

              const cor =
                negocio.corMarca ||
                "#0f172a";

              return (
                <button
                  key={`${negocio.id}-${indice}`}
                  type="button"
                  onClick={() =>
                    abrirNegocio(
                      negocio
                    )
                  }
                  className="
                    relative
                    flex
                    min-w-[270px]
                    max-w-[320px]
                    items-center
                    gap-3
                    overflow-hidden
                    rounded-2xl
                    border
                    border-gray-200
                    bg-white
                    px-4
                    py-3
                    text-left
                    shadow-sm
                    transition
                    hover:-translate-y-0.5
                    hover:shadow-lg
                    active:scale-[0.98]
                  "
                >

                  {negocio.bannerUrl && (
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage:
                          `url(${negocio.bannerUrl})`,
                        backgroundSize:
                          "cover",
                        backgroundPosition:
                          "center",
                      }}
                    />
                  )}

                  <div
                    className="
                      relative
                      flex
                      h-14
                      w-14
                      shrink-0
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-xl
                      bg-gray-100
                    "
                    style={{
                      border:
                        `2px solid ${cor}`,
                    }}
                  >

                    {negocio.imagemUrl ? (
                      <img
                        src={
                          negocio.imagemUrl
                        }
                        alt={
                          negocio.nome ||
                          "Negócio"
                        }
                        className="
                          h-full
                          w-full
                          object-contain
                          bg-white
                        "
                      />
                    ) : (
                      <span className="text-xl">
                        🏪
                      </span>
                    )}

                  </div>

                  <div className="relative min-w-0">

                    <div
                      className="
                        truncate
                        text-sm
                        font-black
                        text-gray-900
                      "
                    >
                      {negocio.nome ||
                        "Comércio parceiro"}
                    </div>

                    {negocio.slogan ? (
                      <div
                        className="
                          truncate
                          text-xs
                          font-semibold
                        "
                        style={{
                          color: cor,
                        }}
                      >
                        {negocio.slogan}
                      </div>
                    ) : negocio.subtitulo ? (
                      <div
                        className="
                          truncate
                          text-xs
                          text-gray-600
                        "
                      >
                        {negocio.subtitulo}
                      </div>
                    ) : (
                      <div
                        className="
                          truncate
                          text-xs
                          text-gray-500
                        "
                      >
                        Conheça este parceiro
                      </div>
                    )}

                  </div>

                </button>
              );
            }
          )}

        </div>

      </div>

    </section>
  );
}