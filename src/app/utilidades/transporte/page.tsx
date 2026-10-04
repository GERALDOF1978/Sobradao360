"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Veiculo = {
  vehicleId?: string;
  positionTime?: string;
  lat?: number;
  lng?: number;
  percTravelled?: number;
  heading?: number;
  startTime?: string;
  delay?: number;
  seq?: number;
  tripId?: string;
};

type Localizacao = { lat: number; lng: number; accuracy?: number };

const semanaCentro = ["05:20","05:50","06:30","07:00","07:40","08:10","08:50","09:20","10:30","11:40","12:55","14:05","15:15","16:25","17:05","17:35","18:15","18:45","19:55","21:00","22:00","23:00"];
const semanaBairro = ["05:50","06:20","07:00","07:30","08:10","08:40","09:50","11:00","12:10","13:25","14:35","15:45","16:25","16:55","17:35","18:05","18:45","19:15","20:25","21:25","22:25","23:25"];
const sabadoCentro = ["05:20","06:30","07:40","08:50","11:10","12:20","13:30","15:50","17:00","18:10","19:20","21:40"];
const sabadoBairro = ["05:50","07:00","08:10","10:30","11:40","12:50","15:10","16:20","17:30","18:40","21:00","22:10"];
const domingoCentro = ["05:20","07:30","09:40","11:50","14:00","16:10","18:20","20:30","22:40"];
const domingoBairro = ["07:00","09:10","11:20","13:30","15:40","17:50","20:00","22:10"];

function horariosHoje(tipo: "centro" | "bairro") {
  const dia = new Date().getDay();
  if (dia === 0) return tipo === "centro" ? domingoCentro : domingoBairro;
  if (dia === 6) return tipo === "centro" ? sabadoCentro : sabadoBairro;
  return tipo === "centro" ? semanaCentro : semanaBairro;
}

