"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Placar = { id: string; apelido: string; pontos: number; tempo: number; tentativas: number };

export default function Desafio360() {
  const [ranking, setRanking] = useState<Placar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  async function atualizar() {
    setCarregando(true); setErro("");
    try {
      const snap = await getDocs(query(collection(db, "ranking_memoria360"), orderBy("pontos", "desc"), limit(10)));
      setRanking(snap.docs.map((d: { id: string; data: () => Record<string, unknown> }) => ({ id: d.id, ...(d.data() as Omit<Placar, "id">) })));
    } catch (e) { const codigo = typeof e === "object" && e !== null && "code" in e ? String((e as { code?: string }).code) : ""; console.error("Falha ao consultar ranking_memoria360:", e); setErro(codigo === "permission-denied" ? "Acesso negado ao ranking. Publique as regras atualizadas no Firebase Firestore." : codigo === "failed-precondition" ? "Consulta do ranking requer configuração de índice no Firestore." : "Não foi possível carregar o ranking. Tente novamente mais tarde."); }
    finally { setCarregando(false); }
  }
  useEffect(() => { void atualizar(); }, []);
  return <main className="min-h-screen bg-slate-50 px-3 py-5 text-slate-900">
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/" className="text-sm font-bold text-cyan-700">← Voltar ao Sobradão 360</Link>
      <header className="rounded-3xl bg-cyan-800 p-6 text-center text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-100">Jogos da comunidade</p>
        <h1 className="mt-2 text-3xl font-black">🏆 Desafio 360</h1>
        <p className="mt-2 text-sm text-cyan-50">Jogue, melhore sua pontuação e conquiste seu lugar no ranking!</p>
      </header>
      <Link href="/jogos/memoria" className="block rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4"><span className="text-5xl">🧠</span><div className="flex-1"><h2 className="text-xl font-black">Memória 360</h2><p className="mt-1 text-sm text-slate-600">Encontre os pares, faça pontos e dispute as primeiras posições.</p><span className="mt-2 inline-block text-sm font-bold text-cyan-700">Jogar agora →</span></div></div>
      </Link>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/jogos/velha" className="block rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm"><span className="text-4xl">⭕</span><h2 className="mt-2 text-lg font-black">Jogo da Velha 360</h2><p className="mt-1 text-xs text-slate-600">5 partidas contra o computador, com ranking de vitórias.</p><span className="mt-2 inline-block text-sm font-bold text-cyan-700">Jogar agora →</span></Link>
        <Link href="/jogos/matematica" className="block rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm"><span className="text-4xl">🔢</span><h2 className="mt-2 text-lg font-black">Matemática 360</h2><p className="mt-1 text-xs text-slate-600">10 contas rápidas: acerte e dispute os primeiros lugares.</p><span className="mt-2 inline-block text-sm font-bold text-cyan-700">Jogar agora →</span></Link>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-black">🥇 Ranking Memória 360</h2><button type="button" onClick={() => void atualizar()} className="text-sm font-bold text-cyan-700">Atualizar</button></div>
        <p className="mb-3 text-xs text-slate-500">Melhores pontuações de cada conta Google</p>
        {carregando ? <p className="text-sm text-slate-500">Carregando classificação...</p> : erro ? <p role="status" className="text-sm text-red-700">{erro}</p> : ranking.length === 0 ? <p className="text-sm text-slate-500">Seja o primeiro a aparecer no ranking!</p> :
          <ol className="divide-y divide-slate-100">{ranking.map((j, i) => <li key={j.id} className="flex items-center gap-3 py-3 text-sm"><span className="w-8 font-black">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1) + "º"}</span><span className="min-w-0 flex-1 truncate font-medium">{j.apelido || "Morador"}</span><strong className="tabular-nums">{j.pontos} pts</strong></li>)}</ol>}
        <Link href="/jogos/memoria" className="mt-4 block rounded-xl bg-cyan-700 p-3 text-center text-sm font-black text-white">Quero subir no ranking!</Link>
      </section>
      <p className="text-center text-xs text-slate-500">Três passatempos, três rankings independentes. Entre com Google para registrar a melhor pontuação.</p>
    </div>
  </main>;
}
