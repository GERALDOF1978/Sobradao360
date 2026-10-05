"use client";

import Link from "next/link";
import MiniCardsAnuncio from "@/components/MiniCardsAnuncio";

const WHATSAPP = "https://wa.me/5508000190505";
const AGENCIA_VIRTUAL = "https://rioclarodaae.eportal.net.br/agencia/index.html#/login";
const SITE_DAAE = "https://daaerioclaro.sp.gov.br/";

const servicosWhatsApp = [
  "2ª via e débitos",
  "Débito automático",
  "Parcelamento e negociação de débitos",
  "Alteração de endereço de entrega",
  "Alteração de titularidade",
  "Conta alta",
  "Alteração de vencimento",
  "Leitura errada",
  "2ª via de parcelamento",
  "Revisão de contas",
];

export default function DaaePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-br from-cyan-700 via-cyan-600 to-blue-700 text-white">
        <div className="mx-auto max-w-3xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
<div className="text-center">
              <div className="text-lg">💧</div>
              <h1 className="text-base font-black">DAAE Rio Claro</h1>
            </div>
            <span className="rounded-lg bg-white/20 px-2 py-1 text-[9px] font-black">Atendimento</span>
          </div>
          <p className="mt-1 text-center text-[10px] leading-3 text-white/85">
            Água, esgoto, contas e canais de atendimento.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-3 space-y-4">
        <MiniCardsAnuncio />
        <div className="grid grid-cols-2 gap-3">
          <a href="tel:08000190505" className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:border-cyan-400 transition">
            <div className="text-lg">📞</div>
            <h2 className="mt-2 font-black">Ligar</h2>
            <p className="text-xs text-slate-500">0800 019 0505</p>
          </a>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:border-cyan-400 transition">
            <div className="text-2xl">💬</div>
            <h2 className="mt-2 font-black">WhatsApp</h2>
            <p className="text-xs text-slate-500">0800 019 0505</p>
          </a>
        </div>

        <div className="rounded-2xl bg-white border border-cyan-100 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-3xl">👤</div>
            <div className="flex-1">
              <h2 className="text-lg font-black">Atendimento ao Público</h2>
              <p className="mt-1 text-sm text-slate-600">
                Entre na Agência Virtual para acessar sua conta, consultar serviços e fazer seu cadastro.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <a href={AGENCIA_VIRTUAL} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-cyan-600 px-4 py-3 text-center text-sm font-black text-white hover:bg-cyan-700">
                  🔐 Entrar / Cadastrar
                </a>
                <a href={AGENCIA_VIRTUAL} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-cyan-200 px-4 py-3 text-center text-sm font-black text-cyan-700 hover:bg-cyan-50">
                  📄 Acessar Agência Virtual
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-black">🧾 Serviços pelo WhatsApp</h2>
          <p className="mt-1 text-xs text-slate-500">
            O DAAE informa atendimento por WhatsApp pelo 0800 019 0505.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {servicosWhatsApp.map((servico) => (
              <a key={servico} href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-sm font-semibold hover:border-cyan-300 hover:bg-cyan-50 transition">
                💧 {servico}
              </a>
            ))}
          </div>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="mt-4 block rounded-xl bg-emerald-600 px-4 py-3 text-center font-black text-white hover:bg-emerald-700">
            💬 Falar com o DAAE pelo WhatsApp
          </a>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-black">🏢 Atendimento presencial</h2>
          <p className="mt-2 text-sm text-slate-600">
            Avenida 8A, nº 360 — Cidade Nova — Rio Claro/SP
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Segunda a sexta, das 8h às 15h30, mediante agendamento.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-black">🔗 Outros acessos</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <a href={SITE_DAAE} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold hover:bg-slate-50">
              🌐 Site oficial do DAAE
            </a>
            <a href="https://transparencia.rioclarodaae.eportal.net.br/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold hover:bg-slate-50">
              📊 Portal da Transparência
            </a>
          </div>
        </div>

        <p className="px-2 text-center text-[11px] leading-5 text-slate-400">
          O Sobradão 360 organiza os acessos para facilitar a vida do morador. Login, cadastro e dados pessoais continuam sendo tratados diretamente pelo sistema oficial do DAAE.
        </p>
      </section>
    </main>
  );
}
