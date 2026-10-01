"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";

type ModoPublicacao = "anuncio" | "post";
type TipoDoacao = "doando" | "solicitando" | "";

const subcategorias = [
  {
    id: "compre-venda",
    nome: "Compra & Venda",
    icone: "🛒",
  },
  {
    id: "reformas",
    nome: "Serviços & Reformas",
    icone: "🛠️",
  },
  {
    id: "aluguel-eventos",
    nome: "Aluguel & Eventos",
    icone: "🏠🎉",
  },
  {
    id: "doacoes",
    nome: "Doações",
    icone: "❤️",
  },
];

/* =========================================================
   COMPACTAR IMAGEM
   ========================================================= */

function compressImage(
  file: File,
  maxWidth = 1000,
  quality = 0.75
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject("Erro ao preparar a imagem.");
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject("Erro ao compactar a imagem.");
              return;
            }

            resolve(
              new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, "") + ".webp",
                {
                  type: "image/webp",
                  lastModified: Date.now(),
                }
              )
            );
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () =>
        reject("Não foi possível abrir a imagem.");
    };

    reader.onerror = () =>
      reject("Não foi possível ler a imagem.");

    reader.readAsDataURL(file);
  });
}

/* =========================================================
   PÁGINA
   ========================================================= */

export default function AnunciePage() {
  const { user, loginWithGoogle } = useAuth();

  const [modo, setModo] =
    useState<ModoPublicacao>("anuncio");

  const [subCategoria, setSubCategoria] =
    useState("");

  const [tipoDoacao, setTipoDoacao] =
    useState<TipoDoacao>("");

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");

  /* =======================================================
     CONTATO
     ======================================================= */

  const [contatoNome, setContatoNome] = useState("");
  const [contatoWhatsapp, setContatoWhatsapp] =
    useState("");
  const [contatoTelefone, setContatoTelefone] =
    useState("");
  const [contatoEmail, setContatoEmail] = useState("");
  const [contatoBairro, setContatoBairro] =
    useState("");

  /* =======================================================
     CONTROLES
     ======================================================= */

  const [isBloqueado, setIsBloqueado] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const categoriaSelecionada =
    subcategorias.find(
      (cat) => cat.nome === subCategoria
    );

  /* =======================================================
     CARREGAR DADOS DO MORADOR
     ======================================================= */

  useEffect(() => {
    async function carregarDadosMorador() {
      if (!user) {
        setIsBloqueado(false);
        setContatoNome("");
        setContatoWhatsapp("");
        setContatoTelefone("");
        setContatoEmail("");
        setContatoBairro("");
        return;
      }

      try {
        const userRef = doc(
          db,
          "usuarios",
          user.uid
        );

        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const dados = snap.data();

          setIsBloqueado(
            dados.bloqueado || false
          );

          setContatoNome(
            dados.nome ||
              user.displayName ||
              "Morador"
          );

          setContatoEmail(
            dados.email ||
              user.email ||
              ""
          );

          setContatoWhatsapp(
            dados.whatsapp ||
              dados.telefone ||
              ""
          );

          setContatoTelefone(
            dados.telefone || ""
          );

          setContatoBairro(
            dados.bairro || ""
          );
        } else {
          await setDoc(
            userRef,
            {
              nome:
                user.displayName ||
                "Morador",
              email:
                user.email || "",
              bloqueado: false,
              createdAt:
                serverTimestamp(),
            },
            {
              merge: true,
            }
          );

          setContatoNome(
            user.displayName ||
              "Morador"
          );

          setContatoEmail(
            user.email || ""
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar dados do morador:",
          error
        );
      }
    }

    carregarDadosMorador();
  }, [user]);

  /* =======================================================
     SELECIONAR CATEGORIA
     ======================================================= */

  const selecionarCategoria = (
    categoria: string
  ) => {
    setModo("anuncio");
    setSubCategoria(categoria);
    setTipoDoacao("");
    setMostrarFormulario(true);
  };

  /* =======================================================
     SELECIONAR TIPO DE DOAÇÃO
     ======================================================= */

  const selecionarDoacao = (
    tipo: TipoDoacao
  ) => {
    setModo("anuncio");
    setSubCategoria("Doações");
    setTipoDoacao(tipo);
    setMostrarFormulario(true);
  };

  /* =======================================================
     INICIAR POST
     ======================================================= */

  const iniciarPost = () => {
    setModo("post");
    setSubCategoria("");
    setTipoDoacao("");
    setMostrarFormulario(true);
  };

  /* =======================================================
     UPLOAD
     ======================================================= */

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    try {
      const compressedFile =
        await compressImage(
          file,
          1000,
          0.75
        );

      const formData = new FormData();

      formData.append(
        "file",
        compressedFile
      );

      const response = await fetch(
        "/api/upload-image",
        {
          method: "POST",
          body: formData,
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            "Erro no upload."
        );
      }

      setImagemUrl(result.url);
    } catch (error) {
      console.error(
        "Erro ao enviar imagem:",
        error
      );

      alert(
        "Não foi possível enviar a imagem."
      );
    } finally {
      setUploading(false);
    }
  };

  /* =======================================================
     LIMPAR FORMULÁRIO
     ======================================================= */

  const limparFormulario = () => {
    setTitulo("");
    setDescricao("");
    setPreco("");
    setImagemUrl("");
    setSubCategoria("");
    setTipoDoacao("");
    setMostrarFormulario(false);
    setModo("anuncio");
  };

  /* =======================================================
     PUBLICAR
     ======================================================= */

  const handlePublicar = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!user) {
      alert(
        "Você precisa estar logado para publicar."
      );
      return;
    }

    if (isBloqueado) {
      alert(
        "Sua conta está bloqueada pela administração e você não pode publicar novos conteúdos."
      );
      return;
    }

    if (
      !titulo.trim() ||
      !descricao.trim()
    ) {
      alert(
        "Preencha o título e a descrição."
      );
      return;
    }

    if (!subCategoria) {
      alert(
        modo === "post"
          ? "Escolha uma categoria para sua publicação."
          : "Escolha uma categoria para o anúncio."
      );
      return;
    }

    if (
      modo === "anuncio" &&
      subCategoria === "Doações" &&
      !tipoDoacao
    ) {
      alert(
        "Escolha se você quer fazer uma doação ou solicitar uma doação."
      );
      return;
    }

    setSalvando(true);

    try {
      const categoriaPublicacao = subCategoria;

      const anuncioRef =
        await addDoc(
          collection(
            db,
            "anuncios"
          ),
          {
            titulo:
              titulo.trim(),

            descricao:
              descricao.trim(),

            categoria:
              categoriaPublicacao,

            tipoPublicacao:
              modo,

            tipoDoacao:
              subCategoria ===
              "Doações"
                ? tipoDoacao
                : null,

            preco:
              modo === "anuncio" &&
              subCategoria ===
                "Compra & Venda"
                ? preco.trim()
                : null,

            salario: null,

            imagemUrl:
              imagemUrl || "",

            autorUid:
              user.uid,

            autorNome:
              user.displayName ||
              contatoNome ||
              "Morador",

            autorFoto:
              user.photoURL ||
              "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao",

            createdAt:
              serverTimestamp(),

            origem:
              "morador",
          }
        );

      await setDoc(
        doc(
          db,
          "anuncios",
          anuncioRef.id,
          "privado",
          "contato"
        ),
        {
          nome:
            contatoNome.trim(),

          whatsapp:
            contatoWhatsapp.trim(),

          telefone:
            contatoTelefone.trim(),

          email:
            contatoEmail.trim(),

          bairro:
            contatoBairro.trim(),

          autorUid:
            user.uid,

          updatedAt:
            serverTimestamp(),
        }
      );

      limparFormulario();

      alert(
        modo === "post"
          ? "Post enviado com sucesso!"
          : subCategoria === "Doações"
            ? tipoDoacao === "doando"
              ? "Sua doação foi publicada com sucesso!"
              : "Seu pedido de doação foi publicado com sucesso!"
            : "Anúncio publicado com sucesso!"
      );
    } catch (error) {
      console.error(
        "Erro ao publicar:",
        error
      );

      alert(
        "Erro ao publicar. Verifique sua conexão e tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  };

  /* =======================================================
     INTERFACE
     ======================================================= */

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 pb-10">
      <div className="max-w-4xl mx-auto">

        {/* CABEÇALHO */}

        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-xs bg-white border border-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl shadow-sm"
          >
            ← Início
          </Link>

          <h1 className="text-lg font-black">
            📢 Anuncie
          </h1>

          <div className="w-16" />
        </div>

        {/* NÃO LOGADO */}

        {!user ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 md:p-8 text-center">

            <div className="text-5xl mb-4">
              🔐
            </div>

            <h2 className="text-xl font-black">
              Entre para publicar
            </h2>

            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Para publicar anúncios,
              doações ou posts no
              Sobradão 360, você precisa
              estar logado como morador.
            </p>

            <button
              type="button"
              onClick={() =>
                loginWithGoogle()
              }
              className="mt-6 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3 px-6 rounded-2xl shadow-md"
            >
              🔐 Entrar / Cadastrar
            </button>
          </div>

        ) : isBloqueado ? (

          /* BLOQUEADO */

          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center">

            <div className="text-5xl mb-3">
              🚫
            </div>

            <h2 className="text-xl font-black text-red-800">
              Publicação bloqueada
            </h2>

            <p className="text-sm text-red-700 mt-2">
              Sua conta está bloqueada
              pela administração para
              novas publicações.
            </p>

          </div>

        ) : (

          <>

            {/* =================================================
                ESCOLHA
                ================================================= */}

            {!mostrarFormulario && (
              <>

                <div className="text-center mb-6">

                  <h2 className="text-2xl font-black">
                    O que você deseja publicar?
                  </h2>

                  <p className="text-sm text-slate-500 mt-2">
                    Compartilhe algo com a
                    comunidade do Sobradão.
                  </p>

                </div>

                {/* CATEGORIAS */}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                  {subcategorias.map(
                    (cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          cat.id ===
                          "doacoes"
                            ? setSubCategoria(
                                "Doações"
                              )
                            : selecionarCategoria(
                                cat.nome
                              )
                        }
                        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-400 hover:bg-amber-50 transition-all flex flex-col items-center justify-center min-h-[145px]"
                      >

                        <span className="text-5xl mb-3">
                          {cat.icone}
                        </span>

                        <span className="font-bold text-slate-700 text-center">
                          {cat.nome}
                        </span>

                      </button>
                    )
                  )}

                </div>

                {/* =================================================
                    DOAÇÕES
                    ================================================= */}

                {subCategoria ===
                  "Doações" && (
                  <div className="mt-5 bg-white border border-rose-200 rounded-3xl p-5 shadow-sm">

                    <div className="text-center mb-5">

                      <div className="text-4xl">
                        ❤️
                      </div>

                      <h3 className="font-black text-lg mt-2">
                        Doações
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        Ajude alguém da
                        comunidade ou peça
                        ajuda quando precisar.
                      </p>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <button
                        type="button"
                        onClick={() =>
                          selecionarDoacao(
                            "doando"
                          )
                        }
                        className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 p-6 transition text-left"
                      >

                        <div className="text-4xl mb-3">
                          🤝
                        </div>

                        <h4 className="font-black text-emerald-800">
                          Quero fazer uma doação
                        </h4>

                        <p className="text-xs text-emerald-700 mt-1">
                          Tenho algo que posso
                          doar para alguém da
                          comunidade.
                        </p>

                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          selecionarDoacao(
                            "solicitando"
                          )
                        }
                        className="rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 p-6 transition text-left"
                      >

                        <div className="text-4xl mb-3">
                          🆘
                        </div>

                        <h4 className="font-black text-amber-800">
                          Preciso de uma doação
                        </h4>

                        <p className="text-xs text-amber-700 mt-1">
                          Estou procurando
                          algum item que alguém
                          possa doar.
                        </p>

                      </button>

                    </div>
                  </div>
                )}

                {/* =================================================
                    POST
                    ================================================= */}

                <div className="mt-6 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">

                  <div className="text-center">

                    <div className="text-4xl mb-2">
                      💬
                    </div>

                    <h3 className="font-black">
                      Quer falar sobre o bairro?
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Use a Voz do Morador para
                      compartilhar informações,
                      avisos e acontecimentos
                      da comunidade.
                    </p>

                    <button
                      type="button"
                      onClick={
                        iniciarPost
                      }
                      className="mt-4 w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-3 rounded-2xl"
                    >
                      💬 PUBLICAR SOBRE O BAIRRO
                    </button>

                  </div>

                </div>

              </>
            )}

            {/* =================================================
                FORMULÁRIO
                ================================================= */}

            {mostrarFormulario && (

              <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-5 md:p-8">

                {/* CABEÇALHO */}

                <div className="flex items-center justify-between gap-3 mb-5">

                  <div>

                    <p className="text-[10px] uppercase font-black text-amber-600">
                      {modo === "post"
                        ? "Voz do Morador"
                        : subCategoria ===
                            "Doações"
                          ? "Doações da comunidade"
                          : "Novo anúncio"}
                    </p>

                    <h2 className="text-xl font-black">

                      {modo === "post"
                        ? "💬 Falar sobre o bairro"
                        : subCategoria ===
                            "Doações"
                          ? tipoDoacao ===
                            "doando"
                            ? "🤝 Fazer uma doação"
                            : "🆘 Solicitar uma doação"
                          : (
                            <>
                              {categoriaSelecionada?.icone ||
                                "📢"}{" "}
                              {subCategoria}
                            </>
                          )}

                    </h2>

                  </div>

                  <button
                    type="button"
                    onClick={
                      limparFormulario
                    }
                    className="text-xs font-bold text-red-500"
                  >
                    ✕ Voltar
                  </button>

                </div>

                {/* AVISO DOAÇÃO */}

                {subCategoria ===
                  "Doações" && (
                  <div className="mb-4 bg-rose-50 border border-rose-200 rounded-2xl p-4">

                    <p className="text-xs text-rose-800 font-semibold">
                      {tipoDoacao ===
                      "doando"
                        ? "🤝 Você está oferecendo algo para doação à comunidade."
                        : "🆘 Você está solicitando algo que precisa receber por doação."}
                    </p>

                  </div>
                )}

                {/* AVISO VOZ DO MORADOR */}

                {modo === "post" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">

                    <p className="text-xs text-blue-800">
                      💬 Esta publicação será
                      exibida na área da Voz
                      do Morador. Em seguida
                      vamos adicionar curtidas
                      e comentários da
                      comunidade.
                    </p>

                  </div>
                )}

                {/* FORM */}

                <form
                  onSubmit={
                    handlePublicar
                  }
                  className="space-y-4"
                >

                  {/* TÍTULO */}

                  {modo === "post" && (
                    <div>
                      <label className="text-xs font-black text-slate-700">
                        Categoria da publicação
                      </label>
                      <select
                        value={subCategoria}
                        onChange={(e) => setSubCategoria(e.target.value)}
                        className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-400"
                      >
                        <option value="">Selecione uma categoria</option>
                        {subcategorias.map((cat) => (
                          <option key={cat.id} value={cat.nome}>
                            {cat.icone} {cat.nome}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[10px] text-slate-500">
                        A mesma categoria será usada no Mural da Comunidade para facilitar a busca.
                      </p>
                    </div>
                  )}

                  <div>

                    <label className="text-xs font-black text-slate-700">
                      {subCategoria ===
                      "Doações"
                        ? tipoDoacao ===
                          "doando"
                          ? "O que você está doando?"
                          : "O que você está procurando?"
                        : "Título"}
                    </label>

                    <input
                      type="text"
                      placeholder={
                        subCategoria ===
                        "Doações"
                          ? tipoDoacao ===
                            "doando"
                            ? "Ex.: Roupas infantis"
                            : "Ex.: Cama de solteiro"
                          : modo === "post"
                            ? "Ex.: Falta de água no bairro"
                            : "Título principal do anúncio"
                      }
                      value={titulo}
                      onChange={(e) =>
                        setTitulo(
                          e.target.value
                        )
                      }
                      className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-400"
                    />

                  </div>

                  {/* DESCRIÇÃO */}

                  <div>

                    <label className="text-xs font-black text-slate-700">
                      Descrição
                    </label>

                    <textarea
                      placeholder={
                        subCategoria ===
                        "Doações"
                          ? tipoDoacao ===
                            "doando"
                            ? "Conte um pouco sobre o item que você está doando..."
                            : "Conte um pouco sobre o que você precisa..."
                          : modo === "post"
                            ? "Conte o que aconteceu ou o que deseja informar à comunidade..."
                            : "Descreva seu produto, serviço ou anúncio..."
                      }
                      value={descricao}
                      onChange={(e) =>
                        setDescricao(
                          e.target.value
                        )
                      }
                      rows={5}
                      className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-sm resize-none text-slate-900 focus:outline-none focus:border-amber-400"
                    />

                  </div>

                  {/* PREÇO */}

                  {modo === "anuncio" &&
                    subCategoria ===
                      "Compra & Venda" && (

                    <div>

                      <label className="text-xs font-black text-slate-700">
                        Preço
                      </label>

                      <input
                        type="text"
                        placeholder="Ex.: R$ 150,00"
                        value={preco}
                        onChange={(e) =>
                          setPreco(
                            e.target.value
                          )
                        }
                        className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-400"
                      />

                    </div>

                  )}

                  {/* IMAGEM */}

                  <div>

                    <label className="text-xs font-black text-slate-700">
                      Imagem
                    </label>

                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={
                        handleImageUpload
                      }
                      disabled={
                        uploading
                      }
                      className="w-full mt-1 text-xs text-slate-600 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200"
                    />

                    {uploading && (
                      <p className="text-[10px] text-amber-600 animate-pulse mt-2">
                        Enviando imagem...
                      </p>
                    )}

                    {imagemUrl && (
                      <div className="relative mt-3 bg-slate-100 p-1 rounded-xl">

                        <img
                          src={imagemUrl}
                          alt="Preview"
                          className="w-full max-h-[500px] object-contain rounded-lg"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setImagemUrl("")
                          }
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 text-xs font-bold"
                        >
                          ✕
                        </button>

                      </div>
                    )}

                  </div>

                  {/* =================================================
                      CONTATO
                      ================================================= */}

                  <div className="border border-emerald-200 bg-emerald-50 rounded-2xl p-4 space-y-3">

                    <div>

                      <h3 className="text-xs font-black text-emerald-800">
                        📞 Seus dados para contato
                      </h3>

                      <p className="text-[10px] text-emerald-700 mt-1 leading-relaxed">
                        🔒 Seus dados pessoais
                        não ficam públicos.
                        Eles são armazenados
                        separadamente.
                      </p>

                    </div>

                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={contatoNome}
                      onChange={(e) =>
                        setContatoNome(
                          e.target.value
                        )
                      }
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                    />

                    <input
                      type="tel"
                      placeholder="WhatsApp"
                      value={contatoWhatsapp}
                      onChange={(e) =>
                        setContatoWhatsapp(
                          e.target.value
                        )
                      }
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                    />

                    <input
                      type="tel"
                      placeholder="Telefone"
                      value={contatoTelefone}
                      onChange={(e) =>
                        setContatoTelefone(
                          e.target.value
                        )
                      }
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                    />

                    <input
                      type="email"
                      placeholder="E-mail"
                      value={contatoEmail}
                      onChange={(e) =>
                        setContatoEmail(
                          e.target.value
                        )
                      }
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                    />

                    <input
                      type="text"
                      placeholder="Bairro"
                      value={contatoBairro}
                      onChange={(e) =>
                        setContatoBairro(
                          e.target.value
                        )
                      }
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-xs text-slate-900"
                    />

                  </div>

                  {/* PUBLICAR */}

                  <button
                    type="submit"
                    disabled={
                      salvando ||
                      uploading
                    }
                    className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 disabled:opacity-60 text-slate-950 font-black py-3.5 rounded-2xl shadow-md"
                  >

                    {salvando
                      ? "Publicando..."
                      : modo === "post"
                        ? "💬 PUBLICAR NA VOZ DO MORADOR"
                        : subCategoria ===
                            "Doações"
                          ? tipoDoacao ===
                            "doando"
                            ? "🤝 PUBLICAR DOAÇÃO"
                            : "🆘 PUBLICAR PEDIDO DE DOAÇÃO"
                          : "📢 PUBLICAR ANÚNCIO"}

                  </button>

                </form>

              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}