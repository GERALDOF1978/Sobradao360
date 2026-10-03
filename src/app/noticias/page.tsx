"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Noticia = {
  id: string;
  titulo: string;
  resumo: string;
  fonte: string;
  linkOriginal: string;
  dataPublicacao?: string | null;
};

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [expandidas, setExpandidas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/noticias", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setNoticias(Array.isArray(d.noticias) ? d.noticias : []))
      .catch(() => setNoticias([]))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-bold text-blue-700 hover:underline">
          ← Voltar para o Sobradão 360
        </Link>

        <section className="mt-4 rounded-3xl bg-white p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wider text-blue-600">Sobradão 360</div>
          <h1 className="mt-1 text-3xl font-black text-slate-900">📰 Giro de Notícias</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Resumos de notícias de Rio Claro e região, sempre com a fonte e o acesso à matéria original.
          </p>
        </section>

        <section className="mt-5 space-y-4">
          {carregando ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">Carregando notícias...</div>
          ) : noticias.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">Nenhuma notícia publicada ainda.</div>
          ) : noticias.map((noticia) => (
            <article key={noticia.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-black text-blue-700">Fonte: {noticia.fonte}</span>
                {noticia.dataPublicacao && (
                  <span className="px-1 py-1 text-slate-500">{new Date(noticia.dataPublicacao).toLocaleString("pt-BR")}</span>
                )}
              </div>
              <h2 className="mt-3 text-xl font-black leading-snug text-slate-900">{noticia.titulo}</h2>
              <p className={`mt-3 text-sm leading-relaxed text-slate-700 ${expandidas[noticia.id] ? "" : "line-clamp-3"}`}>
                {noticia.resumo}
              </p>
              <button
                type="button"
                onClick={() => setExpandidas((atuais) => ({ ...atuais, [noticia.id]: !atuais[noticia.id] }))}
                className="mt-2 text-xs font-black text-blue-700 hover:underline"
              >
                {expandidas[noticia.id] ? "▲ Mostrar menos" : "▼ Continuar lendo"}
              </button>
              <a
                href={noticia.linkOriginal}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white"
              >
                🔗 Ler matéria completa na fonte
              </a>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
