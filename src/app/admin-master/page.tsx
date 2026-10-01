"use client";

type AuthUsuario = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";


import { db } from "@/lib/firebase";
import ContratosAnuncio from "./ContratosAnuncio";

type UsuarioFirebase = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

interface LojaParceira {
  id: string;

  uidDono?: string;
  nomeResponsavel?: string;
  emailDono?: string;

  nome?: string;
  titulo?: string;
  subtitulo?: string;
  descricao?: string;

  tipo?: string;

  telefone?: string;
  whatsapp?: string;

  tipoPresenca?:
    | "pagina_sobradao"
    | "site_externo"
    | "whatsapp";

  destinoDescricao?: string;
  siteUrl?: string;

  imagemUrl?: string;

  ativo?: boolean;
  status?: string;

  temLojaCriada?: boolean;
  linkLoja?: string;

  plano?: string;
  statusPagamento?: string;
  valorPlano?: number;

  planoEscolhidoId?: string;
  planoEscolhidoNome?: string;
  planoEscolhidoValor?: number;
  planoEscolhidoDuracaoDias?: number;
  planoEscolhidoLimiteProdutos?: number;
  statusPlano?: string;

  mostrarMarquee?: boolean;
  mostrarCard?: boolean;
  mostrarBanner?: boolean;

  criadoEm?: unknown;
  atualizadoEm?: unknown;
}

interface Usuario {
  id: string;
  nome?: string;
  displayName?: string;
  email?: string;
  perfil?: string;
}

