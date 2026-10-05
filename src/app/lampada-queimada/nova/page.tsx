"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const OFICIAL_URL = "https://ip.somasig.com.br/ocorrencias/rioclaro";

const TIPOS = [
  "Lâmpada apagada",
  "Lâmpada oscilando",
  "Lâmpada acesa durante o dia",
  "Vandalismo",
  "Problema no poste",
  "Outro problema",
  "Pedido de ponto de iluminação",
  "Pedido de melhoria",
  "Setor apagado",
  "Setor aceso durante o dia",
];

type GeoFeature = {
  type?: string;
  geometry?: { type?: string; coordinates?: unknown };
  properties?: Record<string, unknown>;
};

function contarPontos(valor: unknown): number {
  if (!valor || typeof valor !== "object") return 0;
  const obj = valor as Record<string, unknown>;
  if (Array.isArray(obj.features)) return obj.features.length;
  return 0;
}

function amostraFeature(valor: unknown): GeoFeature | null {
  if (!valor || typeof valor !== "object") return null;
  const features = (valor as Record<string, unknown>).features;
  if (!Array.isArray(features) || !features.length) return null;
  return (features[0] as GeoFeature) || null;
}

export default function NovaOcorrenciaIluminacaoPage() {
  const [tipo, setTipo] = useState("");
  const [pontos, setPontos] = useState<unknown>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await fetch("/api/iluminacao/pontos", { cache: "no-store" });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados?.erro || "Falha ao carregar os pontos.");
        if (ativo) setPontos(dados);
      } catch (e) {
        if (ativo) setErro(e instanceof Error ? e.message : "Falha ao carregar os pontos.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const quantidade = useMemo(() => contarPontos(pontos), [pontos]);
  const amostra = useMemo(() => amostraFeature(pontos), [pontos]);
  const nomesCampos = amostra?.properties ? Object.keys(amostra.properties) : [];

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
            <span className="text-slate-400">2 Local</span>
            <span className="text-slate-400">3 Seus dados</span>
          </div>

          <label className="text-sm font-black text-slate-800" htmlFor="tipo">
            Tipo da ocorrência
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-sm font-semibold outline-none focus:border-amber-500"
          >
            <option value="">Selecione o problema</option>
            {TIPOS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🗺️</div>
            <div>
              <h2 className="font-black">Pontos de iluminação</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Primeiro estamos validando a leitura dos pontos oficiais. O envio de ocorrência ainda não está liberado nesta tela.
              </p>
            </div>
          </div>

          {carregando && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
              Carregando pontos de iluminação…
            </div>
          )}

          {!carregando && erro && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="text-sm font-black text-red-700">Não conseguimos carregar os pontos.</div>
              <div className="mt-1 text-xs leading-5 text-red-600">{erro}</div>
            </div>
          )}

          {!carregando && !erro && pontos !== null && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-sm font-black text-emerald-800">✅ Conexão com os pontos funcionando</div>
              <div className="mt-1 text-xs text-emerald-700">
                {quantidade > 0 ? `${quantidade.toLocaleString("pt-BR")} pontos recebidos.` : "Resposta recebida da API."}
              </div>
              {nomesCampos.length > 0 && (
                <div className="mt-3 rounded-xl bg-white/70 p-3 text-[11px] leading-5 text-slate-600">
                  Campos encontrados no ponto: {nomesCampos.slice(0, 12).join(", ")}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={!tipo || pontos === null || !!erro}
            className="mt-4 w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            📍 Abrir mapa dos pontos
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            O mapa será habilitado depois de confirmarmos os campos recebidos da API.
          </p>
        </div>

        <a
          href={OFICIAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl border-2 border-amber-400 bg-white px-5 py-3.5 text-center text-sm font-black text-amber-700"
        >
          💡 Usar sistema oficial
        </a>

        <Link href="/lampada-queimada" className="block text-center text-xs font-bold text-slate-500">
          Voltar para Lâmpada Queimada
        </Link>
      </section>
    </main>
  );
}
