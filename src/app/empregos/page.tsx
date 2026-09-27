"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import Curriculos from "@/components/Curriculos";

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
  imagemUrl?: string | null;
  origem: "trampolim" | "manual";
  createdAt?: any;
  autorNome?: string;
}

type AbaEmpregos = "trampolim" | "manual" | "curriculos";

function formatarData(valor: any): string {
  try {
    if (!valor) return "";

    let data: Date;

    if (
      valor?.toDate &&
      typeof valor.toDate === "function"
    ) {
      data = valor.toDate();
    } else if (valor?.seconds) {
      data = new Date(valor.seconds * 1000);
    } else {
      data = new Date(valor);
    }

    if (Number.isNaN(data.getTime())) {
      return "";
    }

    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatarSalario(valor: any): string | null {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (typeof valor === "number") {
    return `R$ ${valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return String(valor);
}

async function buscarVagas(): Promise<Vaga[]> {
  const lista: Vaga[] = [];

  // ==========================================
  // VAGAS OFICIAIS / TRAMPOLIM
  // ==========================================

  try {
    const snapshot = await getDocs(
      collection(db, "vagas")
    );

    snapshot.forEach((docSnap: any) => {
      const vaga = docSnap.data();

      const empresa =
        vaga.enterprise?.fantasy_name ||
        vaga.enterprise?.corporate_name ||
        vaga.company ||
        vaga.companyName ||
        vaga.empresa ||
        null;

      const cidade =
        vaga.address?.city ||
        vaga.city ||
        vaga.cidade ||
        "Rio Claro";

      const bairro =
        vaga.address?.neighborhood ||
        vaga.neighborhood ||
        vaga.bairro ||
        null;

      const titulo =
        vaga.title ||
        vaga.titulo ||
        vaga.position ||
        vaga.job_title ||
        "Vaga de emprego";

      let salario: string | null = null;

      if (vaga.salary_value != null) {
        salario = formatarSalario(
          Number(vaga.salary_value)
        );
      } else if (vaga.salary_final_value != null) {
        salario = formatarSalario(
          Number(vaga.salary_final_value)
        );
      } else if (vaga.salary_type?.value) {
        salario = String(
          vaga.salary_type.value
        );
      } else if (vaga.salary != null) {
        salario = String(vaga.salary);
      } else if (vaga.salario != null) {
        salario = String(vaga.salario);
      }

      let beneficios: string | null = null;

      if (Array.isArray(vaga.benefits)) {
        beneficios =
          vaga.benefits.join(" • ");
      } else if (vaga.benefits) {
        beneficios = String(vaga.benefits);
      } else if (vaga.beneficios) {
        beneficios = String(vaga.beneficios);
      }

      let urlTrampolim: string | null = null;

      if (vaga.absolute_url) {
        if (
          String(vaga.absolute_url).startsWith(
            "http"
          )
        ) {
          urlTrampolim =
            vaga.absolute_url;
        } else {
          urlTrampolim =
            `https://www.trampolim.sp.gov.br${vaga.absolute_url}`;
        }
      } else if (vaga.url) {
        urlTrampolim = vaga.url;
      } else if (vaga.urlTrampolim) {
        urlTrampolim =
          vaga.urlTrampolim;
      } else if (vaga.id || docSnap.id) {
        urlTrampolim =
          `https://www.trampolim.sp.gov.br/pt/vagas/${
            vaga.id || docSnap.id
          }/`;
      }

      lista.push({
        id: docSnap.id,
        titulo,
        descricao:
          vaga.description ||
          vaga.descricao ||
          "",
        empresa,
        cidade,
        bairro,
        salario,
        beneficios,
        escolaridade:
          vaga.education ||
          vaga.escolaridade ||
          null,
        experiencia:
          vaga.experience ||
          vaga.experiencia ||
          null,
        turno:
          vaga.shift ||
          vaga.turno ||
          null,
        formatoTrabalho:
          vaga.work_format ||
          vaga.formatoTrabalho ||
          null,
        tipoContrato:
          vaga.contract_type ||
          vaga.tipoContrato ||
          null,
        quantidadeVagas:
          vaga.quantity ||
          vaga.quantity_vacancies ||
          vaga.quantidadeVagas ||
          null,
        prazo:
          vaga.deadline ||
          vaga.prazo ||
          null,
        urlTrampolim,
        imagemUrl:
          vaga.enterprise?.logo ||
          vaga.logo ||
          vaga.imageUrl ||
          vaga.imagemUrl ||
          null,
        origem: "trampolim",
        createdAt:
          vaga.createdAt ||
          vaga.created_at ||
          vaga.updatedAt ||
          null,
      });
    });
  } catch (error) {
    console.error(
      "Erro ao buscar vagas do Trampolim:",
      error
    );
  }

  // ==========================================
  // VAGAS MANUAIS DO SOBRADÃO 360
  // ==========================================

  try {
    const q = query(
      collection(db, "anuncios"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    snapshot.forEach((docSnap: any) => {
      const dados = docSnap.data();

      const categoria =
        String(
          dados.categoria || ""
        )
          .toLowerCase()
          .trim();

      const origem =
        String(
          dados.origem || ""
        )
          .toLowerCase()
          .trim();

      const ehEmprego =
        categoria === "empregos" ||
        categoria === "emprego";

      if (!ehEmprego) {
        return;
      }

      // Vagas oficiais do Trampolim não entram aqui.
      if (origem === "trampolim") {
        return;
      }

      lista.push({
        id: docSnap.id,
        titulo:
          dados.titulo ||
          "Vaga de emprego",
        descricao:
          dados.descricao ||
          "",
        empresa:
          dados.empresa ||
          dados.autorNome ||
          "Empresa / anunciante",
        cidade:
          dados.cidade ||
          "Rio Claro",
        bairro:
          dados.bairro ||
          null,
        salario:
          dados.salario ||
          null,
        beneficios:
          dados.beneficios ||
          null,
        escolaridade:
          dados.escolaridade ||
          null,
        experiencia:
          dados.experiencia ||
          null,
        turno:
          dados.turno ||
          null,
        formatoTrabalho:
          dados.formatoTrabalho ||
          null,
        tipoContrato:
          dados.tipoContrato ||
          null,
        quantidadeVagas:
          dados.quantidadeVagas ||
          null,
        prazo:
          dados.prazo ||
          null,
        imagemUrl:
          dados.imagemUrl ||
          null,
        origem: "manual",
        createdAt:
          dados.createdAt,
        autorNome:
          dados.autorNome ||
          "Morador",
      });
    });
  } catch (error) {
    console.error(
      "Erro ao buscar vagas manuais:",
      error
    );
  }

  return lista;
}

export default function EmpregosPage() {
  const { user } = useAuth();

  const [aba, setAba] =
    useState<AbaEmpregos>("trampolim");

  const [vagas, setVagas] =
    useState<Vaga[]>([]);

  const [busca, setBusca] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro("");

      try {
        const lista =
          await buscarVagas();

        setVagas(lista);
      } catch (error) {
        console.error(error);

        setErro(
          "Não foi possível carregar as vagas."
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const vagasFiltradas = useMemo(() => {
    const termo =
      busca
        .trim()
        .toLowerCase();

    return vagas.filter((vaga) => {
      if (
        aba === "trampolim" &&
        vaga.origem !== "trampolim"
      ) {
        return false;
      }

      if (
        aba === "manual" &&
        vaga.origem !== "manual"
      ) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const texto = [
        vaga.titulo,
        vaga.descricao,
        vaga.empresa,
        vaga.cidade,
        vaga.bairro,
        vaga.salario,
        vaga.beneficios,
        vaga.escolaridade,
        vaga.experiencia,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [vagas, aba, busca]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">

      {/* HEADER */}
      <header className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 border-b border-blue-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">

          <Link
            href="/"
            className="text-white text-xs font-bold hover:text-amber-400"
          >
            ← Início
          </Link>

          <h1 className="font-black text-sm text-white">
            💼 Empregos
          </h1>

          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg">
            Rio Claro
          </span>

        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">

        {/* APRESENTAÇÃO */}
        <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl">
              💼
            </div>

            <div>
              <h2 className="font-black text-lg">
                Oportunidades de emprego
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Vagas e currículos da comunidade.
              </p>
            </div>

          </div>

        </section>

        {/* SUBMENU */}
        <section className="bg-white border border-slate-200 rounded-3xl p-3 shadow-sm">

          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2">
            Empregos
          </p>

          <div className="grid grid-cols-3 gap-2">

            <button
              type="button"
              onClick={() => {
                setAba("trampolim");
                setBusca("");
              }}
              className={`rounded-2xl p-3 text-center text-[11px] font-black transition ${
                aba === "trampolim"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              🌐
              <br />
              Trampolim
            </button>

            <button
              type="button"
              onClick={() => {
                setAba("manual");
                setBusca("");
              }}
              className={`rounded-2xl p-3 text-center text-[11px] font-black transition ${
                aba === "manual"
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              👤
              <br />
              Vagas
            </button>

            <button
              type="button"
              onClick={() => {
                setAba("curriculos");
                setBusca("");
              }}
              className={`rounded-2xl p-3 text-center text-[11px] font-black transition ${
                aba === "curriculos"
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
        {aba === "curriculos" && (
          <Curriculos />
        )}

        {/* VAGAS */}
        {aba !== "curriculos" && (
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
                  setBusca(e.target.value)
                }
                placeholder="Buscar vaga, empresa ou profissão..."
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 pl-10 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

            </div>

            {/* INFO */}
            {aba === "trampolim" && (
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white p-5 rounded-3xl shadow-lg">

                <span className="inline-flex bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-black">
                  🌐 TRAMPOLIM / PAT
                </span>

                <h3 className="font-black text-base mt-2">
                  Vagas oficiais
                </h3>

                <p className="text-xs text-indigo-100 mt-2 leading-relaxed">
                  Consulte as oportunidades disponibilizadas
                  pelo Trampolim para Rio Claro.
                </p>

              </div>
            )}

            {aba === "manual" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">

                <h3 className="font-black text-sm">
                  👤 Vagas cadastradas
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  Oportunidades publicadas por empresas
                  e moradores no Sobradão 360.
                </p>

              </div>
            )}

            {/* CONTADOR */}
            <div className="flex justify-between items-center px-1">

              <span className="text-xs text-slate-500">
                {loading
                  ? "Carregando vagas..."
                  : `${vagasFiltradas.length} vaga${
                      vagasFiltradas.length === 1
                        ? ""
                        : "s"
                    }`}
              </span>

              <button
                type="button"
                onClick={async () => {
                  setLoading(true);

                  try {
                    const lista =
                      await buscarVagas();

                    setVagas(lista);
                  } catch {
                    setErro(
                      "Não foi possível atualizar."
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-xs font-bold text-indigo-700"
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

                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="bg-white rounded-3xl p-4 animate-pulse"
                  >
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/2 mt-3" />
                    <div className="h-3 bg-slate-200 rounded w-full mt-2" />
                  </div>
                ))}

              </div>
            )}

            {/* LISTA */}
            {!loading &&
              !erro &&
              vagasFiltradas.length > 0 && (
                <section className="space-y-3">

                  {vagasFiltradas.map(
                    (vaga) => (
                      <article
                        key={`${vaga.origem}-${vaga.id}`}
                        className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
                      >

                        {vaga.imagemUrl && (
                          <div className="w-full h-40 bg-slate-100">
                            <img
                              src={vaga.imagemUrl}
                              alt={vaga.empresa || "Empresa"}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="p-4">

                          <div className="flex justify-between items-start gap-2">

                            <span className="text-[9px] font-black bg-indigo-100 text-indigo-800 px-2 py-1 rounded-lg">
                              {vaga.origem === "trampolim"
                                ? "🌐 TRAMPOLIM"
                                : "👤 COMUNIDADE"}
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

                          <h3 className="font-black text-base text-slate-900 mt-2">
                            {vaga.titulo}
                          </h3>

                          {vaga.empresa && (
                            <p className="text-xs font-bold text-slate-700 mt-1">
                              🏢 {vaga.empresa}
                            </p>
                          )}

                          {(vaga.cidade ||
                            vaga.bairro) && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              📍{" "}
                              {[
                                vaga.bairro,
                                vaga.cidade,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          )}

                          {vaga.salario && (
                            <div className="mt-3 inline-block bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-black">
                              💰 {vaga.salario}
                            </div>
                          )}

                          <div className="mt-3 space-y-1.5 text-[11px] text-slate-600">

                            {vaga.quantidadeVagas && (
                              <p>
                                👥{" "}
                                {vaga.quantidadeVagas} vaga(s)
                              </p>
                            )}

                            {vaga.tipoContrato && (
                              <p>
                                📋{" "}
                                {vaga.tipoContrato}
                              </p>
                            )}

                            {vaga.turno && (
                              <p>
                                🕐 {vaga.turno}
                              </p>
                            )}

                            {vaga.formatoTrabalho && (
                              <p>
                                🏠{" "}
                                {vaga.formatoTrabalho}
                              </p>
                            )}

                            {vaga.escolaridade && (
                              <p>
                                🎓{" "}
                                {vaga.escolaridade}
                              </p>
                            )}

                            {vaga.experiencia && (
                              <p>
                                🧰{" "}
                                {vaga.experiencia}
                              </p>
                            )}

                            {vaga.beneficios && (
                              <p>
                                🎁{" "}
                                {vaga.beneficios}
                              </p>
                            )}

                          </div>

                          {vaga.descricao && (
                            <p className="text-xs text-slate-600 leading-relaxed mt-4 whitespace-pre-line">
                              {vaga.descricao}
                            </p>
                          )}

                          {vaga.urlTrampolim && (
                            <a
                              href={vaga.urlTrampolim}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2.5 rounded-xl text-xs font-black"
                            >
                              🌐 Ver vaga no Trampolim
                            </a>
                          )}

                        </div>

                      </article>
                    )
                  )}

                </section>
              )}

            {!loading &&
              !erro &&
              vagasFiltradas.length === 0 && (
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

        <div className="text-center pt-2">
          <p className="text-[10px] text-slate-400">
            Sobradão 360 • Empregos
          </p>
        </div>

      </main>
    </div>
  );
}