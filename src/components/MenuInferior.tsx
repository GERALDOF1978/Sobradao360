"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const extras = [
  { href: "/clima", icone: "🌦️", titulo: "Clima" },
  { href: "/utilidades/upas", icone: "🏥", titulo: "UPAs Agora" },
  { href: "/anuncie", icone: "📣", titulo: "Classificados" },
  { href: "/utilidades/transporte", icone: "🚌", titulo: "Transporte" },
  { href: "/utilidades/coleta-lixo", icone: "🗑️", titulo: "Coleta" },
  { href: "/utilidades/ecopontos", icone: "♻️", titulo: "Ecopontos" },
  { href: "/daae", icone: "💧", titulo: "DAAE" },
  { href: "/lampada-queimada", icone: "💡", titulo: "Iluminação" },
];

export default function MenuInferior() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const ativo = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const ambienteGestao =
    pathname.startsWith("/painel-anunciante") ||
    pathname.startsWith("/admin-master");

  if (ambienteGestao) return null;

  return (
    <>
      {aberto && (
        <div className="fixed inset-0 z-[80] bg-slate-950/25 md:hidden" onClick={() => setAberto(false)}>
          <div className="absolute bottom-[86px] left-1/2 w-[calc(100%-24px)] max-w-sm -translate-x-1/2 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Sobradão 360</p><h2 className="text-base font-black">Mais serviços</h2></div><button onClick={() => setAberto(false)} className="h-8 w-8 rounded-full bg-slate-100 font-black">×</button></div>
            <div className="grid grid-cols-3 gap-2">
              {extras.map(item => <Link key={item.href} href={item.href} onClick={() => setAberto(false)} className="flex min-h-[76px] flex-col items-center justify-center rounded-2xl bg-slate-50 p-2 text-center"><span className="text-2xl">{item.icone}</span><span className="mt-1 text-[10px] font-black text-slate-700">{item.titulo}</span></Link>)}
            </div>
          </div>
        </div>
      )}

      <Link href="/comunidade" className="fixed bottom-[72px] left-3 z-[75] flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-amber-400 bg-emerald-600 text-xl text-white shadow-xl ring-2 ring-white md:hidden" title="Voz da Comunidade" aria-label="Voz da Comunidade">💬</Link>
      <Link href="/loja-explicativa?anunciante=novo" className="fixed bottom-[72px] right-3 z-[75] flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-amber-400 bg-amber-400 text-xl text-blue-950 shadow-xl ring-2 ring-white md:hidden" title="Anuncie no Sobradão 360" aria-label="Anuncie no Sobradão 360">📢</Link>

      <nav className="fixed inset-x-0 bottom-0 z-[70] border-t-[3px] border-amber-400 bg-blue-900 text-white shadow-[0_-5px_18px_rgba(15,23,42,.2)] md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto grid h-[72px] max-w-md grid-cols-5 items-center px-2">
          <Link href="/" className={`flex h-full flex-col items-center justify-center gap-1 text-[9px] font-bold ${ativo("/") ? "text-amber-300" : "text-white/80"}`}><span className="text-xl">🏠</span><span>Início</span></Link>
          <Link href="/noticias" className={`flex h-full flex-col items-center justify-center gap-1 text-[9px] font-bold ${ativo("/noticias") ? "text-amber-300" : "text-white/80"}`}><span className="text-xl">📰</span><span>Notícias</span></Link>
          <div className="relative flex h-full items-end justify-center pb-1">
            <button onClick={() => setAberto(v => !v)} className={`absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-amber-400 text-2xl text-blue-950 shadow-xl transition ${aberto ? "rotate-45" : ""}`} aria-label="Abrir menu">＋</button>
            <span className="text-[9px] font-black text-amber-300">Menu</span>
          </div>
          <Link href="/empregos" className={`flex h-full flex-col items-center justify-center gap-1 text-[9px] font-bold ${ativo("/empregos") ? "text-amber-300" : "text-white/80"}`}><span className="text-xl">💼</span><span>Empregos</span></Link>
          <Link href="/utilidades" className={`flex h-full flex-col items-center justify-center gap-1 text-[9px] font-bold ${ativo("/utilidades") ? "text-amber-300" : "text-white/80"}`}><span className="text-xl">📞</span><span>Utilidades</span></Link>
        </div>
      </nav>
    </>
  );
}