function rad(v: number) { return (v * Math.PI) / 180; }
function distanciaMetros(a: Localizacao, b: { lat?: number; lng?: number }) {
  if (typeof b.lat !== "number" || typeof b.lng !== "number") return null;
  const R = 6371000;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
function distanciaTexto(m: number | null) {
  if (m === null) return "";
  return m < 1000 ? `${Math.round(m)} m de você` : `${(m / 1000).toFixed(1).replace(".", ",")} km de você`;
}

export default function TransportePage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null);
  const [erroLocalizacao, setErroLocalizacao] = useState("");
  const [pedindoLocalizacao, setPedindoLocalizacao] = useState(false);
  const [mostrarHorarios, setMostrarHorarios] = useState(false);
  const [tipoHorario, setTipoHorario] = useState<"centro" | "bairro">("centro");
  const [agora, setAgora] = useState(() => new Date());
  const mapaRef = useRef<HTMLDivElement | null>(null);
  const mapaObj = useRef<any>(null);
  const camadaRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

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

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
      setErroLocalizacao("Este aparelho não disponibiliza localização.");
      return;
    }
    setPedindoLocalizacao(true);
    setErroLocalizacao("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocalizacao({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
        setPedindoLocalizacao(false);
      },
      () => {
        setErroLocalizacao("Localização não autorizada. Você ainda pode acompanhar os ônibus no mapa.");
        setPedindoLocalizacao(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  }

  useEffect(() => {
    atualizar();
    const timer = window.setInterval(() => { atualizar(); setAgora(new Date()); }, 20000);
    return () => window.clearInterval(timer);
  }, []);

  const pontos = useMemo(() => veiculos.filter((v) => typeof v.lat === "number" && typeof v.lng === "number"), [veiculos]);

  useEffect(() => {
    let cancelado = false;
    async function montarMapa() {
      if (!mapaRef.current) return;
      if (!leafletRef.current) {
        const L = await import("leaflet");
        if (cancelado) return;
        leafletRef.current = L;
        if (!document.getElementById("leaflet-sobradao-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-sobradao-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }
      }
      const L = leafletRef.current;
      if (!mapaObj.current) {
        mapaObj.current = L.map(mapaRef.current, { zoomControl: true }).setView([-22.38, -47.57], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap"
        }).addTo(mapaObj.current);
        camadaRef.current = L.layerGroup().addTo(mapaObj.current);
      }
      camadaRef.current.clearLayers();
      const limites: [number, number][] = [];

      pontos.forEach((v) => {
        const lat = v.lat as number;
        const lng = v.lng as number;
        limites.push([lat, lng]);
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#059669;color:white;border:3px solid white;border-radius:999px;width:42px;height:42px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px #0005;font-size:21px">🚌</div>`,
          iconSize: [42, 42],
          iconAnchor: [21, 21]
        });
        L.marker([lat, lng], { icon }).bindPopup(`<b>Ônibus ${v.vehicleId || ""}</b><br>Atualizado ${v.positionTime || "agora"}`).addTo(camadaRef.current);
      });

      if (localizacao) {
        limites.push([localizacao.lat, localizacao.lng]);
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#2563eb;color:white;border:3px solid white;border-radius:999px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px #0005;font-size:18px">📍</div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 38]
        });
        L.marker([localizacao.lat, localizacao.lng], { icon }).bindPopup("<b>Você está aqui</b>").addTo(camadaRef.current);
      }

      if (limites.length >= 2) mapaObj.current.fitBounds(limites, { padding: [35, 35], maxZoom: 16 });
      else if (limites.length === 1) mapaObj.current.setView(limites[0], 15);
      window.setTimeout(() => mapaObj.current?.invalidateSize(), 100);
    }
    montarMapa().catch(() => setErro("O mapa não pôde ser carregado agora."));
    return () => { cancelado = true; };
  }, [pontos, localizacao]);

  const horarios = horariosHoje(tipoHorario);
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const futuros = horarios.filter((h) => {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm >= minutosAgora;
  });
  const proximoProgramado = futuros[0];

  return (
    <div className="min-h-screen bg-slate-100 pb-16 text-slate-900">
      <header className="bg-gradient-to-r from-sky-700 to-blue-900 text-white shadow">
        <div className="mx-auto max-w-md px-4 py-2.5">
          <div className="flex items-center justify-between">
            <Link href="/utilidades" className="text-xs font-bold">← Utilidades</Link>
            <span className="rounded-lg bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950">RIO CLARO</span>
          </div>
          <p className="mt-1 text-[10px] font-bold text-sky-100">Transporte Público</p>
          <h1 className="text-lg font-black">🚌 Linha 06 — Cervezão</h1>
          <p className="text-[10px] text-sky-100">Veja os ônibus que estão aparecendo em tempo real.</p>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-2.5">
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 p-4 pb-3">
            <div>
              <p className="text-xs font-black text-emerald-700">● TEMPO REAL</p>
              <h2 className="text-lg font-black">Mapa da Linha 06 agora</h2>
            </div>
            <button onClick={atualizar} className="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black">Atualizar</button>
          </div>

          <div ref={mapaRef} className="h-[390px] w-full bg-slate-200" />

          <div className="p-4">
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="rounded-full bg-emerald-50 px-3 py-2">🚌 Ônibus em circulação</span>
              {localizacao && <span className="rounded-full bg-blue-50 px-3 py-2">📍 Você está aqui</span>}
            </div>
            {!localizacao && (
              <button onClick={usarMinhaLocalizacao} disabled={pedindoLocalizacao} className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-xs font-black text-white disabled:opacity-60">
                {pedindoLocalizacao ? "Localizando..." : "📍 Mostrar onde estou no mapa"}
              </button>
            )}
            {erroLocalizacao && <p className="mt-2 text-[10px] text-amber-700">{erroLocalizacao}</p>}
            <p className="mt-2 text-[9px] leading-4 text-slate-400">Sua localização só é usada no seu aparelho para colocar o marcador no mapa.</p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-emerald-700">ÔNIBUS LOCALIZADOS</p>
              <h2 className="text-lg font-black">{pontos.length} no mapa agora</h2>
            </div>
            <span className="text-[10px] font-bold text-slate-500">Atualiza a cada 20 s</span>
          </div>

          {carregando ? <p className="mt-3 text-xs text-slate-500">Consultando...</p> :
            erro ? <p className="mt-3 text-xs text-red-600">{erro}</p> :
            pontos.length === 0 ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Nenhum ônibus foi localizado no tempo real neste momento.</p> :
            <div className="mt-3 space-y-2">
              {pontos.map((v, i) => {
                const dist = localizacao ? distanciaMetros(localizacao, v) : null;
                return (
                  <div key={`${v.vehicleId}-${v.tripId}-${i}`} className="rounded-xl bg-emerald-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black">🚌 Veículo {v.vehicleId || "—"}</p>
                      <span className="text-[10px] font-bold">Atualizado {v.positionTime || "—"}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                      {v.startTime && <span>Referência: <b>{v.startTime}</b></span>}
                      {dist !== null && <span>📍 <b>{distanciaTexto(dist)}</b></span>}
                    </div>
                  </div>
                );
              })}
            </div>
          }
          <p className="mt-3 text-[9px] leading-4 text-slate-400">O mapa mostra a posição recebida do sistema em tempo real. Não usamos o nome da viagem para afirmar o sentido do ônibus.</p>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-black text-sky-700">HORÁRIOS PROGRAMADOS</p>
          <h2 className="mt-1 text-base font-black">Consulte a tabela da Linha 06</h2>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">O horário é programação. A presença do ônibus no mapa é a informação de tempo real.</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setTipoHorario("centro")} className={`rounded-xl px-3 py-3 text-xs font-black ${tipoHorario === "centro" ? "bg-sky-600 text-white" : "bg-slate-100"}`}>🏙️ Sentido Centro</button>
            <button onClick={() => setTipoHorario("bairro")} className={`rounded-xl px-3 py-3 text-xs font-black ${tipoHorario === "bairro" ? "bg-sky-600 text-white" : "bg-slate-100"}`}>🏠 Sentido bairro</button>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 p-3">
            <div>
              <p className="text-[9px] font-black text-amber-800">PRÓXIMA SAÍDA PROGRAMADA</p>
              <p className="text-[10px] text-slate-500">Não significa que o ônibus já iniciou a viagem.</p>
            </div>
            <p className="text-2xl font-black">{proximoProgramado || "—"}</p>
          </div>

          <button onClick={() => setMostrarHorarios((v) => !v)} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">
            {mostrarHorarios ? "Ocultar horários" : "Ver todos os horários"}
          </button>
          {mostrarHorarios && <div className="mt-3 grid grid-cols-4 gap-2">{horarios.map((h) => <div key={h} className="rounded-lg bg-slate-100 px-2 py-2 text-center text-xs font-black">{h}</div>)}</div>}
          <p className="mt-3 text-[9px] text-slate-400">Tabela da Linha 06 com vigência informada até 27/01/2027.</p>
        </section>
      </main>
    </div>
  );
}
