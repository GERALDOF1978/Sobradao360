"use client";

type AuthUsuario = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
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
  imagemReferenciaUrl?: string;
  arteMarqueeUrl?: string;
  artePublicidadeUrl?: string;
  arteDestaquesUrl?: string;
  arteParceirosUrl?: string;

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

interface NoticiaImportada {
  id: string;
  fonte?: string;
  linkOriginal?: string;
  tituloOriginal?: string;
  resumoFeed?: string;
  dataPublicacao?: string | null;
  categorias?: string[];
  status?: string;
  publicadoNoPortal?: boolean;
  tituloPortal?: string;
  resumoPortal?: string;
  resumidoPorIA?: boolean;
  possivelDuplicidade?: boolean;
  arquivada?: boolean;
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
  imagemReferenciaUrl?: string;
  planoEscolhidoId?: string;
  planoEscolhidoNome?: string;
  planoEscolhidoValor?: number;
  planoEscolhidoDuracaoDias?: number;
  planoEscolhidoLimiteProdutos?: number;
  planoEscolhidoCarrinhoCompras?: boolean;
  statusPlano?: string;
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
  const [enviandoArte, setEnviandoArte] = useState<string | null>(null);

  const [sincronizandoVagas, setSincronizandoVagas] =
    useState(false);

  const [atualizandoNoticias, setAtualizandoNoticias] =
    useState(false);

  const [noticiasImportadas, setNoticiasImportadas] = useState<NoticiaImportada[]>([]);
  const [carregandoNoticias, setCarregandoNoticias] = useState(false);
  const [processandoNoticia, setProcessandoNoticia] = useState<string | null>(null);
  const [rascunhosNoticias, setRascunhosNoticias] = useState<Record<string, { titulo: string; resumo: string }>>({});
  const [noticiasExpandidas, setNoticiasExpandidas] = useState<Record<string, boolean>>({});
  const [ordemNoticias, setOrdemNoticias] = useState<"recentes" | "antigas">("recentes");
  const [fonteNoticias, setFonteNoticias] = useState("todas");

  const [resultadoNoticias, setResultadoNoticias] = useState<{
    fontes?: number;
    encontradas?: number;
    novas?: number;
    duplicadas?: number;
    aguardando?: number;
    mensagem?: string;
  } | null>(null);

  const [filtro, setFiltro] = useState("todos");
  const [filtroSolicitacao, setFiltroSolicitacao] = useState("todos");


  const [postsMoradores, setPostsMoradores] = useState<Array<{id:string;titulo?:string;descricao?:string;texto?:string;autorNome?:string;categoria?:string;origem?:string;tipo?:string;tipoPublicacao?:string;statusModeracao?:string;autorUid?:string}>>([]);
  const [moradoresBloqueados, setMoradoresBloqueados] = useState<Array<{id:string;nome?:string;email?:string;motivoBloqueio?:string}>>([]);
  const [motivoBloqueio, setMotivoBloqueio] = useState<Record<string,string>>({});
  const [carregandoBloqueados, setCarregandoBloqueados] = useState(false);
  async function carregarMoradoresBloqueados() {
    setCarregandoBloqueados(true);
    try {
      const snap = await getDocs(collection(db,"usuarios"));
      setMoradoresBloqueados(snap.docs.map(d=>({id:d.id,...d.data()})).filter((d: {bloqueado?:boolean})=>d.bloqueado === true));
    } catch(e) {console.error(e);setErroPosts("Erro ao carregar moradores bloqueados.");}
    finally {setCarregandoBloqueados(false);}
  }
  async function alterarBloqueioAutor(uid:string,bloquear:boolean,postId?:string) {
    const motivo=(motivoBloqueio[postId || uid] || "Reincidência ou violação das regras da comunidade").trim();
    if (!window.confirm(bloquear ? "Bloquear este morador de novas publicações? A publicação só será suspensa se você usar o botão Suspender." : "Desbloquear este morador para novas publicações?")) return;
    setProcessandoPost(postId || uid);
    setErroPosts("");
    try {
      await updateDoc(doc(db,"usuarios",uid),{
        bloqueado:bloquear,
        motivoBloqueio:bloquear?motivo:"",
        bloqueadoEm:bloquear?serverTimestamp():null,
        bloqueadoPor:bloquear?(user?.uid || ""):""
      });
      await carregarMoradoresBloqueados();
    } catch(e) {console.error(e);setErroPosts("Não foi possível alterar o bloqueio. Confira se o morador possui cadastro.");}
    finally {setProcessandoPost(null);}
  }
  const [carregandoPosts, setCarregandoPosts] = useState(false);
  const [processandoPost, setProcessandoPost] = useState<string | null>(null);
  const [erroPosts, setErroPosts] = useState("");

