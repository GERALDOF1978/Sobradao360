"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";

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

  function capaNoticia(titulo: string) {
    const t = titulo.toLowerCase();
    if (/futebol|esporte|jogo|campeonato|atleta|time/.test(t)) return { icone: "⚽", categoria: "Esportes", fundo: "from-emerald-700 to-green-950" };
    if (/chuva|tempo|clima|calor|frio|tempestade/.test(t)) return { icone: "🌦️", categoria: "Clima", fundo: "from-sky-600 to-blue-950" };
    if (/saúde|saude|hospital|vacina|dengue|ubs/.test(t)) return { icone: "🏥", categoria: "Saúde", fundo: "from-rose-600 to-red-950" };
    if (/trânsito|transito|acidente|rodovia|rua|avenida|ônibus|onibus/.test(t)) return { icone: "🚦", categoria: "Trânsito", fundo: "from-amber-500 to-orange-800" };
    if (/emprego|vaga|trabalho|processo seletivo/.test(t)) return { icone: "💼", categoria: "Empregos", fundo: "from-indigo-600 to-blue-950" };
    if (/polícia|policia|crime|roubo|furto|prisão|prisao/.test(t)) return { icone: "🚔", categoria: "Segurança", fundo: "from-slate-700 to-slate-950" };
    if (/prefeitura|câmara|camara|vereador|municipal/.test(t)) return { icone: "🏛️", categoria: "Cidade", fundo: "from-blue-700 to-slate-950" };
    return { icone: "📰", categoria: "Rio Claro e Região", fundo: "from-blue-700 to-indigo-950" };
  }

  async function compartilharNoticia(noticia: Noticia) {
    const url = noticia.linkOriginal || window.location.href;
    const dados = {
      title: noticia.titulo,
      text: `${noticia.titulo} — Sobradão 360`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(dados);
        return;
      }

      await navigator.clipboard.writeText(url);
      alert("Link copiado!");
    } catch (erro) {
      if ((erro as DOMException)?.name !== "AbortError") {
        console.error("Erro ao compartilhar:", erro);
      }
    }
  }

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
        <section className="space-y-4">
          {carregando ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">Carregando notícias...</div>
          ) : noticias.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">Nenhuma notícia publicada ainda.</div>
          ) : noticias.map((noticia) => (
            <article key={noticia.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {(() => {
                const capa = capaNoticia(noticia.titulo);
                return (
                  <div className={`relative bg-gradient-to-br ${capa.fundo} px-5 py-5 text-white`}>
                    <div className="absolute right-4 top-3 text-4xl opacity-25">{capa.icone}</div>
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/75">Sobradão 360 • Giro de Notícias</div>
                    <div className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black uppercase">{capa.icone} {capa.categoria}</div>
                    <div className="mt-3 line-clamp-3 max-w-[90%] text-lg font-black leading-snug">{noticia.titulo}</div>
                  </div>
                );
              })()}
              <div className="p-5">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-black text-blue-700">Fonte: {noticia.fonte}</span>
                {noticia.dataPublicacao && (
                  <span className="px-1 py-1 text-slate-500">{new Date(noticia.dataPublicacao).toLocaleString("pt-BR")}</span>
                )}
              </div>
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
              <div className="mt-4 flex items-center gap-3">
                <a
                  href={noticia.linkOriginal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white"
                >
                  🔗 Ler matéria completa na fonte
                </a>

                <button
                  type="button"
                  onClick={() => compartilharNoticia(noticia)}
                  title="Compartilhar"
                  aria-label={`Compartilhar: ${noticia.titulo}`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition hover:bg-black active:scale-95"
                >
                  <Share2 size={18} strokeWidth={2.5} />
                </button>
              </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
