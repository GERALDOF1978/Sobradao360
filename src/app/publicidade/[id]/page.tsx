"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Publicidade = { nome: string; imagem: string };

function converterData(valor: unknown): Date | null {
  if (!valor) return null;
  if (typeof valor === "object" && valor !== null && "toDate" in valor) {
    const fn = (valor as { toDate?: () => Date }).toDate;
    if (typeof fn === "function") return fn.call(valor);
  }
  if (typeof valor === "string" || typeof valor === "number") {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }
  return null;
}

export default function PublicidadeTelaCheia() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [anuncio, setAnuncio] = useState<Publicidade | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setAnuncio(null);
      try {
        const contratoSnap = await getDoc(doc(db, "contratos_anuncio", id));
        if (!contratoSnap.exists()) return;
        const contrato = contratoSnap.data();
        const agora = new Date();
        const inicio = converterData(contrato.inicio);
        const vencimento = converterData(contrato.vencimento);
        if (contrato.status !== "ativo" || (inicio && inicio > agora) || (vencimento && vencimento < agora)) return;
        const lojaId = typeof contrato.lojaId === "string" ? contrato.lojaId : "";
        if (!lojaId) return;
        const lojaSnap = await getDoc(doc(db, "lojas_parceiras", lojaId));
        if (!lojaSnap.exists()) return;
        const loja = lojaSnap.data();
        if (loja.ativo !== true || loja.tipoPresenca !== "banner_tela") return;
        const imagem = typeof loja.arteTelaCheiaUrl === "string" ? loja.arteTelaCheiaUrl : "";
        if (!/^https:\/\//i.test(imagem)) return;
        if (ativo) setAnuncio({ nome: String(loja.nome || "Publicidade"), imagem });
      } catch (erro) {
        console.error("Erro ao carregar publicidade:", erro);
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, [id]);

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-220px)] w-full max-w-md flex-col bg-white pb-[calc(88px+env(safe-area-inset-bottom))] md:min-h-[calc(100dvh-160px)] md:pb-8">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">Publicidade</span>
        <Link href="/" className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-800" aria-label="Fechar publicidade e voltar ao início">✕ Fechar</Link>
      </div>
      {carregando ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-500">Carregando publicidade...</div>
      ) : anuncio ? (
        <div className="flex flex-1 items-center justify-center overflow-hidden">
          <img src={anuncio.imagem} alt={anuncio.nome} className="block max-h-[calc(100dvh-275px)] w-full object-contain md:max-h-[calc(100dvh-220px)]" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="font-semibold text-slate-700">Esta publicidade não está disponível.</p>
          <Link href="/" className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-bold text-white">Voltar ao início</Link>
        </div>
      )}
    </main>
  );
}
