"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Preco = {
  revenda: string; cnpj: string; endereco: string; bairro: string; cep: string;
  produto: string; dataColeta: string; valor: number; bandeira: string;
};
type Posto = {
  cnpj: string; revenda: string; endereco: string; complemento: string; bairro: string; cep: string;
  codigoSIMP: string; autorizacao: string; dataPublicacao: string; distribuidora: string;
  produtos: Array<{ produto?: string }>; latitude: string; longitude: string; validacao: string; statusSIGAF: string;
  precos: Array<{ produto: string; valor: number; dataColeta: string }>;
};
type Resposta = { sucesso: boolean; atualizadoEm: string | null; precos: Preco[]; postos?: Posto[]; aviso?: string; erro?: string };
type Localizacao = { lat: number; lng: number };

const abas = ["GASOLINA", "ETANOL", "DIESEL S10", "DIESEL", "GNV"] as const;
const norm = (s: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

function bateProduto(produto: string, aba: string) {
  const prod = norm(produto);
  if (aba === "DIESEL") return prod === "DIESEL" || prod.includes("S500") || prod.includes("S-500");
  if (aba === "DIESEL S10") return (prod.includes("DIESEL") && prod.includes("S10")) || prod.includes("S-10");
  return prod.includes(aba);
}
function numero(v: string) {
  const n = Number(String(v || "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function rad(v: number) { return (v * Math.PI) / 180; }
function distanciaKm(a: Localizacao, lat: number, lng: number) {
  const R=6371, dLat=rad(lat-a.lat), dLng=rad(lng-a.lng);
  const x=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

export default function CombustiveisPage() {
  const [dados, setDados] = useState<Resposta | null>(null);
  const [aba, setAba] = useState<string>("GASOLINA");
  const [busca, setBusca] = useState("");
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null);
  const [erroLocalizacao, setErroLocalizacao] = useState("");
  const mapaRef=useRef<HTMLDivElement|null>(null), mapaObj=useRef<any>(null), camada=useRef<any>(null), leaflet=useRef<any>(null);

  useEffect(() => {
    fetch("/api/combustiveis").then(r => r.json()).then(setDados).catch(() =>
      setDados({ sucesso: false, atualizadoEm: null, precos: [], erro: "Não foi possível carregar os preços." })
    );
  }, []);

  const postos = useMemo(() => {
    const q=norm(busca);
    return (dados?.postos || []).filter(p => {
      const vende=(p.produtos||[]).some(x=>bateProduto(x.produto||"",aba));
      const temPreco=(p.precos||[]).some(x=>bateProduto(x.produto,aba));
      return (vende||temPreco) && (!q || norm(p.revenda+" "+p.bairro+" "+p.distribuidora).includes(q));
    }).sort((a,b)=>{
      const pa=a.precos.find(x=>bateProduto(x.produto,aba))?.valor;
      const pb=b.precos.find(x=>bateProduto(x.produto,aba))?.valor;
      if(pa && pb) return pa-pb; if(pa) return -1; if(pb) return 1; return a.revenda.localeCompare(b.revenda);
    });
  },[dados,aba,busca]);

  function usarMinhaLocalizacao(){
    if(!navigator.geolocation){setErroLocalizacao("Localização não disponível neste aparelho.");return;}
    setErroLocalizacao("");
    navigator.geolocation.getCurrentPosition(p=>setLocalizacao({lat:p.coords.latitude,lng:p.coords.longitude}),
      ()=>setErroLocalizacao("Localização não autorizada. O mapa continua disponível sem mostrar sua posição."),
      {enableHighAccuracy:true,timeout:10000,maximumAge:30000});
  }

  useEffect(()=>{
    if(!mostrarMapa || !mapaRef.current) return;
    let cancelado=false;
    async function montar(){
      if(!leaflet.current){
        const L=await import("leaflet"); if(cancelado)return; leaflet.current=L;
        if(!document.getElementById("leaflet-combustiveis-css")){
          const link=document.createElement("link"); link.id="leaflet-combustiveis-css"; link.rel="stylesheet";
          link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
        }
      }
      const L=leaflet.current;
      if(!mapaObj.current){
        mapaObj.current=L.map(mapaRef.current).setView([-22.41,-47.56],12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap"}).addTo(mapaObj.current);
        camada.current=L.layerGroup().addTo(mapaObj.current);
      }
      camada.current.clearLayers(); const limites:[number,number][]=[];
      postos.forEach(p=>{
        const lat=numero(p.latitude),lng=numero(p.longitude); if(lat===null||lng===null)return;
        limites.push([lat,lng]); const pr=p.precos.find(x=>bateProduto(x.produto,aba));
        const valor=pr ? `R$ ${pr.valor.toFixed(3).replace(".",",")}` : "Sem preço pesquisado";
        const icon=L.divIcon({className:"",html:`<div style="background:${pr?"#047857":"#64748b"};color:white;border:3px solid white;border-radius:16px;padding:5px 7px;min-width:58px;text-align:center;box-shadow:0 2px 8px #0005;font-size:11px;font-weight:900">⛽<br>${pr?valor.replace("R$ ","R$"):"—"}</div>`,iconSize:[64,46],iconAnchor:[32,23]});
        L.marker([lat,lng],{icon}).bindPopup(`<b>${p.revenda}</b><br>${valor}<br>${pr?"Coleta: "+pr.dataColeta:"Posto cadastrado na ANP"}`).addTo(camada.current);
      });
      if(localizacao){
        limites.push([localizacao.lat,localizacao.lng]);
        const icon=L.divIcon({className:"",html:'<div style="background:#2563eb;color:white;border:3px solid white;border-radius:999px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px #0005">📍</div>',iconSize:[38,38],iconAnchor:[19,38]});
        L.marker([localizacao.lat,localizacao.lng],{icon}).bindPopup("<b>Você está aqui</b>").addTo(camada.current);
      }
      if(limites.length>=2) mapaObj.current.fitBounds(limites,{padding:[30,30],maxZoom:15});
      setTimeout(()=>mapaObj.current?.invalidateSize(),100);
    }
    montar(); return()=>{cancelado=true};
  },[mostrarMapa,postos,localizacao,aba]);

  return <div className="min-h-screen bg-slate-100 pb-24 text-slate-900">
    <header className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white shadow-md">
      <div className="mx-auto max-w-md px-4 py-4 text-center"><div className="text-3xl">⛽</div><h1 className="mt-1 text-xl font-black">Combustíveis em Rio Claro</h1><p className="mt-1 text-[11px] text-white/85">Postos cadastrados e preços pesquisados pela ANP</p></div>
    </header>
    <main className="mx-auto max-w-md space-y-4 px-4 py-4">
      <div className="grid grid-cols-2 gap-2">
        {abas.map(item=><button key={item} onClick={()=>setAba(item)} className={`rounded-xl px-3 py-3 text-xs font-black ${aba===item?"bg-emerald-700 text-white shadow":"bg-white text-slate-700"}`}>{item==="ETANOL"?"🌱 Etanol":item==="GASOLINA"?"⛽ Gasolina":item==="GNV"?"🔥 GNV":"🚚 "+item.replace("DIESEL ","Diesel ")}</button>)}
      </div>
      <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="🔎 Buscar posto, bairro ou bandeira" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"/>
      {dados?.atualizadoEm&&<div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-center text-[11px] font-bold text-blue-800">📅 Última pesquisa encontrada em Rio Claro: {dados.atualizadoEm} • Fonte: ANP</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 p-3">
          <div><p className="text-sm font-black">🗺️ Mapa dos postos</p><p className="text-[10px] text-slate-500">Veja preços e postos próximos de você.</p></div>
          <button onClick={()=>setMostrarMapa(v=>!v)} className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black text-white">{mostrarMapa?"Fechar mapa":"Abrir mapa"}</button>
        </div>
        {mostrarMapa&&<><div className="px-3 pb-3"><button onClick={usarMinhaLocalizacao} className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-black text-white">📍 Mostrar minha localização</button>{erroLocalizacao&&<p className="mt-2 text-[10px] font-bold text-red-600">{erroLocalizacao}</p>}</div><div ref={mapaRef} className="h-[390px] w-full bg-slate-100"/></>}
      </section>

      {!dados&&<div className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-500">Consultando a ANP...</div>}
      {dados&&!dados.sucesso&&<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{dados.erro}</div>}
      {dados?.sucesso&&postos.length===0&&<div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">Nenhum posto encontrado para este combustível.</div>}

      <div className="space-y-3">
        {postos.map((p,i)=>{
          const pr=p.precos.find(x=>bateProduto(x.produto,aba)); const lat=numero(p.latitude),lng=numero(p.longitude);
          const dist=localizacao&&lat!==null&&lng!==null?distanciaKm(localizacao,lat,lng):null;
          return <article key={p.cnpj||p.codigoSIMP||i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0">
              {i===0&&pr&&<span className="mb-1 inline-block rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800">🏆 MENOR PREÇO PESQUISADO</span>}
              <h2 className="text-sm font-black leading-5">{p.revenda}</h2><p className="text-[10px] font-bold text-slate-500">{p.distribuidora}</p>
              <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700">✓ Cadastro oficial ANP</span>
            </div><div className="shrink-0 text-right">{pr?<><p className="text-2xl font-black text-emerald-700">R$ {pr.valor.toFixed(3).replace(".",",")}</p><p className="text-[9px] text-slate-400">por litro</p></>:<><p className="text-xs font-black text-slate-500">Sem preço</p><p className="max-w-[90px] text-[9px] leading-3 text-slate-400">não pesquisado nesta coleta</p></>}</div></div>
            <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-600">
              <p>📍 {p.endereco}{p.bairro?" • "+p.bairro:""}</p>{pr&&<p>🗓️ Coleta: {pr.dataColeta}</p>}
              {p.dataPublicacao&&<p>📄 Autorização publicada: {p.dataPublicacao}</p>}
              {dist!==null&&<p className="font-black text-blue-700">📍 {dist<1?Math.round(dist*1000)+" m":dist.toFixed(1).replace(".",",")+" km"} de você</p>}
            </div>
            <a href={lat!==null&&lng!==null?`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.endereco+", Rio Claro, SP")}`} target="_blank" rel="noreferrer" className="mt-3 block rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-black text-slate-700">📍 Como chegar</a>
          </article>
        })}
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-4 text-amber-900"><b>Importante:</b> cadastro do posto e pesquisa de preços são informações diferentes. Os valores não são em tempo real e podem ter mudado após a coleta.</div>
      <Link href="/utilidades" className="block text-center text-xs font-black text-blue-800">← Voltar para Utilidades</Link>
    </main>
  </div>;
}
