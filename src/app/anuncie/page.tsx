"use client";

import { useState } from "react";

export default function AnunciePage() {
  const [subCategoria, setSubCategoria] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bairro, setBairro] = useState("");
  const [preco, setPreco] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);

  const subcategorias = [
    { id: "compre-venda", nome: "Compre & Venda", icone: "🛒" },
    { id: "alimentacao", nome: "Alimentação", icone: "🍰" },
    { id: "reformas", nome: "Reformas", icone: "🛠️" },
    { id: "lazer", nome: "Lazer", icone: "🏡" },
    { id: "automotivo", nome: "Automotivo", icone: "🚗" },
    { id: "zeladoria", nome: "Zeladoria", icone: "🧹" },
    { id: "pet-saude", nome: "Pet & Saúde", icone: "🐾" },
    { id: "eventos", nome: "Eventos", icone: "🎉" },
  ];

  const categoriaSelecionada = subcategorias.find(
    (cat) => cat.nome === subCategoria
  );

  const formatarWhatsapp = (valor: string) => {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length <= 2) {
      return numeros;
    }

    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(
      2,
      7
    )}-${numeros.slice(7)}`;
  };

  const handleFotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const arquivos = Array.from(event.target.files).slice(0, 5);

    setFotos(arquivos);
  };

  const publicarAnuncio = (event: React.FormEvent) => {
    event.preventDefault();

    if (!titulo.trim()) {
      alert("Informe o título do anúncio.");
      return;
    }

    if (!descricao.trim()) {
      alert("Informe a descrição do anúncio.");
      return;
    }

    if (!nome.trim()) {
      alert("Informe seu nome.");
      return;
    }

    if (!whatsapp.trim()) {
      alert("Informe seu WhatsApp.");
      return;
    }

    if (!bairro.trim()) {
      alert("Informe o bairro ou região.");
      return;
    }

    console.log("ANÚNCIO:", {
      categoria: subCategoria,
      titulo,
      descricao,
      nome,
      whatsapp,
      bairro,
      preco,
      fotos,
    });

    alert(
      "Anúncio preenchido com sucesso! Agora vamos conectar o botão ao Firebase para salvar no portal."
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-4xl mx-auto">

        {/* TÍTULO */}
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
          Criar Novo Anúncio
        </h1>

        {!subCategoria ? (
          <>
            <p className="text-center text-gray-600 mb-6">
              O que você deseja anunciar?
            </p>

            {/* CATEGORIAS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subcategorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSubCategoria(cat.nome)}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 hover:bg-blue-50 transition flex flex-col items-center justify-center"
                >
                  <span className="text-4xl mb-3">
                    {cat.icone}
                  </span>

                  <span className="font-bold text-slate-700 text-center">
                    {cat.nome}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : !publicando ? (
          /* CONFIRMAÇÃO DA CATEGORIA */
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center">

            <div className="text-6xl mb-4">
              {categoriaSelecionada?.icone}
            </div>

            <h2 className="text-2xl font-bold text-slate-900">
              {subCategoria}
            </h2>

            <p className="text-gray-500 mt-2 mb-8">
              Você está criando um anúncio nesta categoria.
            </p>

            <button
              onClick={() => setPublicando(true)}
              className="w-full max-w-md mx-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-md transition"
            >
              📢 PUBLICAR ANÚNCIO
            </button>

            <button
              onClick={() => setSubCategoria(null)}
              className="block mx-auto mt-4 text-sm text-red-500 hover:underline"
            >
              ← Voltar para categorias
            </button>
          </div>
        ) : (
          /* FORMULÁRIO */
          <form
            onSubmit={publicarAnuncio}
            className="bg-white rounded-2xl shadow-md border border-slate-200 p-5 md:p-7"
          >

            {/* CABEÇALHO */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">

              <div>
                <p className="text-xs text-gray-500">
                  Categoria
                </p>

                <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                  <span>{categoriaSelecionada?.icone}</span>
                  {subCategoria}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setPublicando(false)}
                className="text-sm text-red-500 hover:underline"
              >
                ← Voltar
              </button>
            </div>

            {/* TÍTULO */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Título do anúncio *
              </label>

              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Pedreiro disponível para reformas"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                maxLength={100}
              />
            </div>

            {/* DESCRIÇÃO */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Descrição *
              </label>

              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva seu produto ou serviço..."
                rows={5}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                maxLength={1000}
              />

              <p className="text-xs text-gray-400 mt-1 text-right">
                {descricao.length}/1000
              </p>
            </div>

            {/* PREÇO */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Preço
              </label>

              <input
                type="text"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="Ex.: R$ 150,00 ou A combinar"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* FOTOS */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Fotos do anúncio
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFotos}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-slate-50"
              />

              <p className="text-xs text-gray-400 mt-2">
                Você pode selecionar até 5 fotos.
              </p>

              {fotos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 md:grid-cols-5 gap-2">
                  {fotos.map((foto, index) => (
                    <div
                      key={index}
                      className="bg-slate-100 rounded-lg p-2 text-xs truncate"
                    >
                      📷 {foto.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEPARADOR */}
            <div className="border-t border-slate-200 my-6" />

            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Seus dados
            </h3>

            {/* NOME */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Seu nome *
              </label>

              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como você quer aparecer no anúncio?"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* WHATSAPP */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                WhatsApp *
              </label>

              <input
                type="tel"
                value={whatsapp}
                onChange={(e) =>
                  setWhatsapp(formatarWhatsapp(e.target.value))
                }
                placeholder="(19) 99999-9999"
                maxLength={15}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* BAIRRO */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Bairro / Região *
              </label>

              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Ex.: Sobradão, Rio Claro"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* AVISO */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                ℹ️ Seu WhatsApp será usado para que interessados possam
                entrar em contato com você sobre este anúncio.
              </p>
            </div>

            {/* BOTÃO PUBLICAR */}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-xl shadow-md transition text-base"
            >
              🚀 PUBLICAR ANÚNCIO
            </button>

          </form>
        )}

      </div>
    </div>
  );
}