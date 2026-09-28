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
    nome: "Oficina",
    descricao: "Divulgue serviços e receba pedidos de orçamento.",
  },
  {
    id: "profissional",
    icon: "👷",
    nome: "Profissional",
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
];

export default function CadastroAnunciantePage() {
  const router = useRouter();
  const { user, loading, loginWithGoogle } = useAuth();

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

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

    if (!telefone.trim() && !whatsapp.trim()) {
      setMensagem("Informe pelo menos um telefone ou WhatsApp.");
      return;
    }

    try {
      setSalvando(true);
      setMensagem("");

      const tipoSelecionado = TIPOS.find(
        (item) => item.id === tipo
      );

      await addDoc(collection(db, "lojas_parceiras"), {
        uidDono: user.uid,

        nome: nome.trim(),
        titulo: nome.trim(),

        subtitulo:
          tipoSelecionado?.nome || "Negócio do Sobradão",

        descricao: descricao.trim(),

        tipo,

        telefone: telefone.trim(),
        whatsapp: whatsapp.trim(),

        imagemUrl: "",

        ativo: false,
        temLojaCriada: false,
        linkLoja: "",

        status: "PENDENTE",

        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });

      setMensagem(
        "Cadastro enviado com sucesso! Aguarde a aprovação do Sobradão 360."
      );

      setTimeout(() => {
        router.push("/painel-anunciante");
      }, 1500);
    } catch (error) {
      console.error("Erro ao cadastrar anunciante:", error);

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
            Tenha sua própria página no Sobradão 360 e
            apresente seus produtos ou serviços para os
            moradores da comunidade.
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

          <div className="text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-4xl">
              🏪
            </div>

            <h1 className="mt-4 text-2xl font-black text-blue-950">
              Cadastre seu negócio
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Crie sua presença comercial no Sobradão 360.
            </p>

          </div>

          <div className="mt-7 space-y-5">

            {/* NOME */}
            <div>
              <label className="text-xs font-black text-slate-700">
                Nome do negócio *
              </label>

              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Mercado do João"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* TIPO */}
            <div>

              <label className="text-xs font-black text-slate-700">
                O que você oferece? *
              </label>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">

                {TIPOS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTipo(item.id)}
                    className={`rounded-2xl border-2 p-4 text-left transition ${
                      tipo === item.id
                        ? "border-amber-400 bg-amber-50"
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

            {/* DESCRIÇÃO */}
            <div>

              <label className="text-xs font-black text-slate-700">
                Descrição do negócio *
              </label>

              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Conte brevemente o que você oferece..."
                rows={5}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />

              <p className="mt-1 text-[10px] text-slate-400">
                Essa informação aparecerá na página do seu negócio.
              </p>

            </div>

            {/* TELEFONE */}
            <div>

              <label className="text-xs font-black text-slate-700">
                Telefone
              </label>

              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
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
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(19) 99999-9999"
                inputMode="tel"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />

            </div>

            {/* AVISO */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-xs font-black text-blue-950">
                📋 Como funciona
              </p>

              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                Depois do cadastro, o Sobradão 360 analisará
                as informações. Após a aprovação, sua empresa
                poderá ter uma página própria no portal e
                aparecer em <strong>Negócios do Sobradão</strong>.
              </p>

            </div>

            {/* MENSAGEM */}
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

            {/* BOTÃO */}
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