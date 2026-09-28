"use client";

import { useEffect, useState, type ChangeEvent } from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { db, storage } from "@/lib/firebase";

type Produto = {
  id: string;
  lojaId: string;
  nome: string;
  descricao: string;
  preco: number;
  imagemUrl: string;
  ativo: boolean;
  criadoEm?: unknown;
  atualizadoEm?: unknown;
};

type GerenciadorProdutosProps = {
  lojaId: string;
  tipoNegocio: string;
};

function converterPreco(valor: string): number {
  const limpo = valor
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  const numero = Number(limpo);

  if (Number.isNaN(numero)) {
    return 0;
  }

  return numero;
}

function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function nomeTipo(tipo: string): string {
  if (tipo === "loja") {
    return "produto";
  }

  if (tipo === "alimentacao") {
    return "produto";
  }

  if (tipo === "oficina") {
    return "serviço";
  }

  if (tipo === "profissional") {
    return "serviço";
  }

  if (tipo === "eventos") {
    return "serviço";
  }

  if (tipo === "tecnologia") {
    return "produto ou serviço";
  }

  return "produto ou serviço";
}

export default function GerenciadorProdutos({
  lojaId,
  tipoNegocio,
}: GerenciadorProdutosProps) {
  const [produtos, setProdutos] =
    useState<Produto[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [produtoEditando, setProdutoEditando] =
    useState<string | null>(null);

  const [nome, setNome] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  const [preco, setPreco] =
    useState("");

  const [imagemUrl, setImagemUrl] =
    useState("");

  const [arquivoImagem, setArquivoImagem] =
    useState<File | null>(null);

  const [previewImagem, setPreviewImagem] =
    useState("");

  const [ativo, setAtivo] =
    useState(true);

  async function carregarProdutos() {
    try {
      setCarregando(true);
      setErro("");

      const referencia =
        collection(
          db,
          "produtos"
        );

      const consulta = query(
        referencia,
        where(
          "lojaId",
          "==",
          lojaId
        )
      );

      const snapshot =
        await getDocs(consulta);

      const lista: Produto[] = [];

      for (
        const documento of snapshot.docs
      ) {
        const dados =
          documento.data() as Record<
            string,
            unknown
          >;

        lista.push({
          id: documento.id,

          lojaId:
            typeof dados.lojaId === "string"
              ? dados.lojaId
              : lojaId,

          nome:
            typeof dados.nome === "string"
              ? dados.nome
              : "",

          descricao:
            typeof dados.descricao === "string"
              ? dados.descricao
              : "",

          preco:
            typeof dados.preco === "number"
              ? dados.preco
              : 0,

          imagemUrl:
            typeof dados.imagemUrl === "string"
              ? dados.imagemUrl
              : "",

          ativo:
            dados.ativo === true,
        });
      }

      lista.sort((a, b) =>
        a.nome.localeCompare(
          b.nome,
          "pt-BR"
        )
      );

      setProdutos(lista);
    } catch (error) {
      console.error(
        "Erro ao carregar produtos:",
        error
      );

      setErro(
        "Não foi possível carregar os produtos."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarProdutos();
  }, [lojaId]);

  function limparFormulario() {
    setNome("");
    setDescricao("");
    setPreco("");
    setImagemUrl("");
    setArquivoImagem(null);
    setPreviewImagem("");
    setAtivo(true);
    setProdutoEditando(null);
  }

  function abrirNovoProduto() {
    limparFormulario();

    setErro("");
    setMensagem("");

    setMostrarFormulario(true);
  }

  function editarProduto(
    produto: Produto
  ) {
    setProdutoEditando(
      produto.id
    );

    setNome(
      produto.nome
    );

    setDescricao(
      produto.descricao
    );

    setPreco(
      produto.preco
        .toFixed(2)
        .replace(".", ",")
    );

    setImagemUrl(
      produto.imagemUrl
    );

    setPreviewImagem(
      produto.imagemUrl
    );

    setArquivoImagem(null);

    setAtivo(
      produto.ativo
    );

    setErro("");
    setMensagem("");

    setMostrarFormulario(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function selecionarImagem(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      evento.target.files?.[0];

    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      setErro(
        "Escolha um arquivo de imagem."
      );

      return;
    }

    const tamanhoMaximo =
      5 * 1024 * 1024;

    if (
      arquivo.size >
      tamanhoMaximo
    ) {
      setErro(
        "A imagem deve ter no máximo 5 MB."
      );

      return;
    }

    setArquivoImagem(
      arquivo
    );

    const url =
      URL.createObjectURL(
        arquivo
      );

    setPreviewImagem(url);

    setErro("");
  }

  async function enviarImagem(
    arquivo: File
  ): Promise<string> {
    const nomeSeguro =
      arquivo.name
        .toLowerCase()
        .replace(
          /[^a-z0-9.-]/g,
          "-"
        );

    const caminho =
      `lojas/${lojaId}/produtos/${Date.now()}-${nomeSeguro}`;

    const referencia =
      ref(
        storage,
        caminho
      );

    await uploadBytes(
      referencia,
      arquivo
    );

    return await getDownloadURL(
      referencia
    );
  }

  async function salvarProduto() {
    if (!nome.trim()) {
      setErro(
        `Informe o nome do ${nomeTipo(
          tipoNegocio
        )}.`
      );

      return;
    }

    if (!preco.trim()) {
      setErro(
        "Informe o preço."
      );

      return;
    }

    const valor =
      converterPreco(preco);

    if (valor < 0) {
      setErro(
        "Informe um preço válido."
      );

      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      let imagemFinal =
        imagemUrl.trim();

      if (arquivoImagem) {
        imagemFinal =
          await enviarImagem(
            arquivoImagem
          );
      }

      const dados = {
        lojaId,

        nome:
          nome.trim(),

        descricao:
          descricao.trim(),

        preco:
          valor,

        imagemUrl:
          imagemFinal,

        ativo,

        atualizadoEm:
          serverTimestamp(),
      };

      if (produtoEditando) {
        const referencia =
          doc(
            db,
            "produtos",
            produtoEditando
          );

        await updateDoc(
          referencia,
          dados
        );

        setMensagem(
          "Produto atualizado com sucesso."
        );
      } else {
        await addDoc(
          collection(
            db,
            "produtos"
          ),
          {
            ...dados,

            criadoEm:
              serverTimestamp(),
          }
        );

        setMensagem(
          "Produto cadastrado com sucesso."
        );
      }

      limparFormulario();

      setMostrarFormulario(
        false
      );

      await carregarProdutos();
    } catch (error) {
      console.error(
        "Erro ao salvar produto:",
        error
      );

      setErro(
        "Não foi possível salvar o produto. Verifique as permissões do Firebase Storage e Firestore."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirProduto(
    produto: Produto
  ) {
    const confirmar =
      window.confirm(
        `Deseja realmente excluir "${produto.nome}"?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setErro("");
      setMensagem("");

      await deleteDoc(
        doc(
          db,
          "produtos",
          produto.id
        )
      );

      setMensagem(
        "Produto excluído com sucesso."
      );

      await carregarProdutos();
    } catch (error) {
      console.error(
        "Erro ao excluir produto:",
        error
      );

      setErro(
        "Não foi possível excluir o produto."
      );
    }
  }

  async function alterarStatus(
    produto: Produto
  ) {
    try {
      setErro("");
      setMensagem("");

      await updateDoc(
        doc(
          db,
          "produtos",
          produto.id
        ),
        {
          ativo:
            !produto.ativo,

          atualizadoEm:
            serverTimestamp(),
        }
      );

      setMensagem(
        produto.ativo
          ? "Produto ocultado."
          : "Produto publicado."
      );

      await carregarProdutos();
    } catch (error) {
      console.error(
        "Erro ao alterar status:",
        error
      );

      setErro(
        "Não foi possível alterar o status."
      );
    }
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-lg font-black text-slate-900">
            📦 Meus produtos e serviços
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Cadastre o que você oferece. Depois
            os moradores poderão montar um carrinho
            e enviar o pedido para você.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNovoProduto}
          className="rounded-xl bg-blue-900 px-4 py-3 text-xs font-black text-white hover:bg-blue-800"
        >
          + Adicionar{" "}
          {nomeTipo(tipoNegocio)}
        </button>

      </div>

      {mensagem && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
          {erro}
        </div>
      )}

      {mostrarFormulario && (
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">

          <div className="flex items-center justify-between">

            <div>
              <h3 className="text-base font-black text-blue-950">
                {produtoEditando
                  ? "✏️ Editar"
                  : "➕ Novo"}{" "}
                {nomeTipo(
                  tipoNegocio
                )}
              </h3>

              <p className="mt-1 text-xs text-blue-700">
                Essas informações aparecerão
                na página pública da sua empresa.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                limparFormulario();
                setMostrarFormulario(false);
              }}
              className="rounded-lg px-3 py-2 text-xs font-black text-slate-500 hover:bg-white"
            >
              ✕
            </button>

          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">

            <div className="space-y-4">

              <div>
                <label className="text-xs font-black text-slate-700">
                  Nome *
                </label>

                <input
                  value={nome}
                  onChange={(evento) =>
                    setNome(
                      evento.target.value
                    )
                  }
                  placeholder={
                    tipoNegocio === "oficina" ||
                    tipoNegocio === "profissional"
                      ? "Ex.: Troca de óleo"
                      : "Ex.: Camiseta masculina"
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">
                  Descrição
                </label>

                <textarea
                  value={descricao}
                  onChange={(evento) =>
                    setDescricao(
                      evento.target.value
                    )
                  }
                  rows={4}
                  placeholder="Descreva o produto ou serviço..."
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">
                  Preço *
                </label>

                <input
                  value={preco}
                  onChange={(evento) =>
                    setPreco(
                      evento.target.value
                    )
                  }
                  inputMode="decimal"
                  placeholder="0,00"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <p className="mt-1 text-[10px] text-slate-400">
                  Para serviços, pode ser o preço
                  inicial ou valor de referência.
                </p>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-4">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(evento) =>
                    setAtivo(
                      evento.target.checked
                    )
                  }
                  className="h-4 w-4"
                />

                <span>
                  <span className="block text-xs font-black text-slate-800">
                    Publicar produto
                  </span>

                  <span className="block text-[10px] text-slate-500">
                    Se desmarcado, ficará oculto
                    para os moradores.
                  </span>
                </span>
              </label>

            </div>

            <div>

              <label className="text-xs font-black text-slate-700">
                Foto ou arte
              </label>

              <div className="mt-1 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4">

                {previewImagem ? (
                  <div className="overflow-hidden rounded-xl">
                    <img
                      src={previewImagem}
                      alt="Prévia"
                      className="h-56 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50">
                    <div className="text-center">
                      <div className="text-5xl">
                        📷
                      </div>

                      <p className="mt-2 text-xs font-black text-slate-600">
                        Nenhuma imagem
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Você pode enviar uma arte
                        pronta do seu produto.
                      </p>
                    </div>
                  </div>
                )}

                <label className="mt-4 block cursor-pointer rounded-xl bg-blue-900 px-4 py-3 text-center text-xs font-black text-white hover:bg-blue-800">
                  📤 Escolher imagem

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      selecionarImagem
                    }
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-center text-[10px] text-slate-400">
                  JPG, PNG ou WEBP • máximo 5 MB
                </p>

              </div>

            </div>

          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">

            <button
              type="button"
              disabled={salvando}
              onClick={() => {
                void salvarProduto();
              }}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {salvando
                ? "Salvando..."
                : produtoEditando
                ? "💾 Salvar alterações"
                : "💾 Cadastrar"}
            </button>

            <button
              type="button"
              onClick={() => {
                limparFormulario();
                setMostrarFormulario(false);
              }}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-600"
            >
              Cancelar
            </button>

          </div>

        </div>
      )}

      <div className="mt-5">

        {carregando ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-center">
            <div className="text-3xl">
              📦
            </div>

            <p className="mt-2 text-xs font-bold text-slate-500">
              Carregando produtos...
            </p>
          </div>
        ) : produtos.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">

            <div className="text-4xl">
              📦
            </div>

            <p className="mt-3 text-sm font-black text-slate-800">
              Você ainda não cadastrou nenhum{" "}
              {nomeTipo(
                tipoNegocio
              )}.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Adicione seu primeiro item para
              começar a montar seu catálogo.
            </p>

          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {produtos.map(
              (produto) => (
                <div
                  key={produto.id}
                  className={`overflow-hidden rounded-2xl border bg-white ${
                    produto.ativo
                      ? "border-slate-200"
                      : "border-amber-200 opacity-70"
                  }`}
                >

                  <div className="h-48 bg-slate-100">

                    {produto.imagemUrl ? (
                      <img
                        src={
                          produto.imagemUrl
                        }
                        alt={
                          produto.nome
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">
                        📦
                      </div>
                    )}

                  </div>

                  <div className="p-4">

                    <div className="flex items-start justify-between gap-2">

                      <h3 className="text-sm font-black text-slate-900">
                        {produto.nome}
                      </h3>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${
                          produto.ativo
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {produto.ativo
                          ? "ATIVO"
                          : "OCULTO"}
                      </span>

                    </div>

                    {produto.descricao && (
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">
                        {
                          produto.descricao
                        }
                      </p>
                    )}

                    <p className="mt-3 text-lg font-black text-blue-900">
                      {formatarPreco(
                        produto.preco
                      )}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          editarProduto(
                            produto
                          )
                        }
                        className="rounded-lg bg-blue-50 px-2 py-2 text-[10px] font-black text-blue-800"
                      >
                        ✏️ Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void alterarStatus(
                            produto
                          )
                        }
                        className="rounded-lg bg-amber-50 px-2 py-2 text-[10px] font-black text-amber-800"
                      >
                        {produto.ativo
                          ? "Ocultar"
                          : "Publicar"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void excluirProduto(
                            produto
                          )
                        }
                        className="rounded-lg bg-red-50 px-2 py-2 text-[10px] font-black text-red-700"
                      >
                        🗑️ Excluir
                      </button>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </section>
  );
}