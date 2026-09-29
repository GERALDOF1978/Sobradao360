"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

import NegociosMarquee from "@/components/NegociosMarquee";

const servicosRapidos = [
  {
    titulo: "Anuncie",
    icone: "📢",
    cor: "bg-emerald-600",
    link: "/anuncie",
  },
  {
    titulo: "Empregos",
    icone: "💼",
    cor: "bg-indigo-600",
    link: "/empregos",
  },
  {
    titulo: "Voz do Morador",
    icone: "💬",
    cor: "bg-emerald-700",
    link: "/comunidade",
  },
  {
    titulo: "Notícias",
    icone: "📰",
    cor: "bg-teal-600",
    link: "/noticias",
  },
  {
    titulo: "Utilidades",
    icone: "📞",
    cor: "bg-slate-700",
    link: "/utilidades",
  },
];

type Exibicao = {
  marquee?: boolean;
  publicidade?: boolean;
  destaques?: boolean;
  parceiros?: boolean;
};

type AnuncioHome = {
  id: string;
  lojaId: string;
  nome: string;
  bannerUrl: string;
  exibicao: Exibicao;
};

function dataTimestamp(valor: unknown): Date | null {
  if (valor && typeof valor === "object" && "toDate" in valor) {
    const toDate = (valor as { toDate?: () => Date }).toDate;
    if (typeof toDate === "function") return toDate();
  }
  if (valor instanceof Date) return valor;
  if (typeof valor === "string" || typeof valor === "number") {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }
  return null;
}