interface UsuarioLogado {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface SolicitacaoDivulgacao {
  id: string;
  nomeResponsavel?: string;
  email?: string;
  whatsapp?: string;
  telefone?: string;
  nomeNegocio?: string;
  tipoNegocio?: string;
  endereco?: string;
  descricao?: string;
  instagram?: string;
  site?: string;
  observacoes?: string;
  status?: string;
  criadoEm?: unknown;
}

const TIPOS: Record<string, string> = {
  loja: "Loja / Comércio",
  oficina: "Oficina / Assistência",
  profissional: "Profissional / Prestador",
  alimentacao: "Alimentação",
  eventos: "Eventos",
  empresa: "Empresa",
  tecnologia: "Tecnologia / Serviço digital",
  outros: "Outro",
};

const DESTINOS: Record<string, string> = {
  pagina_sobradao: "Página dentro do Sobradão 360",
  site_externo: "Site / Loja externa",
  whatsapp: "WhatsApp",
};

const FILTROS = [
  { valor: "todos", texto: "Todos" },
  { valor: "PENDENTE", texto: "Pendentes" },
  { valor: "APROVADO", texto: "Aprovados" },
  { valor: "SUSPENSO", texto: "Suspensos" },
];

const FILTROS_SOLICITACOES = [
  { valor: "todos", texto: "Todas" },
  { valor: "PENDENTE", texto: "Pendentes" },
  { valor: "APROVADO", texto: "Aprovadas" },
  { valor: "RECUSADO", texto: "Recusadas" },
];

function formatarData(valor: unknown): string {
  if (!valor) {
    return "-";
  }

  try {
    if (
      typeof valor === "object" &&
      valor !== null &&
      "toDate" in valor &&
      typeof (valor as { toDate?: unknown }).toDate === "function"
    ) {
      const data = (
        valor as {
          toDate: () => Date;
        }
      ).toDate();

      return data.toLocaleDateString("pt-BR");
    }

    if (valor instanceof Date) {
      return valor.toLocaleDateString("pt-BR");
    }

    return "-";
  } catch {
    return "-";
  }
}

function limparWhatsapp(numero: string): string {
  return numero.replace(/\D/g, "");
}

export default function AdminMasterPage() {
  const [user, setUser] = useState<UsuarioLogado | null>(null);

  const [autorizado, setAutorizado] = useState(false);

  const [carregando, setCarregando] = useState(true);

  const [lojas, setLojas] = useState<LojaParceira[]>([]);

  const [contratosMaster, setContratosMaster] = useState<Record<string, {
    pacoteNome?: string;
    valorContratado?: number;
    duracaoDias?: number;
    limiteProdutos?: number;
    inicio?: unknown;
    vencimento?: unknown;
    status?: string;
    exibicao?: { marquee?: boolean; publicidade?: boolean; destaques?: boolean; parceiros?: boolean };
  }>>({});

  const [selecionada, setSelecionada] =
    useState<LojaParceira | null>(null);

  const [processando, setProcessando] =
    useState<string | null>(null);

  const [sincronizandoVagas, setSincronizandoVagas] =
    useState(false);

  const [filtro, setFiltro] = useState("todos");
  const [filtroSolicitacao, setFiltroSolicitacao] = useState("todos");

  const [menuAberto, setMenuAberto] = useState("anunciantes");

  const [solicitacoes, setSolicitacoes] =
    useState<SolicitacaoDivulgacao[]>([]);

  useEffect(() => {
    const auth = getAuth();

    const cancelar = auth.onAuthStateChanged(
  async (usuario: AuthUsuario | null) => {
      if (!usuario) {
        setUser(null);
        setAutorizado(false);
        setCarregando(false);
        return;
      }

      const usuarioAtual: UsuarioLogado = {
        uid: usuario.uid,
        email: usuario.email,
        displayName: usuario.displayName,
      };

      setUser(usuarioAtual);

      try {
        const usuarioRef = doc(
          db,
          "usuarios",
          usuario.uid
        );

        const usuarioSnapshot = await getDoc(usuarioRef);

        if (!usuarioSnapshot.exists()) {
          setAutorizado(false);
          setCarregando(false);
          return;
        }

        const dados = usuarioSnapshot.data() as {
          nome?: string;
          displayName?: string;
          email?: string;
          perfil?: string;
        };

        if (dados.perfil !== "master") {
          setAutorizado(false);
          setCarregando(false);
          return;
        }

        setAutorizado(true);

        await carregarLojas();
        await carregarContratosMaster();
        await carregarSolicitacoes();
      } catch (error: unknown) {
        console.error(
          "Erro ao verificar acesso Master:",
          error
        );

        setAutorizado(false);
      } finally {
        setCarregando(false);
      }
    });

    return () => cancelar();
  }, []);

  async function sincronizarVagasTrampolim() {
    if (sincronizandoVagas) return;

    setSincronizandoVagas(true);

    try {
      const auth = getAuth();
      const usuario = auth.currentUser;

      if (!usuario) {
        alert("Sessão do Master não encontrada. Entre novamente.");
        return;
      }

      const token = await usuario.getIdToken();

      const response = await fetch("/api/sincronizar-vagas", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const textoResposta = await response.text();
      let resultado: any = {};
      try { resultado = textoResposta ? JSON.parse(textoResposta) : {}; }
      catch { throw new Error(`O servidor respondeu sem JSON válido (HTTP ${response.status}).`); }

      if (!response.ok || !resultado.success) {
        throw new Error(
          resultado.mensagem || "Não foi possível atualizar as vagas."
        );
      }

      alert(
        `Trampolim atualizado com sucesso!\\n\\nEncontradas: ${resultado.encontradas}\\nExcluídas antigas: ${resultado.excluidas}\\nImportadas: ${resultado.importadas}`
      );
    } catch (error) {
      console.error("Erro ao sincronizar vagas do Trampolim:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as vagas do Trampolim."
      );
    } finally {
      setSincronizandoVagas(false);
    }
  }

  async function carregarLojas() {
    try {
      const lojasRef = collection(
        db,
        "lojas_parceiras"
      );

      const consulta = query(
        lojasRef,
        orderBy("criadoEm", "desc")
      );

      const snapshot = await getDocs(consulta);

      const usuariosSnapshot = await getDocs(
        collection(db, "usuarios")
      );

      const usuariosMap = new Map<
        string,
        Usuario
      >();

      usuariosSnapshot.docs.forEach(
  (usuarioDoc: {
    id: string;
    data: () => Record<string, unknown>;
  }) => {
        const dados = usuarioDoc.data() as {
          nome?: string;
          displayName?: string;
          email?: string;
          perfil?: string;
        };

        usuariosMap.set(usuarioDoc.id, {
          id: usuarioDoc.id,
          ...dados,
        });
      });

      const lista: LojaParceira[] =
        snapshot.docs.map(
  (item: {
    id: string;
    data: () => Record<string, unknown>;
  }) => {
          const dados = item.data() as Omit<
            LojaParceira,
            "id"
          >;

          const usuario = dados.uidDono
            ? usuariosMap.get(dados.uidDono)
            : undefined;

          return {
            id: item.id,
            ...dados,

            nomeResponsavel:
              dados.nomeResponsavel ||
              usuario?.nome ||
              usuario?.displayName ||
              "",

            emailDono:
              dados.emailDono ||
              usuario?.email ||
              "",
          };
        });

      setLojas(lista);
    } catch (error: unknown) {
      console.error(
        "Erro ao carregar lojas parceiras:",
        error
      );
    }
  }

  async function carregarContratosMaster() {
    try {
      const snapshot = await getDocs(collection(db, "contratos_anuncio"));
      const mapa: Record<string, {
        pacoteNome?: string; valorContratado?: number; duracaoDias?: number;
        limiteProdutos?: number; inicio?: unknown; vencimento?: unknown;
        status?: string; exibicao?: { marquee?: boolean; publicidade?: boolean; destaques?: boolean; parceiros?: boolean };
      }> = {};

      snapshot.docs.forEach((item: (typeof snapshot.docs)[number]) => {
        const d = item.data() as Record<string, any>;
        if (!d.lojaId) return;
        if (!mapa[d.lojaId] || String(d.status || "").toLowerCase() === "ativo") {
          mapa[d.lojaId] = d;
        }
      });
      setContratosMaster(mapa);
    } catch (error) {
      console.error("Erro ao carregar contratos para o Master:", error);
    }
  }

  async function carregarSolicitacoes() {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, "solicitacoes_divulgacao"),
          orderBy("criadoEm", "desc")
        )
      );

