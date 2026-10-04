"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Localizacao = { lat: number; lng: number; accuracy: number };
type Ecoponto = { nome: string; endereco: string; lat?: number; lng?: number; destaque?: boolean };
type Rota = { distanciaKm: number; minutos: number };

const ECOPONTOS: Ecoponto[] = [
  { nome: "Jardim das Palmeiras", endereco: "Avenida 3-JP com Rua 14, ao lado da Estação de Tratamento de Esgoto", lat: -22.430339, lng: -47.588925 },
  { nome: "Cervezão", endereco: "Rua 6-A com Avenida M-21, em frente à rotatória do Cervezão", lat: -22.385878, lng: -47.573142 },
  { nome: "Jardim São Paulo", endereco: "Rua 1-B JSP, entre as avenidas 26 e 28", lat: -22.401650, lng: -47.575898 },
  { nome: "São Miguel", endereco: "Avenida 64-A com o Anel Viário", lat: -22.386284, lng: -47.542357 },
  { nome: "Inocoop / Guanabara", endereco: "Final da Avenida Tancredo Neves, próximo à Rodovia Fausto Santomauro", lat: -22.436952, lng: -47.572821 },
  { nome: "Jardim Figueira", endereco: "Avenida 54 com Rua 27-JF", lat: -22.394891, lng: -47.593831 },
  { nome: "Ajapi", endereco: "Km 16 da Estrada Ajapi-Ferraz, esquina com Avenida 15, após o posto de combustíveis" },
  { nome: "Assistência", endereco: "Avenida 1-A com Rua 3-A, loteamento São José, distrito de Assistência" },
  { nome: "Estrada do Sobrado", endereco: "Rodovia Wilson Finardi (SP-191), km 69, acesso à Estrada do Sobrado", destaque: true },
];

