"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import Curriculos from "@/components/Curriculos";
import { db } from "@/lib/firebase";
import MiniCardsAnuncio from "@/components/MiniCardsAnuncio";

interface Vaga {
  id: string;
  titulo: string;
  descricao?: string;
  empresa?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  salario?: string | null;
  beneficios?: string | null;
  escolaridade?: string | null;
  experiencia?: string | null;
  turno?: string | null;
  formatoTrabalho?: string | null;
  tipoContrato?: string | null;
  quantidadeVagas?: number | string | null;
  prazo?: string | null;
  urlTrampolim?: string | null;
  codigoVaga?: string | null;
  imagemUrl?: string | null;
  origem: "trampolim" | "rhbrasil" | "manual";
  createdAt?: any;
  autorNome?: string;
  contato?: string | null;
  observacao?: string | null;
  temArte?: boolean;
  exclusividade?: string | null;
}

/**
 * Converte qualquer valor vindo do Firestore/API
 * em texto seguro para renderização React.
 *
 * Evita o erro:
 * "Objects are not valid as a React child"
 */
function textoSeguro(valor: any): string {
  if (valor === null || valor === undefined) {
    return "";
  }

  if (typeof valor === "string") {
    return valor;
  }

  if (
    typeof valor === "number" ||
    typeof valor === "boolean"
  ) {
    return String(valor);
  }

  if (valor instanceof Date) {
    return valor.toLocaleDateString("pt-BR");
  }

  if (Array.isArray(valor)) {
    return valor
      .map((item) => textoSeguro(item))
      .filter(Boolean)
      .join(" • ");
  }

  if (typeof valor === "object") {
    // Estruturas comuns:
    // { key: "...", value: "..." }
    // { label: "...", value: "..." }
    // { name: "..." }
    if (
      Object.prototype.hasOwnProperty.call(
        valor,
        "value"
      )
    ) {
      const resultado = textoSeguro(valor.value);

      if (resultado) {
        return resultado;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(
        valor,
        "label"
      )
    ) {
      const resultado = textoSeguro(valor.label);

      if (resultado) {
        return resultado;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(
        valor,
        "name"
      )
    ) {
      const resultado = textoSeguro(valor.name);

      if (resultado) {
        return resultado;
      }
    }

    // Timestamp do Firestore
    if (
      typeof valor.toDate === "function"
    ) {
      try {
        return valor
          .toDate()
          .toLocaleDateString("pt-BR");
      } catch {
        return "";
      }
    }

    const valores = Object.values(valor)
      .map((item) => textoSeguro(item))
      .filter(Boolean);

    return valores.join(" • ");
  }

  return String(valor);
}

/**
 * Extrai uma URL somente quando o valor
 * realmente representa uma URL.
 */
function urlSeguro(valor: any): string | null {
  if (!valor) {
    return null;
  }

  if (typeof valor === "string") {
    return valor.trim() || null;
  }

  if (typeof valor === "object") {
    if (valor.url) {
      return urlSeguro(valor.url);
    }

    if (valor.src) {
      return urlSeguro(valor.src);
    }

    if (valor.value) {
      return urlSeguro(valor.value);
    }
  }

  return null;
}

/** Normaliza links relativos recebidos do Trampolim para o domínio oficial. */
function linkOficialTrampolim(valor: any, id: any): string | null {
  const recebido = urlSeguro(valor);
  if (recebido) {
    try {
      const destino = new URL(recebido, "https://www.trampolim.sp.gov.br");
      if (destino.protocol === "https:" && (destino.hostname === "trampolim.sp.gov.br" || destino.hostname === "www.trampolim.sp.gov.br")) {
        return destino.toString();
      }
    } catch { /* Link inválido: usar alternativa oficial. */ }
  }
  const codigo = textoSeguro(id).trim();
  return /^[0-9]+$/.test(codigo) ? `https://www.trampolim.sp.gov.br/pt/vagas/${codigo}/` : "https://www.trampolim.sp.gov.br/";
}

/**
 * Formata datas vindas do Firestore,
 * API ou outros formatos.
 */
function formatarData(valor: any): string {
  try {
    if (!valor) {
      return "";
    }

    // A API do Trampolim já devolve datas no formato brasileiro.
    // new Date("23/09/2026") não reconhece esse formato.
    if (typeof valor === "string") {
      const brasileira = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(valor.trim());
      if (brasileira) {
        const [, dia, mes, ano] = brasileira;
        const dataBR = new Date(Number(ano), Number(mes) - 1, Number(dia));
        if (dataBR.getFullYear() === Number(ano) && dataBR.getMonth() === Number(mes) - 1 && dataBR.getDate() === Number(dia)) {
          return `${dia}/${mes}/${ano}`;
        }
        return "";
      }
    }

    let data: Date;

    if (
      valor?.toDate &&
      typeof valor.toDate === "function"
    ) {
      data = valor.toDate();
    } else if (
      valor?.seconds !== undefined
    ) {
      data = new Date(
        Number(valor.seconds) * 1000
      );
    } else if (
      typeof valor === "object" &&
      valor.value
    ) {
      return formatarData(valor.value);
    } else {
      data = new Date(valor);
    }

    if (Number.isNaN(data.getTime())) {
      return "";
    }

    return data.toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  } catch {
    return "";
  }
}

/**
 * Formata salário com segurança.
 */
function formatarSalario(valor: any): string | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  // Caso venha como objeto { value: ... }
  if (
    typeof valor === "object" &&
    !Array.isArray(valor)
  ) {
    if (valor.value !== undefined) {
      return formatarSalario(valor.value);
    }

    if (valor.label !== undefined) {
      return textoSeguro(valor.label);
    }

    if (valor.min !== undefined) {
      const minimo = textoSeguro(valor.min);

      if (valor.max !== undefined) {
        const maximo = textoSeguro(valor.max);

        return `R$ ${minimo} - R$ ${maximo}`;
      }

      return `R$ ${minimo}`;
    }

    return textoSeguro(valor);
  }

  if (typeof valor === "number") {
    return `R$ ${valor.toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  const texto = String(valor).trim();

  if (!texto) {
    return null;
  }

  return texto;
}

/**
 * Converte quantidade de vagas para um valor seguro.
 */
function quantidadeSegura(valor: any): number | string | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  if (typeof valor === "number") {
    return valor;
  }

  const texto = textoSeguro(valor);

  if (!texto) {
    return null;
  }

  const numero = Number(texto);

  if (!Number.isNaN(numero)) {
    return numero;
  }

  return texto;
}

/**
 * Busca vagas do Trampolim + vagas cadastradas
 * manualmente no Sobradão 360.
 */
async function buscarVagas(): Promise<Vaga[]> {
  const lista: Vaga[] = [];

  /*
   * =====================================================
   * 1. PAT / TRAMPOLIM — consulta automática
   * =====================================================
   */
  try {
    const response = await fetch("/api/pat", { cache: "no-store" });

    if (response.ok) {
      const dados = await response.json();
      const vagasPat = Array.isArray(dados?.vagas) ? dados.vagas : [];

      vagasPat.forEach((vaga: any) => {
        lista.push({
          id: textoSeguro(vaga.id) || textoSeguro(vaga.idTrampolim),
          titulo: textoSeguro(vaga.titulo) || "Vaga de emprego",
          descricao: textoSeguro(vaga.descricao),
          empresa: textoSeguro(vaga.empresa) || "PAT / Trampolim",
          cidade: textoSeguro(vaga.cidade) || "Rio Claro",
          bairro: textoSeguro(vaga.bairro) || null,
          salario: formatarSalario(vaga.salario),
          beneficios: textoSeguro(vaga.beneficios) || null,
          escolaridade: textoSeguro(vaga.escolaridade) || null,
          experiencia: textoSeguro(vaga.experiencia) || null,
          turno: textoSeguro(vaga.turno) || null,
          formatoTrabalho: textoSeguro(vaga.formatoTrabalho) || null,
          tipoContrato: textoSeguro(vaga.tipoContrato) || null,
          exclusividade: textoSeguro(vaga.exclusividade) || null,
          quantidadeVagas: quantidadeSegura(vaga.quantidadeVagas),
          prazo: textoSeguro(vaga.prazo) || null,
          urlTrampolim: linkOficialTrampolim(vaga.url, vaga.idTrampolim),
          imagemUrl: urlSeguro(vaga.imagemUrl) || null,
          origem: "trampolim",
          createdAt: vaga.createdAt || null,
        });
      });
    }
  } catch (error) {
    console.warn("Não foi possível consultar as vagas automáticas do PAT:", error);
  }

  /*
   * =====================================================
   * 2. RHBrasil — vagas de Rio Claro
   * =====================================================
   */
  try {
    const response = await fetch("/api/rhbrasil", { cache: "no-store" });
    if (response.ok) {
      const dados = await response.json();
      const vagasRh = Array.isArray(dados?.vagas) ? dados.vagas : [];
      vagasRh.forEach((vaga: any) => {
        const codigo = textoSeguro(vaga.NR_REQUISICAO);
        const tituloBruto = textoSeguro(vaga.NM_CARGO) || "Vaga RHBrasil";
        lista.push({
          id: codigo || `rh-${textoSeguro(vaga.CD_CARGO)}-${tituloBruto}`,
          titulo: tituloBruto.replace(/\s*-\s*\d+\s*$/, "").trim(),
          descricao: textoSeguro(vaga.DS_OBSERVACAO_INTERNET),
          empresa: "RHBrasil",
          cidade: textoSeguro(vaga.NM_CIDADE_DIVULGA) || textoSeguro(vaga.NM_CIDADE) || textoSeguro(vaga.NM_CIDADE_UNIDADE) || "Rio Claro",
          bairro: null, salario: null, beneficios: null, escolaridade: null,
          experiencia: null, turno: null, formatoTrabalho: null, tipoContrato: null,
          quantidadeVagas: quantidadeSegura(vaga.QTD_VAGAS_REQ), prazo: null,
          urlTrampolim: codigo
            ? `https://www.rhbrasil.com.br/portaldocandidato/view/ver-vagas.php?cod=${encodeURIComponent(codigo)}`
            : "https://www.rhbrasil.com.br/portaldocandidato/view/buscar-vagas-publica.php",
          codigoVaga: codigo || null, imagemUrl: null, origem: "rhbrasil", createdAt: null,
        });
      });
    }
  } catch (error) {
    console.warn("Não foi possível consultar as vagas da RHBrasil:", error);
  }

  /*
   * =====================================================
   * 3. VAGAS MANUAIS / COMUNIDADE
   * =====================================================
   */
  try {
    const q = query(
      collection(db, "anuncios"),
      orderBy(
        "createdAt",
        "desc"
      )
    );

    const snapshot =
      await getDocs(q);

    snapshot.forEach(
      (docSnap: any) => {
        const dados =
          docSnap.data() || {};

        const categoria =
          textoSeguro(
            dados.categoria
          )
            .toLowerCase()
            .trim();

        const origem =
          textoSeguro(
            dados.origem
          )
            .toLowerCase()
            .trim();

        const ehEmprego =
          categoria ===
            "empregos" ||
          categoria ===
            "emprego";

        if (!ehEmprego) {
          return;
        }

        if (
          origem ===
          "trampolim"
        ) {
          return;
        }

        lista.push({
          id: docSnap.id,

          titulo:
            textoSeguro(
              dados.titulo
            ) ||
            "Vaga de emprego",

          descricao:
            textoSeguro(
              dados.descricao
            ),

          empresa:
            textoSeguro(
              dados.empresa
            ) ||
            textoSeguro(
              dados.autorNome
            ) ||
            "Empresa / anunciante",

          cidade:
            textoSeguro(
              dados.cidade
            ) ||
            "Rio Claro",

          bairro:
            textoSeguro(
              dados.bairro
            ) ||
            null,

          salario:
            formatarSalario(
              dados.salario
            ),

          beneficios:
            textoSeguro(
              dados.beneficios
            ) ||
            null,

          escolaridade:
            textoSeguro(
              dados.escolaridade
            ) ||
            null,

          experiencia:
            textoSeguro(
              dados.experiencia
            ) ||
            null,

          turno:
            textoSeguro(
              dados.turno
            ) ||
            null,

          formatoTrabalho:
            textoSeguro(
              dados.formatoTrabalho
            ) ||
            null,

          tipoContrato:
            textoSeguro(
              dados.tipoContrato
            ) ||
            null,

          quantidadeVagas:
            quantidadeSegura(
              dados.quantidadeVagas
            ),

          prazo:
            textoSeguro(
              dados.prazo
            ) ||
            null,

          imagemUrl:
            urlSeguro(
              dados.imagemUrl
            ),

          origem: "manual",

          createdAt:
            dados.createdAt,

          autorNome:
            textoSeguro(dados.nomeContato) ||
            textoSeguro(dados.autorNome) ||
            "Morador",

          contato:
            textoSeguro(dados.contato) ||
            null,

          observacao:
            textoSeguro(dados.observacao) ||
            null,

          temArte:
            dados.temArte === true,
        });
      }
    );
  } catch (error) {
    console.warn(
      "Não foi possível consultar as vagas manuais:",
      error
    );
  }

  return lista;
}

