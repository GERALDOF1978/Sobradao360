"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Campeonato = { id: string; titulo: string; premio: string; inicio: string; fim: string; status: string };

function formatarData(valor: string) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function AvisoCampeonatoMemoria({ noJogo = false }: { noJogo?: boolean }) {
  const [campeonato, setCampeonato] = useState<Campeonato | null>(null);
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    const atualizar = () => setAgora(Date.now());
    atualizar();
    const relogio = setInterval(atualizar, 60000);
    (async () => {
      try {
        const snap = await getDocs(collection(db, "campeonatos_memoria360"));
        if (!ativo) return;
        const lista = snap.docs.map((d: { id: string; data: () => Record<string, unknown> }): Campeonato => ({ id: d.id, ...d.data() } as Campeonato))
          .filter((c: Campeonato) => c.status === "ativo" && Number.isFinite(Date.parse(c.inicio)) && Number.isFinite(Date.parse(c.fim)))
          .filter((c: Campeonato) => Date.parse(c.fim) > Date.now())
          .sort((a: Campeonato, b: Campeonato) => Date.parse(a.inicio) - Date.parse(b.inicio));
        setCampeonato(lista[0] || null);
      } catch (erro) {
        console.error("Falha ao consultar campeonato público Memória 360:", erro);
      }
    })();
    return () => { ativo = false; clearInterval(relogio); };
  }, []);

  if (!campeonato || agora === null) return null;
  const comecou = agora >= Date.parse(campeonato.inicio);

  return (
    <section className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm" aria-label="Campeonato Memória 360">
      <span className="inline-flex rounded-full bg-amber-500 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
        🏆 {comecou ? "Campeonato em andamento" : "Campeonato anunciado"}
      </span>
      <h2 className="mt-3 text-xl font-black text-slate-900">{campeonato.titulo || "Campeonato Memória 360"}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-700">🧠 Competição do Jogo da Memória</p>
      {campeonato.premio && <p className="mt-3 rounded-xl bg-white p-3 text-sm font-bold text-amber-900">🎁 Prêmio: {campeonato.premio}</p>}
      <p className="mt-3 text-xs leading-5 text-slate-600">
        Início: <strong>{formatarData(campeonato.inicio)}</strong>
        <br />
        Término: <strong>{formatarData(campeonato.fim)}</strong>
      </p>
      <p className="mt-3 text-xs text-slate-600">
        {comecou ? "O campeonato está no período anunciado." : "O campeonato ainda não começou. Aproveite para treinar!"}
        {" "}O ranking geral do jogo é separado da classificação de cada campeonato.
      </p>
      {!noJogo && <Link href="/jogos/memoria" className="mt-4 block rounded-xl bg-cyan-700 px-4 py-3 text-center text-sm font-black text-white">🧠 Ir para o Jogo da Memória →</Link>}
    </section>
  );
}
