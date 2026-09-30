"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const TIPOS = [
  {
    id: "loja",
    icon: "🛒",
    nome: "Loja / Comércio",
    descricao: "Venda produtos e divulgue preços.",
  },
  {
    id: "oficina",
    icon: "🔧",
    nome: "Oficina / Assistência",
    descricao: "Divulgue serviços e receba pedidos de orçamento.",
  },
  {
    id: "profissional",
    icon: "👷",
    nome: "Profissional / Prestador",
    descricao: "Pedreiro, eletricista, encanador e outros serviços.",
  },
  {
    id: "alimentacao",
    icon: "🍰",
    nome: "Alimentação",
    descricao: "Bolos, salgados, marmitas, lanches e encomendas.",
  },
  {
    id: "eventos",
    icon: "🎉",
    nome: "Eventos",
    descricao: "Serviços, festas, decoração e divulgação.",
  },
  {
    id: "empresa",
    icon: "🏢",
    nome: "Empresa",
    descricao: "Apresente sua empresa e seus serviços.",
  },
  {
    id: "tecnologia",
    icon: "💻",
    nome: "Tecnologia / Serviço digital",
    descricao: "Sites, sistemas, aplicativos e serviços digitais.",
  },
  {
    id: "outros",
    icon: "📌",
    nome: "Outro",
    descricao: "Seu negócio não se encaixa nas opções acima.",
  },
];

const DESTINOS = [
  {
    id: "pagina_sobradao",
    icon: "🏠",
    nome: "Quero uma página no Sobradão 360",
    descricao:
      "O cliente entra em uma página do seu negócio dentro do portal.",
  },
  {
    id: "site_externo",
    icon: "🌐",
    nome: "Já tenho loja ou site pronto",
    descricao:
      "O cliente será direcionado para seu site ou loja online.",
  },
  {
    id: "whatsapp",
    icon: "💬",
    nome: "Quero receber clientes pelo WhatsApp",
    descricao:
      "O cliente será direcionado diretamente para o seu WhatsApp.",
  },
];

function normalizarUrl(url: string) {
  const valor = url.trim();

  if (!valor) {
    return "";
  }

  if (valor.startsWith("http://") || valor.startsWith("https://")) {
    return valor;
  }

  return `https://${valor}`;
}

function urlValida(url: string) {
  try {
    const urlNormalizada = normalizarUrl(url);
    const objeto = new URL(urlNormalizada);

    return (
      objeto.protocol === "http:" ||
      objeto.protocol === "https:"
    );
  } catch {
    return false;
  }
}

