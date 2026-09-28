"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

interface Negocio {
  id: string;
  titulo: string;
  subtitulo?: string;
  imagemUrl?: string;
  temLojaCriada?: boolean;
  linkLoja?: string;
}

export default function NegociosMarquee() {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    async function carregarNegocios() {
      try {
        const q = query(
          collection(db, "lojas_parceiras"),
          where("ativo", "==", true)
        );

        const snapshot = await getDocs(q);

        const lista: Negocio[] = snapshot.docs.map((docSnap: any) => {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    titulo: data.titulo || data.nome || "Negócio",
    subtitulo: data.subtitulo || data.categoria || "",
    imagemUrl: data.imagemUrl || "",
    temLojaCriada: data.temLojaCriada === true,
    linkLoja: data.linkLoja || "",
  };
});

        setNegocios(lista);
      } catch (error) {
        console.error(
          "Erro ao carregar negócios:",
          error
        );

        setNegocios([]);
      } finally {
        setCarregando(false);
      }
    }

    carregarNegocios();
  }, []);

  const abrirNegocio = (item: Negocio) => {
    if (item.temLojaCriada) {
      return (
        item.linkLoja ||
        `/loja/${item.id}`
      );
    }

    return `/loja-explicativa?id=${item.id}`;
  };

  if (carregando) {
    return (
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            🏪 Negócios do Sobradão
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-4 text-center">
          <p className="text-[11px] text-slate-500">
            Carregando negócios...
          </p>
        </div>
      </section>
    );
  }

  if (negocios.length === 0) {
    return (
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            🏪 Negócios do Sobradão
          </h2>
        </div>

        <Link
          href="/loja-explicativa?anunciante=novo"
          className="block bg-white border-2 border-dashed border-amber-400 rounded-2xl p-4 text-center hover:bg-amber-50 transition"
        >
          <p className="text-sm font-black text-blue-900">
            Sua empresa aqui
          </p>

          <p className="text-[11px] text-slate-500 mt-1">
            Tenha sua página no Sobradão 360
          </p>
        </Link>
      </section>
    );
  }

  /*
   * Duplicamos a lista para que a animação
   * consiga passar continuamente pela tela.
   */
  const listaAnimada = [
    ...negocios,
    ...negocios,
  ];

  return (
    <section className="space-y-2 overflow-hidden">

      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
          🏪 Negócios do Sobradão
        </h2>

        <Link
          href="/loja-explicativa?anunciante=novo"
          className="text-[10px] font-bold text-blue-700 hover:text-blue-900"
        >
          Anuncie →
        </Link>
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl bg-white border border-slate-200 py-2 shadow-sm">

        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10" />

        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10" />

        <div className="marquee-negocios flex w-max items-center">

          {listaAnimada.map(
            (item, index) => (
              <Link
                key={`${item.id}-${index}`}
                href={abrirNegocio(item)}
                className="mx-1.5 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 min-w-[145px] max-w-[180px] hover:border-amber-400 hover:bg-amber-50 transition"
              >

                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">

                  {item.imagemUrl ? (
                    <img
                      src={item.imagemUrl}
                      alt={item.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">
                      🏪
                    </span>
                  )}

                </div>

                <div className="min-w-0">

                  <p className="text-[10px] font-black text-slate-800 truncate">
                    {item.titulo}
                  </p>

                  <p className="text-[9px] text-slate-500 truncate">
                    {item.subtitulo ||
                      "Conheça o negócio"}
                  </p>

                </div>

              </Link>
            )
          )}

        </div>

      </div>

      <style jsx>{`
        .marquee-negocios {
          animation: moverNegocios 35s linear infinite;
        }

        .marquee-negocios:hover {
          animation-play-state: paused;
        }

        @keyframes moverNegocios {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

    </section>
  );
}