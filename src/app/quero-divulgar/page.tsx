"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Plano = { id: string; nome: string; valor: number; duracaoDias: number; limiteProdutos: number; carrinhoCompras: boolean; };

const TIPOS = [
  "Loja",
  "Oficina",
  "Profissional",
  "Alimentação",
  "Eventos",
  "Empresa",
  "Tecnologia",
  "Outro",
];

export default function QueroDivulgarPage() {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [planoId, setPlanoId] = useState("");
  const [imagemReferenciaUrl, setImagemReferenciaUrl] = useState("");
  const [enviandoImagem, setEnviandoImagem] = useState(false);

  useEffect(() => {
    async function carregarPlanos() {
      try {
        const snapshot = await getDocs(
          query(collection(db, "pacotes_anuncio"), where("ativo", "==", true))
        );
        const lista: Plano[] = [];
        for (const documento of snapshot.docs) {
          const d = documento.data() as Record<string, unknown>;
          lista.push({
            id: documento.id,
            nome: String(d.nome || "Plano"),
            valor: Number(d.valor || 0),
            duracaoDias: Number(d.duracaoDias || 0),
            limiteProdutos: Number(d.limiteProdutos || 0),
            carrinhoCompras: d.carrinhoCompras === true,
          });
        }
        lista.sort((a, b) => a.valor - b.valor);
        setPlanos(lista);
      } catch (error: unknown) {
        console.error("Erro ao carregar planos:", error);
      }
    }
    void carregarPlanos();
  }, []);

  async function enviarImagem(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) { setErro("Selecione uma imagem válida."); return; }
    try {
      setEnviandoImagem(true); setErro("");
      const fd = new FormData(); fd.append("file", arquivo);
      const resposta = await fetch("/api/upload-image", { method: "POST", body: fd });
      const dados = await resposta.json();
      if (!resposta.ok || !dados.url) throw new Error(dados.error || "Falha no upload");
      setImagemReferenciaUrl(String(dados.url));
    } catch (e) { console.error(e); setErro("Não foi possível enviar a imagem."); }
    finally { setEnviandoImagem(false); }
  }

  async function enviarSolicitacao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");

    const formulario = new FormData(evento.currentTarget);

    const nomeResponsavel = String(formulario.get("nomeResponsavel") || "").trim();
    const nomeNegocio = String(formulario.get("nomeNegocio") || "").trim();
    const tipoNegocio = String(formulario.get("tipoNegocio") || "").trim();
    const whatsapp = String(formulario.get("whatsapp") || "").trim();
    const telefone = String(formulario.get("telefone") || "").trim();
    const email = String(formulario.get("email") || "").trim();
    const endereco = String(formulario.get("endereco") || "").trim();
    const descricao = String(formulario.get("descricao") || "").trim();
    const instagram = String(formulario.get("instagram") || "").trim();
    const site = String(formulario.get("site") || "").trim();
    const observacoes = String(formulario.get("observacoes") || "").trim();

    if (!nomeResponsavel || !nomeNegocio || !tipoNegocio || !whatsapp || !email || !planoId || !imagemReferenciaUrl) {
      setErro(!imagemReferenciaUrl ? "Envie uma imagem do negócio antes de continuar." : "Preencha os campos obrigatórios.");
      return;
    }

    try {
      setEnviando(true);
      const plano = planos.find((item) => item.id === planoId);

      await addDoc(collection(db, "solicitacoes_divulgacao"), {
        nomeResponsavel,
        nomeNegocio,
        tipoNegocio,
        whatsapp,
        telefone,
        email,
        endereco,
        descricao,
        instagram,
        site,
        observacoes,
        imagemReferenciaUrl,
        planoEscolhidoId: plano?.id || "",
        planoEscolhidoNome: plano?.nome || "",
        planoEscolhidoValor: plano?.valor || 0,
        planoEscolhidoDuracaoDias: plano?.duracaoDias || 0,
        planoEscolhidoLimiteProdutos: plano?.limiteProdutos || 0,
        planoEscolhidoCarrinhoCompras: plano?.carrinhoCompras === true,
        statusPlano: "AGUARDANDO_CONFIRMACAO",
        status: "PENDENTE",
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });

      // O formulário deixa de existir quando a tela de sucesso é exibida.
      // Não acesse evento.currentTarget depois de uma operação assíncrona.
      setEnviado(true);
    } catch (error) {
      console.error("Erro ao enviar solicitação de divulgação:", error);
      setErro(
        "Não foi possível enviar sua solicitação. Tente novamente em alguns instantes."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 px-6 py-8 text-white sm:px-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
              SOBRADÃO 360
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              📢 Quero divulgar meu negócio
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              Preencha seus dados. Sua solicitação será analisada pela equipe
              do Sobradão 360 e entraremos em contato para apresentar as
              opções de divulgação.
            </p>
          </div>

          {enviado ? (
            <div className="p-6 sm:p-10">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                <div className="text-5xl">✅</div>

                <h2 className="mt-4 text-2xl font-black text-emerald-900">
                  Solicitação enviada!
                </h2>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-emerald-800">
                  Recebemos os dados do seu negócio. A equipe do Sobradão 360
                  vai analisar a solicitação e entrar em contato.
                </p>

                <button
                  type="button"
                  onClick={() => setEnviado(false)}
                  className="mt-6 rounded-xl bg-blue-900 px-5 py-3 text-xs font-black text-white hover:bg-blue-800"
                >
                  Enviar outra solicitação
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={enviarSolicitacao} className="space-y-6 p-6 sm:p-10">
              {erro && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {erro}
                </div>
              )}

              <section>
                <h2 className="text-lg font-black text-slate-900">
                  👤 Dados de contato
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black text-slate-700">
                      Nome do responsável *
                    </label>
                    <input
                      name="nomeResponsavel"
                      required
                      placeholder="Seu nome"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700">
                      E-mail *
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="seu@email.com"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700">
                      WhatsApp *
                    </label>
                    <input
                      name="whatsapp"
                      required
                      placeholder="(19) 99999-9999"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700">
                      Telefone
                    </label>
                    <input
                      name="telefone"
                      placeholder="(19) 0000-0000"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-100 pt-6">
                <h2 className="text-lg font-black text-slate-900">
                  🏪 Sobre o negócio
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black text-slate-700">
                      Nome do negócio *
                    </label>
                    <input
                      name="nomeNegocio"
                      required
                      placeholder="Ex.: Mercado do Bairro"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700">
                      Tipo de negócio *
                    </label>
                    <select
                      name="tipoNegocio"
                      required
                      defaultValue=""
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    >
                      <option value="" disabled>
                        Selecione
                      </option>
                      {TIPOS.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-black text-slate-700">
                      Endereço
                    </label>
                    <input
                      name="endereco"
                      placeholder="Rua, número, bairro"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-black text-slate-700">
                      Descreva seu negócio
                    </label>
                    <textarea
                      name="descricao"
                      rows={4}
                      placeholder="Conte brevemente o que sua empresa oferece."
                      className="mt-1 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-100 pt-6">
                <h2 className="text-lg font-black text-slate-900">
                  🌐 Seus canais
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black text-slate-700">
                      Instagram
                    </label>
                    <input
                      name="instagram"
                      placeholder="@seunegocio"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700">
                      Site
                    </label>
                    <input
                      name="site"
                      placeholder="https://seusite.com.br"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-black text-slate-700">
                      Observações
                    </label>
                    <textarea
                      name="observacoes"
                      rows={3}
                      placeholder="Ex.: quero divulgar uma loja, oficina, serviço, promoção..."
                      className="mt-1 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-100 pt-6">
                <h2 className="text-lg font-black text-slate-900">📸 Imagem e plano</h2>
                <p className="mt-1 text-xs text-slate-500">Envie uma imagem do negócio e escolha o plano agora. Depois da aprovação, você não precisará preencher outro cadastro.</p>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="text-xs font-black text-slate-700">Imagem do negócio</label>
                  <input type="file" accept="image/*" onChange={enviarImagem} disabled={enviandoImagem} className="mt-2 block w-full text-xs" />
                  {enviandoImagem && <p className="mt-2 text-xs font-bold text-blue-700">Enviando imagem...</p>}
                  {imagemReferenciaUrl && <img src={imagemReferenciaUrl} alt="Imagem do negócio" className="mt-3 h-40 w-full rounded-xl object-cover" />}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {planos.map((plano) => (
                    <button key={plano.id} type="button" onClick={() => setPlanoId(plano.id)} className={`rounded-2xl border-2 p-4 text-left ${planoId === plano.id ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-start justify-between gap-2"><strong>{plano.nome}</strong><strong className="text-blue-900">{plano.valor.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong></div>
                      <p className="mt-2 text-xs text-slate-600">{plano.duracaoDias} dias · até {plano.limiteProdutos} produtos/serviços</p>
                      <p className="mt-1 text-[11px] text-slate-500">Carrinho: {plano.carrinhoCompras ? "incluso" : "não incluso"}</p>
                    </button>
                  ))}
                </div>
              </section>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
                <strong>Antes de enviar:</strong> confira seus dados, a imagem e o plano escolhido. Após a aprovação, sua loja será preparada com essas informações.
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
                <strong>Como funciona:</strong> esta é apenas uma solicitação
                de divulgação. Depois da análise, o Sobradão 360 entrará em
                contato para definir as condições e o formato da divulgação.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={enviando}
                  className="rounded-xl bg-blue-900 px-6 py-3 text-sm font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enviando ? "Enviando..." : "📢 Enviar solicitação"}
                </button>

                <a
                  href="/"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Voltar para o Sobradão 360
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