  async function carregarPostsMoradores() {
    setCarregandoPosts(true);
    setErroPosts("");
    try {
      const snap = await getDocs(collection(db, "anuncios"));
      setPostsMoradores(snap.docs.map((d: (typeof snap.docs)[number]) => ({id:d.id,...d.data()})).filter((p: {id:string;origem?:unknown;tipoPublicacao?:unknown;tipo?:unknown;categoria?:unknown}) => {
        const origem = String(p.origem || "").toLowerCase();
        const tipo = String(p.tipoPublicacao || p.tipo || "").toLowerCase();
        const categoria = String(p.categoria || "").toLowerCase();
        return origem === "morador" || tipo === "post" || ["notícias","noticias","comunidade"].includes(categoria);
      }));
    } catch(e) { console.error(e); setErroPosts("Não foi possível carregar as publicações."); }
    finally { setCarregandoPosts(false); }
  }

  async function moderarPost(id:string, acao:"SUSPENSO"|"ATIVO"|"EXCLUIR") {
    if (!window.confirm(acao === "EXCLUIR" ? "Excluir definitivamente esta publicação? Esta ação não pode ser desfeita." : acao === "SUSPENSO" ? "Suspender esta publicação da comunidade?" : "Reativar esta publicação?")) return;
    setProcessandoPost(id);
    setErroPosts("");
    try {
      const ref = doc(db,"anuncios",id);
      if (acao === "EXCLUIR") await deleteDoc(ref);
      else await updateDoc(ref,{statusModeracao:acao,moderadoEm:serverTimestamp(),moderadoPor:user?.uid || ""});
      await carregarPostsMoradores();
    } catch(e) { console.error(e); setErroPosts("Não foi possível alterar a publicação. Verifique as permissões do Firestore."); }
    finally { setProcessandoPost(null); }
  }

  const [menuAberto, setMenuAberto] = useState("anunciantes");
  const [menuLateralAberto, setMenuLateralAberto] = useState(false);

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
        await carregarNoticiasImportadas();
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
          resultado.erro || resultado.mensagem || "Não foi possível atualizar as vagas."
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

