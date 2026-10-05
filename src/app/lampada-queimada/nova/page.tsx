"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const OFICIAL_URL = "https://ip.somasig.com.br/ocorrencias/rioclaro";
const TIPOS = ["Lâmpada apagada","Lâmpada oscilando","Lâmpada acesa durante o dia","Vandalismo","Problema no poste","Outro problema","Pedido de ponto de iluminação","Pedido de melhoria","Setor apagado","Setor aceso durante o dia"];

type Feature = {
  geometry?: { type?: string; coordinates?: unknown };
  properties?: Record<string, unknown>;
};

function featuresDe(v: unknown): Feature[] {
  if (!v || typeof v !== "object") return [];
  const obj = v as Record<string, unknown>;

  // A SOMASIG devolve: { code, status, data: [{ fc: { type: "FeatureCollection", features: [...] } }] }
  const data = obj.data;
  if (Array.isArray(data)) {
    const todas: Feature[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object") continue;
      const fc = (item as Record<string, unknown>).fc;
      if (!fc || typeof fc !== "object") continue;
      const fs = (fc as Record<string, unknown>).features;
      if (Array.isArray(fs)) todas.push(...(fs as Feature[]));
    }
    if (todas.length) return todas;
  }

  // Mantém compatibilidade caso a API passe a devolver o GeoJSON diretamente.
  const fs = obj.features;
  return Array.isArray(fs) ? (fs as Feature[]) : [];
}

