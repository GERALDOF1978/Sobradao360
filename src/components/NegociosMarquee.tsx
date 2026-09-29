"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";

type Negocio = {
  id: string;
  nome?: string;
  titulo?: string;
  subtitulo?: string;
  descricao?: string;
  tipo?: string;
  telefone?: string;
  whatsapp?: string;
  imagemUrl?: string;
  ativo?: boolean;
  status?: string;
  tipoPresenca?: string;
  destinoDescricao?: string;
  siteUrl?: string;
};

export default function NegociosMarquee() {
  const router = useRouter();

  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregarNegocios() {
      try {
        const referencia = collection(db, "lojas_parceiras");

        const consulta = query(
          referencia,
          where("ativo", "==", true)
        );

        const snapshot = await getDocs(consulta);

        const lista: Negocio[] = [];

        for (const firestoreDoc of snapshot.docs) {
          const dados = firestoreDoc.data() as Record<string, unknown>;

          lista.push({
            id: firestoreDoc.id,
            nome:
              typeof dados.nome === "string"
                ? dados.nome
                : "",
            titulo:
              typeof dados.titulo === "string"
                ? dados.titulo
                : "",
            subtitulo:
              typeof dados.subtitulo === "string"
                ? dados.subtitulo
                : "",
            descricao:
              typeof dados.descricao === "string"
                ? dados.descricao
                : "",
            tipo:
              typeof dados.tipo === "string"
                ? dados.tipo
                : "",
            telefone:
              typeof dados.telefone === "string"
                ? dados.telefone
                : "",
            whatsapp:
              typeof dados.whatsapp === "string"
                ? dados.whatsapp
                : "",
            imagemUrl:
              typeof dados.imagemUrl === "string"
                ? dados.imagemUrl
                : "",
            ativo: dados.ativo === true,
            status:
              typeof dados.status === "string"
                ? dados.status
                : "",
            tipoPresenca:
              typeof dados.tipoPresenca === "string"
                ? dados.tipoPresenca
                : "",
            destinoDescricao:
              typeof dados.destinoDescricao === "string"
                ? dados.destinoDescricao
                : "",
            siteUrl:
              typeof dados.siteUrl === "string"
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

    carregarNegocios();

    return () => {
      ativo = false;
    };
  }, []);

  function abrirNegocio(negocio: Negocio) {
    const anuncio =
      negocio.id.startsWith("cadastro-");

    // Card "ANUNCIE AQUI"
    if (anuncio) {
      window.location.href =
        "https://sobradao360-sgvm.vercel.app/loja-explicativa?anunciante=novo";

      return;
    }

    // Site externo
    if (
      negocio.tipoPresenca === "site_externo" &&
      negocio.siteUrl
    ) {
      window.open(
        negocio.siteUrl,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    // WhatsApp
    if (
      negocio.tipoPresenca === "whatsapp" &&
      negocio.whatsapp
    ) {
      const numero = negocio.whatsapp.replace(/\D/g, "");

      if (numero) {
        const numeroBrasil = numero.startsWith("55")
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

    // Página interna da loja
    router.push(`/loja/${negocio.id}`);
  }

  if (carregando) {
    return null;
  }

  // Mantém sempre pelo menos 4 cards
  const quantidadeCards = Math.max(4, negocios.length);

  const cards: Negocio[] = Array.from(
    { length: quantidadeCards },
    (_, indice) =>
      negocios[indice] || {
        id: `cadastro-${indice}`,
        nome: "ANUNCIE AQUI",
        titulo: "Seu negócio no Sobradão 360",
        subtitulo: "Clique e anuncie sua empresa ou serviço",
        imagemUrl: "",
        ativo: true,
      }
  );

  // Duplica para criar o loop contínuo
  const itens = [...cards, ...cards];

  return (
    <section className="w-full overflow-hidden">
      <div className="relative w-full overflow-hidden">
        <div
          className="
            negocios-marquee
            flex
            w-max
            gap-3
            py-2
          "
        >
          {itens.map((negocio, indice) => {
            const anuncio =
              negocio.id.startsWith("cadastro-");

            return (
              <button
                key={`${negocio.id}-${indice}`}
                type="button"
                onClick={() => abrirNegocio(negocio)}
                className="
                  flex
                  w-[160px]
                  flex-shrink-0
                  flex-col
                  overflow-hidden
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  text-left
                  shadow-sm
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                  active:scale-[0.98]
                "
              >
                {/* LOGO / IMAGEM */}
                <div
                  className="
                    relative
                    h-24
                    w-full
                    overflow-hidden
                    bg-slate-900
                  "
                >
                  {negocio.imagemUrl ? (
                    <img
                      src={negocio.imagemUrl}
                      alt={negocio.nome || "Negócio"}
                      className="
                        absolute
                        inset-0
                        h-full
                        w-full
                        object-contain
                        bg-white
                        p-2
                      "
                    />
                  ) : (
                    <div
                      className="
                        flex
                        h-full
                        w-full
                        items-center
                        justify-center
                        bg-gradient-to-br
                        from-slate-700
                        to-slate-950
                        text-3xl
                      "
                    >
                      📢
                    </div>
                  )}

                  {/* Efeito de escurecimento */}
                  <div
                    className="
                      absolute
                      inset-0
                      bg-black/35
                    "
                  />

                  {/* Gradiente */}
                  <div
                    className="
                      absolute
                      inset-x-0
                      bottom-0
                      h-10
                      bg-gradient-to-t
                      from-black/70
                      to-transparent
                    "
                  />

                  {anuncio && (
                    <div
                      className="
                        absolute
                        inset-x-0
                        bottom-2
                        text-center
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-white
                      "
                    >
                      Seu negócio aqui
                    </div>
                  )}
                </div>

                {/* NOME E DESCRIÇÃO */}
                <div
                  className="
                    flex
                    h-[62px]
                    
                    min-w-0
                    flex-col
                    justify-center
                    px-2.5
                  "
                >
                  <h3
                    className={`
                      truncate
                      text-xs
                      font-black
                      uppercase
                      ${
                        anuncio
                          ? "text-blue-600"
                          : "text-gray-900"
                      }
                    `}
                  >
                    {negocio.nome}
                  </h3>

                  <p
                    className="
                      mt-0.5
                      truncate
                      text-[10px]
                      font-medium
                      text-gray-500
                    "
                  >
                    {negocio.subtitulo ||
                      negocio.titulo ||
                      "Conheça este parceiro"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}