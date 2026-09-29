"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";




import { auth, db, googleProvider } from "@/lib/firebase";
import GerenciadorProdutos from "@/components/anunciante/GerenciadorProdutos";
import IdentidadeAnunciante from "@/components/anunciante/IdentidadeAnunciante";

type TipoNegocio =
  | "loja"
  | "oficina"
  | "profissional"
  | "alimentacao"
  | "eventos"
  | "empresa"
  | "tecnologia"
  | "outros";

type TipoPresenca =
  | "pagina_sobradao"
  | "site_externo"
  | "whatsapp";

type StatusNegocio =
  | "PENDENTE"
  | "APROVADO"
  | "SUSPENSO";

type Negocio = {
  id: string;

  uidDono: string;
  nomeResponsavel: string;
  emailDono: string;

  nome: string;
  titulo: string;
  subtitulo: string;
  descricao: string;

  tipo: TipoNegocio;

  telefone: string;
  whatsapp: string;

  tipoPresenca: TipoPresenca;
  destinoDescricao: string;
  siteUrl: string;

  imagemUrl: string;
  bannerUrl: string;
slogan: string;
corMarca: string;

  ativo: boolean;
  status: StatusNegocio;

  temLojaCriada: boolean;
  linkLoja: string;

  plano: string;
  statusPagamento: string;
  valorPlano: number;

  mostrarMarquee: boolean;
  mostrarCard: boolean;
  mostrarBanner: boolean;
};

type DadosFirestore = Record<string, unknown>;

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
  {
    value: "tecnologia",
    icon: "💻",
    label: "Tecnologia",
    descricao: "Tecnologia e serviços",
  },
  {
    value: "outros",
    icon: "📌",
    label: "Outros",
    descricao: "Outras atividades",
  },
];

const PRESENCAS: {
  value: TipoPresenca;
  icon: string;
  label: string;
  descricao: string;
}[] = [
  {
    value: "pagina_sobradao",
    icon: "🏠",
    label: "Página no Sobradão 360",
    descricao: "Seu negócio terá uma página dentro do portal.",
  },
  {
    value: "site_externo",
    icon: "🌐",
    label: "Meu próprio site",
    descricao: "O cliente será direcionado para seu site.",
  },
  {
    value: "whatsapp",
    icon: "💬",
    label: "WhatsApp",
    descricao: "O cliente será direcionado para seu WhatsApp.",
  },
];

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function numero(valor: unknown): number {
  return typeof valor === "number" ? valor : 0;
}

function booleano(valor: unknown): boolean {
  return valor === true;
}

function tipoValido(valor: unknown): TipoNegocio {
  const tipos: TipoNegocio[] = [
    "loja",
    "oficina",
    "profissional",
    "alimentacao",
    "eventos",
    "empresa",
    "tecnologia",
    "outros",
  ];

  if (
    typeof valor === "string" &&
    tipos.includes(valor as TipoNegocio)
  ) {
    return valor as TipoNegocio;
  }

  return "empresa";
}

function presencaValida(valor: unknown): TipoPresenca {
  const tipos: TipoPresenca[] = [
    "pagina_sobradao",
    "site_externo",
    "whatsapp",
  ];

  if (
    typeof valor === "string" &&
    tipos.includes(valor as TipoPresenca)
  ) {
    return valor as TipoPresenca;
  }

  return "pagina_sobradao";
}

function statusValido(valor: unknown): StatusNegocio {
  if (
    valor === "APROVADO" ||
    valor === "SUSPENSO" ||
    valor === "PENDENTE"
  ) {
    return valor;
  }

  return "PENDENTE";
}

function limparWhatsapp(numero: string): string {
  return numero.replace(/\D/g, "");
}

