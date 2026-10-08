"use client";

import { useEffect, useState } from "react";

// Lançamento oficial: 20h de Brasília, 08/10/2026.
const LANCAMENTO = new Date("2026-10-08T20:00:00-03:00").getTime();

export default function AvisoLancamento() {
  const [aberto, setAberto] = useState(false);
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    setAgora(Date.now());
    setAberto(true);
    const intervalo = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(intervalo);
  }, []);

  if (!aberto || agora === null || agora >= LANCAMENTO) return null;

  const restante = Math.max(0, LANCAMENTO - agora);
  const lancado = restante === 0;
  const horas = Math.floor(restante / 3600000);
  const minutos = Math.floor((restante % 3600000) / 60000);
  const segundos = Math.floor((restante % 60000) / 1000);

  async function compartilhar() {
    const url = "https://sobradao360.com.br";
    const texto = "🚀 Sobradão 360! O portal da nossa comunidade. Conheça e compartilhe com os vizinhos!";
    if (navigator.share) {
      try { await navigator.share({ title: "Sobradão 360", text: texto, url }); } catch {}
    } else {
      window.open("https://wa.me/?text=" + encodeURIComponent(texto + " " + url), "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Lançamento Sobradão 360">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-b from-slate-800 to-slate-950 px-5 py-8 text-center text-white shadow-2xl sm:px-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">🚀 Grande lançamento</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight">SOBRADÃO <span className="text-amber-400">360</span></h2>
        <p className="mt-3 text-sm text-slate-200">{lancado ? "🎉 O SOBRADÃO 360 ESTÁ NO AR!" : "Hoje, às 20h, nossa comunidade estará ainda mais conectada!"}</p>
        {!lancado && (
          <div className="mt-6 flex justify-center gap-2" aria-label="Contagem regressiva">
            {[[horas, "HORAS"], [minutos, "MINUTOS"], [segundos, "SEGUNDOS"]].map(([valor, rotulo]) => (
              <div key={rotulo} className="w-24 rounded-xl bg-slate-700/80 px-2 py-3">
                <div className="text-3xl font-black tabular-nums text-amber-400">{String(valor).padStart(2, "0")}</div>
                <div className="mt-1 text-[10px] font-bold tracking-wider text-slate-200">{rotulo}</div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-5 text-xs font-semibold text-slate-300">08 de outubro de 2026 • 20h • Horário de Brasília</p>
        <button type="button" onClick={compartilhar} className="mt-6 w-full rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 hover:bg-amber-300">📲 Compartilhar com os vizinhos</button>
      </div>
    </div>
  );
}
