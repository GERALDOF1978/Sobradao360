"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDoc, getDocs, query, orderBy, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "@/lib/firebase";

type Solicitacao = {
  id: string;
  nome?: string;
  servico?: string;
  categoria?: string;
  telefone?: string;
  whatsapp?: boolean;
  bairro?: string;
  descricao?: string;
  instagram?: string;
  site?: string;
  autorNome?: string;
  autorUid?: string;
  status?: string;
  createdAt?: unknown;
};

export default function TelefonesMasterPage() {
  const [autorizado, setAutorizado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [itens, setItens] = useState<Solicitacao[]>([]);
  const [processando, setProcessando] = useState<string | null>(null);

  async function carregar() {
    try {
      const snapshot = await getDocs(
        query(collection(db, "solicitacoes_telefones"), orderBy("createdAt", "desc"))
      );
      setItens(snapshot.docs.map((item: { id: string; data: () => Record<string, unknown> }) => ({ id: item.id, ...(item.data() as Omit<Solicitacao, "id">) })));
    } catch (error) {
      console.error("Erro ao carregar solicitações de telefones:", error);
    }
  }

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) {
        setCarregando(false);
        return;
      }
      try {
        const encontrado = await getDoc(doc(db, "usuarios", usuario.uid));
        if (encontrado.exists() && encontrado.data()?.perfil === "master") {
          setAutorizado(true);
          await carregar();
        }
      } catch (error) {
        console.error("Erro ao verificar Master:", error);
      } finally {
        setCarregando(false);
      }
    });
  }, []);

  async function aprovar(item: Solicitacao) {
    if (!item.telefone || !item.nome || !item.servico) return;
    setProcessando(item.id);
    try {
      await addDoc(collection(db, "telefones"), {
        nome: item.nome,
        servico: item.servico,
        titulo: item.nome,
        categoria: item.categoria || "Serviços",
        telefone: item.telefone,
        whatsapp: item.whatsapp === true,
        isWhatsapp: item.whatsapp === true,
        bairro: item.bairro || "",
        descricao: item.descricao || "",
        instagram: item.instagram || "",
        site: item.site || "",
        autorUid: item.autorUid || "",
        status: "APROVADO",
        origem: "comunidade",
        icone: "📞",
        horario: "—",
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "solicitacoes_telefones", item.id), {
        status: "APROVADO",
        aprovadoEm: serverTimestamp(),
      });
      await carregar();
    } catch (error) {
      console.error("Erro ao aprovar contato:", error);
      alert("Não foi possível aprovar o contato.");
    } finally {
      setProcessando(null);
    }
  }

  async function recusar(item: Solicitacao) {
    setProcessando(item.id);
    try {
      await updateDoc(doc(db, "solicitacoes_telefones", item.id), {
        status: "RECUSADO",
        recusadoEm: serverTimestamp(),
      });
      await carregar();
    } catch (error) {
      console.error("Erro ao recusar contato:", error);
      alert("Não foi possível recusar o contato.");
    } finally {
      setProcessando(null);
    }
  }

  if (carregando) return <main className="min-h-screen bg-slate-100 p-8 text-center text-sm text-slate-500">Carregando...</main>;

  if (!autorizado) return (
    <main className="min-h-screen bg-slate-100 p-8 text-center">
      <p className="font-bold text-slate-700">Acesso restrito ao Master.</p>
      <Link href="/admin-master" className="mt-4 inline-block text-sm font-bold text-indigo-700">← Voltar ao Master</Link>
    </main>
  );

  const pendentes = itens.filter((item) => item.status === "PENDENTE");

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link href="/admin-master" className="text-xs font-bold text-slate-500">← Admin Master</Link>
            <h1 className="mt-1 text-2xl font-black text-slate-900">📞 Contatos e Serviços</h1>
            <p className="mt-1 text-xs text-slate-500">Aprovação dos contatos enviados pela comunidade.</p>
          </div>
          <span className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-800">{pendentes.length} pendente(s)</span>
        </div>

        <div className="mt-5 space-y-3">
          {pendentes.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">Nenhum contato aguardando aprovação.</div>
          ) : pendentes.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-black text-slate-900">{item.nome}</h2>
                  <p className="text-xs font-bold text-amber-700">{item.servico} • {item.categoria}</p>
                  <p className="mt-2 text-sm font-bold text-slate-800">{item.telefone} {item.whatsapp ? "• WhatsApp" : ""}</p>
                  {item.bairro && <p className="text-xs text-slate-500">Bairro: {item.bairro}</p>}
                  {item.descricao && <p className="mt-2 text-xs leading-5 text-slate-600">{item.descricao}</p>}
                  <p className="mt-2 text-[10px] text-slate-400">Enviado por: {item.autorNome || "Morador"}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => aprovar(item)} disabled={processando === item.id} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50">
                    {processando === item.id ? "..." : "✓ Aprovar"}
                  </button>
                  <button onClick={() => recusar(item)} disabled={processando === item.id} className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-50">Recusar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}