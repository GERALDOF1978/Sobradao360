"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

import NegociosMarquee from "@/components/NegociosMarquee";

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
  artePublicidadeUrl: string;
  arteDestaquesUrl: string;
  arteParceirosUrl: string;
  exibicao: Exibicao;
};

type LojaHome = {
  id: string;
  nome: string;
  bannerUrl: string;
};

function dataTimestamp(valor: unknown): Date | null {
  if (valor instanceof Date) return valor;

  if (valor && typeof valor === "object") {
    const timestamp = valor as {
      toDate?: () => Date;
      toMillis?: () => number;
    };

    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }

    if (typeof timestamp.toMillis === "function") {
      return new Date(timestamp.toMillis());
    }
  }

  if (typeof valor === "string" || typeof valor === "number") {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  return null;
}

export default function Home() {
  const [anunciosHome, setAnunciosHome] = useState<AnuncioHome[]>([]);
  const [lojasAtivas, setLojasAtivas] = useState<LojaHome[]>([]);
  const [buscaLoja, setBuscaLoja] = useState("");
  const [indicePublicidade, setIndicePublicidade] = useState(0);
  const [indiceDestaques, setIndiceDestaques] = useState(0);

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

        setLojasAtivas(
          lojasSnapshot.docs
            .map((doc: (typeof lojasSnapshot.docs)[number]) => {
              const dados = doc.data() as Record<string, unknown>;
              const bannerUrl =
                typeof dados.arteParceirosUrl === "string" && dados.arteParceirosUrl
                  ? dados.arteParceirosUrl
                  : typeof dados.bannerUrl === "string" && dados.bannerUrl
                    ? dados.bannerUrl
                    : typeof dados.imagemUrl === "string" ? dados.imagemUrl : "";
              const nome = typeof dados.nome === "string" ? dados.nome : "";
              return { id: doc.id, nome, bannerUrl };
            })
            .filter((loja: LojaHome) => loja.nome || loja.bannerUrl)
        );

        const agora = new Date();
        const lista: AnuncioHome[] = [];

        contratosSnapshot.docs.forEach((doc: (typeof contratosSnapshot.docs)[number]) => {
          const contrato = doc.data() as Record<string, unknown>;
          const lojaId = typeof contrato.lojaId === "string" ? contrato.lojaId : "";
          const loja = lojas.get(lojaId);

          if (!loja) {
            return;
          }

          const bannerUrl =
            typeof loja.bannerUrl === "string" && loja.bannerUrl
              ? loja.bannerUrl
              : typeof loja.imagemUrl === "string" ? loja.imagemUrl : "";
          const artePublicidadeUrl =
            typeof loja.artePublicidadeUrl === "string" ? loja.artePublicidadeUrl : "";
          const arteDestaquesUrl =
            typeof loja.arteDestaquesUrl === "string" ? loja.arteDestaquesUrl : "";
          const arteParceirosUrl =
            typeof loja.arteParceirosUrl === "string" ? loja.arteParceirosUrl : "";

          const inicio = dataTimestamp(contrato.inicio);
          const vencimento = dataTimestamp(contrato.vencimento);
          if (inicio && inicio > agora) {
            return;
          }
          if (vencimento && vencimento < agora) {
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
            artePublicidadeUrl,
            arteDestaquesUrl,
            arteParceirosUrl,
            exibicao,
          });
        });


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

  useEffect(() => {
    const paginas = Math.max(1, Math.ceil(publicidade.length / 3));
    if (indicePublicidade >= paginas) {
      setIndicePublicidade(0);
    }
    if (paginas <= 1) return;

    const timer = window.setInterval(() => {
      setIndicePublicidade((indice) => (indice + 1) % paginas);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [publicidade.length, indicePublicidade]);

  useEffect(() => {
    const paginas = Math.max(1, Math.ceil(destaques.length / 6));
    if (indiceDestaques >= paginas) {
      setIndiceDestaques(0);
    }
    if (paginas <= 1) return;

    const timer = window.setInterval(() => {
      setIndiceDestaques((indice) => (indice + 1) % paginas);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [destaques.length, indiceDestaques]);

  const publicidadeVisiveis = publicidade.slice(
    indicePublicidade * 3,
    indicePublicidade * 3 + 3
  );

  const destaquesVisiveis = destaques.slice(
    indiceDestaques * 6,
    indiceDestaques * 6 + 6
  );

  const lojasFiltradas = lojasAtivas.filter((loja: LojaHome) =>
    loja.nome.toLocaleLowerCase("pt-BR").includes(buscaLoja.trim().toLocaleLowerCase("pt-BR"))
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">

      <main className="max-w-md mx-auto px-3 sm:px-4 py-4 space-y-5">

        {/* ==========================================
            1. BANNER PRINCIPAL
            SOMENTE A ARTE
        ========================================== */}

        <section className="w-full overflow-hidden rounded-3xl shadow-xl border border-slate-200 bg-white">

          <img
            src="https://i.ibb.co/nM8R8VKy/banner-sobradao-webp.webp"
            alt="Banner Sobradão 360"
            className="w-full h-auto object-cover block"
          />

        </section>

        {/* ==========================================
            NEGÓCIOS DO SOBRADÃO
            MARQUEE
        ========================================== */}

        <NegociosMarquee />

        {/* ==========================================
            4. PUBLICIDADE
            FORMATO BANNER 3x1 - 2 POR LINHA
        ========================================== */}

        <section className="space-y-2">

          <div className="px-1 flex items-center justify-between gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Publicidade
            </h2>
            {publicidade.length > 0 && (
              <span className="text-[10px] font-bold text-slate-400">
                {publicidade.length} anunciante{publicidade.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {publicidadeVisiveis.map((item) => (
              <Link
                key={item.id}
                href={`/loja/${item.lojaId}`}
                className="block w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-amber-400 hover:shadow-md transition"
              >
                <div className="aspect-[3/1] w-full bg-slate-200 overflow-hidden">
                  <img
                    src={item.artePublicidadeUrl || item.bannerUrl}
                    alt={item.nome || "Publicidade"}
                    className="block h-full w-full object-cover"
                  />
                </div>
              </Link>
            ))}
          </div>

        </section>

        {/* ==========================================
            5. DESTAQUES
            FORMATO VERTICAL 1x2 - 2 POR LINHA
        ========================================== */}

        <section className="space-y-2">

          <div className="px-1 flex items-center justify-between gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Destaques
            </h2>
            {destaques.length > 0 && (
              <span className="text-[10px] font-bold text-slate-400">
                {destaques.length} anunciante{destaques.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {destaquesVisiveis.map((item) => (
              <Link
                key={item.id}
                href={`/loja/${item.lojaId}`}
                className="aspect-[1/2] w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-amber-400 transition"
              >
                <img
                  src={item.arteDestaquesUrl || item.bannerUrl}
                  alt={item.nome || "Destaque"}
                  className="block h-full w-full object-cover"
                />
              </Link>
            ))}
          </div>

        </section>

        {/* ==========================================
            6. TODAS AS LOJAS
            CARDS PEQUENOS + BUSCA
        ========================================== */}

        <section className="space-y-2">

          <div className="px-1 flex items-center justify-between gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Todas as lojas
            </h2>
            <span className="text-[10px] font-bold text-slate-400">
              {lojasFiltradas.length} loja{lojasFiltradas.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="relative">
            <input
              type="search"
              value={buscaLoja}
              onChange={(evento) => setBuscaLoja(evento.target.value)}
              placeholder="Buscar loja..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔎
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {lojasFiltradas.map((loja) => (
              <Link
                key={loja.id}
                href={`/loja/${loja.id}`}
                className="aspect-square w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-amber-400 transition"
                title={loja.nome || "Loja"}
              >
                {loja.bannerUrl ? (
                  <img
                    src={loja.bannerUrl}
                    alt={loja.nome || "Loja"}
                    className="block h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-800 p-2 text-center">
                    <span className="text-[9px] font-black text-white leading-tight">
                      {loja.nome || "Loja"}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>

          {lojasFiltradas.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="text-sm font-bold text-slate-600">
                {buscaLoja ? "Nenhuma loja encontrada." : "Nenhuma loja cadastrada ainda."}
              </p>
              {buscaLoja && (
                <p className="text-xs text-slate-400 mt-1">
                  Tente outro nome na busca.
                </p>
              )}
            </div>
          )}

        </section>

      </main>

    </div>
  );
}