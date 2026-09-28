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

        /*
         * Usamos for...of em vez de map() para evitar
         * problemas de inferência de tipos do Firebase.
         *
         * Não usamos:
         * QueryDocumentSnapshot
         * DocumentData
         * any
         */

        for (const firestoreDoc of snapshot.docs) {
          const dados = firestoreDoc.data() as Record<string, unknown>;

          const negocio: Negocio = {
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

            ativo:
              dados.ativo === true,

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
          };

          lista.push(negocio);
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
    /*
     * Se o anunciante possui site externo,
     * abrimos o endereço informado.
     */
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

    /*
     * Se o anunciante escolheu WhatsApp,
     * abrimos diretamente a conversa.
     */
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

    /*
     * Caso padrão:
     * página comercial dentro do Sobradão 360.
     */
    router.push(`/loja/${negocio.id}`);
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
            (negocio, indice) => (
              <button
                key={`${negocio.id}-${indice}`}
                type="button"
                onClick={() => abrirNegocio(negocio)}
                className="
                  flex
                  min-w-[240px]
                  max-w-[300px]
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  px-4
                  py-3
                  text-left
                  shadow-sm
                  transition
                  hover:shadow-md
                  active:scale-[0.98]
                "
              >
                {negocio.imagemUrl ? (
                  <img
                    src={negocio.imagemUrl}
                    alt={negocio.nome || "Negócio"}
                    className="
                      h-12
                      w-12
                      shrink-0
                      rounded-full
                      object-cover
                    "
                  />
                ) : (
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-gray-100
                      text-xl
                    "
                  >
                    🏪
                  </div>
                )}

                <div className="min-w-0">
                  <div
                    className="
                      truncate
                      text-sm
                      font-bold
                      text-gray-900
                    "
                  >
                    {negocio.nome || "Comércio parceiro"}
                  </div>

                  {negocio.subtitulo ? (
                    <div
                      className="
                        truncate
                        text-xs
                        text-gray-600
                      "
                    >
                      {negocio.subtitulo}
                    </div>
                  ) : negocio.titulo ? (
                    <div
                      className="
                        truncate
                        text-xs
                        text-gray-600
                      "
                    >
                      {negocio.titulo}
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
            )
          )}
        </div>
      </div>
    </section>
  );
}