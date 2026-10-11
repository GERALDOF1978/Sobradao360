"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Noticia = { id: number; titulo: string; data: string; resumo: string; conteudo: string; url: string };

function textoSeguro(html: string) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#039;|&#8217;/g, "'")
      .replace(/(?:\s*\n\s*){2,}/g, "\n\n")
    .replace(/&#8211;|&#8212;/g, "–")
    .trim();
}

export default function MateriaDaaePage() {
  const params = useParams();
  const id = String(params.id || "");
  const [noticia, setNoticia] = useState<Noticia | null>(null);
  const [status, setStatus] = useState("carregando");

  useEffect(() => {
    let ativo = true;
    if (!/^[1-9]\d*$/.test(id)) { setStatus("erro"); return; }
    async function carregar() {
      try {
        const resposta = await fetch("/api/noticias-daae?id=" + encodeURIComponent(id));
        if (!resposta.ok) throw new Error("Falha");
        const dados = await resposta.json();
        if (!dados.noticia) throw new Error("Matéria não encontrada");
        if (ativo) { setNoticia(dados.noticia); setStatus("ok"); }
      } catch { if (ativo) setStatus("erro"); }
    }
    carregar();
    return () => { ativo = false; };
  }, [id]);

  return <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-900">
    <div className="mx-auto max-w-3xl">
      <nav className="mb-4 flex gap-3 text-xs font-bold text-cyan-700">
        <Link href="/daae">← DAAE</Link>
        <Link href="/utilidades/daae/noticias">Todas as notícias</Link>
      </nav>
      {status === "carregando" && <p className="text-sm text-slate-500">Carregando matéria...</p>}
      {status === "erro" && <p className="text-sm text-slate-600">Esta matéria está indisponível no momento.</p>}
      {noticia && <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-2 text-xs font-bold text-cyan-700">💧 DAAE Rio Claro · Comunicado oficial</p>
        <h1 className="text-xl font-black leading-tight">{noticia.titulo}</h1>
        <p className="mt-2 text-xs text-slate-500">{noticia.data ? new Date(noticia.data).toLocaleDateString("pt-BR") : ""}</p>
        <div className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">
          {textoSeguro(noticia.conteudo) || noticia.resumo || "O conteúdo completo não foi disponibilizado pela fonte."}
        </div>
        <p className="mt-6 border-t pt-3 text-xs text-slate-500">Fonte: Departamento Autônomo de Água e Esgoto de Rio Claro (DAAE).</p>
      </article>}
    </div>
  </main>;
}