export default function PainelAnunciantePage() {
 const [usuario, setUsuario] =
  useState<typeof auth.currentUser>(null);

  const [carregandoUsuario, setCarregandoUsuario] =
    useState(true);

  const [negocios, setNegocios] =
    useState<Negocio[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const [erro, setErro] =
    useState("");

  const [mostrarCadastro, setMostrarCadastro] =
    useState(false);

  const [negocioEditando, setNegocioEditando] =
    useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  const [tipo, setTipo] =
    useState<TipoNegocio>("loja");

  const [telefone, setTelefone] =
    useState("");

  const [whatsapp, setWhatsapp] =
    useState("");

  const [tipoPresenca, setTipoPresenca] =
    useState<TipoPresenca>("pagina_sobradao");

  const [destinoDescricao, setDestinoDescricao] =
    useState("");

  const [siteUrl, setSiteUrl] =
    useState("");

  useEffect(() => {
    const cancelar = onAuthStateChanged(
  auth,
  (usuarioAtual: typeof auth.currentUser) => {
    setUsuario(usuarioAtual);
    setCarregandoUsuario(false);
  }
);

    return () => cancelar();
  }, []);

  async function carregarNegocios() {
    if (!usuario) {
      setNegocios([]);
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const referencia =
        collection(db, "lojas_parceiras");

      const consulta = query(
        referencia,
        where("uidDono", "==", usuario.uid)
      );

      const snapshot = await getDocs(consulta);

      const lista: Negocio[] = [];

      for (const documento of snapshot.docs) {
        const dados =
          documento.data() as DadosFirestore;

        const negocio: Negocio = {
          id: documento.id,

          uidDono: texto(dados.uidDono),

          nomeResponsavel:
            texto(dados.nomeResponsavel) ||
            usuario.displayName ||
            "",

          emailDono:
            texto(dados.emailDono) ||
            usuario.email ||
            "",

          nome: texto(dados.nome),

          titulo:
            texto(dados.titulo),

          subtitulo:
            texto(dados.subtitulo),

          descricao:
            texto(dados.descricao),

          tipo:
            tipoValido(dados.tipo),

          telefone:
            texto(dados.telefone),

          whatsapp:
            texto(dados.whatsapp),

          tipoPresenca:
            presencaValida(
              dados.tipoPresenca
            ),

          destinoDescricao:
            texto(dados.destinoDescricao),

          siteUrl:
  texto(dados.siteUrl),

imagemUrl:
  texto(dados.imagemUrl),

bannerUrl:
  texto(dados.bannerUrl),

slogan:
  texto(dados.slogan),

corMarca:
  texto(dados.corMarca) ||
  "#0f172a",

          ativo:
            booleano(dados.ativo),

          status:
            statusValido(dados.status),

          temLojaCriada:
            booleano(dados.temLojaCriada),

          linkLoja:
            texto(dados.linkLoja),

          plano:
            texto(dados.plano) ||
            "gratuito",

          statusPagamento:
            texto(dados.statusPagamento) ||
            "nao_aplicavel",

          valorPlano:
            numero(dados.valorPlano),

          mostrarMarquee:
            booleano(dados.mostrarMarquee),

          mostrarCard:
            booleano(dados.mostrarCard),

          mostrarBanner:
            booleano(dados.mostrarBanner),
        };

        lista.push(negocio);
      }

      setNegocios(lista);
    } catch (error) {
      console.error(
        "Erro ao carregar negócios:",
        error
      );

      setErro(
        "Não foi possível carregar seus negócios. Verifique as permissões do Firebase."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (!carregandoUsuario) {
      void carregarNegocios();
    }
  }, [usuario, carregandoUsuario]);

  function limparFormulario() {
    setNome("");
    setTitulo("");
    setSubtitulo("");
    setDescricao("");
    setTipo("loja");
    setTelefone("");
    setWhatsapp("");
    setTipoPresenca("pagina_sobradao");
    setDestinoDescricao("");
    setSiteUrl("");
    setNegocioEditando(null);
  }

  function preencherFormulario(
    negocio: Negocio
  ) {
    setNome(negocio.nome);
    setTitulo(negocio.titulo);
    setSubtitulo(negocio.subtitulo);
    setDescricao(negocio.descricao);
    setTipo(negocio.tipo);
    setTelefone(negocio.telefone);
    setWhatsapp(negocio.whatsapp);
    setTipoPresenca(
      negocio.tipoPresenca
    );

    setDestinoDescricao(
      negocio.destinoDescricao
    );

    setSiteUrl(negocio.siteUrl);

    setNegocioEditando(negocio.id);
    setMostrarCadastro(true);

    setMensagem("");
    setErro("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function salvarNegocio(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!usuario) {
      setErro(
        "Faça login para continuar."
      );
      return;
    }

    if (!nome.trim()) {
      setErro(
        "Informe o nome do negócio."
      );
      return;
    }

    if (!descricao.trim()) {
      setErro(
        "Informe uma descrição do negócio."
      );
      return;
    }

    if (
      tipoPresenca ===
        "site_externo" &&
      !siteUrl.trim()
    ) {
      setErro(
        "Informe o endereço do seu site externo."
      );
      return;
    }

    if (
      tipoPresenca ===
        "whatsapp" &&
      !whatsapp.trim()
    ) {
      setErro(
        "Informe o número do WhatsApp."
      );
      return;
    }

    try {
      setSalvando(true);
      setMensagem("");
      setErro("");

      const tipoSelecionado =
        TIPOS.find(
          (item) =>
            item.value === tipo
        ) || TIPOS[0];

      const dados = {
        uidDono:
          usuario.uid,

        nomeResponsavel:
          usuario.displayName || "",

        emailDono:
          usuario.email || "",

        nome:
          nome.trim(),

        titulo:
          titulo.trim() ||
          nome.trim(),

        subtitulo:
          subtitulo.trim() ||
          tipoSelecionado.label,

        descricao:
          descricao.trim(),

        tipo,

        telefone:
          telefone.trim(),

        whatsapp:
          whatsapp.trim(),

        tipoPresenca,

        destinoDescricao:
          destinoDescricao.trim(),

        siteUrl:
          siteUrl.trim(),

        atualizadoEm:
          serverTimestamp(),
      };

      if (negocioEditando) {
        const referencia =
          doc(
            db,
            "lojas_parceiras",
            negocioEditando
          );

        await updateDoc(
          referencia,
          dados
        );

        setMensagem(
          "Dados do seu negócio atualizados com sucesso."
        );
      } else {
        setErro(
          "Para criar um novo negócio, use o cadastro de anunciante."
        );

        return;
      }

      limparFormulario();
      setMostrarCadastro(false);

      await carregarNegocios();
    } catch (error) {
      console.error(
        "Erro ao salvar negócio:",
        error
      );

      setErro(
        "Não foi possível salvar as alterações."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function entrarComGoogle() {
    try {
      setErro("");

      await signInWithPopup(
        auth,
        googleProvider
      );
    } catch (error) {
      console.error(
        "Erro ao entrar com Google:",
        error
      );

      setErro(
        "Não foi possível entrar com Google."
      );
    }
  }

  function abrirNegocio(
    negocio: Negocio
  ) {
    if (
      negocio.tipoPresenca ===
        "site_externo" &&
      negocio.siteUrl
    ) {
      window.open(
        negocio.siteUrl,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    if (
      negocio.tipoPresenca ===
      "whatsapp"
    ) {
      const numero =
        limparWhatsapp(
          negocio.whatsapp
        );

      if (!numero) {
        setErro(
          "Este negócio ainda não possui WhatsApp cadastrado."
        );

        return;
      }

      const numeroBrasil =
        numero.startsWith("55")
          ? numero
          : `55${numero}`;

      window.open(
        `https://wa.me/${numeroBrasil}`,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    window.location.href =
      `/loja/${negocio.id}`;
  }

  function textoStatus(
    negocio: Negocio
  ): string {
    if (
      negocio.status ===
      "APROVADO"
    ) {
      return "APROVADO";
    }

    if (
      negocio.status ===
      "SUSPENSO"
    ) {
      return "SUSPENSO";
    }

    return "AGUARDANDO APROVAÇÃO";
  }

  function classeStatus(
    negocio: Negocio
  ): string {
    if (
      negocio.status ===
      "APROVADO"
    ) {
      return "bg-emerald-100 text-emerald-700";
    }

    if (
      negocio.status ===
      "SUSPENSO"
    ) {
      return "bg-red-100 text-red-700";
    }

    return "bg-amber-100 text-amber-700";
  }

  if (
    carregandoUsuario ||
    carregando
  ) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 text-center shadow-sm">

          <div className="text-4xl">
            🏪
          </div>

          <p className="mt-3 text-sm font-bold text-slate-600">
            Carregando painel...
          </p>

        </div>
      </main>
    );
  }

  if (!usuario) {
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
              Acesse sua área para administrar
              sua empresa, loja ou serviço.
            </p>

          </div>

          <div className="p-8">

            {erro && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
                {erro}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <p className="text-sm font-black text-slate-800">
                Entrar como anunciante
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Use a mesma conta Google usada
                no cadastro da empresa.
              </p>

              <button
                type="button"
                onClick={
                  entrarComGoogle
                }
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

      <div className="mx-auto max-w-6xl space-y-5">

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">

          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 p-6 text-white md:p-8">

            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                  SOBRADÃO 360
                </p>

                <h1 className="mt-2 text-2xl font-black md:text-3xl">
                  🏪 Painel do Anunciante
                </h1>

                <p className="mt-2 text-sm text-blue-100">
                  Administração do seu negócio
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

          <div className="grid gap-3 p-5 md:grid-cols-3">

            <div className="rounded-2xl bg-slate-50 p-4">

              <p className="text-[10px] font-black uppercase text-slate-400">
                Responsável
              </p>

              <p className="mt-1 text-sm font-black text-slate-800">
                {usuario.displayName ||
                  "Usuário"}
              </p>

            </div>

            <div className="rounded-2xl bg-slate-50 p-4">

              <p className="text-[10px] font-black uppercase text-slate-400">
                E-mail da conta
              </p>

              <p className="mt-1 break-all text-sm font-black text-slate-800">
                {usuario.email ||
                  "Não informado"}
              </p>

            </div>

            <div className="rounded-2xl bg-slate-50 p-4">

              <p className="text-[10px] font-black uppercase text-slate-400">
                ID do usuário
              </p>

              <p className="mt-1 break-all text-[11px] font-bold text-slate-600">
                {usuario.uid}
              </p>

            </div>

          </div>

        </section>

        {mensagem && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
            {erro}
          </div>
        )}

        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-lg font-black text-slate-900">
                Minha empresa
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Aqui aparecem somente os negócios
                vinculados à sua conta.
              </p>

            </div>

            <Link
              href="/cadastro-anunciante"
              className="rounded-xl bg-amber-400 px-4 py-3 text-center text-xs font-black text-blue-950 hover:bg-amber-300"
            >
              + Cadastrar outro negócio
            </Link>

          </div>

          {mostrarCadastro &&
            negocioEditando && (
              <form
                onSubmit={salvarNegocio}
                className="mt-5 space-y-5 rounded-2xl border border-blue-100 bg-blue-50 p-5"
              >

                <div>

                  <h3 className="text-base font-black text-blue-950">
                    ✏️ Editar minha página
                  </h3>

                  <p className="mt-1 text-xs text-blue-700">
                    Altere as informações que
                    aparecerão para os moradores.
                  </p>

                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <div>

                    <label className="text-xs font-black text-slate-700">
                      Nome do negócio *
                    </label>

                    <input
                      value={nome}
                      onChange={(e) =>
                        setNome(
                          e.target.value
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />

                  </div>

                  <div>

                    <label className="text-xs font-black text-slate-700">
                      Título
                    </label>

                    <input
                      value={titulo}
                      onChange={(e) =>
                        setTitulo(
                          e.target.value
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />

                  </div>

                </div>

                <div>

                  <label className="text-xs font-black text-slate-700">
                    Subtítulo
                  </label>

                  <input
                    value={subtitulo}
                    onChange={(e) =>
                      setSubtitulo(
                        e.target.value
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                  />

                </div>

                <div>

                  <label className="text-xs font-black text-slate-700">
                    Descrição *
                  </label>

                  <textarea
                    value={descricao}
                    onChange={(e) =>
                      setDescricao(
                        e.target.value
                      )
                    }
                    rows={5}
                    className="mt-1 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                  />

                </div>

                <div>

                  <label className="text-xs font-black text-slate-700">
                    Tipo de negócio
                  </label>

                  <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">

                    {TIPOS.map(
                      (item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() =>
                            setTipo(
                              item.value
                            )
                          }
                          className={
                            tipo ===
                            item.value
                              ? "rounded-xl border-2 border-blue-800 bg-white p-3 text-left"
                              : "rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-blue-300"
                          }
                        >

                          <span className="text-xl">
                            {item.icon}
                          </span>

                          <span className="mt-1 block text-xs font-black text-slate-800">
                            {item.label}
                          </span>

                        </button>
                      )
                    )}

                  </div>

                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <div>

                    <label className="text-xs font-black text-slate-700">
                      Telefone
                    </label>

                    <input
                      value={telefone}
                      onChange={(e) =>
                        setTelefone(
                          e.target.value
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />

                  </div>

                  <div>

                    <label className="text-xs font-black text-slate-700">
                      WhatsApp
                    </label>

                    <input
                      value={whatsapp}
                      onChange={(e) =>
                        setWhatsapp(
                          e.target.value
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />

                  </div>

                </div>

                <div>

                  <label className="text-xs font-black text-slate-700">
                    Onde o cliente será atendido?
                  </label>

                  <div className="mt-2 grid gap-3 md:grid-cols-3">

                    {PRESENCAS.map(
                      (item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() =>
                            setTipoPresenca(
                              item.value
                            )
                          }
                          className={
                            tipoPresenca ===
                            item.value
                              ? "rounded-2xl border-2 border-blue-800 bg-white p-4 text-left"
                              : "rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-blue-300"
                          }
                        >

                          <div className="text-2xl">
                            {item.icon}
                          </div>

                          <p className="mt-2 text-xs font-black text-slate-800">
                            {item.label}
                          </p>

                          <p className="mt-1 text-[10px] leading-4 text-slate-500">
                            {item.descricao}
                          </p>

                        </button>
                      )
                    )}

                  </div>

                </div>

                {tipoPresenca ===
                  "site_externo" && (
                  <div>

                    <label className="text-xs font-black text-slate-700">
                      Endereço do seu site *
                    </label>

                    <input
                      value={siteUrl}
                      onChange={(e) =>
                        setSiteUrl(
                          e.target.value
                        )
                      }
                      placeholder="https://seusite.com.br"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />

                  </div>
                )}

                {tipoPresenca ===
                  "whatsapp" && (
                  <div>

                    <label className="text-xs font-black text-slate-700">
                      Número do WhatsApp *
                    </label>

                    <input
                      value={whatsapp}
                      onChange={(e) =>
                        setWhatsapp(
                          e.target.value
                        )
                      }
                      placeholder="(19) 99999-9999"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                    />

                  </div>
                )}

                <div>

                  <label className="text-xs font-black text-slate-700">
                    Como deseja apresentar o destino?
                  </label>

                  <input
                    value={
                      destinoDescricao
                    }
                    onChange={(e) =>
                      setDestinoDescricao(
                        e.target.value
                      )
                    }
                    placeholder="Ex.: Visite nossa loja, peça pelo WhatsApp..."
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700"
                  />

                </div>

                <div className="flex flex-col gap-2 sm:flex-row">

                  <button
                    type="submit"
                    disabled={salvando}
                    className="rounded-xl bg-blue-900 px-5 py-3 text-xs font-black text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {salvando
                      ? "Salvando..."
                      : "💾 Salvar alterações"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      limparFormulario();
                      setMostrarCadastro(
                        false
                      );
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-black text-slate-700"
                  >
                    Cancelar
                  </button>

                </div>

              </form>
            )}

          <div className="mt-5 space-y-4">

            {negocios.length === 0 ? (

              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">

                <div className="text-4xl">
                  🏪
                </div>

                <p className="mt-3 text-sm font-black text-slate-800">
                  Nenhum negócio encontrado.
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Se você já fez o cadastro,
                  verifique se entrou com a
                  mesma conta Google.
                </p>

                <Link
                  href="/cadastro-anunciante"
                  className="mt-5 inline-block rounded-xl bg-blue-900 px-5 py-3 text-xs font-black text-white"
                >
                  Cadastrar negócio
                </Link>

              </div>

            ) : (

              negocios.map(
                (negocio) => {
                  const tipoInfo =
                    TIPOS.find(
                      (item) =>
                        item.value ===
                        negocio.tipo
                    ) ||
                    TIPOS[7];

                  return (
                    <div
                      key={negocio.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >

                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                        <div className="flex gap-4">

                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                            {tipoInfo.icon}
                          </div>

                          <div>

                            <h3 className="text-lg font-black text-slate-900">
                              {negocio.nome ||
                                negocio.titulo ||
                                "Meu negócio"}
                            </h3>

                            <p className="mt-1 text-xs font-bold text-slate-500">
                              {tipoInfo.label}
                            </p>

                            <p className="mt-2 break-all text-[11px] text-slate-400">
                              {negocio.emailDono}
                            </p>

                          </div>

                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-[10px] font-black ${classeStatus(
                            negocio
                          )}`}
                        >
                          ●{" "}
                          {textoStatus(
                            negocio
                          )}
                        </span>

                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3">

                        <div className="rounded-xl bg-white p-4">

                          <p className="text-[10px] font-black uppercase text-slate-400">
                            Presença
                          </p>

                          <p className="mt-1 text-xs font-black text-slate-700">

                            {negocio.tipoPresenca ===
                              "site_externo" &&
                              "🌐 Site externo"}

                            {negocio.tipoPresenca ===
                              "whatsapp" &&
                              "💬 WhatsApp"}

                            {negocio.tipoPresenca ===
                              "pagina_sobradao" &&
                              "🏠 Página Sobradão 360"}

                          </p>

                        </div>

                        <div className="rounded-xl bg-white p-4">

                          <p className="text-[10px] font-black uppercase text-slate-400">
                            Plano
                          </p>

                          <p className="mt-1 text-xs font-black capitalize text-slate-700">
                            {negocio.plano}
                          </p>

                        </div>

                        <div className="rounded-xl bg-white p-4">

                          <p className="text-[10px] font-black uppercase text-slate-400">
                            Publicação
                          </p>

                          <p className="mt-1 text-xs font-black text-slate-700">
                            {negocio.ativo
                              ? "Publicado"
                              : "Aguardando aprovação"}
                          </p>

                        </div>

                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">

                        <button
                          type="button"
                          onClick={() =>
                            preencherFormulario(
                              negocio
                            )
                          }
                          className="rounded-xl bg-blue-900 px-4 py-3 text-xs font-black text-white hover:bg-blue-800"
                        >
                          ✏️ Editar minha página
                        </button>

                        {negocio.ativo && (
                          <button
                            type="button"
                            onClick={() =>
                              abrirNegocio(
                                negocio
                              )
                            }
                            className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-xs font-black text-blue-800 hover:bg-blue-50"
                          >
                            👀 Ver minha página
                          </button>
                        )}

                      </div>
                      <IdentidadeAnunciante
  lojaId={negocio.id}
  nome={negocio.nome}
  imagemUrl={negocio.imagemUrl}
  bannerUrl={negocio.bannerUrl}
  corMarca={negocio.corMarca}
  mostrarBanner={
    negocio.mostrarBanner
  }
  mostrarMarquee={
    negocio.mostrarMarquee
  }
  mostrarCard={
    negocio.mostrarCard
  }
  onAtualizado={() => {
    void carregarNegocios();
  }}
/>

                      <GerenciadorProdutos
                        lojaId={negocio.id}
                        tipoNegocio={
                          negocio.tipo
                        }
                      />

                    </div>
                  );
                }
              )

            )}

          </div>

        </section>

        <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5">

          <h2 className="text-sm font-black text-blue-950">
            🚀 Área comercial
          </h2>

          <p className="mt-1 text-xs leading-5 text-blue-800">
            O ambiente abaixo será adaptado de
            acordo com o tipo do seu negócio.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl bg-white p-4">

              <div className="text-2xl">
                📦
              </div>

              <p className="mt-2 text-xs font-black text-slate-800">
                Produtos
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Produtos, preços e imagens.
              </p>

            </div>

            <div className="rounded-2xl bg-white p-4">

              <div className="text-2xl">
                🔧
              </div>

              <p className="mt-2 text-xs font-black text-slate-800">
                Serviços
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Serviços oferecidos pelo negócio.
              </p>

            </div>

            <div className="rounded-2xl bg-white p-4">

              <div className="text-2xl">
                📸
              </div>

              <p className="mt-2 text-xs font-black text-slate-800">
                Fotos
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Fotos da empresa e produtos.
              </p>

            </div>

            <div className="rounded-2xl bg-white p-4">

              <div className="text-2xl">
                📢
              </div>

              <p className="mt-2 text-xs font-black text-slate-800">
                Divulgação
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Cards, banners e destaque.
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}