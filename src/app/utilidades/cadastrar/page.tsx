"use client";

type AuthUsuario = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const SERVICOS = [
  "Pedreiro","Pintor","Encanador","Eletricista","Calheiro","Gesseiro","Drywall","Azulejista","Telhadista","Serralheiro","Ferreiro","Marceneiro","Carpinteiro",
  "Jardineiro","Limpeza de quintal","Roçagem","Poda de árvore","Limpeza de terreno","Piscineiro","Dedetização","Limpeza de caixa d'água",
  "Faxineira","Diarista","Limpeza residencial","Limpeza pós-obra","Lavanderia","Passadeira",
  "Motorista particular","Frete","Carreto","Mudança","Motoboy","Transporte escolar",
  "Mecânico","Eletricista automotivo","Borracharia","Guincho","Funilaria e pintura","Lavagem de veículos",
  "Montador de móveis","Conserto de eletrodomésticos","Técnico de geladeira","Técnico de máquina de lavar","Ar-condicionado","Chaveiro",
  "Marmitas","Bolos","Salgados","Doces","Churrasqueiro","Buffet","Gás","Água mineral",
  "Banho e tosa","Cuidador de animais","Passeador de cães","Veterinário",
  "Cabeleireiro","Barbeiro","Manicure","Pedicure","Cuidador de idosos",
  "Manutenção de celular","Manutenção de computador","Instalação de internet/rede","Câmeras de segurança",
  "Fotógrafo","DJ","Decoração","Aluguel de mesas e cadeiras","Som para festas","Outro serviço"
];

export default function CadastrarContatoPage() {
  const [uid, setUid] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [form, setForm] = useState({nome:"",servicos:[] as string[],telefone:"",whatsapp:false,bairro:"",descricao:"",instagram:"",site:""});

  useEffect(() => onAuthStateChanged(auth, (usuario: AuthUsuario | null) => {
    setUid(usuario?.uid || "");
    setNomeUsuario(usuario?.displayName || usuario?.email?.split("@")[0] || "Morador");
    setCarregando(false);
  }), []);

  function atualizar(campo:string, valor:string|boolean) { setForm(atual => ({...atual,[campo]:valor})); }
  function alternarServico(servico:string) {
    setForm(atual => ({...atual, servicos: atual.servicos.includes(servico) ? atual.servicos.filter(item => item !== servico) : [...atual.servicos, servico]}));
  }

  async function enviar(e:import("react").FormEvent) {
    e.preventDefault(); setMensagem("");
    if (!uid) { setMensagem("Você precisa entrar na sua conta para cadastrar um contato."); return; }
    if (!form.nome.trim() || form.servicos.length === 0 || !form.telefone.trim()) { setMensagem("Preencha nome/empresa, marque pelo menos um serviço e informe o telefone."); return; }
    setEnviando(true);
    try {
      const usuario = auth.currentUser;
      if (!usuario) throw new Error("Sessão não encontrada. Entre novamente.");
      const token = await usuario.getIdToken();
      const resposta = await fetch("/api/telefones", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const texto = await resposta.text();
      let resultado: { success?: boolean; error?: string } = {};
      try { resultado = texto ? JSON.parse(texto) : {}; } catch {}
      if (!resposta.ok || !resultado.success) {
        throw new Error(resultado.error || `Erro HTTP ${resposta.status} ao cadastrar.`);
      }
      setForm({nome:"",servicos:[],telefone:"",whatsapp:false,bairro:"",descricao:"",instagram:"",site:""});
      setMensagem("Cadastro enviado! Ele ficará aguardando aprovação antes de aparecer nos Telefones e Serviços.");
    } catch (error) {
      console.error("Erro ao cadastrar contato:",error);
      setMensagem(error instanceof Error ? error.message : "Não foi possível enviar o cadastro. Tente novamente.");
    } finally { setEnviando(false); }
  }

  if (carregando) return <main className="min-h-screen bg-slate-100 p-6 text-center text-sm text-slate-500">Carregando...</main>;

  if (!uid) return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <Link href="/utilidades" className="text-xs font-bold text-slate-600">← Voltar para Telefones e Serviços</Link>
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
      <Link href="/utilidades" className="text-xs font-bold text-slate-600">← Telefones e Serviços</Link>
      <div className="mt-3 rounded-3xl bg-gradient-to-r from-slate-700 to-slate-800 p-5 text-white shadow-md">
        <div className="text-3xl">📞</div><h1 className="mt-1 text-xl font-black">Cadastrar contato ou serviço</h1>
        <p className="mt-1 text-xs leading-5 text-white/80">Ajude a ampliar o diretório da comunidade. Todos os cadastros passam por aprovação.</p>
      </div>
      <form onSubmit={enviar} className="mt-4 space-y-3 rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
        <div><label className="text-[10px] font-black uppercase text-slate-500">Nome ou empresa *</label><input value={form.nome} onChange={e=>atualizar("nome",e.target.value)} placeholder="Ex.: João Reformas" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-400"/></div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500">Quais serviços você oferece? *</label>
          <p className="mt-1 text-[10px] text-slate-500">Marque quantas opções precisar.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SERVICOS.map(servico => <label key={servico} className={`flex items-center gap-2 rounded-xl border p-2.5 text-[11px] font-bold ${form.servicos.includes(servico) ? "border-amber-400 bg-amber-50 text-slate-900" : "border-slate-200 bg-white text-slate-600"}`}><input type="checkbox" checked={form.servicos.includes(servico)} onChange={()=>alternarServico(servico)}/>{servico}</label>)}
          </div>
        </div>
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