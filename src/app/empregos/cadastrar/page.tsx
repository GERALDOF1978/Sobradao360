"use client";

type AuthUsuario = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

import { useEffect, useState } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

export default function CadastrarVagaPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [form, setForm] = useState({
    titulo: "", empresa: "", cidade: "Rio Claro", bairro: "", salario: "",
    tipoContrato: "", turno: "", formatoTrabalho: "", escolaridade: "",
    experiencia: "", quantidadeVagas: "1", prazo: "", contato: "", descricao: "",
  });

  useEffect(() => onAuthStateChanged(auth, (u: AuthUsuario | null) => {
    setUid(u?.uid || null);
    setCarregando(false);
  }), []);

  function alterar(campo: keyof typeof form, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("");
    if (!uid) return setMensagem("Entre na sua conta para cadastrar uma vaga.");
    if (!form.titulo.trim() || !form.descricao.trim()) {
      return setMensagem("Informe o título e a descrição da vaga.");
    }
    setSalvando(true);
    try {
      await addDoc(collection(db, "anuncios"), {
        ...form,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        categoria: "Empregos",
        subCategoria: "Vagas de emprego",
        tipo: "vaga",
        tipoPublicacao: "vaga",
        origem: "manual",
        autorUid: uid,
        autorNome: auth.currentUser?.displayName || "Usuário",
        createdAt: serverTimestamp(),
      });
      setMensagem("Vaga cadastrada com sucesso!");
      setForm({
        titulo: "", empresa: "", cidade: "Rio Claro", bairro: "", salario: "",
        tipoContrato: "", turno: "", formatoTrabalho: "", escolaridade: "",
        experiencia: "", quantidadeVagas: "1", prazo: "", contato: "", descricao: "",
      });
    } catch (error) {
      console.error("Erro ao cadastrar vaga:", error);
      setMensagem("Não foi possível cadastrar a vaga.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <main className="min-h-screen bg-slate-100 p-8 text-center text-sm">Carregando...</main>;

  if (!uid) {
    return (
      <main className="min-h-screen bg-slate-100 p-5">
        <div className="mx-auto mt-10 max-w-md rounded-3xl bg-white p-7 text-center shadow-sm">
          <div className="text-4xl">🔐</div>
          <h1 className="mt-3 text-xl font-black">Entre para cadastrar uma vaga</h1>
          <p className="mt-2 text-sm text-slate-500">Faça login para publicar uma oportunidade no Sobradão 360.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white">Entrar</Link>
        </div>
      </main>
    );
  }

  const campos: Array<[keyof typeof form, string]> = [
    ["empresa", "Empresa / anunciante"], ["cidade", "Cidade"], ["bairro", "Bairro"],
    ["salario", "Salário / faixa salarial"], ["tipoContrato", "Tipo de contrato"],
    ["turno", "Turno / horário"], ["formatoTrabalho", "Presencial / híbrido / remoto"],
    ["escolaridade", "Escolaridade"], ["experiencia", "Experiência exigida"],
    ["quantidadeVagas", "Quantidade de vagas"], ["prazo", "Prazo para candidatura"],
    ["contato", "Contato para candidatura"],
  ];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 pb-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/empregos" className="text-xs font-bold text-indigo-700 hover:underline">← Voltar para Empregos</Link>
        <section className="mt-4 rounded-3xl bg-gradient-to-r from-indigo-700 to-blue-700 p-6 text-white shadow-lg">
          <div className="text-3xl">💼</div>
          <h1 className="mt-1 text-2xl font-black">Cadastrar vaga</h1>
          <p className="mt-1 text-xs text-white/85">Publique uma oportunidade para moradores de Rio Claro.</p>
        </section>

        <form onSubmit={salvar} className="mt-4 space-y-4 rounded-3xl bg-white p-5 shadow-sm">
          <div>
            <label className="text-xs font-black text-slate-700">Título da vaga *</label>
            <input value={form.titulo} onChange={(e) => alterar("titulo", e.target.value)} required placeholder="Ex.: Auxiliar de produção" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {campos.map(([campo, label]) => (
              <div key={campo}>
                <label className="text-xs font-black text-slate-700">{label}</label>
                <input value={form[campo]} onChange={(e) => alterar(campo, e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs font-black text-slate-700">Descrição da vaga *</label>
            <textarea value={form.descricao} onChange={(e) => alterar("descricao", e.target.value)} required rows={7} placeholder="Atividades, requisitos e informações importantes..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {mensagem && <div className="rounded-xl bg-slate-100 p-3 text-center text-xs font-bold text-slate-700">{mensagem}</div>}
          <button type="submit" disabled={salvando} className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-60">
            {salvando ? "Publicando..." : "📢 Publicar vaga"}
          </button>
        </form>
      </div>
    </main>
  );
}
