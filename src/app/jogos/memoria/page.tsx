"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const ICONES = ["💧", "⚽", "🌳", "🏠", "🚲", "🐶", "☀️", "🚗", "🌻", "📚", "🎨", "🍉"];
type Carta = { id: number; simbolo: string };
type Placar = { uid: string; apelido: string; pontos: number; tempo: number; tentativas: number };

function embaralhar<T,>(itens: T[]): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
function novaRodada(): Carta[] {
  return embaralhar(ICONES.slice(0, 8).flatMap((simbolo, i) => [
    { id: i * 2, simbolo }, { id: i * 2 + 1, simbolo },
  ]));
}
function calcularPontos(tentativas: number, segundos: number): number {
  return Math.max(100, 3000 - Math.max(0, tentativas - 8) * 110 - segundos * 12);
}

export default function Memoria360() {
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [viradas, setViradas] = useState<number[]>([]);
  const [pares, setPares] = useState<string[]>([]);
  const [tentativas, setTentativas] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [iniciado, setIniciado] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [ranking, setRanking] = useState<Placar[]>([]);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const bloqueado = useRef(false);
  const timerVirada = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inicio = useRef<number | null>(null);
  const salvo = useRef(false);

  useEffect(() => {
    setCartas(novaRodada());
    const unsubscribe = onAuthStateChanged(auth, setUsuario);
    return () => { unsubscribe(); if (timerVirada.current) clearTimeout(timerVirada.current); };
  }, []);

  async function carregarRanking() {
    try {
      const snap = await getDocs(query(collection(db, "ranking_memoria360"), orderBy("pontos", "desc"), limit(10)));
      setRanking(snap.docs.map(d => ({ uid: d.id, ...(d.data() as Omit<Placar, "uid">) })));
    } catch { setMensagem("Ranking indisponível. O jogo continua funcionando normalmente."); }
  }
  useEffect(() => { void carregarRanking(); }, []);

  useEffect(() => {
    if (!iniciado || finalizado) return;
    const relogio = setInterval(() => setSegundos(Math.floor((Date.now() - (inicio.current || Date.now())) / 1000)), 500);
    return () => clearInterval(relogio);
  }, [iniciado, finalizado]);

  const concluido = pares.length === 8 && iniciado;
  const pontos = calcularPontos(tentativas, segundos);

  useEffect(() => {
    if (!concluido || finalizado) return;
    setFinalizado(true);
  }, [concluido, finalizado]);

  async function salvarPontos() {
    if (!usuario || !finalizado || salvo.current || salvando) return;
    setSalvando(true);
    setMensagem("");
    try {
      const referencia = doc(db, "ranking_memoria360", usuario.uid);
      const apelido = (usuario.displayName || "Morador").trim().slice(0, 24);
      await runTransaction(db, async tx => {
        const anterior = await tx.get(referencia);
        if (!anterior.exists() || Number(anterior.data().pontos || 0) < pontos) {
          tx.set(referencia, { apelido, pontos, tempo: segundos, tentativas, atualizadoEm: serverTimestamp() });
        }
      });
      salvo.current = true;
      setMensagem("Sua melhor pontuação foi registrada!");
      await carregarRanking();
    } catch {
      setMensagem("Não foi possível registrar no ranking. Confira o login e as regras do Firebase.");
    } finally { setSalvando(false); }
  }

  function reiniciar() {
    if (timerVirada.current) clearTimeout(timerVirada.current);
    bloqueado.current = false;
    salvo.current = false;
    inicio.current = null;
    setCartas(novaRodada());
    setViradas([]); setPares([]); setTentativas(0); setSegundos(0);
    setIniciado(false); setFinalizado(false); setMensagem("");
  }

  function virar(carta: Carta) {
    if (bloqueado.current || finalizado || viradas.includes(carta.id) || pares.includes(carta.simbolo)) return;
    if (!iniciado) { inicio.current = Date.now(); setIniciado(true); }
    const proxima = [...viradas, carta.id];
    setViradas(proxima);
    if (proxima.length !== 2) return;
    setTentativas(v => v + 1);
    bloqueado.current = true;
    const outra = cartas.find(c => c.id === proxima[0]);
    if (outra?.simbolo === carta.simbolo) {
      timerVirada.current = setTimeout(() => {
        setPares(v => [...v, carta.simbolo]);
        setViradas([]);
        bloqueado.current = false;
      }, 350);
    } else {
      timerVirada.current = setTimeout(() => { setViradas([]); bloqueado.current = false; }, 850);
    }
  }

  return <main className="min-h-screen bg-slate-50 px-3 py-5 text-slate-900">
    <div className="mx-auto max-w-xl">
      <Link href="/" className="text-xs font-bold text-cyan-700">← Voltar ao Sobradão 360</Link>
      <h1 className="mt-3 text-center text-2xl font-black">🧠 Memória 360</h1>
      <p className="mt-1 text-center text-xs text-slate-500">Encontre os 8 pares no menor tempo e com menos tentativas.</p>
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 text-center shadow-sm">
        <div><p className="text-[10px] text-slate-500">Tempo</p><strong className="text-lg tabular-nums">{segundos}s</strong></div>
        <div><p className="text-[10px] text-slate-500">Tentativas</p><strong className="text-lg tabular-nums">{tentativas}</strong></div>
        <div><p className="text-[10px] text-slate-500">Pontos</p><strong className="text-lg tabular-nums">{pontos}</strong></div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 rounded-2xl bg-cyan-50 p-3" aria-label="Cartas do jogo da memória">
        {cartas.map(carta => {
          const visivel = viradas.includes(carta.id) || pares.includes(carta.simbolo);
          return <button key={carta.id} type="button" onClick={() => virar(carta)}
            aria-label={pares.includes(carta.simbolo) ? "Par encontrado" : visivel ? carta.simbolo : "Virar carta"}
            disabled={finalizado || pares.includes(carta.simbolo)}
            className={"aspect-square rounded-xl border-2 text-3xl shadow-sm transition-transform active:scale-95 sm:text-4xl " + (visivel ? "border-cyan-200 bg-white" : "border-cyan-700 bg-cyan-700 text-white")}>
            {visivel ? carta.simbolo : "?"}
          </button>;
        })}
      </div>
      {finalizado && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <h2 className="text-xl font-black">🎉 Parabéns!</h2>
        <p className="mt-1 text-sm">Você fez {pontos} pontos em {segundos} segundos e {tentativas} tentativas.</p>
        {usuario ? <button type="button" onClick={salvarPontos} disabled={salvando || salvo.current}
          className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          {salvo.current ? "Pontuação registrada" : salvando ? "Salvando..." : "Registrar no ranking"}
        </button> : <p className="mt-3 text-sm">Entre com sua conta do Sobradão 360 para participar do ranking.</p>}
      </div>}
      {mensagem && <p role="status" className="mt-3 text-center text-xs text-slate-600">{mensagem}</p>}
      <button type="button" onClick={reiniciar} className="mt-4 w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-black text-white">↻ Novo jogo</button>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between"><h2 className="font-black">🏆 Ranking geral</h2><button type="button" onClick={() => void carregarRanking()} className="text-xs font-bold text-cyan-700">Atualizar</button></div>
        <p className="mb-3 text-[11px] text-slate-500">Melhor pontuação de cada jogador</p>
        {ranking.length === 0 ? <p className="text-sm text-slate-500">Nenhuma pontuação disponível ainda.</p> :
          <ol className="divide-y divide-slate-100">{ranking.map((j, i) =>
            <li key={j.uid} className="flex items-center gap-2 py-2 text-sm">
              <span className="w-7 font-bold">{i + 1}º</span>
              <span className="min-w-0 flex-1 truncate">{j.apelido}</span>
              <strong>{j.pontos} pts</strong>
            </li>)}</ol>}
      </section>
      <p className="mt-3 text-center text-[11px] text-slate-500">Jogue gratuitamente. Sem apostas ou prêmios em dinheiro.</p>
    </div>
  </main>;
}
