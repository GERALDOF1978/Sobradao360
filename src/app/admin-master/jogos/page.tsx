"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Torneio = { id: string; titulo: string; premio: string; inicio: string; fim: string; status: string };
type Jogador = { id: string; apelido: string; pontos: number; tempo: number; tentativas: number };

export default function AdminJogos() {
  const [autorizado, setAutorizado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [titulo, setTitulo] = useState("Desafio Memória 360");
  const [premio, setPremio] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [ranking, setRanking] = useState<Record<string, Jogador[]>>({});

  async function carregar() {
    const lista = await getDocs(query(collection(db, "campeonatos_memoria360"), orderBy("criadoEm", "desc")));
    const dados = lista.docs.map((d: { id: string; data: () => Record<string, unknown> }) => ({ id: d.id, ...d.data() } as Torneio));
    setTorneios(dados);
    const tabelas: Record<string, Jogador[]> = {};
    await Promise.all(dados.map(async (t: Torneio) => {
      const snap = await getDocs(query(collection(db, "campeonatos_memoria360", t.id, "ranking"), orderBy("pontos", "desc")));
      tabelas[t.id] = snap.docs.map((d: { id: string; data: () => Record<string, unknown> }) => ({ id: d.id, ...d.data() } as Jogador));
    }));
    setRanking(tabelas);
  }

  useEffect(() => onAuthStateChanged(auth, async (usuario: { uid: string } | null) => {
    if (!usuario) { setAutorizado(false); setCarregando(false); return; }
    try {
      const perfil = await getDoc(doc(db, "usuarios", usuario.uid));
      const ok = perfil.data()?.perfil === "master";
      setAutorizado(ok);
      if (ok) await carregar();
    } catch { setMensagem("Não foi possível verificar o acesso Master."); }
    finally { setCarregando(false); }
  }), []);

  function descreverErro(erro: unknown): string {
    const codigo = typeof erro === "object" && erro !== null && "code" in erro ? String((erro as { code?: unknown }).code) : "";
    if (codigo === "permission-denied") return "Permissão negada pelo Firestore. Confira se seu usuário possui perfil master e se as regras da coleção campeonatos_memoria360 estão publicadas no Firebase.";
    if (codigo === "failed-precondition") return "A consulta exige uma configuração do Firestore. Confira os detalhes no console do navegador.";
    if (codigo === "unavailable") return "O Firestore está temporariamente indisponível. Tente novamente.";
    return codigo ? `Erro do Firebase: ${codigo}. Confira o console do navegador.` : "Não foi possível concluir a operação. Confira o console do navegador.";
  }

  async function criar() {
    if (!titulo.trim() || !premio.trim() || !inicio || !fim) { setMensagem("Preencha título, prêmio e período."); return; }
    const a = new Date(inicio).getTime(), b = new Date(fim).getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a || b <= Date.now()) { setMensagem("Defina um período válido com término no futuro."); return; }
    if (torneios.some(t => t.status === "ativo" && new Date(t.fim).getTime() > Date.now())) { setMensagem("Encerre o campeonato atual antes de iniciar outro."); return; }
    setOcupado(true); setMensagem("");
    try {
      const criado = await addDoc(collection(db, "campeonatos_memoria360"), {
        titulo: titulo.trim().slice(0, 80), premio: premio.trim().slice(0, 300),
        inicio: new Date(a).toISOString(), fim: new Date(b).toISOString(),
        status: "ativo", criadoEm: serverTimestamp(),
      });
      try {
        await carregar();
        setMensagem("Campeonato criado com sucesso. Cada edição terá seu ranking independente.");
      } catch (erroLista) {
        console.error("Campeonato criado, mas falha ao recarregar lista e ranking:", { campeonatoId: criado.id, erro: erroLista });
        setMensagem("Campeonato criado com sucesso, mas não foi possível atualizar a lista. " + descreverErro(erroLista));
      }
    } catch (erroCriacao) {
      console.error("Erro ao criar campeonato Memória 360:", erroCriacao);
      setMensagem("Falha ao criar campeonato. " + descreverErro(erroCriacao));
    } finally { setOcupado(false); }
  }
  async function encerrar(id: string) {
    if (!confirm("Encerrar este campeonato? O ranking será preservado.")) return;
    setOcupado(true);
    try {
      await updateDoc(doc(db, "campeonatos_memoria360", id), { status: "encerrado", encerradoEm: serverTimestamp() });
      await carregar();
    } catch { setMensagem("Não foi possível encerrar."); }
    finally { setOcupado(false); }
  }

  if (carregando) return <main className="p-6">Verificando acesso...</main>;
  if (!autorizado) return <main className="p-6">Acesso exclusivo ao Admin Master.</main>;
  return <main className="mx-auto max-w-3xl space-y-5 bg-slate-50 p-4 text-slate-900">
    <Link href="/admin-master" className="text-sm font-bold text-cyan-700">← Voltar ao Master</Link>
    <h1 className="text-2xl font-black">🏆 Campeonatos Memória 360</h1>
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-bold">Criar novo campeonato</h2>
      <label className="block text-sm">Título<input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={80} className="mt-1 w-full rounded-lg border p-3"/></label>
      <label className="block text-sm">Prêmio<textarea value={premio} onChange={e => setPremio(e.target.value)} maxLength={300} rows={2} className="mt-1 w-full rounded-lg border p-3" placeholder="Ex.: vale-compras de R$ 100"/></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">Começa em<input type="datetime-local" value={inicio} onChange={e => setInicio(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
        <label className="block text-sm">Termina em<input type="datetime-local" value={fim} onChange={e => setFim(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
      </div>
      <button onClick={criar} disabled={ocupado} className="w-full rounded-xl bg-cyan-700 p-3 font-bold text-white disabled:opacity-50">Criar campeonato</button>
      <p className="text-xs text-slate-500">Horários no fuso do dispositivo do administrador. Identidade e pontuação precisam de validação antes de liberar prêmios reais.</p>
    </section>
    {mensagem && <p role="status" className="rounded-lg bg-white p-3 text-sm">{mensagem}</p>}
    {torneios.map(t => <section key={t.id} className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2"><h2 className="font-bold">{t.titulo}</h2><span className="text-xs font-semibold">{t.status}</span></div>
      <p className="mt-1 text-sm">Prêmio: {t.premio}</p>
      <p className="mt-1 text-xs text-slate-500">{new Date(t.inicio).toLocaleString("pt-BR")} até {new Date(t.fim).toLocaleString("pt-BR")}</p>
      <h3 className="mt-4 text-sm font-bold">Classificação</h3>
      {(ranking[t.id] || []).length === 0 ? <p className="mt-2 text-xs text-slate-500">Nenhuma pontuação registrada.</p> : <ol className="mt-2 divide-y">{ranking[t.id].map((j, i) => <li key={j.id} className="flex justify-between gap-2 py-2 text-sm"><span>{i + 1}º {j.apelido}</span><strong>{j.pontos} pontos</strong></li>)}</ol>}
      {t.status === "ativo" && <button disabled={ocupado} onClick={() => encerrar(t.id)} className="mt-3 rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-700">Encerrar campeonato</button>}
    </section>)}
  </main>;
}