function rotaGoogle(e: Ecoponto) {
  const destino = typeof e.lat === "number" && typeof e.lng === "number" ? `${e.lat},${e.lng}` : `${e.endereco}, Rio Claro - SP`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}&travelmode=driving`;
}

export default function EcopontosPage() {
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null);
  const [erroLocalizacao, setErroLocalizacao] = useState("");
  const [localizando, setLocalizando] = useState(false);
  const [rotas, setRotas] = useState<Record<string, Rota>>({});
  const [calculandoRotas, setCalculandoRotas] = useState(false);
  const mapaRef = useRef<HTMLDivElement | null>(null);
  const mapaObj = useRef<any>(null);
  const camadaRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const watchRef = useRef<number | null>(null);

  function usarLocalizacao() {
    if (!navigator.geolocation) return setErroLocalizacao("Este aparelho não disponibiliza localização.");
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    setLocalizando(true); setErroLocalizacao(""); setRotas({});
    let melhor: Localizacao | null = null;
    const finalizar = () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null; setLocalizando(false);
      if (!melhor) setErroLocalizacao("Não foi possível obter sua localização. Verifique a permissão do navegador.");
    };
    watchRef.current = navigator.geolocation.watchPosition(
      p => {
        const atual = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
        if (!melhor || atual.accuracy < melhor.accuracy) { melhor = atual; setLocalizacao(atual); }
        if (atual.accuracy <= 20) finalizar();
      },
      () => { setErroLocalizacao("Localização não autorizada. Você ainda pode consultar todos os ecopontos."); finalizar(); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
    window.setTimeout(finalizar, 10000);
  }

  useEffect(() => () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current); }, []);

  useEffect(() => {
    if (!localizacao) return;
    const pontos = ECOPONTOS.filter(e => typeof e.lat === "number" && typeof e.lng === "number");
    if (!pontos.length) return;
    let cancelado = false;
    async function calcular() {
      setCalculandoRotas(true);
      try {
        const coords = [
          `${localizacao.lng},${localizacao.lat}`,
          ...pontos.map(e => `${e.lng},${e.lat}`)
        ].join(";");
        const destinos = pontos.map((_, i) => i + 1).join(";");
        const url = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&destinations=${destinos}&annotations=distance,duration`;
        const r = await fetch(url);
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (cancelado || d.code !== "Ok") return;
        const novas: Record<string, Rota> = {};
        pontos.forEach((e, i) => {
          const metros = d.distances?.[0]?.[i];
          const segundos = d.durations?.[0]?.[i];
          if (typeof metros === "number" && typeof segundos === "number") novas[e.nome] = { distanciaKm: metros / 1000, minutos: Math.max(1, Math.round(segundos / 60)) };
        });
        setRotas(novas);
      } catch {
        if (!cancelado) setRotas({});
      } finally { if (!cancelado) setCalculandoRotas(false); }
    }
    calcular();
    return () => { cancelado = true; };
  }, [localizacao]);

  const lista = useMemo(() => [...ECOPONTOS].sort((a, b) => {
    const da = rotas[a.nome]?.distanciaKm ?? Number.POSITIVE_INFINITY;
    const db = rotas[b.nome]?.distanciaKm ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return a.nome.localeCompare(b.nome, "pt-BR");
  }), [rotas]);

  useEffect(() => {
    let cancelado = false;
    async function montar() {
      if (!mapaRef.current) return;
      if (!leafletRef.current) {
        const L = await import("leaflet"); if (cancelado) return; leafletRef.current = L;
        if (!document.getElementById("leaflet-ecopontos-css")) {
          const link = document.createElement("link"); link.id = "leaflet-ecopontos-css"; link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
        }
      }
      const L = leafletRef.current;
      if (!mapaObj.current) {
        mapaObj.current = L.map(mapaRef.current).setView([-22.405, -47.575], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(mapaObj.current);
        camadaRef.current = L.layerGroup().addTo(mapaObj.current);
      }
      camadaRef.current.clearLayers();
      const limites: [number, number][] = [];
      ECOPONTOS.filter(e => typeof e.lat === "number" && typeof e.lng === "number").forEach(e => {
        limites.push([e.lat!, e.lng!]);
        const icon = L.divIcon({ className:"", html:'<div style="background:#059669;color:white;border:3px solid white;border-radius:999px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px #0005;font-size:20px">♻️</div>', iconSize:[40,40], iconAnchor:[20,20] });
        L.marker([e.lat!, e.lng!], { icon }).bindPopup(`<b>${e.nome}</b><br>${e.endereco}`).addTo(camadaRef.current);
      });
      if (localizacao) {
        limites.push([localizacao.lat, localizacao.lng]);
        const icon = L.divIcon({ className:"", html:'<div style="background:#2563eb;color:white;border:3px solid white;border-radius:999px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px #0005">📍</div>', iconSize:[38,38], iconAnchor:[19,38] });
        L.marker([localizacao.lat, localizacao.lng], { icon }).bindPopup(`<b>Você está aqui</b><br>Precisão aproximada: ${Math.round(localizacao.accuracy)} m`).addTo(camadaRef.current);
      }
      if (limites.length) mapaObj.current.fitBounds(limites, { padding:[30,30], maxZoom:14 });
      setTimeout(() => mapaObj.current?.invalidateSize(), 100);
    }
    montar(); return () => { cancelado = true; };
  }, [localizacao]);

  return <div className="min-h-screen bg-slate-100 pb-16 text-slate-900">
    <header className="bg-gradient-to-r from-emerald-700 to-green-900 text-white shadow"><div className="mx-auto max-w-md px-4 py-4">
      <div className="flex items-center justify-between"><Link href="/utilidades" className="text-xs font-bold">← Utilidades</Link><span className="rounded-lg bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950">RIO CLARO</span></div>
      <p className="mt-3 text-xs font-bold text-emerald-100">Descarte correto</p><h1 className="text-2xl font-black">♻️ Ecopontos</h1><p className="mt-1 text-[11px] text-emerald-100">Encontre o ecoponto mais próximo e veja como chegar.</p>
    </div></header>
    <main className="mx-auto max-w-md space-y-4 px-4 py-4">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="p-4 pb-3"><p className="text-xs font-black text-emerald-700">MAPA DOS ECOPONTOS</p><h2 className="text-lg font-black">Pontos de descarte em Rio Claro</h2></div>
        <div ref={mapaRef} className="h-[360px] w-full bg-slate-200" />
        <div className="p-4">
          <button onClick={usarLocalizacao} disabled={localizando} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-xs font-black text-white disabled:opacity-60">{localizando ? "📡 Buscando melhor sinal de GPS..." : localizacao ? "📍 Melhorar minha localização" : "📍 Usar minha localização"}</button>
          {localizacao && <p className="mt-2 text-[10px] font-bold text-blue-700">Precisão informada pelo aparelho: aproximadamente {Math.round(localizacao.accuracy)} m.</p>}
          {erroLocalizacao && <p className="mt-2 text-[10px] text-amber-700">{erroLocalizacao}</p>}
          <p className="mt-2 text-[9px] leading-4 text-slate-400">Após autorizar, o portal tenta obter uma leitura mais precisa do GPS por alguns segundos. A posição pode variar conforme o aparelho, sinal, Wi-Fi e ambiente.</p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-black text-emerald-700">O QUE PODE LEVAR</p>
        <p className="mt-2 text-[11px] leading-5 text-slate-600">Até 1 m³ de galhos, podas e entulho de construção; móveis, eletrodomésticos, MDF, colchões, pilhas, recicláveis, lâmpadas e óleo de cozinha.</p>
        <div className="mt-3 rounded-xl bg-red-50 p-3 text-[10px] font-bold text-red-700">🚫 Não levar lixo orgânico, hospitalar ou resíduos de empresas.</div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-black text-emerald-700">HORÁRIO INFORMADO PELA PREFEITURA EM 2026</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px]"><div className="rounded-xl bg-slate-50 p-2"><b>Seg–Sex</b><br/>7h–18h</div><div className="rounded-xl bg-slate-50 p-2"><b>Sábado</b><br/>7h–17h</div><div className="rounded-xl bg-slate-50 p-2"><b>Domingo</b><br/>7h–12h</div></div>
        <p className="mt-2 text-[9px] text-slate-400">Feriados podem ter funcionamento especial.</p>
      </section>

      <section>
        <div className="mb-2"><p className="text-xs font-black text-emerald-700">9 ECOPONTOS</p><h2 className="text-lg font-black">{localizacao ? "Mais próximos por trajeto" : "Lista de ecopontos"}</h2>{calculandoRotas && <p className="text-[10px] text-blue-600">🚗 Calculando distância pelas ruas...</p>}</div>
        <div className="space-y-3">{lista.map((e, i) => {
          const r = rotas[e.nome];
          return <div key={e.nome} className={`rounded-2xl border p-4 shadow-sm ${e.destaque ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}><div className="flex gap-3"><div className="text-2xl">♻️</div><div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black">{e.nome}</h3>{localizacao && i === 0 && r && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[8px] font-black text-emerald-800">MAIS PRÓXIMO</span>}{e.destaque && <span className="rounded-full bg-amber-200 px-2 py-1 text-[8px] font-black">REGIÃO DO SOBRADÃO</span>}</div>
            <p className="mt-1 text-[10px] leading-4 text-slate-600">{e.endereco}</p>
            {r && <p className="mt-2 text-xs font-black text-blue-700">🚗 {r.distanciaKm.toFixed(1).replace(".", ",")} km pelas ruas • cerca de {r.minutos} min</p>}
            {localizacao && !r && typeof e.lat !== "number" && <p className="mt-2 text-[9px] text-slate-400">Abra “Como chegar” para ver o trajeto e a distância no Google Maps.</p>}
            <a href={rotaGoogle(e)} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-[10px] font-black text-white">🧭 Como chegar</a>
          </div></div></div>;
        })}</div>
      </section>
      <p className="px-2 text-center text-[9px] leading-4 text-slate-400">A distância e o tempo são estimativas de trajeto de carro pela malha viária do OpenStreetMap e podem diferir do Google Maps. Endereços e orientações de descarte baseados em informações da Prefeitura Municipal de Rio Claro.</p>
    </main>
  </div>;
}