function coordenada(f: Feature): [number, number] | null {
  const c = f.geometry?.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const lng = Number(c[0]), lat = Number(c[1]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

function valor(p: Record<string, unknown> | undefined, nomes: string[]) {
  if (!p) return "";
  for (const nome of nomes) {
    const achado = Object.keys(p).find((k) => k.toLowerCase() === nome.toLowerCase());
    if (achado && p[achado] != null) return String(p[achado]);
  }
  return "";
}

export default function NovaOcorrenciaIluminacaoPage() {
  const [tipo, setTipo] = useState("");
  const [dados, setDados] = useState<unknown>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState<Feature | null>(null);
  const [pontoConfirmado, setPontoConfirmado] = useState(false);
  const [nome, setNome] = useState("");
  const [tipoTelefone, setTipoTelefone] = useState("Celular");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [observacao, setObservacao] = useState("");
  const mapaRef = useRef<HTMLDivElement | null>(null);
  const mapaObj = useRef<any>(null);
  const camadaRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  useEffect(() => {
    let ativo = true;
    fetch("/api/iluminacao/pontos", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d?.erro || "Falha ao carregar os pontos.");
        if (ativo) setDados(d);
      })
      .catch((e) => ativo && setErro(e instanceof Error ? e.message : "Falha ao carregar os pontos."))
      .finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, []);

  const features = useMemo(() => featuresDe(dados), [dados]);
  const pontos = useMemo(() => features.map((f) => ({ f, c: coordenada(f) })).filter((x): x is { f: Feature; c: [number, number] } => x.c !== null), [features]);

  useEffect(() => {
    let cancelado = false;
    async function montar() {
      if (!mapaRef.current || carregando || erro || pontos.length === 0) return;
      if (!leafletRef.current) {
        const L = await import("leaflet");
        if (cancelado) return;
        leafletRef.current = L;
        if (!document.getElementById("leaflet-iluminacao-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-iluminacao-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }
      }
      const L = leafletRef.current;
      if (!mapaObj.current) {
        mapaObj.current = L.map(mapaRef.current, { preferCanvas: true }).setView([-22.4114, -47.5614], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(mapaObj.current);
        camadaRef.current = L.layerGroup().addTo(mapaObj.current);
      }
      camadaRef.current.clearLayers();
      pontos.forEach(({ f, c }) => {
        const marker = L.circleMarker(c, { radius: 5, weight: 1, color: "#a16207", fillColor: "#facc15", fillOpacity: 0.9 });
        marker.on("click", () => { setSelecionado(f); setPontoConfirmado(false); });
        marker.addTo(camadaRef.current);
      });
      window.setTimeout(() => mapaObj.current?.invalidateSize(), 100);
    }
    montar().catch(() => setErro("O mapa não pôde ser carregado agora."));
    return () => { cancelado = true; };
  }, [pontos, carregando, erro]);

  const prop = selecionado?.properties;
  const codigo = valor(prop, ["id"]);
  const tipoLogradouro = valor(prop, ["tipo_logradouro"]);
  const logradouro = valor(prop, ["logradouro"]);
  const numero = valor(prop, ["numero"]);
  const bairro = valor(prop, ["bairro"]);
  const cep = valor(prop, ["cep"]);
  const luminarias = valor(prop, ["quantidade_pontos_luminosos"]);
  const potencia = valor(prop, ["potencia_total"]);
  const endereco = [tipoLogradouro, logradouro, numero && `nº ${numero}`].filter(Boolean).join(" ");

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900">
      <section className="bg-gradient-to-br from-amber-500 via-amber-400 to-orange-500 text-white">
        <div className="mx-auto max-w-2xl px-4 py-4 text-center">
          <div className="text-3xl">💡</div>
          <h1 className="mt-1 text-lg font-black">Nova ocorrência de iluminação</h1>
          <p className="mt-1 text-xs text-white/90">Teste da integração • Rio Claro</p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between text-xs font-black">
            <span className="rounded-full bg-amber-500 px-3 py-2 text-white">1 Problema</span>
            <span className="text-slate-500">2 Local</span><span className="text-slate-400">3 Seus dados</span>
          </div>
          <label className="text-sm font-black" htmlFor="tipo">Tipo da ocorrência</label>
          <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-sm font-semibold">
            <option value="">Selecione o problema</option>
            {TIPOS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 pb-3">
            <h2 className="font-black">🗺️ Escolha o ponto de iluminação</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Aproxime o mapa e toque no ponto amarelo correspondente ao poste.</p>
          </div>
          {carregando ? <div className="m-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold">Carregando pontos…</div> :
           erro ? <div className="m-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{erro}</div> :
           pontos.length === 0 ? <div className="m-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">A API respondeu, mas não encontramos coordenadas válidas nos pontos.</div> :
           <div ref={mapaRef} className="h-[430px] w-full bg-slate-200" />}
          {!carregando && !erro && pontos.length > 0 && <div className="px-5 py-3 text-[10px] font-bold text-slate-500">{pontos.length.toLocaleString("pt-BR")} pontos carregados • toque em um ponto amarelo</div>}
        </div>

        {selecionado && (
          <div className="rounded-3xl border-2 border-emerald-300 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase text-emerald-700">Ponto selecionado</p><h2 className="text-xl font-black">{codigo ? `#${codigo}` : "Ponto de iluminação"}</h2></div>
              <button onClick={() => { setSelecionado(null); setPontoConfirmado(false); }} className="text-xl text-slate-400">✕</button>
            </div>
            {(endereco || bairro) && <p className="mt-3 text-sm font-bold text-slate-700">📍 {[endereco,bairro].filter(Boolean).join(" — ")}</p>}
            {cep && <p className="mt-1 text-xs text-slate-500">CEP {cep}</p>}
            {(luminarias || potencia) && <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-3"><b>Luminárias</b><br/>{luminarias || "—"}</div><div className="rounded-xl bg-slate-50 p-3"><b>Potência</b><br/>{potencia ? `${potencia} W` : "—"}</div></div>}
            <button
              disabled={!tipo}
              onClick={() => {
                setPontoConfirmado(true);
                window.setTimeout(() => document.getElementById("seus-dados")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
              }}
              className="mt-4 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white disabled:bg-slate-300"
            >✓ Confirmar este ponto</button>
            {!tipo && <p className="mt-2 text-center text-[10px] text-amber-700">Selecione primeiro o tipo da ocorrência.</p>}
          </div>
        )}

        {pontoConfirmado && selecionado && (
          <div id="seus-dados" className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between text-xs font-black">
              <span className="text-emerald-700">✓ 1 Problema</span>
              <span className="text-emerald-700">✓ 2 Local</span>
              <span className="rounded-full bg-amber-500 px-3 py-2 text-white">3 Seus dados</span>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-[10px] font-black uppercase text-emerald-700">Local confirmado</p>
              <p className="mt-1 text-sm font-black text-slate-800">{codigo ? `Ponto #${codigo}` : "Ponto de iluminação"}</p>
              <p className="mt-1 text-xs text-slate-600">{[endereco, bairro].filter(Boolean).join(" — ")}</p>
              {cep && <p className="mt-1 text-[11px] text-slate-500">CEP {cep}</p>}
            </div>

            <label className="mt-5 block text-sm font-black" htmlFor="observacao">Descrição do problema</label>
            <textarea id="observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={4} placeholder="Descreva o problema incluindo o máximo de informações que puder" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500" />

            <h2 className="mt-5 text-base font-black">Dados do solicitante</h2>
            <label className="mt-3 block text-xs font-black" htmlFor="nome">Nome *</label>
            <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500" />

            <div className="mt-3 grid grid-cols-[120px_1fr] gap-2">
              <div>
                <label className="block text-xs font-black" htmlFor="tipoTelefone">Tipo *</label>
                <select id="tipoTelefone" value={tipoTelefone} onChange={(e) => setTipoTelefone(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm">
                  <option>Celular</option><option>Residencial</option><option>Comercial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black" htmlFor="telefone">Telefone *</label>
                <input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="(19) 99999-9999" className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500" />
              </div>
            </div>

            <label className="mt-3 block text-xs font-black" htmlFor="email">E-mail <span className="font-normal text-slate-400">(opcional)</span></label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500" />

            <button type="button" disabled className="mt-5 w-full rounded-2xl bg-slate-300 px-5 py-4 text-sm font-black text-white">
              Registrar ocorrência
            </button>
            <p className="mt-2 text-center text-[10px] leading-4 text-slate-500">Nesta fase os dados ficam somente nesta tela. O envio para a SOMASIG ainda está bloqueado até validarmos o retorno e o protocolo.</p>
          </div>
        )}

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center text-[11px] font-bold text-amber-800">🚧 Teste: ainda não estamos enviando ocorrências.</div>
        <a href={OFICIAL_URL} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border-2 border-amber-400 bg-white px-5 py-3.5 text-center text-sm font-black text-amber-700">💡 Usar sistema oficial</a>
        <Link href="/lampada-queimada" className="block text-center text-xs font-bold text-slate-500">Voltar para Lâmpada Queimada</Link>
      </section>
    </main>
  );
}
