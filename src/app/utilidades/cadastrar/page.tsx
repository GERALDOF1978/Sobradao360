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

const CATEGORIAS = ["Serviços","Comércio","Alimentação","Construção e Reformas","Automotivo","Saúde e Bem-estar","Pet","Beleza","Educação","Tecnologia","Eventos","Profissional","Outros"];

export default function CadastrarContatoPage() {
  const [uid, setUid] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [form, setForm] = useState({nome:"",servico:"",categoria:"Serviços",telefone:"",whatsapp:false,bairro:"",descricao:"",instagram:"",site:""});

  useEffect(() => onAuthStateChanged(auth, (usuario: AuthUsuario | null) => {
    setUid(usuario?.uid || "");
    setNomeUsuario(usuario?.displayName || usuario?.email?.split("@")[0] || "Morador");
    setCarregando(false);
  }), []);

  function atualizar(campo:string, valor:string|boolean) { setForm(atual => ({...atual,[campo]:valor})); }

  async function enviar(e:import("react").FormEvent) {
    e.preventDefault(); setMensagem("");
    if (!uid) { setMensagem("Você precisa entrar na sua conta para cadastrar um contato."); return; }
    if (!form.nome.trim() || !form.servico.trim() || !form.telefone.trim()) { setMensagem("Preencha nome/empresa, serviço e telefone."); return; }
    setEnviando(true);
    try {
      await addDoc(collection(db,"solicitacoes_telefones"), {
        nome:form.nome.trim(), servico:form.servico.trim(), categoria:form.categoria,
        telefone:form.telefone.trim(), whatsapp:form.whatsapp, bairro:form.bairro.trim(),
        descricao:form.descricao.trim(), instagram:form.instagram.trim(), site:form.site.trim(),
        autorUid:uid, autorNome:nomeUsuario, status:"PENDENTE", createdAt:serverTimestamp()
      });
      setForm({nome:"",servico:"",categoria:"Serviços",telefone:"",whatsapp:false,bairro:"",descricao:"",instagram:"",site:""});
      setMensagem("Cadastro enviado! Ele ficará aguardando aprovação antes de aparecer nos Telefones Úteis.");
    } catch (error) {
      console.error("Erro ao cadastrar contato:",error);
      setMensagem("Não foi possível enviar o cadastro. Tente novamente.");
    } finally { setEnviando(false); }
  }

  if (carregando) return <main className="min-h-screen bg-slate-100 p-6 text-center text-sm text-slate-500">Carregando...</main>;

  if (!uid) return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <Link href="/utilidades" className="text-xs font-bold text-slate-600">← Voltar para Telefones Úteis</Link>
        <div className="mt-6 text-center"><div className="text-4xl">📞</div>
          <h1 className="mt-2 text-xl font-black text-slate-900">Cadastrar contato ou serviço</h1>
          <p className="mt-2 text-xs leading-5 text-slate-500">Entre na sua conta para enviar um contato. O cadastro será analisado antes da publicação.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-xl bg-amber-500 px-5 py-3 text-xs font-black text-white">Entrar na conta</Link>
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 pb-12"><div className="mx-auto max-w-md">
      <Link href="/utilidades" className="text-xs font-bold text-slate-600">← Telefones Úteis</Link>
      <div className="mt-3 rounded-3xl bg-gradient-to-r from-slate-700 to-slate-800 p-5 text-white shadow-md">
        <div className="text-3xl">📞</div><h1 className="mt-1 text-xl font-black">Cadastrar contato ou serviço</h1>
        <p className="mt-1 text-xs leading-5 text-white/80">Ajude a ampliar o diretório da comunidade. Todos os cadastros passam por aprovação.</p>
      </div>
      <form onSubmit={enviar} className="mt-4 space-y-3 rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
        <div><label className="text-[10px] font-black uppercase text-slate-500">Nome ou empresa *</label><input value={form.nome} onChange={e=>atualizar("nome",e.target.value)} placeholder="Ex.: João Reformas" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400"/></div>
        <div><label className="text-[10px] font-black uppercase text-slate-500">Serviço oferecido *</label><input value={form.servico} onChange={e=>atualizar("servico",e.target.value)} placeholder="Ex.: Pedreiro, eletricista, bolos..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400"/></div>
        <div><label className="text-[10px] font-black uppercase text-slate-500">Categoria</label><select value={form.categoria} onChange={e=>atualizar("categoria",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">{CATEGORIAS.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label className="text-[10px] font-black uppercase text-slate-500">Telefone *</label><input type="tel" value={form.telefone} onChange={e=>atualizar("telefone",e.target.value)} placeholder="(19) 99999-9999" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400"/></div>
        <label className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-900"><input type="checkbox" checked={form.whatsapp} onChange={e=>atualizar("whatsapp",e.target.checked)}/>Este número também atende pelo WhatsApp</label>
        <div><label className="text-[10px] font-black uppercase text-slate-500">Bairro</label><input value={form.bairro} onChange={e=>atualizar("bairro",e.target.value)} placeholder="Ex.: Sobradão" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400"/></div>
        <div><label className="text-[10px] font-black uppercase text-slate-500">Descrição</label><textarea value={form.descricao} onChange={e=>atualizar("descricao",e.target.value)} rows={3} placeholder="Conte brevemente o que você oferece." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400"/></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><input value={form.instagram} onChange={e=>atualizar("instagram",e.target.value)} placeholder="Instagram (opcional)" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-xs"/><input value={form.site} onChange={e=>atualizar("site",e.target.value)} placeholder="Site (opcional)" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-xs"/></div>
        {mensagem && <div className="rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">{mensagem}</div>}
        <button disabled={enviando} className="w-full rounded-xl bg-amber-500 px-4 py-3 text-xs font-black text-white shadow-sm hover:bg-amber-600 disabled:opacity-60">{enviando?"Enviando...":"Enviar para aprovação"}</button>
      </form>
    </div></main>
  );
}