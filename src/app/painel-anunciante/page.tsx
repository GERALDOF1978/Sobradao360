"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
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

  planoEscolhidoId: string;
  planoEscolhidoNome: string;
  planoEscolhidoValor: number;
  planoEscolhidoDuracaoDias: number;
  planoEscolhidoLimiteProdutos: number;
  statusPlano: string;

  mostrarMarquee: boolean;
  mostrarCard: boolean;
  mostrarBanner: boolean;
};

type DadosFirestore = Record<string, unknown>;

type ContratoAnuncio = {
  id: string;
  pacoteNome: string;
  valorContratado: number;
  duracaoDias: number;
  limiteProdutos: number;
  inicio: Date | null;
  vencimento: Date | null;
  status: "ativo" | "expirado" | "cancelado";
  exibicao: { marquee: boolean; publicidade: boolean; destaques: boolean; parceiros: boolean };
};

type PlanoAnuncio = {
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

function normalizarTipoNegocio(valor: unknown): TipoNegocio {
  const bruto = texto(valor)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "");

  const compacto = bruto.replace(/[^a-z]/g, "");

  if (!compacto) {
    return "empresa";
  }

  if (
    compacto.includes("tecnologia") ||
    compacto.includes("informatica") ||
    compacto.includes("software")
  ) {
    return "tecnologia";
  }

  if (
    compacto.includes("alimentacao") ||
    compacto.includes("comida") ||
    compacto.includes("confeitaria") ||
    compacto.includes("padaria") ||
    compacto.includes("lanchonete")
  ) {
    return "alimentacao";
  }

  if (
    compacto.includes("oficina") ||
    compacto.includes("mecanica") ||
    compacto.includes("automotivo")
  ) {
    return "oficina";
  }

  if (
    compacto.includes("profissional") ||
    compacto.includes("prestador") ||
    compacto.includes("servico")
  ) {
    return "profissional";
  }

  if (
    compacto.includes("eventos") ||
    compacto.includes("evento")
  ) {
    return "eventos";
  }

  if (
    compacto.includes("loja") ||
    compacto.includes("comercio") ||
    compacto.includes("varejo")
  ) {
    return "loja";
  }

  if (compacto.includes("outro")) {
    return "outros";
  }

  if (compacto.includes("empresa")) {
    return "empresa";
  }

  return "empresa";
}

