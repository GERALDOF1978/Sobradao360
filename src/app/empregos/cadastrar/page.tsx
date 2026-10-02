"use client";

type AuthUsuario = { uid: string; email: string | null; displayName: string | null; };

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
  const [temArte, setTemArte] = useState<boolean | null>(null);
  const [imagem, setImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState("");
  const [form, setForm] = useState({
    nome: "", telefone: "", observacao: "", titulo: "", empresa: "", cidade: "Rio Claro",
    bairro: "", salario: "", tipoContrato: "", turno: "", formatoTrabalho: "",
    escolaridade: "", experiencia: "", quantidadeVagas: "1", prazo: "", descricao: "",
  });

  useEffect(() => onAuthStateChanged(auth, (u: AuthUsuario | null) => {
    setUid(u?.uid || null); setCarregando(false);
  }), []);

  function alterar(campo: keyof typeof form, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function selecionarImagem(arquivo: File | null) {
    setImagem(arquivo);
    if (previewImagem) URL.revokeObjectURL(previewImagem);
    setPreviewImagem(arquivo ? URL.createObjectURL(arquivo) : "");
  }

  async function enviarImagem(): Promise<string> {
    if (!imagem) return "";
    const dados = new FormData(); dados.append("file", imagem);
    const resposta = await fetch("/api/upload-image", { method: "POST", body: dados });
    const texto = await resposta.text();
    let resultado: { success?: boolean; url?: string; error?: string } = {};
    try { resultado = texto ? JSON.parse(texto) : {}; } catch {}
    if (!resposta.ok || !resultado.success || !resultado.url) throw new Error(resultado.error || "Não foi possível enviar a arte da vaga.");
    return resultado.url;
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setMensagem("");
    if (!uid) return setMensagem("Entre na sua conta para cadastrar uma vaga.");
    if (temArte === null) return setMensagem("Informe se você já tem uma arte da vaga.");
    if (!form.nome.trim() || !form.telefone.trim()) return setMensagem("Informe seu nome e telefone.");
    if (temArte && !imagem) return setMensagem("Selecione a arte da vaga.");
    if (!temArte && (!form.titulo.trim() || !form.descricao.trim())) return setMensagem("Informe o título e a descrição da vaga.");

    setSalvando(true);
    try {
      const imagemUrl = temArte ? await enviarImagem() : "";
      await addDoc(collection(db, "anuncios"), {
        titulo: temArte ? (form.observacao.trim() || "Vaga de emprego") : form.titulo.trim(),
        empresa: temArte ? "" : form.empresa.trim(),
        cidade: temArte ? "Rio Claro" : form.cidade.trim(),
        bairro: temArte ? "" : form.bairro.trim(),
        salario: temArte ? "" : form.salario.trim(),
        tipoContrato: temArte ? "" : form.tipoContrato.trim(),
        turno: temArte ? "" : form.turno.trim(),
        formatoTrabalho: temArte ? "" : form.formatoTrabalho.trim(),
        escolaridade: temArte ? "" : form.escolaridade.trim(),
        experiencia: temArte ? "" : form.experiencia.trim(),
        quantidadeVagas: temArte ? "" : form.quantidadeVagas,
        prazo: temArte ? "" : form.prazo.trim(),
        descricao: temArte ? form.observacao.trim() : form.descricao.trim(),
        contato: form.telefone.trim(),
        nomeContato: form.nome.trim(),
        observacao: form.observacao.trim(),
        temArte,
        categoria: "Empregos", subCategoria: "Vagas de emprego", tipo: "vaga",
        tipoPublicacao: "vaga", origem: "manual", autorUid: uid,
        autorNome: form.nome.trim(), imagemUrl: imagemUrl || null, createdAt: serverTimestamp(),
      });
      setMensagem("Vaga cadastrada com sucesso!");
      selecionarImagem(null); setTemArte(null);
      setForm({ nome:"", telefone:"", observacao:"", titulo:"", empresa:"", cidade:"Rio Claro", bairro:"", salario:"", tipoContrato:"", turno:"", formatoTrabalho:"", escolaridade:"", experiencia:"", quantidadeVagas:"1", prazo:"", descricao:"" });
    } catch (error) {
      console.error("Erro ao cadastrar vaga:", error);
      setMensagem("Não foi possível cadastrar a vaga.");
    } finally { setSalvando(false); }
  }

  if (carregando) return <main className="min-h-screen bg-slate-100 p-8 text-center text-sm">Carregando...</main>;
  if (!uid) return <main className="min-h-screen bg-slate-100 p-5"><div className="mx-auto mt-10 max-w-md rounded-3xl bg-white p-7 text-center shadow-sm"><div className="text-4xl">🔐</div><h1 className="mt-3 text-xl font-black">Entre para cadastrar uma vaga</h1><p className="mt-2 text-sm text-slate-500">Faça login para publicar uma oportunidade no Sobradão 360.</p><Link href="/login" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white">Entrar</Link></div></main>;

  const campos: Array<[keyof typeof form, string]> = [
    ["empresa","Empresa / anunciante"],["cidade","Cidade"],["bairro","Bairro"],["salario","Salário / faixa salarial"],
    ["tipoContrato","Tipo de contrato"],["turno","Turno / horário"],["formatoTrabalho","Presencial / híbrido / remoto"],
    ["escolaridade","Escolaridade"],["experiencia","Experiência exigida"],["quantidadeVagas","Quantidade de vagas"],["prazo","Prazo para candidatura"],
  ];

  return <main className="min-h-screen bg-slate-100 px-4 py-5 pb-16"><div className="mx-auto max-w-2xl">
    <Link href="/empregos" className="text-xs font-bold text-indigo-700">← Voltar para Empregos</Link>
    <section className="mt-4 rounded-3xl bg-gradient-to-r from-indigo-700 to-blue-700 p-6 text-white shadow-lg"><div className="text-3xl">💼</div><h1 className="mt-1 text-2xl font-black">Cadastrar vaga</h1><p className="mt-1 text-xs text-white/85">Publique uma oportunidade para moradores de Rio Claro.</p></section>

    <form onSubmit={salvar} className="mt-4 space-y-4 rounded-3xl bg-white p-5 shadow-sm">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        <p className="text-sm font-black text-slate-900">Você já tem uma arte pronta da vaga?</p>
        <p className="mt-1 text-[11px] text-slate-500">Se tiver, basta enviar a imagem e informar seus dados de contato.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={()=>setTemArte(true)} className={`rounded-xl px-4 py-3 text-xs font-black ${temArte===true?"bg-indigo-600 text-white":"bg-white border border-slate-200 text-slate-700"}`}>✓ Sim, tenho arte</button>
          <button type="button" onClick={()=>{setTemArte(false);selecionarImagem(null);}} className={`rounded-xl px-4 py-3 text-xs font-black ${temArte===false?"bg-indigo-600 text-white":"bg-white border border-slate-200 text-slate-700"}`}>Não tenho arte</button>
        </div>
      </div>

      {temArte !== null && <>
        {temArte && <div className="rounded-2xl border border-dashed border-indigo-200 p-4"><label className="text-xs font-black text-slate-700">Arte da vaga *</label><input type="file" accept="image/*" onChange={e=>selecionarImagem(e.target.files?.[0]||null)} className="mt-3 block w-full text-xs"/>{previewImagem&&<div className="mt-3 overflow-hidden rounded-2xl border"><img src={previewImagem} alt="Prévia da vaga" className="max-h-[520px] w-full object-contain"/><button type="button" onClick={()=>selecionarImagem(null)} className="w-full border-t p-2 text-xs font-bold text-red-600">Remover imagem</button></div>}</div>}

        <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-black uppercase text-slate-500">Dados de quem está publicando</p>
          <div><label className="text-xs font-black text-slate-700">Nome *</label><input value={form.nome} onChange={e=>alterar("nome",e.target.value)} placeholder="Seu nome ou responsável pela vaga" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></div>
          <div><label className="text-xs font-black text-slate-700">Telefone / WhatsApp *</label><input type="tel" value={form.telefone} onChange={e=>alterar("telefone",e.target.value)} placeholder="(19) 99999-9999" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></div>
          <div><label className="text-xs font-black text-slate-700">Observação</label><textarea value={form.observacao} onChange={e=>alterar("observacao",e.target.value)} rows={3} placeholder="Ex.: Chamar no WhatsApp / entregar currículo..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></div>
        </div>

        {!temArte && <div className="space-y-4 border-t pt-4">
          <div><label className="text-xs font-black text-slate-700">Título da vaga *</label><input value={form.titulo} onChange={e=>alterar("titulo",e.target.value)} placeholder="Ex.: Auxiliar de produção" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></div>
          <div className="grid gap-3 sm:grid-cols-2">{campos.map(([campo,label])=><div key={campo}><label className="text-xs font-black text-slate-700">{label}</label><input value={form[campo]} onChange={e=>alterar(campo,e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></div>)}</div>
          <div><label className="text-xs font-black text-slate-700">Descrição da vaga *</label><textarea value={form.descricao} onChange={e=>alterar("descricao",e.target.value)} rows={6} placeholder="Atividades, requisitos e informações importantes..." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"/></div>
        </div>}

        {mensagem&&<div className="rounded-xl bg-slate-100 p-3 text-center text-xs font-bold text-slate-700">{mensagem}</div>}
        <button type="submit" disabled={salvando} className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{salvando?"Publicando...":"📢 Publicar vaga"}</button>
      </>}
    </form>
  </div></main>;
}
