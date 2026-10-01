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

function dataTimestamp(valor: unknown): Date | null {
  if (valor && typeof valor === "object") {
    const item = valor as { toDate?: () => Date; toMillis?: () => number };
    if (typeof item.toDate === "function") return item.toDate();
    if (typeof item.toMillis === "function") return new Date(item.toMillis());
  }
  return null;
}

export default function MiniCardsAnuncio() {
  const [cards, setCards] = useState<CardAnuncio[]>([]);

  useEffect(() => {
    async function carregar() {
      try {
        const [lojasSnapshot, contratosSnapshot] = await Promise.all([
          getDocs(query(collection(db, "lojas_parceiras"), where("ativo", "==", true))),
          getDocs(query(collection(db, "contratos_anuncio"), where("status", "==", "ativo"))),
        ]);

        const lojas = new Map<string, Record<string, unknown>>();
        lojasSnapshot.docs.forEach((item) => lojas.set(item.id, item.data() as Record<string, unknown>));

        const agora = new Date();
        const lista: CardAnuncio[] = [];

        contratosSnapshot.docs.forEach((item) => {
          const contrato = item.data() as Record<string, unknown>;
          const lojaId = typeof contrato.lojaId === "string" ? contrato.lojaId : "";
          const loja = lojas.get(lojaId);
          if (!loja) return;

          const bannerUrl = typeof loja.bannerUrl === "string" ? loja.bannerUrl : "";
          const nome = typeof loja.nome === "string" ? loja.nome : "";
          if (!bannerUrl && !nome) return;

          const inicio = dataTimestamp(contrato.inicio);
          const vencimento = dataTimestamp(contrato.vencimento);
          if (inicio && inicio > agora) return;
          if (vencimento && vencimento < agora) return;

          const exibicao = contrato.exibicao;
          if (exibicao && typeof exibicao === "object") {
            const dados = exibicao as Record<string, unknown>;
            if (dados.publicidade !== true && dados.destaques !== true && dados.parceiros !== true) return;
          }

          lista.push({ id: item.id, lojaId, nome, bannerUrl });
        });

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
