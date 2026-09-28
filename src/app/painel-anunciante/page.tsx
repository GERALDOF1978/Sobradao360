"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";

type TipoNegocio =
  | "loja"
  | "oficina"
  | "profissional"
  | "alimentacao"
  | "eventos"
  | "empresa";

interface Negocio {
  id: string;
  titulo: string;
  tipo: TipoNegocio;
  ativo: boolean;
  temLojaCriada: boolean;
  linkLoja: string;
}

const TIPOS: {
  value: TipoNegocio;
  icon: string;
  label: string;
  descricao: string;
}[] = [
  {
    value: "loja",
    icon: "🛒",
    label: "Loja",
    descricao: "Produtos e preços",
  },
  {
    value: "oficina",
    icon: "🔧",
    label: "Oficina",
    descricao: "Serviços e orçamento",
  },
  {
    value: "profissional",
    icon: "👷",
    label: "Profissional",
    descricao: "Serviços e contato",
  },
  {
    value: "alimentacao",
    icon: "🍰",
    label: "Alimentação",
    descricao: "Produtos e encomendas",
  },
  {
    value: "eventos",
    icon: "🎉",
    label: "Eventos",
    descricao: "Serviços e divulgação",
  },
  {
    value: "empresa",
    icon: "🏢",
    label: "Empresa",
    descricao: "Produtos e serviços",
  },
];