  async function atualizarNoticias(fonteId = "todas") {
    if (atualizandoNoticias) return;

    setAtualizandoNoticias(true);
    setResultadoNoticias(null);

    try {
      const auth = getAuth();
      const usuario = auth.currentUser;

      if (!usuario) {
        alert("Sessão do Master não encontrada. Entre novamente.");
        return;
      }

      const token = await usuario.getIdToken();

      const response = await fetch("/api/admin/noticias/atualizar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fonteId }),
      });

      const texto = await response.text();
      let resultado: Record<string, any> = {};

      try {
        resultado = texto ? JSON.parse(texto) : {};
      } catch {
        throw new Error(
          `O servidor respondeu sem JSON válido (HTTP ${response.status}).`
        );
      }

      if (!response.ok || !resultado.success) {
        throw new Error(
          resultado.erro ||
            "Não foi possível atualizar as notícias."
        );
      }

      setResultadoNoticias(resultado);
      await carregarNoticiasImportadas();
    } catch (error) {
      console.error("Erro ao atualizar notícias:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as notícias."
      );
    } finally {
      setAtualizandoNoticias(false);
    }
  }

  async function limparPendentesFonte(fonte: string) {
    if (!confirm(`Excluir as notícias NÃO publicadas de ${fonte}? As publicadas serão preservadas.`)) return;
    try {
      const usuario = getAuth().currentUser;
      if (!usuario) return alert("Sessão do Master não encontrada.");
      const token = await usuario.getIdToken();
      const response = await fetch("/api/admin/noticias/limpar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fonte }),
      });
      const resultado = await response.json();
      if (!response.ok || !resultado.success) throw new Error(resultado.erro || "Falha ao limpar.");
      alert(`${resultado.excluidas} notícia(s) não publicada(s) removida(s).`);
      await carregarNoticiasImportadas();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível limpar as pendentes.");
    }
  }

  async function revisarNoticia(id: string, acao: "APROVAR" | "RECUSAR") {
    if (processandoNoticia) return;

    setProcessandoNoticia(id);

    try {
      const usuario = getAuth().currentUser;
      if (!usuario) {
        alert("Sessão do Master não encontrada. Entre novamente.");
        return;
      }

      const token = await usuario.getIdToken();
      const response = await fetch("/api/admin/noticias/revisar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, acao }),
      });

      const resultado = await response.json();

      if (!response.ok || !resultado.success) {
        throw new Error(resultado.erro || "Não foi possível revisar a notícia.");
      }

      setNoticiasImportadas((atuais) =>
        atuais.map((noticia) =>
          noticia.id === id
            ? { ...noticia, status: resultado.status }
            : noticia
        )
      );
    } catch (error) {
      console.error("Erro ao revisar notícia:", error);
      alert(error instanceof Error ? error.message : "Não foi possível revisar a notícia.");
    } finally {
      setProcessandoNoticia(null);
    }
  }

  async function gerarResumoIA(id: string) {
    if (processandoNoticia) return;
    setProcessandoNoticia(id);

    try {
      const usuario = getAuth().currentUser;
      if (!usuario) {
        alert("Sessão do Master não encontrada. Entre novamente.");
        return;
      }

      const token = await usuario.getIdToken();
      const response = await fetch("/api/admin/noticias/resumir", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      const resultado = await response.json();

      if (!response.ok || !resultado.success) {
        throw new Error(resultado.erro || "Não foi possível gerar o resumo.");
      }

      setRascunhosNoticias((atuais) => ({
        ...atuais,
        [id]: {
          titulo: resultado.titulo,
          resumo: resultado.resumo,
        },
      }));
      setNoticiasImportadas((atuais) =>
        atuais.map((noticia) =>
          noticia.id === id ? { ...noticia, resumidoPorIA: true } : noticia
        )
      );
    } catch (error) {
      console.error("Erro ao gerar resumo com IA:", error);
      alert(error instanceof Error ? error.message : "Não foi possível gerar o resumo.");
    } finally {
      setProcessandoNoticia(null);
    }
  }

  async function salvarPublicacaoNoticia(
    id: string,
    acao: "SALVAR" | "PUBLICAR" | "RETIRAR"
  ) {
    if (processandoNoticia) return;
    setProcessandoNoticia(id);

    try {
      const usuario = getAuth().currentUser;
      if (!usuario) {
        alert("Sessão do Master não encontrada. Entre novamente.");
        return;
      }

      const rascunho = rascunhosNoticias[id] || { titulo: "", resumo: "" };
      const token = await usuario.getIdToken();
      const response = await fetch("/api/admin/noticias/publicar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          acao,
          titulo: rascunho.titulo,
          resumo: rascunho.resumo,
        }),
      });
      const resultado = await response.json();

      if (!response.ok || !resultado.success) {
        throw new Error(resultado.erro || "Não foi possível salvar a notícia.");
      }

      await carregarNoticiasImportadas();
    } catch (error) {
      console.error("Erro ao salvar/publicar notícia:", error);
      alert(error instanceof Error ? error.message : "Não foi possível salvar a notícia.");
    } finally {
      setProcessandoNoticia(null);
    }
  }

  async function carregarNoticiasImportadas() {
    setCarregandoNoticias(true);

    try {
      const snapshot = await getDocs(
        query(
          collection(db, "noticias_importadas"),
          orderBy("criadoEm", "desc")
        )
      );

      const lista: NoticiaImportada[] = snapshot.docs.map(
        (item: (typeof snapshot.docs)[number]): NoticiaImportada => ({
          id: item.id,
          ...(item.data() as Omit<NoticiaImportada, "id">),
        })
      );

      setNoticiasImportadas(lista);
      setRascunhosNoticias((atuais) => {
        const proximos = { ...atuais };
        lista.forEach((noticia) => {
          if (!proximos[noticia.id]) {
            proximos[noticia.id] = {
              titulo: noticia.tituloPortal || noticia.tituloOriginal || "",
              resumo: noticia.resumoPortal || noticia.resumoFeed || "",
            };
          }
        });
        return proximos;
      });
    } catch (error) {
      console.error("Erro ao carregar notícias importadas:", error);
    } finally {
      setCarregandoNoticias(false);
    }
  }

  async function carregarLojas() {
    try {
      const lojasRef = collection(
        db,
        "lojas_parceiras"
      );

      // Não usar orderBy aqui: documentos provisórios criados pelo Master
      // podem ainda não possuir criadoEm. O Firestore exclui esses documentos
      // de consultas com orderBy("criadoEm"), fazendo as artes salvas sumirem
      // da visualização do Master.
      const snapshot = await getDocs(lojasRef);

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

      lista.sort((a, b) => {
        const obterMillis = (valor: unknown): number => {
          if (
            valor &&
            typeof valor === "object" &&
            "toDate" in valor &&
            typeof (valor as { toDate?: unknown }).toDate === "function"
          ) {
            return (valor as { toDate: () => Date }).toDate().getTime();
          }
          return 0;
        };
        return obterMillis(b.criadoEm || b.atualizadoEm) - obterMillis(a.criadoEm || a.atualizadoEm);
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

      if (status === "APROVADO") {
        const snap = await getDoc(solicitacaoRef);
        const dados = snap.data() as Omit<SolicitacaoDivulgacao, "id"> | undefined;
        if (dados) {
          await setDoc(doc(db, "lojas_parceiras", id), {
            nomeResponsavel: dados.nomeResponsavel || "",
            emailDono: String(dados.email || "").trim().toLowerCase(),
            nome: dados.nomeNegocio || "",
            titulo: dados.nomeNegocio || "",
            subtitulo: dados.tipoNegocio || "",
            descricao: dados.descricao || "",
            telefone: dados.telefone || "",
            whatsapp: dados.whatsapp || "",
            siteUrl: dados.site || "",
            tipoPresenca: "pagina_sobradao",
            imagemReferenciaUrl: dados.imagemReferenciaUrl || "",
            imagemUrl: dados.imagemReferenciaUrl || "",
            planoEscolhidoId: dados.planoEscolhidoId || "",
            planoEscolhidoNome: dados.planoEscolhidoNome || "",
            planoEscolhidoValor: dados.planoEscolhidoValor || 0,
            planoEscolhidoDuracaoDias: dados.planoEscolhidoDuracaoDias || 0,
            planoEscolhidoLimiteProdutos: dados.planoEscolhidoLimiteProdutos || 0,
            statusPlano: "AGUARDANDO_CONFIRMACAO",
            status: "PENDENTE_CONTRATO",
            ativo: false,
            criadoEm: serverTimestamp(),
            atualizadoEm: serverTimestamp(),
          }, { merge: true });
          await carregarLojas();
        }
      }

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

  async function enviarArteFinal(item: SolicitacaoDivulgacao, campo: "arteMarqueeUrl" | "artePublicidadeUrl" | "arteDestaquesUrl" | "arteParceirosUrl", arquivo?: File) {
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) { alert("Selecione uma imagem válida."); return; }
    const chave = item.id + ":" + campo;
    setEnviandoArte(chave);
    try {
      const fd = new FormData();
      fd.append("file", arquivo);
      const resposta = await fetch("/api/upload-image", { method: "POST", body: fd });
      const dados = await resposta.json();
      if (!resposta.ok || !dados.url) throw new Error(dados.error || "Falha no upload");
      await setDoc(doc(db, "lojas_parceiras", item.id), { [campo]: String(dados.url), atualizadoEm: serverTimestamp() }, { merge: true });
      await carregarLojas();
    } catch (error) {
      console.error("Erro ao enviar arte:", error);
      alert("Não foi possível enviar esta arte.");
    } finally {
      setEnviandoArte(null);
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
    <main className="min-h-screen bg-slate-100 p-4 md:p-6 lg:pl-72">

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


        <button type="button" onClick={() => setMenuLateralAberto(true)} className="fixed left-3 top-1/2 z-40 -translate-y-1/2 rounded-r-2xl bg-slate-950 px-3 py-4 text-xl text-white shadow-xl lg:hidden" aria-label="Abrir menu Master">☰</button>
        {menuLateralAberto && <button type="button" onClick={() => setMenuLateralAberto(false)} className="fixed inset-0 z-40 bg-black/30 lg:hidden" aria-label="Fechar menu" />}
        <aside className={`fixed bottom-0 left-0 top-0 z-50 w-64 overflow-y-auto bg-slate-950 p-4 text-white shadow-2xl transition-transform lg:translate-x-0 ${menuLateralAberto ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Sobradão 360</p><p className="text-lg font-black">Painel Master</p></div>
            <button type="button" onClick={() => setMenuLateralAberto(false)} className="rounded-lg bg-white/10 px-3 py-2 lg:hidden">✕</button>
          </div>
          <div className="space-y-2">
            {[
              ["anunciantes","🏪","Anunciantes"],["solicitacoes","📨","Solicitações"],["planos","💳","Planos e contratos"],["noticias","📰","Giro de Notícias"],["moderacao","🛡️","Voz do Morador"],["vagas","💼","Atualizar vagas"],["contatos","📞","Contatos e Serviços"],["painel","👤","Painel anunciante"]
            ].map(([id,icone,titulo]) => <button key={id} type="button" onClick={() => { setMenuAberto(id); setMenuLateralAberto(false); if (id === "moderacao") {void carregarPostsMoradores();void carregarMoradoresBloqueados();} }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-black ${menuAberto === id ? "bg-amber-400 text-slate-950" : "bg-white/5 text-white hover:bg-white/10"}`}><span>{icone}</span><span>{titulo}</span>{id === "solicitacoes" && solicitacoes.length > 0 && <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{solicitacoes.length}</span>}</button>)}
          </div>
          <p className="mt-6 border-t border-white/10 pt-4 text-[10px] text-slate-400">{user?.email || "Master"}</p>
        </aside>


        {menuAberto === "moderacao" && (
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-xl font-black">🛡️ Moderação — Voz do Morador</h2><p className="text-sm text-slate-500">Suspenda, reative ou exclua publicações feitas pela comunidade.</p></div>
              <button type="button" onClick={() => void carregarPostsMoradores()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Atualizar lista</button>
            </div>
            {erroPosts && <p role="alert" className="mt-3 text-sm text-red-700">{erroPosts}</p>}
            {carregandoPosts ? <p className="mt-4">Carregando publicações...</p> : postsMoradores.length === 0 ? <p className="mt-4 text-slate-500">Nenhuma publicação encontrada.</p> : (
              <div className="mt-5 space-y-3">
                {postsMoradores.map(post => <article key={post.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black">{post.titulo || "Publicação sem título"}</h3><span className={post.statusModeracao === "SUSPENSO" ? "rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-800" : "rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800"}>{post.statusModeracao === "SUSPENSO" ? "Suspensa" : "Publicada"}</span></div>
                  <p className="mt-1 text-xs text-slate-500">{post.autorNome || "Morador"} • {post.categoria || "Comunidade"}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-700">{post.descricao || post.texto || ""}</p>
                  {post.autorUid && <input aria-label="Motivo do bloqueio do autor" value={motivoBloqueio[post.id] || ""} onChange={e=>setMotivoBloqueio(prev=>({...prev,[post.id]:e.target.value}))} placeholder="Motivo do bloqueio (ex.: reincidência)" className="mt-3 w-full rounded-lg border border-slate-300 p-2 text-sm" />}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.statusModeracao === "SUSPENSO" ? <button type="button" disabled={!!processandoPost} onClick={() => void moderarPost(post.id,"ATIVO")} className="rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Reativar</button> : <button type="button" disabled={!!processandoPost} onClick={() => void moderarPost(post.id,"SUSPENSO")} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50">Suspender</button>}
                    {post.autorUid && <button type="button" disabled={!!processandoPost} onClick={() => void alterarBloqueioAutor(post.autorUid! ,true,post.id)} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Bloquear autor</button>}
                    <button type="button" disabled={!!processandoPost} onClick={() => void moderarPost(post.id,"EXCLUIR")} className="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Excluir definitivamente</button>
                  </div>
                </article>)}
              </div>
            )}
            <div className="mt-6 border-t pt-4"><h3 className="font-black">Moradores bloqueados</h3>
              <button type="button" onClick={()=>void carregarMoradoresBloqueados()} className="my-2 rounded-lg border px-3 py-2 text-sm">Atualizar bloqueados</button>
              {carregandoBloqueados ? <p>Carregando...</p> : moradoresBloqueados.length===0 ? <p className="text-sm text-slate-500">Nenhum morador bloqueado.</p> : moradoresBloqueados.map(m=><div key={m.id} className="my-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"><div><strong>{m.nome || m.email || m.id}</strong><p className="text-xs text-slate-500">{m.motivoBloqueio || "Motivo não informado"}</p></div><button type="button" disabled={!!processandoPost} onClick={()=>void alterarBloqueioAutor(m.id,false)} className="rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Desbloquear autor</button></div>)}
            </div>
          </section>
        )}
        {menuAberto === "vagas"' && (
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">💼 Atualização de vagas</h2>
            <p className="mt-1 text-sm text-slate-500">Atualize manualmente as vagas do Trampolim / PAT.</p>
            <button type="button" onClick={sincronizarVagasTrampolim} disabled={sincronizandoVagas} className="mt-4 w-full rounded-xl bg-indigo-700 px-4 py-3 text-sm font-black text-white disabled:opacity-60">{sincronizandoVagas ? "⏳ Atualizando..." : "🔄 Atualizar Trampolim"}</button>
          </section>
        )}
        {menuAberto === "contatos" && (
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">📞 Contatos e Serviços</h2>
            <p className="mt-1 text-sm text-slate-500">Aprovar cadastros enviados pela comunidade.</p>
            <a href="/admin-master/telefones" className="mt-4 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white">Abrir gerenciamento</a>
          </section>
        )}

        <section className="mb-6">
          {menuAberto === "noticias" && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-blue-600">
                    Giro de Notícias
                  </div>
                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    Notícias de Rio Claro e região
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-slate-500">
                    O Master consulta as fontes cadastradas, identifica matérias novas
                    e prepara os itens para revisão. Nesta primeira etapa nenhuma
                    notícia será publicada automaticamente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => atualizarNoticias("todas")}
                  disabled={atualizandoNoticias}
                  className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {atualizandoNoticias
                    ? "⏳ Buscando notícias..."
                    : "🔄 Atualizar notícias agora"}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["jornal-cidade", "Jornal Cidade"],
                  ["diario-rio-claro", "Diário do Rio Claro"],
                  ["cidade-azul", "Cidade Azul Notícias"],
                  ["prefeitura-rio-claro", "Prefeitura de Rio Claro"],
                ].map(([id, nome]) => {
                  const daFonte = noticiasImportadas.filter((n) => n.fonte === nome);
                  const publicadas = daFonte.filter((n) => n.publicadoNoPortal && !n.arquivada).length;
                  const aguardando = daFonte.filter((n) => !n.publicadoNoPortal && n.status !== "RECUSADA").length;
                  return (
                    <div key={id} className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="font-black text-slate-900">{nome}</div>
                      <div className="mt-1 text-xs text-slate-600">{publicadas}/5 publicadas • {aguardando} aguardando</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => { setFonteNoticias(nome); atualizarNoticias(id); }} disabled={atualizandoNoticias} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white disabled:opacity-50">🔄 Buscar 5 novas</button>
                        <button type="button" onClick={() => setFonteNoticias(nome)} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-blue-700">Gerenciar</button>
                        <button type="button" onClick={() => limparPendentesFonte(nome)} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-red-700">🗑️ Limpar pendentes</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-bold text-slate-500">Fontes consultadas</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    {resultadoNoticias?.fontes ?? 0}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-bold text-slate-500">Encontradas</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    {resultadoNoticias?.encontradas ?? 0}
                  </div>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <div className="text-xs font-bold text-amber-700">Novas</div>
                  <div className="mt-1 text-2xl font-black text-amber-800">
                    {resultadoNoticias?.novas ?? 0}
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4">
                  <div className="text-xs font-bold text-emerald-700">Aguardando revisão</div>
                  <div className="mt-1 text-2xl font-black text-emerald-800">
                    {resultadoNoticias?.aguardando ?? 0}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900">
                      Matérias recebidas
                    </h3>
                    <p className="text-xs text-slate-500">
                      Confira o título, a data e abra a publicação original antes da próxima etapa.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={fonteNoticias}
                      onChange={(e) => setFonteNoticias(e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700"
                    >
                      <option value="todas">Todas as fontes</option>
                      <option value="Jornal Cidade">Jornal Cidade</option>
                      <option value="Diário do Rio Claro">Diário do Rio Claro</option>
                      <option value="Cidade Azul Notícias">Cidade Azul Notícias</option>
                      <option value="Prefeitura de Rio Claro">Prefeitura de Rio Claro</option>
                    </select>
                    <select
                      value={ordemNoticias}
                      onChange={(e) => setOrdemNoticias(e.target.value as "recentes" | "antigas")}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700"
                    >
                      <option value="recentes">Mais recentes primeiro</option>
                      <option value="antigas">Mais antigas primeiro</option>
                    </select>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                      {noticiasImportadas.length} salva(s)
                    </span>
                  </div>
                </div>

                {carregandoNoticias ? (
                  <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Carregando matérias...
                  </div>
                ) : noticiasImportadas.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Nenhuma matéria importada ainda. Use o botão Atualizar notícias agora.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...noticiasImportadas]
                      .filter((n) => fonteNoticias === "todas" || n.fonte === fonteNoticias)
                      .sort((a, b) => {
                        const ta = a.dataPublicacao ? new Date(a.dataPublicacao).getTime() : 0;
                        const tb = b.dataPublicacao ? new Date(b.dataPublicacao).getTime() : 0;
                        return ordemNoticias === "antigas" ? ta - tb : tb - ta;
                      })
                      .map((noticia) => (
                      <article
                        key={noticia.id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">
                            {noticia.fonte || "Fonte"}
                          </span>
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">
                            {noticia.status === "AGUARDANDO_REVISAO"
                              ? "🟡 Aguardando revisão"
                              : noticia.status === "APROVADA" && !noticia.resumidoPorIA
                              ? "🟡 Aguardando IA"
                              : noticia.resumidoPorIA
                              ? "🟣 Resumida pela IA"
                              : noticia.status || "Importada"}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${noticia.publicadoNoPortal ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                            {noticia.publicadoNoPortal ? "🟢 PUBLICADA" : "⚪ NÃO PUBLICADA"}
                          </span>
                          {noticia.possivelDuplicidade && (
                            <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-[11px] font-black text-fuchsia-800">⚠️ Possível notícia semelhante</span>
                          )}
                          {noticia.arquivada && (
                            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-black text-slate-700">📦 ARQUIVADA</span>
                          )}
                          {noticia.dataPublicacao && (
                            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                              {(() => {
                                const data = new Date(noticia.dataPublicacao);
                                const dias = Math.max(0, Math.floor((Date.now() - data.getTime()) / 86400000));
                                return `${dias === 0 ? "Hoje" : dias === 1 ? "1 dia atrás" : `${dias} dias atrás`} • ${data.toLocaleDateString("pt-BR")}`;
                              })()}
                            </span>
                          )}
                        </div>

                        <h4 className="mt-3 text-base font-black leading-snug text-slate-900">
                          {noticia.tituloOriginal || "Sem título"}
                        </h4>

                        {noticia.resumoFeed && (
                          <>
                            <p className={`mt-2 text-sm leading-relaxed text-slate-600 ${noticiasExpandidas[noticia.id] ? "" : "line-clamp-3"}`}>
                              {noticia.resumoFeed}
                            </p>
                            <button
                              type="button"
                              onClick={() => setNoticiasExpandidas((atuais) => ({ ...atuais, [noticia.id]: !atuais[noticia.id] }))}
                              className="mt-1 text-xs font-black text-blue-700 hover:underline"
                            >
                              {noticiasExpandidas[noticia.id] ? "▲ Ver menos" : "▼ Ver mais"}
                            </button>
                          </>
                        )}

                        {noticia.status === "APROVADA" && (
                          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <div className="text-xs font-black uppercase tracking-wider text-emerald-700">
                              Texto para o Giro de Notícias
                            </div>
                            <label className="mt-3 block text-xs font-bold text-slate-700">
                              Título
                            </label>
                            <input
                              value={rascunhosNoticias[noticia.id]?.titulo ?? noticia.tituloOriginal ?? ""}
                              onChange={(e) =>
                                setRascunhosNoticias((atuais) => ({
                                  ...atuais,
                                  [noticia.id]: {
                                    titulo: e.target.value,
                                    resumo: atuais[noticia.id]?.resumo ?? noticia.resumoFeed ?? "",
                                  },
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                            />
                            <label className="mt-3 block text-xs font-bold text-slate-700">
                              Resumo
                            </label>
                            <textarea
                              rows={5}
                              value={rascunhosNoticias[noticia.id]?.resumo ?? noticia.resumoFeed ?? ""}
                              onChange={(e) =>
                                setRascunhosNoticias((atuais) => ({
                                  ...atuais,
                                  [noticia.id]: {
                                    titulo: atuais[noticia.id]?.titulo ?? noticia.tituloOriginal ?? "",
                                    resumo: e.target.value,
                                  },
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-700"
                            />
                            <p className="mt-2 text-[11px] text-slate-500">
                              O texto inicial vem do conteúdo recebido da fonte. Revise e edite antes de publicar.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => gerarResumoIA(noticia.id)}
                                disabled={processandoNoticia === noticia.id}
                                className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-black text-white hover:bg-violet-800 disabled:opacity-50"
                              >
                                {processandoNoticia === noticia.id ? "⏳ Gerando..." : "✨ Gerar resumo com IA"}
                              </button>
                              <button
                                type="button"
                                onClick={() => salvarPublicacaoNoticia(noticia.id, "SALVAR")}
                                disabled={processandoNoticia === noticia.id}
                                className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-black text-emerald-700 disabled:opacity-50"
                              >
                                💾 Salvar rascunho
                              </button>
                              <button
                                type="button"
                                onClick={() => salvarPublicacaoNoticia(noticia.id, "PUBLICAR")}
                                disabled={processandoNoticia === noticia.id || !noticia.resumidoPorIA}
                                title={!noticia.resumidoPorIA ? "Gere o resumo com IA antes de publicar." : ""}
                                className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {noticia.resumidoPorIA ? "📰 Publicar no portal" : "🔒 Publicar após IA"}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {noticia.linkOriginal && (
                            <a
                              href={noticia.linkOriginal}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800"
                            >
                              🔗 Abrir matéria original
                            </a>
                          )}
                          {noticia.status === "AGUARDANDO_REVISAO" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => revisarNoticia(noticia.id, "APROVAR")}
                                disabled={processandoNoticia === noticia.id}
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {processandoNoticia === noticia.id ? "⏳ Processando..." : "✅ Aprovar para resumo"}
                              </button>
                              <button
                                type="button"
                                onClick={() => revisarNoticia(noticia.id, "RECUSAR")}
                                disabled={processandoNoticia === noticia.id}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                ❌ Recusar
                              </button>
                            </>
                          ) : (
                            <span className={`rounded-lg px-3 py-2 text-xs font-black ${
                              noticia.status === "APROVADA"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}>
                              {noticia.status === "APROVADA" ? "✅ Aprovada para resumo" : "❌ Recusada"}
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <div className="font-black text-slate-800">🛡️ Publicação controlada pelo Master</div>
                <p className="mt-1 text-sm text-slate-600">
                  Cada fonte pode ser atualizada separadamente ou todas de uma vez. Entram no máximo 5 novas por fonte a cada busca. A publicação continua passando por aprovação, IA e revisão. Ao publicar a 6ª notícia de uma fonte, a mais antiga sai da vitrine principal e fica arquivada.
                </p>
                {resultadoNoticias?.mensagem && (
                  <p className="mt-3 rounded-lg bg-white p-3 text-sm font-bold text-blue-700">
                    {resultadoNoticias.mensagem}
                  </p>
                )}
              </div>
            </div>
          )}

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

                      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
                        <div>
                          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Imagem original enviada</p>
                          {item.imagemReferenciaUrl ? (
                            <a href={item.imagemReferenciaUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                              <img src={item.imagemReferenciaUrl} alt={`Referência de ${item.nomeNegocio || "anunciante"}`} className="aspect-square w-full object-cover" />
                              <span className="block px-3 py-2 text-center text-xs font-black text-blue-700">🔎 Abrir imagem original</span>
                            </a>
                          ) : <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">Nenhuma imagem enviada</div>}
                        </div>
                        <div>
                          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Dados do anunciante</p>

                      <div className="grid gap-2 text-sm md:grid-cols-2">
                        <div><strong>E-mail:</strong> {item.email || "-"}</div>
                        <div><strong>WhatsApp:</strong> {item.whatsapp || "-"}</div>
                        <div><strong>Telefone:</strong> {item.telefone || "-"}</div>
                        <div><strong>Tipo:</strong> {TIPOS[item.tipoNegocio || ""] || item.tipoNegocio || "-"}</div>
                        <div><strong>Endereço:</strong> {item.endereco || "-"}</div>
                        <div><strong>Cadastro:</strong> {formatarData(item.criadoEm)}</div>
                      </div>

                        </div>
                      </div>

                      {item.planoEscolhidoNome && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                          <strong>💳 Plano escolhido:</strong> {item.planoEscolhidoNome} · {Number(item.planoEscolhidoValor || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})} · {item.planoEscolhidoDuracaoDias || 0} dias · até {item.planoEscolhidoLimiteProdutos || 0} produtos/serviços
                        </div>
                      )}

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

                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-500">🎨 Produção das artes</p>
                        <p className="mt-1 text-xs text-slate-500">Depois de aprovar o cadastro, envie aqui as artes finais produzidas a partir da imagem original.</p>
                        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                          {([
                            ["arteMarqueeUrl","📢","Marquee","1200 × 300 px"],
                            ["artePublicidadeUrl","🖼️","Publicidade","1080 × 1080 px"],
                            ["arteDestaquesUrl","⭐","Destaques","1080 × 1350 px"],
                            ["arteParceirosUrl","🤝","Parceiros","600 × 600 px"]
                          ] as const).map(([campo,icone,nome,tamanho]) => {
                            const loja = lojas.find((x) => x.id === item.id);
                            const url = loja?.[campo];
                            const chave = item.id + ":" + campo;
                            return <div key={campo} className="rounded-xl border border-slate-200 p-3">
                              <p className="text-xs font-black text-slate-800">{icone} {nome}</p>
                              <p className="text-[10px] font-bold text-blue-700">{tamanho}</p>
                              {url ? <img src={url} alt={nome} className="mt-2 aspect-square w-full rounded-lg bg-slate-50 object-contain" /> : <div className="mt-2 flex aspect-square items-center justify-center rounded-lg bg-slate-50 text-[10px] text-slate-400">Arte ainda não enviada</div>}
                              {item.status === "APROVADO" && <label className="mt-2 block cursor-pointer rounded-lg bg-slate-900 px-2 py-2 text-center text-[10px] font-black text-white">
                                {enviandoArte === chave ? "Enviando..." : url ? "Trocar arte" : "Subir arte"}
                                <input type="file" accept="image/*" className="hidden" disabled={enviandoArte === chave} onChange={(e) => void enviarArteFinal(item, campo, e.target.files?.[0])} />
                              </label>}
                            </div>;
                          })}
                        </div>
                      </div>

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
        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["todos","Total",total,"text-slate-900"],["PENDENTE","Pendentes",pendentes,"text-amber-500"],["APROVADO","Aprovados",aprovadas,"text-green-600"],["SUSPENSO","Suspensos",suspensas,"text-red-600"]
          ].map(([valor,label,numero,cor]) => (
            <button key={String(valor)} type="button" onClick={() => setFiltro(String(valor))} className={`rounded-2xl p-4 text-left shadow-sm transition ${filtro === valor ? "bg-slate-900 text-white ring-2 ring-amber-400" : "bg-white"}`}>
              <div className={`text-xs font-bold ${filtro === valor ? "text-slate-300" : "text-slate-500"}`}>{label}</div>
              <div className={`mt-1 text-3xl font-black ${filtro === valor ? "text-white" : cor}`}>{numero}</div>
              <div className={`mt-1 text-[10px] font-bold ${filtro === valor ? "text-amber-300" : "text-slate-400"}`}>Toque para filtrar</div>
            </button>
          ))}
        </section>

        {solicitacoes.some((x) => x.status === "APROVADO") && (
          <button type="button" onClick={() => { setMenuAberto("solicitacoes"); setFiltroSolicitacao("APROVADO"); }} className="mb-4 flex w-full items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 text-left">
            <span><strong className="block text-sm text-green-900">✅ Solicitações já aprovadas</strong><span className="text-xs text-green-700">Há {solicitacoes.filter((x) => x.status === "APROVADO").length} aprovação(ões). Toque para gerenciar e ver a imagem enviada.</span></span><span>›</span>
          </button>
        )}
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