      setSolicitacoes(
        snapshot.docs.map((item: (typeof snapshot.docs)[number]) => ({
          id: item.id,
          ...(item.data() as Omit<SolicitacaoDivulgacao, "id">),
        }))
      );
    } catch (error: unknown) {
      console.error(
        "Erro ao carregar solicitações de divulgação:",
        error
      );
    }
  }

  async function atualizarStatusSolicitacao(
    id: string,
    status: "APROVADO" | "RECUSADO"
  ) {
    setProcessando(id);

    try {
      const solicitacaoRef = doc(
        db,
        "solicitacoes_divulgacao",
        id
      );

      await updateDoc(solicitacaoRef, {
        status,
        atualizadoEm: serverTimestamp(),
      });

      setSolicitacoes((lista) =>
        lista.map((item) =>
          item.id === id ? { ...item, status } : item
        )
      );
    } catch (error: unknown) {
      console.error("Erro ao atualizar solicitação:", error);
      alert("Não foi possível atualizar esta solicitação.");
    } finally {
      setProcessando(null);
    }
  }

  function enviarAprovacaoWhatsApp(item: SolicitacaoDivulgacao) {
    const numero = limparWhatsapp(item.whatsapp || "");

    if (!numero) {
      alert("Esta solicitação não possui um WhatsApp válido.");
      return;
    }

    const origem =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://sobradao360-sgvm.vercel.app";

    const linkPainel =
      origem + "/painel-anunciante?solicitacao=" + encodeURIComponent(item.id);

    const linkPlanos =
      origem + "/planos-anunciante";

    const mensagem = [
      "Olá, " + (item.nomeResponsavel || "") + "!",
      "",
      "Sua solicitação para divulgar o negócio " +
        (item.nomeNegocio || "") +
        " no Sobradão 360 foi APROVADA. ✅",
      "",
      "Para continuar:",
      "1. Acesse o painel do anunciante pelo link abaixo.",
      "2. Entre com o Google usando o MESMO e-mail informado no cadastro.",
      "3. Depois do acesso, sua página será vinculada ao seu painel.",
      "4. No painel você poderá completar os dados do negócio e cadastrar produtos ou serviços.",
      "",
      "🔐 Painel do anunciante:",
      linkPainel,
      "",
      "💳 Veja os planos, limites e condições:",
      linkPlanos,
      "",
      "O pagamento e a ativação comercial serão tratados conforme o plano escolhido.",
      "",
      "Sobradão 360"
    ].join("\n");

    window.open(
      "https://wa.me/55" +
        numero +
        "?text=" +
        encodeURIComponent(mensagem),
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function aprovarLoja(id: string) {
    setProcessando(id);

    try {
      const lojaRef = doc(
        db,
        "lojas_parceiras",
        id
      );

      await updateDoc(lojaRef, {
        status: "APROVADO",
        ativo: true,
        atualizadoEm: serverTimestamp(),
      });

      setLojas((lista) =>
        lista.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "APROVADO",
                ativo: true,
              }
            : item
        )
      );

      setSelecionada((item) =>
        item && item.id === id
          ? {
              ...item,
              status: "APROVADO",
              ativo: true,
            }
          : item
      );
    } catch (error: unknown) {
      console.error(
        "Erro ao aprovar loja:",
        error
      );

      alert(
        "Não foi possível aprovar este parceiro."
      );
    } finally {
      setProcessando(null);
    }
  }

  async function suspenderLoja(id: string) {
    setProcessando(id);

    try {
      const lojaRef = doc(
        db,
        "lojas_parceiras",
        id
      );

      await updateDoc(lojaRef, {
        status: "SUSPENSO",
        ativo: false,
        atualizadoEm: serverTimestamp(),
      });

      setLojas((lista) =>
        lista.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "SUSPENSO",
                ativo: false,
              }
            : item
        )
      );

      setSelecionada((item) =>
        item && item.id === id
          ? {
              ...item,
              status: "SUSPENSO",
              ativo: false,
            }
          : item
      );
    } catch (error: unknown) {
      console.error(
        "Erro ao suspender loja:",
        error
      );

      alert(
        "Não foi possível suspender este parceiro."
      );
    } finally {
      setProcessando(null);
    }
  }

  async function reativarLoja(id: string) {
    setProcessando(id);

    try {
      const lojaRef = doc(
        db,
        "lojas_parceiras",
        id
      );

      await updateDoc(lojaRef, {
        status: "APROVADO",
        ativo: true,
        atualizadoEm: serverTimestamp(),
      });

      setLojas((lista) =>
        lista.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "APROVADO",
                ativo: true,
              }
            : item
        )
      );

      setSelecionada((item) =>
        item && item.id === id
          ? {
              ...item,
              status: "APROVADO",
              ativo: true,
            }
          : item
      );
    } catch (error: unknown) {
      console.error(
        "Erro ao reativar loja:",
        error
      );

      alert(
        "Não foi possível reativar este parceiro."
      );
    } finally {
      setProcessando(null);
    }
  }

  function abrirDestino(item: LojaParceira) {
    if (
      item.tipoPresenca === "site_externo" &&
      item.siteUrl
    ) {
      const url =
        item.siteUrl.startsWith("http://") ||
        item.siteUrl.startsWith("https://")
          ? item.siteUrl
          : `https://${item.siteUrl}`;

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    if (
      item.tipoPresenca === "whatsapp" &&
      item.whatsapp
    ) {
      const numero = limparWhatsapp(
        item.whatsapp
      );

      if (numero) {
        window.open(
          `https://wa.me/55${numero}`,
          "_blank",
          "noopener,noreferrer"
        );
      }

      return;
    }

    window.open(
      `/loja/${item.id}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const lojasFiltradas =
    filtro === "todos"
      ? lojas
      : lojas.filter(
          (item) =>
            (item.status || "PENDENTE") ===
            filtro
        );

  const total = lojas.length;

  const pendentes = lojas.filter(
    (item) =>
      (item.status || "PENDENTE") ===
      "PENDENTE"
  ).length;

  const aprovadas = lojas.filter(
    (item) =>
      item.status === "APROVADO"
  ).length;

  const suspensas = lojas.filter(
    (item) =>
      item.status === "SUSPENSO"
  ).length;

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow">
            Carregando painel Master...
          </div>
        </div>
      </main>
    );
  }

  if (!autorizado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">

          <div className="mb-4 text-5xl">
            🔒
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Acesso restrito
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Esta área é exclusiva
            para o usuário Master.
          </p>

          {user?.email && (
            <p className="mt-4 text-xs text-slate-400">
              Usuário: {user.email}
            </p>
          )}

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">

    <div className="mx-auto max-w-7xl">

      <header className="mb-6">
          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>
                <div className="mb-1 text-sm font-semibold uppercase tracking-wider text-amber-400">
                  Sobradão 360
                </div>

                <h1 className="text-2xl font-bold md:text-3xl">
                  Painel Master
                </h1>

                <p className="mt-1 text-sm text-slate-300">
                  Administração dos anunciantes parceiros
                </p>
              </div>

              <div className="rounded-xl bg-white/10 px-4 py-3 text-sm">
                Logado como:
                <div className="font-bold text-white">
                  {user?.email || "Master"}
                </div>
              </div>

            </div>

          </div>
        </header>


        <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-base font-black text-slate-900">
              Menu Master
            </h2>
            <p className="text-xs text-slate-500">
              Abra somente a área que você precisa administrar.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["anunciantes", "🏪", "Anunciantes", "Lojas parceiras"],
              ["solicitacoes", "📨", "Solicitações", solicitacoes.length + " recebida(s)"],
              ["planos", "💳", "Planos e contratos", "Pacotes e contratos"],
              ["painel", "👤", "Painel anunciante", "Abrir painel"],
            ].map(([id, icone, titulo, descricao]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMenuAberto(id)}
                className={`rounded-xl border p-3 text-left transition ${
                  menuAberto === id
                    ? "border-amber-400 bg-amber-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="text-lg">{icone}</div>
                <div className="mt-1 text-sm font-black text-slate-900">
                  {titulo}
                </div>
                <div className="text-xs text-slate-500">
                  {descricao}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-black text-indigo-950">💼 Atualização de vagas</div>
                <p className="mt-1 text-xs leading-relaxed text-indigo-800">
                  Atualize manualmente as vagas do Trampolim / PAT. A integração já está preparada para futuramente ser automatizada pelo n8n.
                </p>
              </div>
              <button
                type="button"
                onClick={sincronizarVagasTrampolim}
                disabled={sincronizandoVagas}
                className="rounded-xl bg-indigo-700 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sincronizandoVagas ? "⏳ Atualizando..." : "🔄 Atualizar Trampolim"}
              </button>
            </div>
          </div>
        </section>

        <div className="mb-6">
          <a
            href="/admin-master/telefones"
            className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100"
          >
            <span className="text-2xl">📞</span>
            <span>
              <span className="block text-sm font-black text-slate-900">Contatos e Serviços</span>
              <span className="block text-xs text-slate-500">Aprovar cadastros enviados pela comunidade</span>
            </span>
          </a>
        </div>

        <section className="mb-6">
          {menuAberto === "planos" && (
            <ContratosAnuncio
              lojas={lojas.map((loja) => ({
                id: loja.id,
                nome: loja.nome,
                titulo: loja.titulo,
                statusPlano: loja.statusPlano,
                planoEscolhidoId: loja.planoEscolhidoId,
                planoEscolhidoNome: loja.planoEscolhidoNome,
                planoEscolhidoValor: loja.planoEscolhidoValor,
                planoEscolhidoDuracaoDias: loja.planoEscolhidoDuracaoDias,
                planoEscolhidoLimiteProdutos: loja.planoEscolhidoLimiteProdutos,
              }))}
            />
          )}

          {menuAberto === "painel" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">
                Painel do anunciante
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Área usada pelo comerciante para administrar a própria página e produtos.
              </p>
              <a
                href="/painel-anunciante"
                className="mt-4 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                Abrir painel anunciante
              </a>
            </div>
          )}

          {menuAberto === "solicitacoes" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Solicitações de divulgação
                  </h2>
                  <p className="text-sm text-slate-500">
                    Pedidos enviados pelo formulário Quero divulgar meu negócio.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                    {solicitacoes.filter((item) => (item.status || "PENDENTE") === "PENDENTE").length} pendente(s)
                  </span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                    {solicitacoes.filter((item) => item.status === "APROVADO").length} aprovada(s)
                  </span>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                    {solicitacoes.filter((item) => item.status === "RECUSADO").length} recusada(s)
                  </span>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {FILTROS_SOLICITACOES.map((filtroItem) => (
                  <button
                    key={filtroItem.valor}
                    type="button"
                    onClick={() => setFiltroSolicitacao(filtroItem.valor)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${filtroSolicitacao === filtroItem.valor ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {filtroItem.texto}
                  </button>
                ))}
              </div>

              {solicitacoes.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Nenhuma solicitação recebida.
                </div>
              ) : (
                <div className="space-y-3">
                  {solicitacoes
                    .filter((item) =>
                      filtroSolicitacao === "todos"
                        ? true
                        : (item.status || "PENDENTE") === filtroSolicitacao
                    )
                    .map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="font-black text-slate-900">
                            {item.nomeNegocio || "Negócio sem nome"}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Responsável: {item.nomeResponsavel || "Não informado"}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                          {item.status || "PENDENTE"}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                        <div><strong>E-mail:</strong> {item.email || "-"}</div>
                        <div><strong>WhatsApp:</strong> {item.whatsapp || "-"}</div>
                        <div><strong>Telefone:</strong> {item.telefone || "-"}</div>
                        <div><strong>Tipo:</strong> {TIPOS[item.tipoNegocio || ""] || item.tipoNegocio || "-"}</div>
                        <div><strong>Endereço:</strong> {item.endereco || "-"}</div>
                        <div><strong>Cadastro:</strong> {formatarData(item.criadoEm)}</div>
                      </div>

                      {item.descricao && (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                          {item.descricao}
                        </p>
                      )}

                      {(item.instagram || item.site || item.observacoes) && (
                        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                          {item.instagram && <div><strong>Instagram:</strong> {item.instagram}</div>}
                          {item.site && <div><strong>Site:</strong> {item.site}</div>}
                          {item.observacoes && <div><strong>Observações:</strong> {item.observacoes}</div>}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {item.status !== "APROVADO" && (
                          <button
                            type="button"
                            disabled={processando === item.id}
                            onClick={() => atualizarStatusSolicitacao(item.id, "APROVADO")}
                            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {processando === item.id ? "..." : "✓ Aprovar solicitação"}
                          </button>
                        )}

                        {item.status !== "RECUSADO" && (
                          <button
                            type="button"
                            disabled={processando === item.id}
                            onClick={() => atualizarStatusSolicitacao(item.id, "RECUSADO")}
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {processando === item.id ? "..." : "✕ Recusar"}
                          </button>
                        )}

                        {item.status === "APROVADO" && (
                          <button
                            type="button"
                            onClick={() => enviarAprovacaoWhatsApp(item)}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                          >
                            📲 Enviar aprovação pelo WhatsApp
                          </button>
                        )}

                        {item.status === "APROVADO" && (
                          <a
                            href="/planos-anunciante"
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-900 hover:bg-amber-200"
                          >
                            💳 Ver planos
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {menuAberto === "anunciantes" && (
          <>
        <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">
              Total
            </div>
            <div className="mt-1 text-3xl font-bold text-slate-900">
              {total}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">
              Pendentes
            </div>
            <div className="mt-1 text-3xl font-bold text-amber-500">
              {pendentes}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">
              Aprovados
            </div>
            <div className="mt-1 text-3xl font-bold text-green-600">
              {aprovadas}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">
              Suspensos
            </div>
            <div className="mt-1 text-3xl font-bold text-red-600">
              {suspensas}
            </div>
          </div>

        </section>

        <section className="mb-6 flex flex-wrap gap-2">

          {FILTROS.map((filtroItem) => (
            <button
              key={filtroItem.valor}
              type="button"
              onClick={() =>
                setFiltro(filtroItem.valor)
              }
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                filtro === filtroItem.valor
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              }`}
            >
              {filtroItem.texto}
            </button>
          ))}

        </section>

        <section className="space-y-4">

          {lojasFiltradas.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

              <div className="mb-2 text-4xl">
                🏪
              </div>

              <h2 className="font-bold text-slate-800">
                Nenhum anunciante encontrado
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Não existem parceiros neste filtro.
              </p>

            </div>
          ) : (
            lojasFiltradas.map((item) => {

              const status =
                item.status || "PENDENTE";

              return (
                <article
                  key={item.id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div className="min-w-0 flex-1">

                      <div className="mb-2 flex flex-wrap items-center gap-2">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            status === "APROVADO"
                              ? "bg-green-100 text-green-700"
                              : status === "SUSPENSO"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {status}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {TIPOS[item.tipo || ""] ||
                            "Parceiro"}
                        </span>

                      </div>

                      <h2 className="text-xl font-bold text-slate-900">
                        {item.nome ||
                          item.titulo ||
                          "Sem nome"}
                      </h2>

                      {item.subtitulo && (
                        <p className="mt-1 text-sm text-slate-500">
                          {item.subtitulo}
                        </p>
                      )}

                      <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">

                        <div>
                          <span className="font-semibold text-slate-700">
                            Responsável:
                          </span>{" "}
                          {item.nomeResponsavel ||
                            "Não informado"}
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            E-mail:
                          </span>{" "}
                          {item.emailDono ||
                            "Não informado"}
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            Telefone:
                          </span>{" "}
                          {item.telefone ||
                            "Não informado"}
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            WhatsApp:
                          </span>{" "}
                          {item.whatsapp ||
                            "Não informado"}
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            Presença:
                          </span>{" "}
                          {DESTINOS[
                            item.tipoPresenca || ""
                          ] ||
                            "Página Sobradão 360"}
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            Cadastro:
                          </span>{" "}
                          {formatarData(
                            item.criadoEm
                          )}
                        </div>

                      </div>

                      {item.siteUrl && (
                        <div className="mt-3 break-all text-sm">
                          <span className="font-semibold text-slate-700">
                            Site:
                          </span>{" "}
                          {item.siteUrl}
                        </div>
                      )}

                      {item.descricao && (
                        <p className="mt-3 line-clamp-3 text-sm text-slate-600">
                          {item.descricao}
                        </p>
                      )}

                    </div>

                    <div className="flex flex-wrap gap-2 lg:w-[270px] lg:justify-end">

                      <button
                        type="button"
                        onClick={() =>
                          setSelecionada(item)
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Detalhes
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          abrirDestino(item)
                        }
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                      >
                        Abrir
                      </button>

                      {status !== "APROVADO" && (
                        <button
                          type="button"
                          disabled={
                            processando === item.id
                          }
                          onClick={() =>
                            aprovarLoja(item.id)
                          }
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {processando === item.id
                            ? "..."
                            : "Aprovar"}
                        </button>
                      )}

                      {status === "APROVADO" && (
                        <button
                          type="button"
                          disabled={
                            processando === item.id
                          }
                          onClick={() =>
                            suspenderLoja(item.id)
                          }
                          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {processando === item.id
                            ? "..."
                            : "Suspender"}
                        </button>
                      )}

                      {status === "SUSPENSO" && (
                        <button
                          type="button"
                          disabled={
                            processando === item.id
                          }
                          onClick={() =>
                            reativarLoja(item.id)
                          }
                          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {processando === item.id
                            ? "..."
                            : "Reativar"}
                        </button>
                      )}

                    </div>

                  </div>

                </article>
              );
            })
          )}

        </section>
          </>
        )}

      </div>

      {selecionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() =>
            setSelecionada(null)
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="mb-5 flex items-start justify-between gap-4">

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Detalhes do parceiro
                </div>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {selecionada.nome ||
                    selecionada.titulo ||
                    "Sem nome"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelecionada(null)
                }
                className="rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>

            </div>

            <div className="space-y-4 text-sm">

              {(() => {
                const contrato = contratosMaster[selecionada.id];
                const valor = contrato?.valorContratado ?? selecionada.valorPlano;
                return (
                  <>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-amber-700">Plano / contrato</p>
                          <h3 className="mt-1 text-xl font-black text-slate-900">
                            {contrato?.pacoteNome || selecionada.plano || "Sem contrato"}
                          </h3>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">
                          {contrato?.status || selecionada.statusPlano || "Sem contrato"}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div><span className="text-xs text-slate-500">Valor</span><div className="font-black">{valor != null ? Number(valor).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) : "-"}</div></div>
                        <div><span className="text-xs text-slate-500">Início</span><div className="font-bold">{formatarData(contrato?.inicio)}</div></div>
                        <div><span className="text-xs text-slate-500">Válido até</span><div className="font-bold">{formatarData(contrato?.vencimento)}</div></div>
                        <div><span className="text-xs text-slate-500">Produtos</span><div className="font-bold">Até {contrato?.limiteProdutos ?? selecionada.planoEscolhidoLimiteProdutos ?? "-"}</div></div>
                      </div>
                      <div className="mt-4 border-t border-amber-200 pt-3">
                        <p className="mb-2 text-xs font-black uppercase text-slate-500">Onde será anunciado</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            ["Marquee", contrato?.exibicao?.marquee ?? selecionada.mostrarMarquee],
                            ["Banner", contrato?.exibicao?.publicidade ?? selecionada.mostrarBanner],
                            ["Destaques", contrato?.exibicao?.destaques],
                            ["Parceiros", contrato?.exibicao?.parceiros ?? selecionada.mostrarCard],
                          ].map(([nome, ativo]) => (
                            <span key={String(nome)} className={ativo ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-400"}>
                              {ativo ? "✓ " : "○ "}{String(nome)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <h3 className="mb-2 font-bold text-slate-800">
                  Proprietário
                </h3>

                <p>
                  <strong>Nome:</strong>{" "}
                  {selecionada.nomeResponsavel ||
                    "Não informado"}
                </p>

                <p>
                  <strong>E-mail:</strong>{" "}
                  {selecionada.emailDono ||
                    "Não informado"}
                </p>

                <p className="break-all">
                  <strong>UID:</strong>{" "}
                  {selecionada.uidDono ||
                    "Não informado"}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <h3 className="mb-2 font-bold text-slate-800">
                  Negócio
                </h3>

                <p>
                  <strong>Tipo:</strong>{" "}
                  {TIPOS[
                    selecionada.tipo || ""
                  ] ||
                    "Não informado"}
                </p>

                <p>
                  <strong>Telefone:</strong>{" "}
                  {selecionada.telefone ||
                    "Não informado"}
                </p>

                <p>
                  <strong>WhatsApp:</strong>{" "}
                  {selecionada.whatsapp ||
                    "Não informado"}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <h3 className="mb-2 font-bold text-slate-800">
                  Presença no portal
                </h3>

                <p>
                  <strong>Destino:</strong>{" "}
                  {DESTINOS[
                    selecionada.tipoPresenca ||
                      ""
                  ] ||
                    "Página dentro do Sobradão 360"}
                </p>

                {selecionada.siteUrl && (
                  <p className="mt-1 break-all">
                    <strong>Site:</strong>{" "}
                    {selecionada.siteUrl}
                  </p>
                )}

                {selecionada.destinoDescricao && (
                  <p className="mt-1">
                    <strong>Descrição:</strong>{" "}
                    {selecionada.destinoDescricao}
                  </p>
                )}

              </div>

              {selecionada.descricao && (
                <div className="rounded-xl bg-slate-50 p-4">

                  <h3 className="mb-2 font-bold text-slate-800">
                    Descrição
                  </h3>

                  <p className="whitespace-pre-wrap text-slate-600">
                    {selecionada.descricao}
                  </p>

                </div>
              )}

                  </>
                );
              })()}

            </div>

            <div className="mt-6 flex justify-end gap-2">

              <button
                type="button"
                onClick={() =>
                  abrirDestino(selecionada)
                }
                className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700"
              >
                Abrir destino
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelecionada(null)
                }
                className="rounded-xl bg-slate-900 px-5 py-2.5 font-bold text-white hover:bg-slate-800"
              >
                Fechar
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}