type AbaEmpregos =
  | "trampolim"
  | "rhbrasil"
  | "manual"
  | "curriculos";

export default function EmpregosPage() {
  const [
    aba,
    setAba,
  ] =
    useState<AbaEmpregos>(
      "trampolim"
    );

  const [
    vagas,
    setVagas,
  ] =
    useState<Vaga[]>([]);

  const [
    busca,
    setBusca,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    erro,
    setErro,
  ] =
    useState("");

  async function carregarVagas() {
    setLoading(true);
    setErro("");

    try {
      const lista =
        await buscarVagas();

      setVagas(lista);
    } catch (error) {
      console.error(
        "Erro ao carregar vagas:",
        error
      );

      setErro(
        "Não foi possível carregar as vagas."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarVagas();
  }, []);

  const vagasFiltradas =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      return vagas.filter(
        (vaga) => {
          if (
            aba ===
              "trampolim" &&
            vaga.origem !==
              "trampolim"
          ) {
            return false;
          }

          if (aba === "rhbrasil" && vaga.origem !== "rhbrasil") {
            return false;
          }

          if (
            aba ===
              "manual" &&
            vaga.origem !==
              "manual"
          ) {
            return false;
          }

          if (!termo) {
            return true;
          }

          const texto =
            [
              vaga.titulo,
              vaga.descricao,
              vaga.empresa,
              vaga.cidade,
              vaga.bairro,
              vaga.salario,
              vaga.beneficios,
              vaga.escolaridade,
              vaga.experiencia,
              vaga.turno,
              vaga.formatoTrabalho,
              vaga.tipoContrato,
              vaga.prazo,
              vaga.autorNome,
              vaga.contato,
              vaga.observacao,
            ]
              .filter(Boolean)
              .map((item) =>
                textoSeguro(item)
              )
              .join(" ")
              .toLowerCase();

          return texto.includes(
            termo
          );
        }
      );
    }, [
      vagas,
      aba,
      busca,
    ]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-36 font-sans">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-700 text-white shadow-md">
        <div className="max-w-md mx-auto px-4 py-2.5">
          <div className="relative flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg">💼</div>
              <h1 className="text-base font-black">Empregos</h1>
            </div>
            <span className="absolute right-0 rounded-lg bg-amber-400 px-2 py-1 text-[9px] font-black text-slate-950">Rio Claro</span>
          </div>
          <p className="mt-1 text-center text-[10px] leading-3 text-white/85">
            Vagas, oportunidades e currículos da comunidade.
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-3 space-y-4">
        <MiniCardsAnuncio />

        {/* SUBMENU */}
        <section className="bg-white border border-slate-200 rounded-3xl p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
              Empregos
            </p>
            <div className="flex items-center gap-1.5">
              <Link
                href="/empregos/cadastrar"
                className="rounded-xl bg-emerald-600 px-2.5 py-2 text-[9px] font-black text-white shadow-sm hover:bg-emerald-700"
              >
                ➕ Cadastrar vaga
              </Link>
              <button
                type="button"
                onClick={() => {
                  setAba("curriculos");
                  setBusca("");
                  window.setTimeout(() => {
                    window.dispatchEvent(new Event("abrir-cadastro-curriculo"));
                  }, 0);
                }}
                className="rounded-xl bg-amber-400 px-2.5 py-2 text-[9px] font-black text-slate-950 shadow-sm hover:bg-amber-300"
              >
                📄 Cadastrar currículo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">

            {/* TRAMPOLIM */}
            <button
              type="button"
              onClick={() => {
                setAba(
                  "trampolim"
                );
                setBusca("");
              }}
              className={`rounded-2xl p-3 text-center text-[11px] font-black transition ${
                aba ===
                "trampolim"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              🌐
              <br />
              PAT
            </button>

            <button type="button" onClick={() => { setAba("rhbrasil"); setBusca(""); }} className={`rounded-2xl p-3 text-center text-[11px] font-black transition ${aba === "rhbrasil" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
              💼<br />RHBrasil
            </button>

            {/* VAGAS MANUAIS */}
            <button
              type="button"
              onClick={() => {
                setAba(
                  "manual"
                );
                setBusca("");
              }}
              className={`rounded-2xl p-3 text-center text-[11px] font-black transition ${
                aba ===
                "manual"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              👤
              <br />
              Vagas
            </button>

            {/* CURRÍCULOS */}
            <button
              type="button"
              onClick={() => {
                setAba(
                  "curriculos"
                );
                setBusca("");
              }}
              className={`rounded-2xl p-3 text-center text-[11px] font-black transition ${
                aba ===
                "curriculos"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              📄
              <br />
              Currículos
            </button>
          </div>
        </section>

        {/* CURRÍCULOS */}
        {aba ===
          "curriculos" && (
          <Curriculos />
        )}

        {/* VAGAS */}
        {aba !==
          "curriculos" && (
          <>
            {/* BUSCA */}
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400">
                🔍
              </span>

              <input
                type="text"
                value={busca}
                onChange={(e) =>
                  setBusca(
                    e.target.value
                  )
                }
                placeholder="Buscar vaga, empresa ou profissão..."
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 pl-10 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* BANNER TRAMPOLIM */}
            {aba ===
              "trampolim" && (
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white p-5 rounded-3xl shadow-lg">
                <span className="inline-flex bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-black">
                  🏢 PAT
                </span>

                <h3 className="font-black text-base mt-2">
                  Vagas oficiais
                </h3>

                <p className="text-xs text-indigo-100 mt-2 leading-relaxed">
                  Consulte as oportunidades oficiais disponíveis para Rio Claro.
                </p>
              </div>
            )}

            {/* BANNER RHBrasil */}
            {aba === "rhbrasil" && (
              <div className="bg-gradient-to-br from-sky-900 via-blue-800 to-indigo-900 text-white p-5 rounded-3xl shadow-lg">
                <span className="inline-flex bg-white/15 px-2.5 py-1 rounded-lg text-[10px] font-black">RHBrasil</span>
                <h3 className="font-black text-base mt-2">Vagas RHBrasil</h3>
                <p className="text-xs text-blue-100 mt-2 leading-relaxed">Oportunidades encontradas para Rio Claro, atualizadas diretamente da RHBrasil.</p>
              </div>
            )}

            {/* BANNER MANUAL */}
            {aba ===
              "manual" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
                <h3 className="font-black text-sm">
                  👤 Vagas cadastradas
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Oportunidades publicadas por empresas e moradores no Sobradão 360.
                </p>
              </div>
            )}

            {/* CONTADOR */}
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-slate-500">
                {loading
                  ? "Carregando vagas..."
                  : `${vagasFiltradas.length} vaga${
                      vagasFiltradas.length ===
                      1
                        ? ""
                        : "s"
                    }`}
              </span>

              <button
                type="button"
                onClick={
                  carregarVagas
                }
                disabled={
                  loading
                }
                className="text-xs font-bold text-indigo-700 disabled:opacity-50"
              >
                ↻ Atualizar
              </button>
            </div>

            {/* ERRO */}
            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-red-700">
                  ⚠️ {erro}
                </p>
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="bg-white rounded-3xl p-4 animate-pulse"
                    >
                      <div className="h-4 bg-slate-200 rounded w-2/3" />

                      <div className="h-3 bg-slate-200 rounded w-1/2 mt-3" />

                      <div className="h-3 bg-slate-200 rounded w-full mt-2" />
                    </div>
                  )
                )}
              </div>
            )}

            {/* LISTA */}
            {!loading &&
              !erro &&
              vagasFiltradas.length >
                0 && (
                <section className="space-y-3">
                  {vagasFiltradas.map(
                    (vaga) => (
                      <article
                        key={`${vaga.origem}-${vaga.id}`}
                        className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-5"
                      >
                        {/* IMAGEM: logotipo compacto no cabeçalho para vagas do Trampolim */}
                        {vaga.imagemUrl && vaga.origem !== "trampolim" && (
                          <div className="w-full h-40 bg-slate-100">
                            <img
                              src={
                                vaga.imagemUrl
                              }
                              alt={
                                textoSeguro(
                                  vaga.empresa
                                ) ||
                                "Empresa"
                              }
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="p-4">

                          {/* ORIGEM / DATA */}
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[9px] font-black bg-indigo-100 text-indigo-800 px-2 py-1 rounded-lg">
                              {vaga.origem === "trampolim" ? "🏢 PAT" : vaga.origem === "rhbrasil" ? "💼 RHBrasil" : "👤 COMUNIDADE"}
                            </span>

                            {formatarData(
                              vaga.createdAt
                            ) && (
                              <span className="text-[9px] text-slate-400">
                                {formatarData(
                                  vaga.createdAt
                                )}
                              </span>
                            )}
                          </div>

                          {vaga.origem === "trampolim" && (
                            <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                              {vaga.imagemUrl ? <img src={vaga.imagemUrl} alt={vaga.empresa || "Empresa"} className="h-14 w-14 shrink-0 rounded-lg border bg-white object-contain p-1" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling?.classList.remove("hidden"); }} /> : null}<div className={`${vaga.imagemUrl ? "hidden" : ""} flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-2xl`}>🏢</div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-900">{vaga.empresa || "Empresa não informada"}</p>
                                <p className="text-[11px] text-slate-500">{[vaga.bairro,vaga.cidade].filter(Boolean).join(" • ")}</p>
                              </div>
                            </div>
                          )}

                          {/* TÍTULO */}
                          <h3 className="font-black text-base text-slate-900 mt-2">
                            {textoSeguro(
                              vaga.titulo
                            )}
                          </h3>

                          {/* EMPRESA */}
                          {vaga.empresa && vaga.origem !== "trampolim" && (
                            <p className="text-xs font-bold text-slate-700 mt-1">
                              🏢{" "}
                              {textoSeguro(
                                vaga.empresa
                              )}
                            </p>
                          )}

                          {/* LOCAL */}
                          {vaga.origem !== "trampolim" && (vaga.cidade ||
                            vaga.bairro) && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              📍{" "}
                              {[
                                vaga.bairro,
                                vaga.cidade,
                              ]
                                .filter(
                                  Boolean
                                )
                                .map(
                                  (
                                    item
                                  ) =>
                                    textoSeguro(
                                      item
                                    )
                                )
                                .join(
                                  " • "
                                )}
                            </p>
                          )}

                          {/* SALÁRIO */}
                          {vaga.salario && (
                            <div className="mt-3 inline-block bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-black">
                              💰{" "}
                              {textoSeguro(
                                vaga.salario
                              )}
                            </div>
                          )}

                          {/* DETALHES */}
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600 [&>p]:rounded-lg [&>p]:bg-slate-50 [&>p]:px-2.5 [&>p]:py-1.5 [&>p]:max-w-full">

                            {vaga.quantidadeVagas !==
                              null &&
                              vaga.quantidadeVagas !==
                                undefined &&
                              String(
                                vaga.quantidadeVagas
                              ) !==
                                "" && (
                                <p>
                                  👥{" "}
                                  {textoSeguro(
                                    vaga.quantidadeVagas
                                  )}{" "}
                                  vaga(s)
                                </p>
                              )}

                            {vaga.tipoContrato && (
                              <p>
                                📋{" "}
                                {textoSeguro(
                                  vaga.tipoContrato
                                )}
                              </p>
                            )}

                            {vaga.turno && (
                              <p>
                                🕐{" "}
                                {textoSeguro(
                                  vaga.turno
                                )}
                              </p>
                            )}

                            {vaga.formatoTrabalho && (
                              <p>
                                🏠{" "}
                                {textoSeguro(
                                  vaga.formatoTrabalho
                                )}
                              </p>
                            )}

                            {vaga.escolaridade && (
                              <p>
                                🎓{" "}
                                {textoSeguro(
                                  vaga.escolaridade
                                )}
                              </p>
                            )}

                            {vaga.experiencia && (
                              <p>
                                🧰{" "}
                                {textoSeguro(
                                  vaga.experiencia
                                )}
                              </p>
                            )}

                            {vaga.beneficios && (
                              <p>
                                🎁{" "}
                                {textoSeguro(
                                  vaga.beneficios
                                )}
                              </p>
                            )}

                            {vaga.prazo && (
                              <p>
                                ⏳{" "}
                                Prazo: {formatarData(vaga.prazo) || textoSeguro(vaga.prazo)}
                              </p>
                            )}
                          </div>

                          {vaga.exclusividade && !["false","0","não","nao"].includes(vaga.exclusividade.toLowerCase()) && <p className="mt-2 text-xs font-semibold text-indigo-700">♿ {vaga.exclusividade === "true" ? "Vaga exclusiva para pessoa com deficiência" : vaga.exclusividade}</p>}

                          {/* DESCRIÇÃO */}
                          {vaga.descricao && (
                            <p className="text-xs text-slate-600 leading-relaxed mt-4 whitespace-pre-line line-clamp-3">
                              {textoSeguro(
                                vaga.descricao
                              )}
                            </p>
                          )}

                          {vaga.origem === "manual" && (vaga.autorNome || vaga.contato || vaga.observacao) && (
                            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-[11px] text-slate-700">
                              <p className="font-black text-slate-800">Contato da publicação</p>
                              {vaga.autorNome && <p className="mt-1">👤 {textoSeguro(vaga.autorNome)}</p>}
                              {vaga.contato && <p className="mt-1">📱 {textoSeguro(vaga.contato)}</p>}
                              {vaga.observacao && <p className="mt-1">📝 {textoSeguro(vaga.observacao)}</p>}
                            </div>
                          )}

                          {vaga.origem === "rhbrasil" && vaga.codigoVaga && (
                            <div className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-[11px] font-bold text-sky-800">Código da vaga: {vaga.codigoVaga}</div>
                          )}

                          {/* LINK DA FONTE */}
                          {vaga.urlTrampolim && (
                            <a
                              href={
                                vaga.urlTrampolim
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2.5 rounded-xl text-xs font-black"
                            >
                              {vaga.origem === "rhbrasil" ? "Ver / candidatar-se na RHBrasil" : "Ver vaga no PAT"}
                            </a>
                          )}
                        </div>
                      </article>
                    )
                  )}
                </section>
              )}

            {/* SEM RESULTADOS */}
            {!loading &&
              !erro &&
              vagasFiltradas.length ===
                0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center">
                  <div className="text-4xl">
                    💼
                  </div>

                  <h3 className="font-black mt-3">
                    Nenhuma vaga encontrada
                  </h3>

                  <p className="text-xs text-slate-500 mt-2">
                    {busca
                      ? "Tente outra busca."
                      : "Ainda não existem vagas nesta categoria."}
                  </p>
                </div>
              )}
          </>
        )}

        {/* RODAPÉ */}
        <div className="text-center pt-2">
          <p className="text-[10px] text-slate-400">
            Sobradão 360 • Empregos
          </p>
        </div>
      </main>
    </div>
  );
}