function tipoValido(valor: unknown): TipoNegocio {
  return normalizarTipoNegocio(valor);
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

  const [contratos, setContratos] =
    useState<Record<string, ContratoAnuncio | null>>({});

  const [planos, setPlanos] =
    useState<PlanoAnuncio[]>([]);

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

      const snapshotPlanos = await getDocs(
        query(
          collection(db, "pacotes_anuncio"),
          where("ativo", "==", true)
        )
      );

      const listaPlanos: PlanoAnuncio[] =
        snapshotPlanos.docs.map((item: (typeof snapshotPlanos.docs)[number]) => {
          const dados = item.data() as DadosFirestore;
          const exibicaoPadrao =
            (dados.exibicaoPadrao || {}) as DadosFirestore;

          return {
            id: item.id,
            nome: texto(dados.nome) || "Plano de divulgação",
            valor: numero(dados.valor),
            duracaoDias: numero(dados.duracaoDias),
            limiteProdutos: numero(dados.limiteProdutos),
            carrinhoCompras: booleano(dados.carrinhoCompras),
            exibicaoPadrao: {
              marquee: booleano(exibicaoPadrao.marquee),
              publicidade: booleano(exibicaoPadrao.publicidade),
              destaques: booleano(exibicaoPadrao.destaques),
              parceiros: booleano(exibicaoPadrao.parceiros),
            },
            ativo: booleano(dados.ativo),
          };
        });

      setPlanos(listaPlanos);

      const referencia =
        collection(db, "lojas_parceiras");

      const parametros = new URLSearchParams(
        window.location.search
      );

      const solicitacaoId =
        parametros.get("solicitacao");

      // Quando o acesso vem pelo link enviado pelo Master,
      // a solicitação é a fonte de verdade da aprovação.
      // Mesmo que já exista uma loja PENDENTE, ela deve ser
      // liberada e vinculada à conta Google correta.
      if (solicitacaoId && usuario.email) {
        const solicitacaoRef = doc(
          db,
          "solicitacoes_divulgacao",
          solicitacaoId
        );

        const solicitacaoSnapshot =
          await getDoc(solicitacaoRef);

        if (solicitacaoSnapshot.exists()) {
          const solicitacao =
            solicitacaoSnapshot.data() as DadosFirestore;

          const emailSolicitacao =
            texto(solicitacao.email).trim().toLowerCase();

          const emailUsuario =
            (usuario.email || "").trim().toLowerCase();

          if (emailSolicitacao !== emailUsuario) {
            setErro(
              "Entre com o Google usando o mesmo e-mail informado no cadastro."
            );
            setNegocios([]);
            setCarregando(false);
            return;
          }

          if (solicitacao.status !== "APROVADO") {
            setNegocios([]);
            setContratos({});
            setMostrarCadastro(false);
            setNegocioEditando(null);
            setMensagem(
              "Seu cadastro foi recebido e está aguardando a liberação do Sobradão 360."
            );
            setCarregando(false);
            return;
          }

          const lojaRef = doc(
            db,
            "lojas_parceiras",
            solicitacaoId
          );

          // Não lemos a loja antiga antes da promoção.
          // Se ela estiver PENDENTE ou vinculada a outro UID,
          // essa leitura pode ser bloqueada pelas regras do Firestore.
          // O merge preserva os demais campos existentes.
          await setDoc(
            lojaRef,
            {
              uidDono: usuario.uid,
              nomeResponsavel:
                texto(solicitacao.nomeResponsavel) ||
                usuario.displayName ||
                "",
              emailDono:
                emailUsuario,
              nome:
                texto(solicitacao.nomeNegocio),
              titulo:
                texto(solicitacao.nomeNegocio),
              subtitulo:
                texto(solicitacao.tipoNegocio),
              descricao:
                texto(solicitacao.descricao),
              tipo:
                normalizarTipoNegocio(
                  solicitacao.tipoNegocio
                ),
              telefone:
                texto(solicitacao.telefone),
              whatsapp:
                texto(solicitacao.whatsapp),
              tipoPresenca:
                "pagina_sobradao",
              siteUrl:
                texto(solicitacao.site),
              ativo:
                true,
              status:
                "APROVADO",
              atualizadoEm:
                serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

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

          planoEscolhidoId:
            texto(dados.planoEscolhidoId),

          planoEscolhidoNome:
            texto(dados.planoEscolhidoNome),

          planoEscolhidoValor:
            numero(dados.planoEscolhidoValor),

          planoEscolhidoDuracaoDias:
            numero(dados.planoEscolhidoDuracaoDias),

          planoEscolhidoLimiteProdutos:
            numero(dados.planoEscolhidoLimiteProdutos),

          statusPlano:
            texto(dados.statusPlano),

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

      const contratosPorLoja: Record<string, ContratoAnuncio | null> = {};

      await Promise.all(
        lista.map(async (negocio) => {
          try {
            const snapshotContratos = await getDocs(
              query(
                collection(db, "contratos_anuncio"),
                where("lojaId", "==", negocio.id)
              )
            );

            const listaContratos: ContratoAnuncio[] = [];

            for (const item of snapshotContratos.docs) {
              const dados = item.data() as DadosFirestore;

              const data = (valor: unknown): Date | null => {
                if (valor instanceof Date) {
                  return valor;
                }

                if (typeof valor === "object" && valor !== null) {
                  const possivelTimestamp = valor as {
                    toDate?: () => Date;
                  };

                  if (typeof possivelTimestamp.toDate === "function") {
                    return possivelTimestamp.toDate();
                  }
                }

                return null;
              };

              const exibicao = (dados.exibicao || {}) as DadosFirestore;

              listaContratos.push({
                id: item.id,
                pacoteNome: texto(dados.pacoteNome) || "Pacote comercial",
                valorContratado: numero(dados.valorContratado),
                duracaoDias: numero(dados.duracaoDias),
                limiteProdutos: numero(dados.limiteProdutos),
                inicio: data(dados.inicio),
                vencimento: data(dados.vencimento),
                status:
                  dados.status === "cancelado"
                    ? "cancelado"
                    : dados.status === "expirado"
                      ? "expirado"
                      : "ativo",
                exibicao: {
                  marquee: booleano(exibicao.marquee),
                  publicidade: booleano(exibicao.publicidade),
                  destaques: booleano(exibicao.destaques),
                  parceiros: booleano(exibicao.parceiros),
                },
              });
            }

            listaContratos.sort(
              (a: ContratoAnuncio, b: ContratoAnuncio) =>
                (b.inicio?.getTime() || 0) -
                (a.inicio?.getTime() || 0)
            );

            contratosPorLoja[negocio.id] =
              listaContratos.find((item) => item.status === "ativo") ||
              listaContratos[0] ||
              null;
          } catch (error) {
            console.error("Erro ao carregar contrato:", error);
            contratosPorLoja[negocio.id] = null;
          }
        })
      );

      setContratos(contratosPorLoja);
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

  async function escolherPlano(
    negocio: Negocio,
    plano: PlanoAnuncio
  ) {
    if (!usuario) {
      setErro("Faça login para escolher um plano.");
      return;
    }

    try {
      setSalvando(true);
      setMensagem("");
      setErro("");

      await updateDoc(
        doc(db, "lojas_parceiras", negocio.id),
        {
          planoEscolhidoId: plano.id,
          planoEscolhidoNome: plano.nome,
          planoEscolhidoValor: plano.valor,
          planoEscolhidoDuracaoDias: plano.duracaoDias,
          planoEscolhidoLimiteProdutos: plano.limiteProdutos,
          planoEscolhidoCarrinhoCompras: plano.carrinhoCompras,
          statusPlano: "AGUARDANDO_CONFIRMACAO",
          atualizadoEm: serverTimestamp(),
        }
      );

      setMensagem(
        "Plano " + plano.nome + " escolhido. Aguarde a confirmação do Sobradão 360."
      );

      await carregarNegocios();
    } catch (error) {
      console.error("Erro ao escolher plano:", error);
      setErro(
        "Não foi possível registrar a escolha do plano."
      );
    } finally {
      setSalvando(false);
    }
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

        // O tipo é estrutural: vem do cadastro aprovado e não pode
        // ser alterado pelo formulário de edição.
        tipo:
          negocioEditando
            ? normalizarTipoNegocio(
                negocios.find(
                  (item) => item.id === negocioEditando
                )?.tipo || tipo
              )
            : normalizarTipoNegocio(tipo),

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

  async function compartilharNegocio(negocio: Negocio) {
    setErro("");
    setMensagem("");

    const url = `${window.location.origin}/loja/${negocio.id}`;
    const dados = {
      title: negocio.nome || "Sobradão 360",
      text: `Confira ${negocio.nome || "este negócio"} no Sobradão 360.`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(dados);
        return;
      }

      await navigator.clipboard.writeText(url);
      setMensagem("Link da sua página copiado! Agora é só compartilhar.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      try {
        await navigator.clipboard.writeText(url);
        setMensagem("Link da sua página copiado! Agora é só compartilhar.");
      } catch {
        setErro("Não foi possível compartilhar a página agora.");
      }
    }
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

        {negocios.length > 0 && (
          <nav
            aria-label="Menu do anunciante"
            className="sticky top-2 z-20 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur"
          >
            <div className="flex gap-2 overflow-x-auto">
              <a
                href="#minha-empresa"
                className="shrink-0 rounded-xl bg-blue-900 px-4 py-2.5 text-xs font-black text-white"
              >
                🏠 Início
              </a>
              <a
                href="#minha-pagina"
                className="shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200"
              >
                ✏️ Minha página
              </a>
              <a
                href="#identidade"
                className="shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200"
              >
                🎨 Identidade
              </a>
              <a
                href="#contrato"
                className="shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200"
              >
                📋 Contrato
              </a>
              <a
                href="#catalogo"
                className="shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200"
              >
                {negocios[0]?.tipo === "loja" || negocios[0]?.tipo === "alimentacao" ? "🛍️ Produtos" : "🔧 Serviços"}
              </a>
              <a
                href="#divulgacao"
                className="shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200"
              >
                📢 Divulgação
              </a>
            </div>
          </nav>
        )}

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

        <section
          id="minha-empresa"
          className="rounded-3xl bg-white p-5 shadow-sm"
        >

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
                id="minha-pagina"
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

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <label className="text-xs font-black text-amber-900">
                    E-mail da conta
                  </label>

                  <input
                    value={usuario?.email || ""}
                    readOnly
                    className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                  />

                  <p className="mt-1 text-[11px] text-amber-800">
                    Este e-mail está vinculado à sua conta de acesso e não pode ser alterado aqui.
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

                  {(() => {
                    const tipoInfo =
                      TIPOS.find(
                        (item) => item.value === normalizarTipoNegocio(tipo)
                      ) || TIPOS.find((item) => item.value === "empresa")!;

                    return (
                      <div className="mt-2 rounded-2xl border-2 border-blue-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                            {tipoInfo.icon}
                          </div>

                          <div>
                            <p className="text-sm font-black text-slate-900">
                              {tipoInfo.label}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {tipoInfo.descricao}
                            </p>
                          </div>

                          <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-wide text-slate-500">
                            Definido no cadastro
                          </span>
                        </div>

                        <p className="mt-3 text-[11px] leading-5 text-slate-500">
                          O tipo do negócio define o ambiente, os campos e o catálogo exibido no Sobradão 360.
                          Para evitar que sua página fique incompatível com seu cadastro, essa informação não pode ser alterada nesta tela.
                        </p>
                      </div>
                    );
                  })()}

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

                        {negocio.ativo && negocio.tipoPresenca === "pagina_sobradao" && (
                          <button
                            type="button"
                            onClick={() => void compartilharNegocio(negocio)}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-800 hover:bg-emerald-100"
                          >
                            ↗️ Compartilhar minha página
                          </button>
                        )}

                      </div>
                      <div id={negocio.id === negocios[0]?.id ? "identidade" : undefined}>
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

                      {!contratos[negocio.id] && (
                        <div className="mt-5 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-amber-50 p-5">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                            Plano de divulgação
                          </p>
                          <h4 className="mt-1 text-xl font-black text-slate-950">
                            📢 Escolha seu plano
                          </h4>
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            Escolha um dos planos definidos pelo Sobradão 360. O plano inclui os dias, a quantidade de produtos/serviços e os espaços de divulgação.
                          </p>

                          {negocio.statusPlano === "AGUARDANDO_CONFIRMACAO" && (
                            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                              <p className="text-xs font-black text-amber-900">
                                ⏳ Plano escolhido: {negocio.planoEscolhidoNome}
                              </p>
                              <p className="mt-1 text-[11px] text-amber-800">
                                {negocio.planoEscolhidoValor.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })} · {negocio.planoEscolhidoDuracaoDias} dias · até {negocio.planoEscolhidoLimiteProdutos} produtos/serviços
                              </p>
                              <p className="mt-2 text-[11px] font-bold text-amber-800">
                                Aguardando confirmação do Sobradão 360.
                              </p>
                            </div>
                          )}

                          {negocio.statusPlano !== "AGUARDANDO_CONFIRMACAO" && (
                            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                              {planos.map((plano) => {
                                const ex = plano.exibicaoPadrao;
                                return (
                                  <div
                                    key={plano.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                  >
                                    <h5 className="text-base font-black text-slate-900">
                                      {plano.nome}
                                    </h5>

                                    <p className="mt-2 text-2xl font-black text-blue-900">
                                      {plano.valor.toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      })}
                                    </p>

                                    <div className="mt-3 space-y-1 text-[11px] text-slate-600">
                                      <p>📅 {plano.duracaoDias} dias</p>
                                      <p>📦 Até {plano.limiteProdutos} produtos/serviços</p>
                                      <p className={plano.carrinhoCompras ? "font-black text-emerald-700" : "text-slate-400"}>🛒 Carrinho: {plano.carrinhoCompras ? "incluso" : "não incluso"}</p>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-1">
                                      {ex.marquee && <span className="rounded-full bg-blue-100 px-2 py-1 text-[9px] font-black text-blue-800">Marquee</span>}
                                      {ex.publicidade && <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800">Publicidade</span>}
                                      {ex.destaques && <span className="rounded-full bg-purple-100 px-2 py-1 text-[9px] font-black text-purple-800">Destaques</span>}
                                      {ex.parceiros && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-800">Parceiros</span>}
                                    </div>

                                    <button
                                      type="button"
                                      disabled={salvando}
                                      onClick={() => void escolherPlano(negocio, plano)}
                                      className="mt-4 w-full rounded-xl bg-blue-900 px-4 py-3 text-xs font-black text-white hover:bg-blue-800 disabled:opacity-50"
                                    >
                                      {salvando ? "Registrando..." : "Escolher este plano"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {planos.length === 0 && (
                            <p className="mt-4 rounded-xl bg-white p-4 text-xs font-bold text-slate-500">
                              Nenhum plano disponível no momento. Aguarde a liberação pelo Sobradão 360.
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-5 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-5">
                        {(() => {
                          const contrato = contratos[negocio.id];

                          if (!contrato) {
                            return (
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                  Contrato comercial
                                </p>
                                <h4 className="mt-1 text-lg font-black text-slate-900">
                                  📋 Nenhum contrato encontrado
                                </h4>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  Quando um pacote for contratado e aprovado, os detalhes aparecerão aqui.
                                </p>
                              </div>
                            );
                          }

                          const formatarData = (data: Date | null) =>
                            data ? data.toLocaleDateString("pt-BR") : "Não informado";

                          const formatarValor = (valor: number) =>
                            valor.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            });

                          const vencido =
                            contrato.status === "expirado" ||
                            (contrato.vencimento !== null &&
                              contrato.vencimento.getTime() < Date.now());

                          const exibicoes: Array<
                            [string, boolean]
                          > = [
                            ["Marquee", contrato.exibicao.marquee],
                            ["Publicidade", contrato.exibicao.publicidade],
                            ["Destaques", contrato.exibicao.destaques],
                            ["Parceiros", contrato.exibicao.parceiros],
                          ];

                          return (
                            <>
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                                    Seu contrato comercial
                                  </p>
                                  <h4 className="mt-1 text-xl font-black text-slate-950">
                                    📦 {contrato.pacoteNome}
                                  </h4>
                                </div>

                                <span className={
                                  vencido
                                    ? "w-fit rounded-full bg-red-100 px-3 py-1 text-[10px] font-black text-red-700"
                                    : contrato.status === "cancelado"
                                      ? "w-fit rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black text-slate-700"
                                      : "w-fit rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700"
                                }>
                                  {vencido
                                    ? "● EXPIRADO"
                                    : contrato.status === "cancelado"
                                      ? "● CANCELADO"
                                      : "● ATIVO"}
                                </span>
                              </div>

                              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {(
                                  [
                                    ["Valor contratado", formatarValor(contrato.valorContratado)],
                                    ["Duração", `${contrato.duracaoDias} dias`],
                                    ["Início", formatarData(contrato.inicio)],
                                    ["Válido até", formatarData(contrato.vencimento)],
                                  ] as Array<[string, string]>
                                ).map((item) => {
                                  const rotulo = item[0];
                                  const valor = item[1];
                                  return (
                                    <div key={rotulo} className="rounded-2xl bg-white p-4 shadow-sm">
                                      <p className="text-[10px] font-black uppercase text-slate-400">{rotulo}</p>
                                      <p className="mt-1 text-base font-black text-slate-900">{valor}</p>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                                <p className="text-[10px] font-black uppercase text-slate-400">
                                  Onde sua publicidade está contratada
                                </p>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                  {exibicoes.map((item) => {
                                    const rotulo = item[0];
                                    const ativo = item[1];
                                    return (
                                      <div
                                        key={rotulo}
                                        className={ativo ? "rounded-xl border border-emerald-200 bg-emerald-50 p-3" : "rounded-xl border border-slate-200 bg-slate-50 p-3"}
                                      >
                                        <p className={ativo ? "text-xs font-black text-emerald-800" : "text-xs font-black text-slate-500"}>
                                          {ativo ? "✓" : "—"} {rotulo}
                                        </p>
                                        <p className="mt-1 text-[9px] text-slate-500">
                                          {ativo ? "Incluído no contrato" : "Não contratado"}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div id={negocio.id === negocios[0]?.id ? "catalogo" : undefined}>
                      <GerenciadorProdutos
                        lojaId={negocio.id}
                        tipoNegocio={negocio.tipo}
                        limiteProdutos={contratos[negocio.id]?.limiteProdutos || 0}
                      />
                      </div>

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </section>

        <section
          id="divulgacao"
          className="rounded-3xl border border-blue-100 bg-blue-50 p-5"
        >

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