export default function PainelAnunciantePage() {
  const { user, loading, loginWithGoogle } = useAuth();

  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [mostrarCadastro, setMostrarCadastro] = useState(false);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoNegocio>("loja");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  async function carregarNegocios() {
    if (!user) {
      setNegocios([]);
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);

      const q = query(
        collection(db, "lojas_parceiras"),
        where("uidDono", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      const lista: Negocio[] = snapshot.docs.map((docSnap: any) => {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          titulo: data.titulo || data.nome || "Meu negócio",
          tipo: data.tipo || "empresa",
          ativo: data.ativo === true,
          temLojaCriada: data.temLojaCriada === true,
          linkLoja: data.linkLoja || "",
        };
      });

      setNegocios(lista);
    } catch (error) {
      console.error("Erro ao carregar negócios:", error);
      setMensagem("Não foi possível carregar seus negócios.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (!loading) {
      carregarNegocios();
    }
  }, [user, loading]);

  async function criarNegocio(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (!nome.trim()) {
      setMensagem("Informe o nome do negócio.");
      return;
    }

    try {
      setSalvando(true);
      setMensagem("");

      const tipoSelecionado =
        TIPOS.find((item) => item.value === tipo) || TIPOS[0];

      await addDoc(collection(db, "lojas_parceiras"), {
        uidDono: user.uid,

        nome: nome.trim(),
        titulo: nome.trim(),

        subtitulo: tipoSelecionado.label,
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

      setNome("");
      setDescricao("");
      setTipo("loja");
      setTelefone("");
      setWhatsapp("");

      setMostrarCadastro(false);

      setMensagem(
        "Solicitação enviada! Seu negócio ficará aguardando aprovação do administrador."
      );

      await carregarNegocios();
    } catch (error) {
      console.error("Erro ao cadastrar negócio:", error);

      setMensagem(
        "Não foi possível enviar o cadastro. Verifique o login e tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (loading || carregando) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="text-4xl">🏪</div>

          <p className="mt-3 text-sm font-bold text-slate-600">
            Carregando painel...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="bg-gradient-to-r from-blue-950 to-blue-800 p-8 text-white">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
              SOBRADÃO 360
            </p>

            <h1 className="mt-2 text-3xl font-black">
              🏪 Painel do Anunciante
            </h1>

            <p className="mt-3 text-sm leading-6 text-blue-100">
              Cadastre seu negócio e tenha uma página própria dentro do
              Sobradão 360.
            </p>
          </div>

          <div className="p-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-800">
                Entre com sua conta
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Faça login para cadastrar e administrar seu negócio.
              </p>

              <button
                onClick={loginWithGoogle}
                className="mt-5 w-full rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
              >
                🔐 Entrar com Google
              </button>
            </div>

            <Link
              href="/"
              className="mt-5 block text-center text-xs font-bold text-blue-700"
            >
              ← Voltar para o Sobradão 360
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 pb-12">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* CABEÇALHO */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 p-6 text-white md:p-8">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                  SOBRADÃO 360
                </p>

                <h1 className="mt-2 text-2xl font-black md:text-3xl">
                  🏪 Painel do Anunciante
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                  Gerencie seu negócio e tenha uma página própria no
                  Sobradão 360.
                </p>
              </div>

              <Link
                href="/"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-xs font-black hover:bg-white/20"
              >
                ← Voltar ao portal
              </Link>

            </div>
          </div>

          {/* RESUMO */}
          <div className="grid gap-3 p-5 sm:grid-cols-3">

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl">🏪</p>

              <p className="mt-2 text-xs font-black text-slate-800">
                Minha página
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                Um espaço próprio para seu negócio.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl">📢</p>

              <p className="mt-2 text-xs font-black text-slate-800">
                Divulgação
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                Apareça em Negócios do Sobradão.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl">📦</p>

              <p className="mt-2 text-xs font-black text-slate-800">
                Produtos e serviços
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                Estrutura adaptada ao seu negócio.
              </p>
            </div>

          </div>
        </section>

        {/* MENSAGEM */}
        {mensagem && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
            {mensagem}
          </div>
        )}

        {/* NEGÓCIOS */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-black text-slate-900">
                Meus negócios
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Negócios vinculados à sua conta.
              </p>
            </div>

            <button
              onClick={() => {
                setMostrarCadastro(!mostrarCadastro);
                setMensagem("");
              }}
              className="rounded-xl bg-amber-400 px-4 py-3 text-xs font-black text-blue-950 hover:bg-amber-300"
            >
              {mostrarCadastro
                ? "Fechar cadastro"
                : "+ Cadastrar negócio"}
            </button>

          </div>

          {/* FORMULÁRIO */}
          {mostrarCadastro && (
            <form
              onSubmit={criarNegocio}
              className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >

              <div>
                <label className="text-xs font-black text-slate-700">
                  Nome do negócio *
                </label>

                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex.: Mercado do Sobradão"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">
                  Tipo de negócio
                </label>

                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">

                  {TIPOS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTipo(item.value)}
                      className={
                        tipo === item.value
                          ? "rounded-xl border-2 border-blue-800 bg-blue-50 p-3 text-left"
                          : "rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-blue-300"
                      }
                    >
                      <span className="text-xl">
                        {item.icon}
                      </span>

                      <span className="mt-1 block text-xs font-black text-slate-800">
                        {item.label}
                      </span>

                      <span className="mt-0.5 block text-[10px] text-slate-500">
                        {item.descricao}
                      </span>
                    </button>
                  ))}

                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">
                  Descrição
                </label>

                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={4}
                  placeholder="Conte brevemente o que seu negócio oferece."
                  className="mt-1 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">

                <div>
                  <label className="text-xs font-black text-slate-700">
                    Telefone
                  </label>

                  <input
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(19) 00000-0000"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700">
                    WhatsApp
                  </label>

                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(19) 99999-9999"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                  />
                </div>

              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-xl bg-blue-900 px-5 py-3 text-xs font-black text-white disabled:opacity-50"
                >
                  {salvando
                    ? "Enviando..."
                    : "Enviar para aprovação"}
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarCadastro(false)}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-black text-slate-700"
                >
                  Cancelar
                </button>

              </div>
            </form>
          )}

          {/* LISTA */}
          <div className="mt-5 space-y-3">

            {negocios.length === 0 ? (

              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-7 text-center">

                <div className="text-3xl">🏪</div>

                <p className="mt-2 text-sm font-black text-slate-800">
                  Você ainda não possui um negócio cadastrado.
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Clique em “Cadastrar negócio” para começar.
                </p>

              </div>

            ) : (

              negocios.map((negocio) => {

                const tipoInfo =
                  TIPOS.find(
                    (item) => item.value === negocio.tipo
                  ) || TIPOS[5];

                return (
                  <div
                    key={negocio.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex items-center gap-3">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                          {tipoInfo.icon}
                        </div>

                        <div>

                          <h3 className="text-sm font-black text-slate-900">
                            {negocio.titulo}
                          </h3>

                          <p className="text-[11px] text-slate-500">
                            {tipoInfo.label}
                          </p>

                        </div>

                      </div>

                      <span
                        className={
                          negocio.ativo
                            ? "w-fit rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700"
                            : "w-fit rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black text-amber-700"
                        }
                      >
                        {negocio.ativo
                          ? "● PUBLICADO"
                          : "● AGUARDANDO APROVAÇÃO"}
                      </span>

                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Página
                        </p>

                        <p className="mt-1 text-xs font-black text-slate-700">
                          {negocio.temLojaCriada
                            ? "Disponível"
                            : "Após aprovação"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Produtos
                        </p>

                        <p className="mt-1 text-xs font-black text-slate-700">
                          Próxima etapa
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Publicidade
                        </p>

                        <p className="mt-1 text-xs font-black text-slate-700">
                          Próxima etapa
                        </p>
                      </div>

                    </div>

                    {negocio.ativo && (
                      <div className="mt-4">

                        <Link
                          href={
                            negocio.linkLoja ||
                            `/loja/${negocio.id}`
                          }
                          className="inline-flex rounded-xl bg-blue-900 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-800"
                        >
                          👀 Ver minha página
                        </Link>

                      </div>
                    )}

                  </div>
                );
              })

            )}

          </div>
        </section>

        {/* PRÓXIMAS FUNÇÕES */}
        <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5">

          <h2 className="text-sm font-black text-blue-950">
            🚀 Estrutura do painel
          </h2>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">

            {[
              ["🏪", "Minha Página"],
              ["📦", "Produtos"],
              ["🔧", "Serviços"],
              ["🖼️", "Banners"],
            ].map(([icon, label]) => (
              <div
                key={label}
                className="rounded-xl bg-white px-3 py-3 text-xs font-black text-slate-700"
              >
                <span className="mr-2">
                  {icon}
                </span>

                {label}
              </div>
            ))}

          </div>

          <p className="mt-4 text-[11px] leading-5 text-blue-800">
            O cadastro fica inicialmente como{" "}
            <strong>PENDENTE</strong>. Depois vamos criar o
            Administrador Master para aprovar anunciantes,
            administrar páginas, assinaturas, banners e
            publicidades.
          </p>

        </section>

      </div>
    </main>
  );
}