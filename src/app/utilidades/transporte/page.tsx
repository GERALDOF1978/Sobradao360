"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Sentido = "centro" | "bairro";
type Veiculo = { vehicleId?: string; positionTime?: string; lat?: number; lng?: number; percTravelled?: number; heading?: number; startTime?: string; delay?: number; seq?: number; tripId?: string; sentido?: Sentido };

const semanaCentro = ["05:20","05:50","06:30","07:00","07:40","08:10","08:50","09:20","10:30","11:40","12:55","14:05","15:15","16:25","17:05","17:35","18:15","18:45","19:55","21:00","22:00","23:00"];
const semanaBairro = ["05:50","06:20","07:00","07:30","08:10","08:40","09:50","11:00","12:10","13:25","14:35","15:45","16:25","16:55","17:35","18:05","18:45","19:15","20:25","21:25","22:25","23:25"];
const sabadoCentro = ["05:20","06:30","07:40","08:50","11:10","12:20","13:30","15:50","17:00","18:10","19:20","21:40"];
const sabadoBairro = ["05:50","07:00","08:10","10:30","11:40","12:50","15:10","16:20","17:30","18:40","21:00","22:10"];
const domingoCentro = ["05:20","07:30","09:40","11:50","14:00","16:10","18:20","20:30","22:40"];
const domingoBairro = ["07:00","09:10","11:20","13:30","15:40","17:50","20:00","22:10"];

function horariosHoje(sentido: Sentido) {
  const dia = new Date().getDay();
  if (dia === 0) return sentido === "centro" ? domingoCentro : domingoBairro;
  if (dia === 6) return sentido === "centro" ? sabadoCentro : sabadoBairro;
  return sentido === "centro" ? semanaCentro : semanaBairro;
}

export default function TransportePage() {
  const [sentido, setSentido] = useState<Sentido>("centro");
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarTodos, setMostrarTodos] = useState(false);

  async function atualizar() {
    try {
      const r = await fetch("/api/transporte/linha-06/vehicles", { cache: "no-store" });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setVeiculos(Array.isArray(d.vehicles) ? d.vehicles : []);
      setErro("");
    } catch {
      setErro("Não foi possível atualizar a posição dos ônibus agora.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    atualizar();
    const timer = window.setInterval(atualizar, 20000);
    return () => window.clearInterval(timer);
  }, []);

  const horarios = useMemo(() => horariosHoje(sentido), [sentido]);
  const minutosAgora = new Date().getHours() * 60 + new Date().getMinutes();
  const proximos = horarios.filter((h) => {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm >= minutosAgora;
  });
  const proximo = proximos[0];
  const veiculosDoSentido = veiculos.filter((v) => v.sentido === sentido);

  return (
    <div className="min-h-screen bg-slate-100 pb-16 text-slate-900">
      <header className="bg-gradient-to-r from-sky-700 to-blue-900 text-white shadow">
        <div className="mx-auto max-w-md px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/utilidades" className="text-xs font-bold">← Utilidades</Link>
            <span className="rounded-lg bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950">RIO CLARO</span>
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-sky-100">Transporte Público</p>
            <h1 className="text-2xl font-black">🚌 Linha 06 — Cervezão</h1>
            <p className="mt-1 text-[11px] text-sky-100">Escolha para onde você vai.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-4">
        <section className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-black">Para onde você vai?</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setSentido("centro"); setMostrarTodos(false); }} className={`rounded-xl px-3 py-3 text-xs font-black ${sentido === "centro" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`}>🏙️ Para o Centro</button>
            <button onClick={() => { setSentido("bairro"); setMostrarTodos(false); }} className={`rounded-xl px-3 py-3 text-xs font-black ${sentido === "bairro" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`}>🏠 Para Cervezão / Regina Picelli</button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-black text-sky-700">PRÓXIMA SAÍDA</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black">{sentido === "centro" ? "Para o Centro" : "Para Cervezão / Regina Picelli"}</h2>
              <p className="mt-1 text-[10px] text-slate-500">Horários programados para hoje</p>
            </div>
            <div className="min-w-24 rounded-2xl bg-amber-400 px-4 py-3 text-center">
              <p className="text-[9px] font-black">PRÓXIMO</p>
              <p className="text-2xl font-black">{proximo || "—"}</p>
            </div>
          </div>

          {proximos.length > 1 && (
            <div className="mt-3">
              <p className="mb-2 text-[10px] font-bold text-slate-500">Depois:</p>
              <div className="flex flex-wrap gap-2">{proximos.slice(1, 4).map((h) => <span key={h} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black">{h}</span>)}</div>
            </div>
          )}

          <button onClick={() => setMostrarTodos((v) => !v)} className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">
            {mostrarTodos ? "Ocultar horários" : "Ver todos os horários"}
          </button>

          {mostrarTodos && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {horarios.map((h) => <div key={h} className={`rounded-lg px-2 py-2 text-center text-xs font-black ${h === proximo ? "bg-amber-400 text-slate-950" : "bg-slate-100"}`}>{h}</div>)}
            </div>
          )}
          <p className="mt-3 text-[9px] text-slate-400">Tabela da Linha 06 com vigência informada até 27/01/2027.</p>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-emerald-700">● TEMPO REAL</p>
              <h2 className="text-lg font-black">Ônibus {sentido === "centro" ? "para o Centro" : "para Cervezão / Regina Picelli"}</h2>
            </div>
            <button onClick={atualizar} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold">Atualizar</button>
          </div>

          {carregando ? <p className="mt-3 text-xs text-slate-500">Consultando...</p> :
            erro ? <p className="mt-3 text-xs text-red-600">{erro}</p> :
            veiculosDoSentido.length === 0 ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Nenhum ônibus deste sentido foi localizado neste momento.</p> :
            <div className="mt-3 space-y-3">{veiculosDoSentido.map((v, i) => (
              <div key={`${v.vehicleId}-${v.tripId}-${i}`} className="rounded-xl bg-emerald-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-black">🚌 Veículo {v.vehicleId || "—"}</p>
                  <span className="text-[10px] font-bold">Atualizado {v.positionTime || "—"}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <p>Saída: <b>{v.startTime || "—"}</b></p>
                  <p>Progresso: <b>{typeof v.percTravelled === "number" ? `${v.percTravelled}%` : "—"}</b></p>
                </div>
                {typeof v.lat === "number" && typeof v.lng === "number" && <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${v.lat},${v.lng}`} className="mt-3 block rounded-lg bg-emerald-600 px-3 py-2 text-center text-xs font-black text-white">📍 Ver posição no mapa</a>}
              </div>
            ))}</div>
          }
          <p className="mt-3 text-[9px] leading-4 text-slate-400">Posição atualizada automaticamente a cada 20 segundos.</p>
        </section>
      </main>
    </div>
  );
}
