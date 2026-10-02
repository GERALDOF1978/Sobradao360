"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Veiculo = { vehicleId?: string; positionTime?: string; lat?: number; lng?: number; percTravelled?: number; heading?: number; startTime?: string; delay?: number; seq?: number; tripId?: string };

const semanaIda = ["05:20","05:50","06:30","07:00","07:40","08:10","08:50","09:20","10:30","11:40","12:55","14:05","15:15","16:25","17:05","17:35","18:15","18:45","19:55","21:00","22:00","23:00"];
const semanaVolta = ["05:50","06:20","07:00","07:30","08:10","08:40","09:50","11:00","12:10","13:25","14:35","15:45","16:25","16:55","17:35","18:05","18:45","19:15","20:25","21:25","22:25","23:25"];
const sabadoIda = ["05:20","06:30","07:40","08:50","11:10","12:20","13:30","15:50","17:00","18:10","19:20","21:40"];
const sabadoVolta = ["05:50","07:00","08:10","10:30","11:40","12:50","15:10","16:20","17:30","18:40","21:00","22:10"];
const domingoIda = ["05:20","07:30","09:40","11:50","14:00","16:10","18:20","20:30","22:40"];
const domingoVolta = ["07:00","09:10","11:20","13:30","15:40","17:50","20:00","22:10"];

function horariosHoje(sentido: "ida" | "volta") {
  const dia = new Date().getDay();
  if (dia === 0) return sentido === "ida" ? domingoIda : domingoVolta;
  if (dia === 6) return sentido === "ida" ? sabadoIda : sabadoVolta;
  return sentido === "ida" ? semanaIda : semanaVolta;
}

export default function TransportePage() {
  const [sentido, setSentido] = useState<"ida" | "volta">("ida");
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function atualizar() {
    try {
      const r = await fetch("/api/transporte/linha-06/vehicles", { cache: "no-store" });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setVeiculos(Array.isArray(d.vehicles) ? d.vehicles : []);
      setErro("");
    } catch {
      setErro("Não foi possível atualizar a posição dos ônibus agora.");
    } finally { setCarregando(false); }
  }

  useEffect(() => {
    atualizar();
    const timer = window.setInterval(atualizar, 20000);
    return () => window.clearInterval(timer);
  }, []);

  const horarios = useMemo(() => horariosHoje(sentido), [sentido]);
  const agora = new Date();
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const proximo = horarios.find((h) => { const [hh, mm] = h.split(":").map(Number); return hh * 60 + mm >= minutosAgora; });

  return (
    <div className="min-h-screen bg-slate-100 pb-16 text-slate-900">
      <header className="bg-gradient-to-r from-sky-700 to-blue-900 text-white shadow">
        <div className="mx-auto max-w-md px-4 py-4">
          <div className="flex items-center justify-between"><Link href="/utilidades" className="text-xs font-bold">← Utilidades</Link><span className="rounded-lg bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950">RIO CLARO</span></div>
          <div className="mt-3"><p className="text-xs font-bold text-sky-100">Transporte Público</p><h1 className="text-2xl font-black">🚌 Linha 06 — Cervezão</h1><p className="mt-1 text-[11px] text-sky-100">Horários e posição dos veículos em circulação.</p></div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-4">
        <section className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-black">Escolha o sentido</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSentido("ida")} className={`rounded-xl px-3 py-3 text-xs font-black ${sentido === "ida" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`}>Regina Picelli → Centro</button>
            <button onClick={() => setSentido("volta")} className={`rounded-xl px-3 py-3 text-xs font-black ${sentido === "volta" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`}>Centro → Regina Picelli</button>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between"><div><p className="text-xs font-black text-emerald-700">● TEMPO REAL</p><h2 className="text-lg font-black">Ônibus em circulação</h2></div><button onClick={atualizar} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold">Atualizar</button></div>
          {carregando ? <p className="mt-3 text-xs text-slate-500">Consultando...</p> : erro ? <p className="mt-3 text-xs text-red-600">{erro}</p> : veiculos.length === 0 ? <p className="mt-3 text-xs text-slate-500">Nenhum veículo localizado neste momento.</p> : (
            <div className="mt-3 space-y-3">{veiculos.map((v, i) => (
              <div key={`${v.vehicleId}-${v.tripId}-${i}`} className="rounded-xl bg-emerald-50 p-3">
                <div className="flex items-center justify-between"><p className="font-black">🚌 Veículo {v.vehicleId || "—"}</p><span className="text-[10px] font-bold">Atualizado {v.positionTime || "—"}</span></div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]"><p>Saída: <b>{v.startTime || "—"}</b></p><p>Progresso: <b>{typeof v.percTravelled === "number" ? `${v.percTravelled}%` : "—"}</b></p></div>
                {typeof v.lat === "number" && typeof v.lng === "number" && <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${v.lat},${v.lng}`} className="mt-3 block rounded-lg bg-emerald-600 px-3 py-2 text-center text-xs font-black text-white">📍 Ver posição no mapa</a>}
              </div>
            ))}</div>
          )}
          <p className="mt-3 text-[9px] leading-4 text-slate-400">Atualização automática a cada 20 segundos. A disponibilidade depende dos dados enviados pelo sistema de transporte.</p>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black text-sky-700">HORÁRIOS DE HOJE</p><h2 className="text-base font-black">{sentido === "ida" ? "Regina Picelli → Centro" : "Centro → Regina Picelli"}</h2></div>{proximo && <div className="rounded-xl bg-amber-100 px-3 py-2 text-center"><p className="text-[9px] font-bold text-amber-800">PRÓXIMA SAÍDA</p><p className="text-lg font-black">{proximo}</p></div>}</div>
          <div className="mt-3 grid grid-cols-4 gap-2">{horarios.map((h) => <div key={h} className={`rounded-lg px-2 py-2 text-center text-xs font-black ${h === proximo ? "bg-amber-400 text-slate-950" : "bg-slate-100"}`}>{h}</div>)}</div>
          {!proximo && <p className="mt-3 rounded-lg bg-slate-100 p-2 text-center text-xs font-bold">Não há mais saídas programadas hoje.</p>}
          <p className="mt-3 text-[9px] text-slate-400">Tabela consultada para a Linha 06, com vigência informada até 27/01/2027.</p>
        </section>

        <section className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <p className="text-xs font-black">ℹ️ Primeira versão</p>
          <p className="mt-1 text-[10px] leading-4 text-slate-600">Estamos validando os sentidos das viagens em tempo real. Por isso os veículos são exibidos como “em circulação”, sem atribuir automaticamente um sentido enquanto essa associação não estiver confirmada.</p>
        </section>
      </main>
    </div>
  );
}