export default function CadastroAnunciantePage() {
  const router = useRouter();
  const { user, loading, loginWithGoogle } = useAuth();

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [tipoPresenca, setTipoPresenca] = useState("");
  const [descricao, setDescricao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);

  async function cadastrar() {
    if (!user) {
      setMensagem("Faça login para continuar.");
      return;
    }

    if (!nome.trim()) {
      setMensagem("Informe o nome do negócio.");
      return;
    }

    if (!tipo) {
      setMensagem("Escolha o tipo de negócio.");
      return;
    }

    if (!descricao.trim()) {
      setMensagem("Informe uma breve descrição.");
      return;
    }

    if (!tipoPresenca) {
      setMensagem(
        "Escolha como você deseja apresentar seu negócio."
      );
      return;
    }

    if (!telefone.trim() && !whatsapp.trim()) {
      setMensagem(
        "Informe pelo menos um telefone ou WhatsApp."
      );
      return;
    }

    if (tipoPresenca === "site_externo") {
      if (!siteUrl.trim()) {
        setMensagem(
          "Informe o endereço da sua loja ou site."
        );
        return;
      }

      if (!urlValida(siteUrl)) {
        setMensagem(
          "Informe um endereço de site válido. Ex.: https://www.exemplo.com.br"
        );
        return;
      }
    }

    if (tipoPresenca === "whatsapp" && !whatsapp.trim()) {
      setMensagem(
        "Informe o número de WhatsApp para receber os clientes."
      );
      return;
    }

    try {
      setSalvando(true);
      setMensagem("");

      const tipoSelecionado = TIPOS.find(
        (item) => item.id === tipo
      );

      const destinoSelecionado = DESTINOS.find(
        (item) => item.id === tipoPresenca
      );

      const siteNormalizado =
        tipoPresenca === "site_externo"
          ? normalizarUrl(siteUrl)
          : "";

      await addDoc(collection(db, "lojas_parceiras"), {
        // =========================
        // RESPONSÁVEL PELO NEGÓCIO
        // =========================
        uidDono: user.uid,

        nomeResponsavel:
          user.displayName?.trim() || "",

        emailDono:
          user.email?.trim() || "",

        // =========================
        // DADOS DO NEGÓCIO
        // =========================
        nome: nome.trim(),

        titulo: nome.trim(),

        subtitulo:
          tipoSelecionado?.nome ||
          "Negócio do Sobradão",

        descricao: descricao.trim(),

        tipo,

        // =========================
        // CONTATOS
        // =========================
        telefone: telefone.trim(),

        whatsapp: whatsapp.trim(),

        // =========================
        // COMO O NEGÓCIO SERÁ
        // APRESENTADO
        // =========================
        tipoPresenca,

        destinoDescricao:
          destinoSelecionado?.nome || "",

        siteUrl: siteNormalizado,

        // =========================
        // IMAGEM
        // =========================
        imagemUrl: "",

        // =========================
        // STATUS DO ANÚNCIO
        // =========================
        ativo: false,

        status: "PENDENTE",

        // Mantidos para compatibilidade
        // com a estrutura atual.
        temLojaCriada: false,

        linkLoja: "",

        // =========================
        // CAMPOS PREPARADOS PARA
        // FUTURO SISTEMA COMERCIAL
        // =========================
        plano: "gratuito",

        statusPagamento: "nao_aplicavel",

        valorPlano: 0,

        mostrarMarquee: false,

        mostrarCard: false,

        mostrarBanner: false,

        // =========================
        // DATAS
        // =========================
        criadoEm: serverTimestamp(),

        atualizadoEm: serverTimestamp(),
      });

      setMensagem(
        "Cadastro enviado com sucesso! Aguarde a aprovação do Sobradão 360."
      );
      setEnviado(true);
    } catch (error) {
      console.error(
        "Erro ao cadastrar anunciante:",
        error
      );

      setMensagem(
        "Não foi possível enviar o cadastro. Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">🏪</div>

          <p className="mt-3 text-sm font-bold text-slate-500">
            Carregando...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-4xl">
            🏪
          </div>

          <h1 className="mt-5 text-2xl font-black text-blue-950">
            Cadastre seu negócio
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Divulgue sua empresa, loja ou serviço
            para os moradores do Sobradão e região.
          </p>

          <button
            onClick={loginWithGoogle}
            className="mt-7 w-full rounded-2xl bg-blue-900 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:bg-blue-800"
          >
            🔐 Entrar com Google
          </button>

          <Link
            href="/"
            className="mt-5 inline-block text-xs font-bold text-blue-700"
          >
            ← Voltar para o Sobradão 360
          </Link>
        </div>
      </main>
    );
  }

  if (enviado) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-4xl">
            ✅
          </div>

          <h1 className="mt-5 text-2xl font-black text-blue-950">
            Cadastro enviado!
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Recebemos os dados do seu negócio. Agora o Sobradão 360
            fará a análise e a liberação da divulgação.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left">
            <p className="text-sm font-black text-blue-950">
              ⏳ Aguarde a liberação
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Quando seu cadastro for aprovado, você receberá o link
              para entrar no painel do anunciante. Se abrir o mesmo
              link depois da aprovação, ele levará você diretamente
              para o painel.
            </p>
          </div>

          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-blue-900 px-5 py-3 text-xs font-black text-white hover:bg-blue-800"
          >
            Voltar para o Sobradão 360
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 pb-12">

      <div className="mx-auto max-w-2xl">

        <Link
          href="/"
          className="text-xs font-bold text-blue-700"
        >
          ← Sobradão 360
        </Link>

        <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm sm:p-7">

          {/* CABEÇALHO */}
          <div className="text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-4xl">
              🏪
            </div>

            <h1 className="mt-4 text-2xl font-black text-blue-950">
              Cadastre seu negócio
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Faça parte dos negócios divulgados
              no Sobradão 360.
            </p>

            <div className="mx-auto mt-4 max-w-lg rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left">
              <p className="text-xs font-black text-blue-950">
                📢 Espaço exclusivo para parceiros
              </p>

              <p className="mt-1 text-[11px] leading-5 text-blue-900/70">
                Este cadastro é exclusivo para empresas,
                comerciantes e prestadores de serviços.
                Ele é separado dos anúncios publicados
                pelos moradores.
              </p>
            </div>

          </div>

          <div className="mt-7 space-y-6">

            {/* =========================
                NOME
            ========================== */}
            <div>

              <label className="text-xs font-black text-slate-700">
                Nome do negócio *
              </label>

              <input
                value={nome}
                onChange={(e) =>
                  setNome(e.target.value)
                }
                placeholder="Ex.: Mercado do João"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />

            </div>

            {/* =========================
                TIPO DE NEGÓCIO
            ========================== */}
            <div>

              <label className="text-xs font-black text-slate-700">
                O que você oferece? *
              </label>

              <p className="mt-1 text-[11px] text-slate-400">
                Escolha a opção que mais combina
                com seu negócio.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">

                {TIPOS.map((item) => (

                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setTipo(item.id)
                    }
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      tipo === item.id
                        ? "border-amber-400 bg-amber-50 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:border-blue-300"
                    }`}
                  >

                    <div className="flex items-center gap-3">

                      <span className="text-2xl">
                        {item.icon}
                      </span>

                      <div>

                        <p className="text-sm font-black text-slate-800">
                          {item.nome}
                        </p>

                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                          {item.descricao}
                        </p>

                      </div>

                    </div>

                  </button>

                ))}

              </div>

            </div>

            {/* =========================
                DESCRIÇÃO
            ========================== */}
            <div>

              <label className="text-xs font-black text-slate-700">
                Descrição do negócio *
              </label>

              <textarea
                value={descricao}
                onChange={(e) =>
                  setDescricao(e.target.value)
                }
                placeholder="Conte brevemente o que você oferece..."
                rows={5}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />

              <p className="mt-1 text-[10px] text-slate-400">
                Essa informação poderá aparecer
                na divulgação do seu negócio.
              </p>

            </div>

            {/* =========================
                CONTATO
            ========================== */}
            <div className="grid gap-4 sm:grid-cols-2">

              {/* TELEFONE */}
              <div>

                <label className="text-xs font-black text-slate-700">
                  Telefone
                </label>

                <input
                  value={telefone}
                  onChange={(e) =>
                    setTelefone(e.target.value)
                  }
                  placeholder="(19) 99999-9999"
                  inputMode="tel"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />

              </div>

              {/* WHATSAPP */}
              <div>

                <label className="text-xs font-black text-slate-700">
                  WhatsApp
                </label>

                <input
                  value={whatsapp}
                  onChange={(e) =>
                    setWhatsapp(e.target.value)
                  }
                  placeholder="(19) 99999-9999"
                  inputMode="tel"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />

              </div>

            </div>

            {/* =========================
                DESTINO
            ========================== */}
            <div>

              <label className="text-xs font-black text-slate-700">
                Como você quer apresentar seu negócio? *
              </label>

              <p className="mt-1 text-[11px] leading-5 text-slate-400">
                Essa escolha define para onde o morador
                será levado quando clicar na divulgação.
              </p>

              <div className="mt-3 space-y-3">

                {DESTINOS.map((item) => (

                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setTipoPresenca(item.id)
                    }
                    className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                      tipoPresenca === item.id
                        ? "border-amber-400 bg-amber-50 shadow-sm"
                        : "border-slate-200 bg-slate-50 hover:border-blue-300"
                    }`}
                  >

                    <div className="flex items-start gap-3">

                      <span className="text-2xl">
                        {item.icon}
                      </span>

                      <div className="flex-1">

                        <div className="flex items-center justify-between gap-2">

                          <p className="text-sm font-black text-slate-800">
                            {item.nome}
                          </p>

                          {tipoPresenca === item.id && (
                            <span className="rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black text-blue-950">
                              SELECIONADO
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-[10px] leading-4 text-slate-500">
                          {item.descricao}
                        </p>

                      </div>

                    </div>

                  </button>

                ))}

              </div>

            </div>

            {/* =========================
                SITE EXTERNO
            ========================== */}
            {tipoPresenca === "site_externo" && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">

                <label className="text-xs font-black text-blue-950">
                  Endereço da sua loja ou site *
                </label>

                <input
                  value={siteUrl}
                  onChange={(e) =>
                    setSiteUrl(e.target.value)
                  }
                  placeholder="https://www.sualoja.com.br"
                  inputMode="url"
                  className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <p className="mt-2 text-[10px] leading-4 text-blue-900/60">
                  Exemplo: se você possui uma loja online
                  ou um sistema como o Agenda Aki, informe
                  aqui o endereço que deseja divulgar.
                </p>

              </div>
            )}

            {/* =========================
                WHATSAPP
            ========================== */}
            {tipoPresenca === "whatsapp" && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

                <p className="text-xs font-black text-emerald-900">
                  💬 Atendimento pelo WhatsApp
                </p>

                <p className="mt-2 text-[11px] leading-5 text-emerald-900/70">
                  Quando o morador clicar na divulgação,
                  ele poderá iniciar o contato pelo
                  WhatsApp informado acima.
                </p>

                {!whatsapp.trim() && (
                  <p className="mt-2 text-[10px] font-bold text-red-600">
                    Informe o WhatsApp para continuar.
                  </p>
                )}

              </div>
            )}

            {/* =========================
                PÁGINA SOBRADÃO
            ========================== */}
            {tipoPresenca === "pagina_sobradao" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">

                <p className="text-xs font-black text-blue-950">
                  🏠 Página no Sobradão 360
                </p>

                <p className="mt-2 text-[11px] leading-5 text-slate-600">
                  Seu negócio poderá ter uma página própria
                  dentro do portal. Dependendo do tipo de
                  negócio, ela poderá apresentar produtos,
                  serviços, informações, contatos e outras
                  opções.
                </p>

              </div>
            )}

            {/* =========================
                DADOS DO RESPONSÁVEL
            ========================== */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

              <p className="text-xs font-black text-slate-700">
                👤 Dados da conta responsável
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-400">
                Esses dados são obtidos da sua conta Google
                e ficam vinculados ao cadastro do negócio.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <div className="rounded-xl bg-white p-3">

                  <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                    Responsável
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-700">
                    {user.displayName || "Não informado"}
                  </p>

                </div>

                <div className="rounded-xl bg-white p-3">

                  <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                    E-mail
                  </p>

                  <p className="mt-1 break-all text-xs font-bold text-slate-700">
                    {user.email || "Não informado"}
                  </p>

                </div>

              </div>

            </div>

            {/* =========================
                AVISO
            ========================== */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-xs font-black text-blue-950">
                📋 Como funciona
              </p>

              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                Depois do cadastro, o Sobradão 360 analisará
                as informações. Após a aprovação, sua empresa
                poderá ser divulgada na área de
                <strong> Negócios do Sobradão</strong>.
              </p>

              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                O cadastro do parceiro é independente dos
                anúncios publicados pelos moradores.
              </p>

            </div>

            {/* =========================
                MENSAGEM
            ========================== */}
            {mensagem && (
              <div
                className={`rounded-2xl p-4 text-xs font-bold ${
                  mensagem.includes("sucesso")
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {mensagem}
              </div>
            )}

            {/* =========================
                BOTÃO
            ========================== */}
            <button
              type="button"
              onClick={cadastrar}
              disabled={salvando}
              className="w-full rounded-2xl bg-blue-900 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando
                ? "Enviando cadastro..."
                : "📢 Enviar cadastro"}
            </button>

          </div>
        </div>

        {/* PAINEL */}
        <div className="mt-5 text-center">

          <Link
            href="/painel-anunciante"
            className="text-xs font-bold text-blue-700"
          >
            Já possui cadastro? Acessar painel do anunciante →
          </Link>

        </div>

      </div>

    </main>
  );
}