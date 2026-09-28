"use client";

import { useState, type ChangeEvent } from "react";
import {
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type Props = {
  lojaId: string;
  nome: string;
  imagemUrl: string;
  bannerUrl: string;
  corMarca: string;
  mostrarBanner: boolean;
  mostrarMarquee: boolean;
  mostrarCard: boolean;
  onAtualizado?: () => void;
};

type ResultadoUpload = {
  success?: boolean;
  url?: string;
  error?: string;
};

export default function IdentidadeAnunciante({
  lojaId,
  nome,
  imagemUrl: imagemUrlInicial,
  bannerUrl: bannerUrlInicial,
  corMarca: corMarcaInicial,
  mostrarBanner: mostrarBannerInicial,
  mostrarMarquee: mostrarMarqueeInicial,
  mostrarCard: mostrarCardInicial,
  onAtualizado,
}: Props) {
  const [imagemUrl, setImagemUrl] =
    useState(imagemUrlInicial || "");

  const [bannerUrl, setBannerUrl] =
    useState(bannerUrlInicial || "");

  const [corMarca, setCorMarca] =
    useState(corMarcaInicial || "#0f172a");

  const [mostrarBanner, setMostrarBanner] =
    useState(mostrarBannerInicial !== false);

  const [mostrarMarquee, setMostrarMarquee] =
    useState(mostrarMarqueeInicial !== false);

  const [mostrarCard, setMostrarCard] =
    useState(mostrarCardInicial !== false);

  const [enviandoLogo, setEnviandoLogo] =
    useState(false);

  const [enviandoBanner, setEnviandoBanner] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const [erro, setErro] =
    useState("");

  async function enviarImagem(
    arquivo: File
  ): Promise<string> {
    const dados = new FormData();

    dados.append("file", arquivo);

    const resposta = await fetch(
      "/api/upload-image",
      {
        method: "POST",
        body: dados,
      }
    );

    let resultado: ResultadoUpload;

    try {
      resultado =
        (await resposta.json()) as ResultadoUpload;
    } catch {
      throw new Error(
        "A API de imagens retornou uma resposta inválida."
      );
    }

    if (
      !resposta.ok ||
      !resultado.success ||
      !resultado.url
    ) {
      throw new Error(
        resultado.error ||
          "Não foi possível enviar a imagem."
      );
    }

    return resultado.url;
  }

  function validarImagem(
    arquivo: File
  ): boolean {
    if (
      !arquivo.type.startsWith("image/")
    ) {
      setErro(
        "Escolha um arquivo de imagem."
      );

      return false;
    }

    if (
      arquivo.size >
      10 * 1024 * 1024
    ) {
      setErro(
        "A imagem deve ter no máximo 10 MB."
      );

      return false;
    }

    return true;
  }

  async function selecionarLogo(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      evento.target.files?.[0];

    if (!arquivo) {
      return;
    }

    if (!validarImagem(arquivo)) {
      return;
    }

    try {
      setEnviandoLogo(true);
      setErro("");
      setMensagem("");

      const url =
        await enviarImagem(arquivo);

      await updateDoc(
        doc(
          db,
          "lojas_parceiras",
          lojaId
        ),
        {
          imagemUrl: url,
          atualizadoEm:
            serverTimestamp(),
        }
      );

      setImagemUrl(url);

      setMensagem(
        "Logo atualizado com sucesso."
      );

      onAtualizado?.();
    } catch (error) {
      console.error(
        "Erro ao enviar logo:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o logo."
      );
    } finally {
      setEnviandoLogo(false);
      evento.target.value = "";
    }
  }

  async function selecionarBanner(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      evento.target.files?.[0];

    if (!arquivo) {
      return;
    }

    if (!validarImagem(arquivo)) {
      return;
    }

    try {
      setEnviandoBanner(true);
      setErro("");
      setMensagem("");

      const url =
        await enviarImagem(arquivo);

      await updateDoc(
        doc(
          db,
          "lojas_parceiras",
          lojaId
        ),
        {
          bannerUrl: url,
          atualizadoEm:
            serverTimestamp(),
        }
      );

      setBannerUrl(url);

      setMensagem(
        "Banner atualizado com sucesso."
      );

      onAtualizado?.();
    } catch (error) {
      console.error(
        "Erro ao enviar banner:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o banner."
      );
    } finally {
      setEnviandoBanner(false);
      evento.target.value = "";
    }
  }

  async function salvarConfiguracoes() {
    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      await updateDoc(
        doc(
          db,
          "lojas_parceiras",
          lojaId
        ),
        {
          corMarca:
            corMarca || "#0f172a",

          mostrarBanner,
          mostrarMarquee,
          mostrarCard,

          atualizadoEm:
            serverTimestamp(),
        }
      );

      setMensagem(
        "Configurações de divulgação salvas."
      );

      onAtualizado?.();
    } catch (error) {
      console.error(
        "Erro ao salvar configurações:",
        error
      );

      setErro(
        "Não foi possível salvar as configurações."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
          Identidade do anunciante
        </p>

        <h3 className="mt-1 text-lg font-black text-slate-900">
          Logo, banner e divulgação
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Essas imagens representam o seu negócio
          dentro do Sobradão 360.
        </p>
      </div>

      {mensagem && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
          {erro}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">

        {/* LOGO */}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

          <div className="flex items-center justify-between gap-3">

            <div>
              <h4 className="text-sm font-black text-slate-800">
                🏪 Logo da empresa
              </h4>

              <p className="mt-1 text-[10px] text-slate-500">
                Aparece na página do anunciante e nos cards.
              </p>
            </div>

            {imagemUrl && (
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-700">
                CONFIGURADO
              </span>
            )}

          </div>

          <div className="mt-4 flex min-h-44 items-center justify-center overflow-hidden rounded-2xl bg-white">

            {imagemUrl ? (
              <img
                src={imagemUrl}
                alt={`Logo ${nome}`}
                className="max-h-40 max-w-full object-contain p-4"
              />
            ) : (
              <div className="text-center">
                <div className="text-5xl">
                  🏪
                </div>

                <p className="mt-2 text-xs font-bold text-slate-400">
                  Nenhum logo cadastrado
                </p>
              </div>
            )}

          </div>

          <label className="mt-4 block cursor-pointer rounded-xl bg-blue-900 px-4 py-3 text-center text-xs font-black text-white transition hover:bg-blue-800">

            {enviandoLogo
              ? "⏳ Enviando logo..."
              : "📤 Enviar / trocar logo"}

            <input
              type="file"
              accept="image/*"
              onChange={selecionarLogo}
              disabled={enviandoLogo}
              className="hidden"
            />

          </label>

        </div>

        {/* BANNER */}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

          <div className="flex items-center justify-between gap-3">

            <div>
              <h4 className="text-sm font-black text-slate-800">
                🖼️ Banner da empresa
              </h4>

              <p className="mt-1 text-[10px] text-slate-500">
                Será usado na sua página e no Marquee.
              </p>
            </div>

            {bannerUrl && (
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-700">
                CONFIGURADO
              </span>
            )}

          </div>

          <div className="mt-4 overflow-hidden rounded-2xl bg-slate-900">

            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt={`Banner ${nome}`}
                className="h-44 w-full object-cover"
              />
            ) : (
              <div className="flex h-44 items-center justify-center">

                <div className="text-center text-white">

                  <div className="text-5xl">
                    🖼️
                  </div>

                  <p className="mt-2 text-xs font-bold text-white/70">
                    Nenhum banner cadastrado
                  </p>

                </div>

              </div>
            )}

          </div>

          <label className="mt-4 block cursor-pointer rounded-xl bg-amber-400 px-4 py-3 text-center text-xs font-black text-blue-950 transition hover:bg-amber-300">

            {enviandoBanner
              ? "⏳ Enviando banner..."
              : "📤 Enviar / trocar banner"}

            <input
              type="file"
              accept="image/*"
              onChange={selecionarBanner}
              disabled={enviandoBanner}
              className="hidden"
            />

          </label>

          <p className="mt-2 text-center text-[10px] text-slate-400">
            Recomenda-se imagem horizontal.
            Máximo 10 MB.
          </p>

        </div>

      </div>

      {/* CONFIGURAÇÕES */}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">

        <h4 className="text-sm font-black text-slate-800">
          ⚙️ Onde sua identidade aparecerá
        </h4>

        <div className="mt-4 grid gap-3 md:grid-cols-3">

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <input
              type="checkbox"
              checked={mostrarBanner}
              onChange={(e) =>
                setMostrarBanner(
                  e.target.checked
                )
              }
              className="mt-1 h-4 w-4"
            />

            <span>
              <span className="block text-xs font-black text-slate-800">
                🖼️ Banner
              </span>

              <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                Mostrar o banner na página pública.
              </span>
            </span>

          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <input
              type="checkbox"
              checked={mostrarMarquee}
              onChange={(e) =>
                setMostrarMarquee(
                  e.target.checked
                )
              }
              className="mt-1 h-4 w-4"
            />

            <span>
              <span className="block text-xs font-black text-slate-800">
                📢 Marquee
              </span>

              <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                Mostrar seu negócio na faixa de divulgação.
              </span>
            </span>

          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <input
              type="checkbox"
              checked={mostrarCard}
              onChange={(e) =>
                setMostrarCard(
                  e.target.checked
                )
              }
              className="mt-1 h-4 w-4"
            />

            <span>
              <span className="block text-xs font-black text-slate-800">
                🧾 Card
              </span>

              <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                Permitir que o card do negócio apareça no portal.
              </span>
            </span>

          </label>

        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">

          <div className="flex items-center gap-3">

            <label className="text-xs font-black text-slate-700">
              Cor da marca
            </label>

            <input
              type="color"
              value={corMarca}
              onChange={(e) =>
                setCorMarca(
                  e.target.value
                )
              }
              className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
            />

            <span className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs font-bold text-slate-600">
              {corMarca}
            </span>

          </div>

          <button
            type="button"
            onClick={() => {
              void salvarConfiguracoes();
            }}
            disabled={salvando}
            className="rounded-xl bg-blue-900 px-5 py-3 text-xs font-black text-white hover:bg-blue-800 disabled:opacity-50 sm:ml-auto"
          >
            {salvando
              ? "Salvando..."
              : "💾 Salvar configurações"}
          </button>

        </div>

      </div>

    </section>
  );
}