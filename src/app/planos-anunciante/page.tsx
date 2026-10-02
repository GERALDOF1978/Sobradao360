"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Plano = {
  id: string;
  nome: string;
  valor: number;
  duracaoDias: number;
  limiteProdutos: number;
  carrinhoCompras: boolean;
  exibicaoPadrao: {
    marquee: boolean;
    publicidade: boolean;
    destaques: boolean;
    parceiros: boolean;
  };
  ativo: boolean;
};

const POSICOES = [
  ["marquee", "Vitrine de Lojas"],
  ["publicidade", "Banner Publicitário"],
  ["destaques", "Destaques"],
  ["parceiros", "Todas as Lojas"],
] as const;

function dinheiro(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PlanosAnunciantePage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, "pacotes_anuncio"),
            where("ativo", "==", true)
          )
        );

        const lista = snapshot.docs
          .map((item: { id: string; data: () => Record<string, unknown> }) => {
            const dados = item.data();
            const exibicao = (dados.exibicaoPadrao ?? {}) as Record<string, unknown>;

            return {
              id: item.id,
              nome: String(dados.nome || "Plano"),
              valor: Number(dados.valor || 0),
              duracaoDias: Number(dados.duracaoDias || 0),
              limiteProdutos: Number(dados.limiteProdutos || 0),
              carrinhoCompras: dados.carrinhoCompras === true,
              exibicaoPadrao: {
                marquee: exibicao.marquee === true,
                publicidade: exibicao.publicidade === true,
                destaques: exibicao.destaques === true,
                parceiros: exibicao.parceiros === true,
              },
              ativo: dados.ativo !== false,
            };
          })
          .sort((a: Plano, b: Plano) => a.valor - b.valor);

        setPlanos(lista);
      } catch (error) {
        console.error("Erro ao carregar planos:", error);
      } finally {
        setCarregando(false);
      }
    }

    void carregar();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 p-6 text-white shadow-xl md:p-8">
          <Link
            href="/"
            className="text-xs font-bold text-blue-200 hover:text-white"
          >
            ← Sobradão 360
          </Link>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-amber-300">
            PORTAL SOBRADÃO 360
          </p>

          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            Planos de divulgação
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100">
            Conheça as opções disponíveis para colocar seu negócio em
            destaque no Portal Sobradão 360 e veja com clareza onde sua marca pode aparecer.
          </p>
        </header>

        <section className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {carregando ? (
            <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 md:col-span-2 lg:col-span-3">
              Carregando planos...
            </div>
          ) : planos.length === 0 ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-sm text-amber-900 md:col-span-2 lg:col-span-3">
              Os planos ainda estão sendo configurados. Entre em contato com
              o Sobradão 360 para conhecer as condições atuais.
            </div>
          ) : (
            planos.map((plano) => (
              <article
                key={plano.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">
                      {plano.nome}
                    </h2>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {plano.duracaoDias} dias
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-100 px-3 py-2 text-right">
                    <div className="text-lg font-black text-amber-900">
                      {dinheiro(plano.valor)}
                    </div>
                    <div className="text-[10px] font-bold text-amber-800">
                      por período
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-black text-slate-900">
                    🛍️ Produtos
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {plano.limiteProdutos > 0
                      ? "Até " + plano.limiteProdutos + " produtos ou serviços cadastrados."
                      : "Sem limite definido de produtos ou serviços."}
                  </div>
                </div>

                <div className={`mt-4 rounded-2xl p-4 ${plano.carrinhoCompras ? "bg-emerald-50" : "bg-slate-50"}`}>
                  <div className="text-sm font-black text-slate-900">🛒 Carrinho de compras</div>
                  <div className="mt-1 text-xs text-slate-600">
                    {plano.carrinhoCompras ? "Incluso — o cliente pode montar o pedido e enviar pelo WhatsApp." : "Não incluso neste plano."}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-black text-slate-900">
                    📍 Onde sua divulgação aparece
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {POSICOES.filter(
                      ([chave]) =>
                        plano.exibicaoPadrao[
                          chave as keyof Plano["exibicaoPadrao"]
                        ]
                    ).map(([chave, nome]) => (
                      <span
                        key={chave}
                        className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800"
                      >
                        {nome}
                      </span>
                    ))}

                    {!POSICOES.some(
                      ([chave]) =>
                        plano.exibicaoPadrao[
                          chave as keyof Plano["exibicaoPadrao"]
                        ]
                    ) && (
                      <span className="text-xs text-slate-500">
                        Posições definidas durante a contratação.
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">
              💳 Como funciona o pagamento?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Depois da aprovação, o anunciante escolhe o plano e a equipe do
              Sobradão 360 envia as instruções de pagamento e confirmação.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <strong>Pix:</strong> dados de pagamento enviados pela equipe.
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <strong>Transferência:</strong> disponível mediante combinação.
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <strong>Outras formas:</strong> podem ser combinadas diretamente
                com o Sobradão 360.
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-emerald-50 p-6 shadow-sm">
            <h2 className="text-lg font-black text-emerald-950">
              📲 Próximo passo
            </h2>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              Ainda não solicitou divulgação? Envie seus dados. Depois da
              análise, você receberá as instruções para acessar o painel e
              escolher a contratação.
            </p>

            <Link
              href="/quero-divulgar"
              className="mt-5 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800"
            >
              Quero divulgar meu negócio
            </Link>
          </div>
        </section>

        <div className="mt-5 text-center">
          <Link
            href="/loja-explicativa"
            className="text-xs font-bold text-slate-500 hover:text-blue-800"
          >
            ← Voltar para apresentação do parceiro
          </Link>
        </div>
      </div>
    </main>
  );
}
