"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Modo = "velha" | "matematica";
type Placar = { uid: string; apelido: string; pontos: number };
type Pergunta = { texto: string; resposta: number };
const nomes = { velha: "Jogo da Velha 360", matematica: "Matemática 360" };
const colecoes = { velha: "ranking_velha360", matematica: "ranking_matematica360" };
function pergunta(): Pergunta {
  const a = 2 + Math.floor(Math.random() * 19);
  const b = 2 + Math.floor(Math.random() * 19);
  const op = Math.floor(Math.random() * 3);
  if (op === 0) return { texto: a + " + " + b + " = ?", resposta: a + b };
  if (op === 1) return { texto: Math.max(a, b) + " − " + Math.min(a, b) + " = ?", resposta: Math.abs(a - b) };
  const x = 2 + Math.floor(Math.random() * 9), y = 2 + Math.floor(Math.random() * 9);
  return { texto: x + " × " + y + " = ?", resposta: x * y };
}
function vencedor(tab: string[]): string | null {
  const linhas = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of linhas) if (tab[a] && tab[a] === tab[b] && tab[b] === tab[c]) return tab[a];
  return tab.every(Boolean) ? "empate" : null;
}
function jogadaComputador(tab: string[]): number {
  for (const simbolo of ["O", "X"]) for (let i = 0; i < 9; i++) {
    if (tab[i]) continue;
    const tentativa = [...tab]; tentativa[i] = simbolo;
    if (vencedor(tentativa) === simbolo) return i;
  }
  if (!tab[4]) return 4;
  const vazias = tab.map((v,i) => v ? -1 : i).filter(i => i >= 0);
  return vazias[Math.floor(Math.random() * vazias.length)];
}
export default function JogoPassatempo({ modo }: { modo: Modo }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cadastro, setCadastro] = useState<{ nome: string } | null>(null);
  const [ranking, setRanking] = useState<Placar[]>([]);
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [cadastrando, setCadastrando] = useState(false);
  const [tabuleiro, setTabuleiro] = useState<string[]>(Array(9).fill(""));
  const [resultado, setResultado] = useState<string | null>(null);
  const [vitorias, setVitorias] = useState(0);
  const [partidas, setPartidas] = useState(0);
  const [perguntaAtual, setPerguntaAtual] = useState<Pergunta>(() => pergunta());
  const [resposta, setResposta] = useState("");
  const [acertos, setAcertos] = useState(0);
  const [rodada, setRodada] = useState(0);
  const [fim, setFim] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const inicio = useRef<number | null>(null);
  const travado = useRef(false);
  const salvo = useRef(false);
  const pontos = modo === "velha" ? vitorias * 100 : Math.max(0, acertos * 100 - segundos * 2);
  useEffect(() => onAuthStateChanged(auth, setUsuario), []);
  useEffect(() => {
    let ativo = true;
    if (!usuario) { setCadastro(null); return; }
    void (async () => {
      try {
        const token = await usuario.getIdToken();
        const r = await fetch("/api/jogos/memoria/cadastro", { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
        const dados = await r.json();
        if (ativo && r.ok) setCadastro(dados.cadastro || null);
      } catch { if (ativo) setMensagem("Não foi possível verificar seu cadastro de jogador."); }
    })();
    return () => { ativo = false; };
  }, [usuario]);
  async function buscarRanking() {
    try {
      const snap = await getDocs(query(collection(db, colecoes[modo]), orderBy("pontos", "desc"), limit(10)));
      setRanking(snap.docs.map(d => ({ uid: d.id, apelido: String(d.data().apelido || "Morador"), pontos: Number(d.data().pontos || 0) })));
    } catch { setMensagem("Ranking ainda indisponível. Confira se as regras do Firebase foram publicadas."); }
  }
  useEffect(() => { void buscarRanking(); }, [modo]);
  useEffect(() => {
    if (modo !== "matematica" || !inicio.current || fim) return;
    const id = setInterval(() => setSegundos(Math.floor((Date.now() - (inicio.current || Date.now())) / 1000)), 500);
    return () => clearInterval(id);
  }, [modo, rodada, fim]);
  async function cadastrar() {
    if (!usuario || cadastrando) return;
    setCadastrando(true); setMensagem("");
    try {
      const token = await usuario.getIdToken();
      const r = await fetch("/api/jogos/memoria/cadastro", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ nome, celular: "55" + celular.replace(/\D/g, "").replace(/^55/, "") }),
      });
      const dados = await r.json();
      if (!r.ok) throw new Error(dados.erro || "Cadastro não realizado");
      setCadastro(dados.cadastro);
      setMensagem("Cadastro concluído!");
    } catch (e) { setMensagem(e instanceof Error ? e.message : "Falha no cadastro."); }
    finally { setCadastrando(false); }
  }
  function jogar(posicao: number) {
    if (modo !== "velha" || tabuleiro[posicao] || resultado || partidas >= 5 || travado.current) return;
    travado.current = true;
    const tab = [...tabuleiro]; tab[posicao] = "X";
    let ganhador = vencedor(tab);
    if (!ganhador) {
      const computador = jogadaComputador(tab);
      tab[computador] = "O";
      ganhador = vencedor(tab);
    }
    setTabuleiro(tab);
    if (ganhador) {
      setResultado(ganhador);
      setPartidas(v => v + 1);
      if (ganhador === "X") setVitorias(v => v + 1);
    }
    travado.current = false;
  }
  function proximaPartida() {
    if (partidas >= 5) return;
    setTabuleiro(Array(9).fill("")); setResultado(null);
  }
  function responder() {
    if (modo !== "matematica" || fim || resposta.trim() === "" || !Number.isFinite(Number(resposta))) return;
    if (!inicio.current) inicio.current = Date.now();
    if (Number(resposta) === perguntaAtual.resposta) setAcertos(v => v + 1);
    setResposta("");
    if (rodada + 1 >= 10) { setSegundos(Math.floor((Date.now() - inicio.current) / 1000)); setFim(true); }
    else { setRodada(v => v + 1); setPerguntaAtual(pergunta()); }
  }
  async function salvar() {
    const concluido = modo === "velha" ? partidas === 5 : fim;
    if (!concluido || !usuario || !cadastro || salvo.current || salvando || pontos <= 0) return;
    setSalvando(true); setMensagem("");
    try {
      const ref = doc(db, colecoes[modo], usuario.uid);
      await runTransaction(db, async tx => {
        const anterior = await tx.get(ref);
        if (!anterior.exists() || Number(anterior.data().pontos || 0) < pontos) {
          tx.set(ref, { apelido: cadastro.nome.slice(0, 24), pontos, atualizadoEm: serverTimestamp() });
        }
      });
      salvo.current = true;
      setMensagem("Melhor pontuação registrada!");
      await buscarRanking();
    } catch { setMensagem("Não foi possível registrar. Faça login e publique as regras dos rankings no Firebase."); }
    finally { setSalvando(false); }
  }
  function reiniciar() {
    travado.current = false; salvo.current = false; inicio.current = null;
    setTabuleiro(Array(9).fill("")); setResultado(null); setVitorias(0); setPartidas(0);
    setPerguntaAtual(pergunta()); setResposta(""); setRodada(0); setAcertos(0); setSegundos(0); setFim(false); setMensagem("");
  }
  const concluido = modo === "velha" ? partidas === 5 : fim;
  return <main className="min-h-screen bg-slate-50 px-3 py-5 text-slate-900">
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/desafio-360" className="text-sm font-bold text-cyan-700">← Voltar ao Desafio 360</Link>
      <header className="rounded-3xl bg-cyan-800 p-6 text-center text-white">
        <h1 className="text-2xl font-black">{modo === "velha" ? "⭕" : "🔢"} {nomes[modo]}</h1>
        <p className="mt-2 text-sm text-cyan-50">{modo === "velha" ? "Jogue 5 partidas contra o computador. Cada vitória vale 100 pontos." : "Resolva 10 contas. Cada acerto vale 100 pontos e o tempo desconta pontos."}</p>
      </header>
      {usuario && !cadastro && <section className="space-y-2 rounded-2xl border bg-white p-4">
        <h2 className="font-bold">Cadastro único para os jogos</h2>
        <p className="text-xs text-slate-500">O mesmo cadastro do jogo da memória. Seu celular não aparece no ranking.</p>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" aria-label="Nome" className="w-full rounded-lg border p-3" />
        <input value={celular} onChange={e => setCelular(e.target.value)} placeholder="Celular com DDD" aria-label="Celular" type="tel" className="w-full rounded-lg border p-3" />
        <button onClick={() => void cadastrar()} disabled={cadastrando} className="w-full rounded-xl bg-cyan-700 p-3 font-bold text-white disabled:opacity-50">{cadastrando ? "Cadastrando..." : "Cadastrar jogador"}</button>
      </section>}
      {cadastro && <p className="text-center text-sm text-slate-600">Jogador: <strong>{cadastro.nome}</strong></p>}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div><p className="text-xs text-slate-500">{modo === "velha" ? "Partidas" : "Perguntas"}</p><strong>{modo === "velha" ? partidas + "/5" : Math.min(rodada + 1, 10) + "/10"}</strong></div>
          <div><p className="text-xs text-slate-500">{modo === "velha" ? "Vitórias" : "Acertos"}</p><strong>{modo === "velha" ? vitorias : acertos}</strong></div>
          <div><p className="text-xs text-slate-500">Pontos</p><strong>{pontos}</strong></div>
        </div>
        {modo === "velha" ? <>
          <p className="mb-3 text-center text-sm font-semibold">{resultado === "X" ? "🎉 Você venceu!" : resultado === "O" ? "O computador venceu esta partida." : resultado === "empate" ? "Empate!" : concluido ? "Fim do desafio" : "Sua vez: X"}</p>
          <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
            {tabuleiro.map((simbolo, i) => <button key={i} onClick={() => jogar(i)} disabled={!!resultado || concluido || !!simbolo} aria-label={"Casa " + (i + 1)} className="aspect-square rounded-xl border-2 border-cyan-200 bg-cyan-50 text-4xl font-black text-cyan-800 disabled:cursor-default">{simbolo}</button>)}
          </div>
          {resultado && !concluido && <button onClick={proximaPartida} className="mt-4 w-full rounded-xl bg-cyan-700 p-3 font-bold text-white">Próxima partida →</button>}
        </> : <>
          <p className="mb-2 text-center text-xs text-slate-500">Tempo: {segundos}s</p>
          <p className="my-5 text-center text-3xl font-black">{fim ? "Desafio concluído!" : perguntaAtual.texto}</p>
          {!fim && <form onSubmit={e => { e.preventDefault(); responder(); }} className="flex gap-2">
            <input type="number" value={resposta} onChange={e => setResposta(e.target.value)} placeholder="Resposta" aria-label="Resposta" className="min-w-0 flex-1 rounded-xl border p-3 text-lg" required />
            <button type="submit" className="rounded-xl bg-cyan-700 px-5 font-bold text-white">Responder</button>
          </form>}
        </>}
        {concluido && <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-center">
          <h2 className="font-black">🏁 Desafio finalizado — {pontos} pontos</h2>
          {usuario && cadastro && pontos > 0 ? <button onClick={() => void salvar()} disabled={salvando || salvo.current} className="mt-3 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-50">{salvo.current ? "Registrado" : salvando ? "Salvando..." : "Registrar no ranking"}</button> : <p className="mt-2 text-xs">{pontos <= 0 ? "Faça pontos para entrar no ranking." : "Entre com Google e cadastre-se para entrar no ranking."}</p>}
        </div>}
        <button onClick={reiniciar} className="mt-4 w-full rounded-xl border border-cyan-700 p-3 text-sm font-bold text-cyan-700">↻ Jogar novamente</button>
      </section>
      {mensagem && <p role="status" className="rounded-xl bg-white p-3 text-center text-sm">{mensagem}</p>}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between"><h2 className="font-black">🏆 Ranking {nomes[modo]}</h2><button onClick={() => void buscarRanking()} className="text-sm font-bold text-cyan-700">Atualizar</button></div>
        <p className="mt-1 text-xs text-slate-500">As 10 maiores pontuações. Cada jogador mantém sua melhor marca.</p>
        {ranking.length === 0 ? <p className="mt-4 text-sm text-slate-500">Ainda não há pontuações registradas.</p> : <ol className="mt-3 divide-y">{ranking.map((j,i) => <li key={j.uid} className="flex gap-3 py-3 text-sm"><strong className="w-8">{i < 3 ? ["🥇","🥈","🥉"][i] : (i+1) + "º"}</strong><span className="flex-1 truncate">{j.apelido}</span><strong>{j.pontos} pts</strong></li>)}</ol>}
      </section>
    </div>
  </main>;
}
