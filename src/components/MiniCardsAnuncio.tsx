"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type CardAnuncio = {
  id: string;
  lojaId: string;
  nome: string;
  bannerUrl: string;
};

export default function MiniCardsAnuncio() {
  const [cards, setCards] = useState<CardAnuncio[]>([]);

  useEffect(() => {
    async function carregar() {
      try {
        const lojasSnapshot = await getDocs(
          query(collection(db, "lojas_parceiras"), where("ativo", "==", true))
        );

        const lista: CardAnuncio[] = lojasSnapshot.docs
          .map((item: (typeof lojasSnapshot.docs)[number]) => {
            const loja = item.data() as Record<string, unknown>;
            return {
              id: item.id,
              lojaId: item.id,
              nome: typeof loja.nome === "string" ? loja.nome : "",
              bannerUrl: typeof loja.bannerUrl === "string" ? loja.bannerUrl : "",
            };
          })
          .filter((item: CardAnuncio) => item.nome || item.bannerUrl);

        setCards(lista.slice(0, 4));
      } catch (erro) {
        console.error("Erro ao carregar mini anúncios:", erro);
        setCards([]);
      }
    }

    carregar();
  }, []);

  if (cards.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Publicidade</h2>
        <span className="text-[9px] font-bold text-slate-400">Anunciantes locais</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={`/loja/${card.lojaId}`}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-amber-400 hover:shadow-md"
          >
            {card.bannerUrl ? (
              <div className="aspect-[3/1] w-full overflow-hidden bg-slate-100">
                <img src={card.bannerUrl} alt={card.nome || "Publicidade"} className="h-full w-full object-cover" loading="lazy" />
              </div>
            ) : (
              <div className="flex min-h-12 items-center justify-center bg-emerald-700 px-2 text-center text-[10px] font-black text-white">
                {card.nome}
              </div>
            )}
            <div className="truncate px-2 py-1.5 text-[10px] font-bold text-slate-700">{card.nome || "Anunciante"}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
