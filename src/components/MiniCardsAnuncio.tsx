"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type CardAnuncio = {
  id: string;
  lojaId: string;
  nome: string;
  imagemUrl: string;
};

export default function MiniCardsAnuncio() {
  const [cards, setCards] = useState<CardAnuncio[]>([]);
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    async function carregar() {
      try {
        const [lojasSnapshot, contratosSnapshot] = await Promise.all([
          getDocs(query(collection(db, "lojas_parceiras"), where("ativo", "==", true))),
          getDocs(query(collection(db, "contratos_anuncio"), where("status", "==", "ativo"))),
        ]);

        const lojas = new Map<string, Record<string, unknown>>();
        lojasSnapshot.docs.forEach((item: (typeof lojasSnapshot.docs)[number]) =>
          lojas.set(item.id, item.data() as Record<string, unknown>)
        );

        const lista: CardAnuncio[] = [];
        contratosSnapshot.docs.forEach(
          (contratoDoc: (typeof contratosSnapshot.docs)[number]) => {
          const contrato = contratoDoc.data() as Record<string, unknown>;
          const exibicao =
            contrato.exibicao && typeof contrato.exibicao === "object"
              ? (contrato.exibicao as Record<string, unknown>)
              : {};
          const lojaId = typeof contrato.lojaId === "string" ? contrato.lojaId : "";
          const loja = lojas.get(lojaId);
          if (!loja || exibicao.publicidade !== true) return;

          const imagemUrl =
            typeof loja.artePublicidadeUrl === "string" && loja.artePublicidadeUrl
              ? loja.artePublicidadeUrl
              : typeof loja.bannerUrl === "string" && loja.bannerUrl
                ? loja.bannerUrl
                : typeof loja.imagemUrl === "string" ? loja.imagemUrl : "";

          if (!imagemUrl) return;
          lista.push({
            id: contratoDoc.id,
            lojaId,
            nome: typeof loja.nome === "string" ? loja.nome : "Anunciante",
            imagemUrl,
          });
        }
        );

        setCards(lista);
      } catch (erro) {
        console.error("Erro ao carregar mini anúncios:", erro);
        setCards([]);
      }
    }
    carregar();
  }, []);

  const totalPaginas = Math.max(1, Math.ceil(cards.length / 4));

  useEffect(() => {
    if (totalPaginas <= 1) return;
    const timer = window.setInterval(() => {
      setPagina((atual) => (atual + 1) % totalPaginas);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [totalPaginas]);

  if (cards.length === 0) return null;

  const visiveis = cards.slice(pagina * 4, pagina * 4 + 4);

  return (
    <section className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {visiveis.map((card) => (
          <Link
            key={card.id}
            href={`/loja/${card.lojaId}`}
            className="aspect-[3/1] w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-amber-400"
            title={card.nome}
          >
            <img
              src={card.imagemUrl}
              alt={card.nome}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