export default function Home() {
  const [anunciosHome, setAnunciosHome] = useState<AnuncioHome[]>([]);

  useEffect(() => {
    async function carregarAnunciosHome() {
      try {
        const [lojasSnapshot, contratosSnapshot] = await Promise.all([
          getDocs(query(collection(db, "lojas_parceiras"), where("ativo", "==", true))),
          getDocs(query(collection(db, "contratos_anuncio"), where("status", "==", "ativo"))),
        ]);

        const lojas = new Map<string, Record<string, unknown>>();
        lojasSnapshot.docs.forEach((doc: (typeof lojasSnapshot.docs)[number]) => {
          const dados = doc.data() as Record<string, unknown>;
          lojas.set(doc.id, dados);
        });

        console.groupCollapsed("[Sobradão 360] Diagnóstico da publicidade da Home");
        console.log("Lojas ativas encontradas:", lojasSnapshot.size);
        console.log("Contratos ativos encontrados:", contratosSnapshot.size);
        console.table(
          lojasSnapshot.docs.map((doc: (typeof lojasSnapshot.docs)[number]) => ({
            lojaId: doc.id,
            nome: doc.data().nome || "",
            ativo: doc.data().ativo,
            bannerUrl: doc.data().bannerUrl || "",
            uidDono: doc.data().uidDono || "",
          }))
        );

        const agora = new Date();
        const lista: AnuncioHome[] = [];

        contratosSnapshot.docs.forEach((doc: (typeof contratosSnapshot.docs)[number]) => {
          const contrato = doc.data() as Record<string, unknown>;
          const lojaId = typeof contrato.lojaId === "string" ? contrato.lojaId : "";
          const loja = lojas.get(lojaId);

          console.log("[Contrato]", {
            contratoId: doc.id,
            lojaIdContrato: lojaId,
            lojaEncontrada: Boolean(loja),
            status: contrato.status,
            inicio: contrato.inicio,
            vencimento: contrato.vencimento,
            exibicao: contrato.exibicao,
          });

          if (!loja) {
            console.warn("[Contrato descartado] lojaId não corresponde a uma loja ativa:", lojaId);
            return;
          }

          const bannerUrl = typeof loja.bannerUrl === "string" ? loja.bannerUrl : "";
          if (!bannerUrl) {
            console.warn("[Contrato descartado] a loja não possui bannerUrl:", {
              lojaId,
              nome: loja.nome || "",
            });
            return;
          }

          const inicio = dataTimestamp(contrato.inicio);
          const vencimento = dataTimestamp(contrato.vencimento);
          if (inicio && inicio > agora) {
            console.warn("[Contrato descartado] início ainda não chegou:", {
              lojaId,
              inicio,
              agora,
            });
            return;
          }
          if (vencimento && vencimento < agora) {
            console.warn("[Contrato descartado] contrato vencido:", {
              lojaId,
              vencimento,
              agora,
            });
            return;
          }

          const exibicao =
            contrato.exibicao && typeof contrato.exibicao === "object"
              ? (contrato.exibicao as Exibicao)
              : {};

          lista.push({
            id: doc.id,
            lojaId,
            nome: typeof loja.nome === "string" ? loja.nome : "",
            bannerUrl,
            exibicao,
          });
        });

        console.log("Anúncios aprovados para a Home:", lista);
        console.log("Publicidade:", lista.filter((item) => item.exibicao.publicidade));
        console.log("Destaques:", lista.filter((item) => item.exibicao.destaques));
        console.log("Parceiros:", lista.filter((item) => item.exibicao.parceiros));
        console.groupEnd();

        setAnunciosHome(lista);
      } catch (erro) {
        console.error("Erro ao carregar publicidade dos parceiros:", erro);
        setAnunciosHome([]);
      }
    }

    carregarAnunciosHome();
  }, []);

  const publicidade = anunciosHome.filter((item) => item.exibicao.publicidade);
  const destaques = anunciosHome.filter((item) => item.exibicao.destaques);
  const parceiros = anunciosHome.filter((item) => item.exibicao.parceiros);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">

      <main className="max-w-md mx-auto px-3 sm:px-4 py-4 space-y-5">

        {/* ==========================================
            1. BANNER PRINCIPAL
            SOMENTE A ARTE
        ========================================== */}

        <section className="w-full overflow-hidden rounded-3xl shadow-xl border border-slate-200 bg-white">

          <img
            src="https://i.ibb.co/zTTKfgLt/banner-s360-webp.webp"
            alt="Banner Sobradão 360"
            className="w-full h-auto object-cover block"
          />

        </section>

        {/* ==========================================
            2. CATEGORIAS PRINCIPAIS
            UMA ÚNICA LINHA
        ========================================== */}

        <section className="space-y-2">

          <div className="px-1">

            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Categorias principais
            </h2>

          </div>

          <div className="w-full overflow-x-auto scrollbar-hide">

            <div className="flex gap-2 min-w-max">

              {servicosRapidos.map(
                (servico) => (
                  <Link
                    key={servico.titulo}
                    href={servico.link}
                    className="bg-white border border-slate-200 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1.5 shadow-sm hover:border-amber-400 hover:shadow-md transition group w-[78px] min-h-[82px] shrink-0"
                  >

                    <div
                      className={`w-9 h-9 rounded-xl ${servico.cor} flex items-center justify-center text-white text-base shadow-md group-hover:scale-110 transition`}
                    >
                      {servico.icone}
                    </div>

                    <span className="text-[9px] font-bold text-slate-700 leading-tight text-center">
                      {servico.titulo}
                    </span>

                  </Link>
                )
              )}

            </div>

          </div>

        </section>

        {/* ==========================================
            3. NEGÓCIOS DO SOBRADÃO
            MARQUEE
        ========================================== */}

        <NegociosMarquee />

        {/* ==========================================
            4. PUBLICIDADE
            BANNER RETANGULAR
        ========================================== */}

        <section className="space-y-2">

          <div className="px-1">

            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Publicidade
            </h2>

          </div>

          <Link
            href="/loja-explicativa?anunciante=novo"
            className="block w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-amber-400 hover:shadow-md transition"
          >

            <div className="aspect-[3/1] w-full bg-slate-200 overflow-hidden">
              {publicidade[0] ? (
                <img
                  src={publicidade[0].bannerUrl}
                  alt={publicidade[0].nome || "Publicidade"}
                  className="block h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-center px-4">
                  <div>
                    <p className="text-[10px] text-amber-300 font-black uppercase tracking-widest">Banner Retangular</p>
                    <p className="text-lg font-black text-white mt-1">Sua empresa aqui</p>
                    <p className="text-[10px] text-blue-100 mt-1">Clique e saiba como anunciar</p>
                  </div>
                </div>
              )}
            </div>

          </Link>

        </section>

        {/* ==========================================
            5. PUBLICIDADE
            2 POR LINHA
        ========================================== */}

        <section className="space-y-2">

          <div className="px-1">

            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Destaques
            </h2>

          </div>

          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((indice) => {
              const item = destaques[indice];
              return (
                <Link
                  key={item?.id || `destaque-vazio-${indice}`}
                  href={item ? `/loja/${item.lojaId}` : "/loja-explicativa?anunciante=novo"}
                  className="aspect-[3/2] w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-amber-400 transition"
                >
                  {item ? (
                    <img src={item.bannerUrl} alt={item.nome || "Destaque"} className="block h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 p-3 text-center">
                      <div>
                        <p className="text-[9px] text-emerald-100 font-bold uppercase">Anuncie</p>
                        <p className="text-sm font-black text-white">Sua marca</p>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

        </section>

        {/* ==========================================
            6. PUBLICIDADE
            4 POR TELA
        ========================================== */}

        <section className="space-y-2">

          <div className="px-1">

            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Parceiros
            </h2>

          </div>

          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((indice) => {
              const item = parceiros[indice];
              return (
                <Link
                  key={item?.id || `parceiro-vazio-${indice}`}
                  href={item ? `/loja/${item.lojaId}` : "/loja-explicativa?anunciante=novo"}
                  className="aspect-square w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-amber-400 transition"
                >
                  {item ? (
                    <img src={item.bannerUrl} alt={item.nome || "Parceiro"} className="block h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-800 p-2 text-center">
                      <span className="text-[9px] font-black text-white leading-tight">Anuncie aqui</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

        </section>

      </main>

    </div>
  );
}