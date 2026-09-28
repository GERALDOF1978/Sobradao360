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
          const firestoreDoc of snapshot.docs
        ) {
          const dados =
            firestoreDoc.data() as Record<
              string,
              unknown
            >;

          if (
            dados.mostrarMarquee === false
          ) {
            continue;
          }

          lista.push({
            id:
              firestoreDoc.id,

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
          });
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

  /*
   * Três cópias deixam o movimento contínuo.
   */
  const itens = [
    ...negocios,
    ...negocios,
    ...negocios,
  ];

  return (
    <section className="w-full overflow-hidden py-2">

      <div
        className="
          group
          relative
          w-full
          overflow-hidden
        "
      >

        <div
          className="
            flex
            w-max
            gap-4
            px-2
            animate-marquee
            group-hover:[animation-play-state:paused]
          "
        >

          {itens.map(
            (
              negocio,
              indice
            ) => {

              const cor =
                negocio.corMarca ||
                "#0f172a";

              const temBanner =
                Boolean(
                  negocio.bannerUrl
                );

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
                    h-[108px]
                    w-[310px]
                    shrink-0
                    overflow-hidden
                    rounded-2xl
                    border
                    border-white/20
                    bg-slate-900
                    text-left
                    shadow-md
                    transition
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-xl
                  "
                >

                  {/* BANNER DO PRÓPRIO ANUNCIANTE */}

                  {temBanner ? (
                    <img
                      src={
                        negocio.bannerUrl
                      }
                      alt=""
                      aria-hidden="true"
                      className="
                        absolute
                        inset-0
                        h-full
                        w-full
                        object-cover
                        transition
                        duration-500
                        group-hover:scale-105
                      "
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          `linear-gradient(135deg, ${cor}, #020617)`,
                      }}
                    />
                  )}

                  {/* ESCURECIMENTO */}

                  <div
                    className="
                      absolute
                      inset-0
                      bg-gradient-to-r
                      from-black/85
                      via-black/55
                      to-black/20
                    "
                  />

                  {/* CONTEÚDO */}

                  <div className="relative z-10 flex h-full items-center gap-3 px-3">

                    {/* LOGO */}

                    <div
                      className="
                        flex
                        h-[78px]
                        w-[78px]
                        shrink-0
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-2xl
                        border-2
                        bg-white
                        shadow-lg
                      "
                      style={{
                        borderColor:
                          cor,
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
                            p-1
                          "
                        />
                      ) : (
                        <span className="text-3xl">
                          🏪
                        </span>
                      )}

                    </div>

                    {/* TEXTOS */}

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-white/70">
                        Parceiro Sobradão 360
                      </p>

                      <h3 className="mt-1 truncate text-base font-black text-white">
                        {negocio.nome ||
                          negocio.titulo ||
                          "Comércio parceiro"}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-4 text-white/85">
                        {negocio.slogan ||
                          negocio.subtitulo ||
                          "Conheça este anunciante"}
                      </p>

                      <span
                        className="
                          mt-2
                          inline-flex
                          rounded-full
                          px-3
                          py-1
                          text-[9px]
                          font-black
                          text-white
                        "
                        style={{
                          backgroundColor:
                            cor,
                        }}
                      >
                        VER ANUNCIANTE →
                      </span>

                    </div>

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