"use client";

import { useState, useEffect } from "react";

interface TelefoneUtil {
  id: string;
  titulo: string;
  categoria: string;
  telefone: string;
  horario: string;
  icone: string;
  isWhatsapp?: boolean;
}

export default function TelefonesUteisLista() {
  const [telefones, setTelefones] = useState<TelefoneUtil[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/telefones");
        const data = await res.json();
        if (data.success) {
          setTelefones(data.telefones);
        }
      } catch (err) {
        console.error("Erro ao carregar telefones:", err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  // Botões de filtro rápido no cabeçalho
  const categoriasFiltro = ["Todos", "Água", "Energia", "Internet", "Saúde", "Emergência", "WhatsApp"];

  const telefonesFiltrados = telefones.filter((item) => {
    const correspondeBusca =
      item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      item.categoria.toLowerCase().includes(busca.toLowerCase()) ||
      item.telefone.includes(busca);

    if (filtroAtivo === "Todos") return correspondeBusca;
    if (filtroAtivo === "WhatsApp") return correspondeBusca && item.isWhatsapp;
    return correspondeBusca && item.categoria.toLowerCase().includes(filtroAtivo.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* BOTÕES DE FILTRO RÁPIDO NO CABEÇALHO */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categoriasFiltro.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltroAtivo(cat)}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl whitespace-nowrap transition shadow-sm ${
              filtroAtivo === cat
                ? "bg-amber-500 text-white shadow-amber-200"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat === "Água" && "💧 "}
            {cat === "Energia" && "⚡ "}
            {cat === "Internet" && "🌐 "}
            {cat === "Saúde" && "🏥 "}
            {cat === "Emergência" && "🚨 "}
            {cat === "WhatsApp" && "💬 "}
            {cat}
          </button>
        ))}
      </div>

      {/* CAMPO DE BUSCA */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔍</span>
        <input
          type="text"
          placeholder="Pesquisar por nome, categoria ou número (ex: DAAE, UPA, 156)..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
        />
        {busca && (
          <button onClick={() => setBusca("")} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 text-xs">
            ✕
          </button>
        )}
      </div>

      {/* LISTA MODERNA */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <p className="text-center py-8 text-xs text-slate-500">A carregar diretório de telefones...</p>
        ) : telefonesFiltrados.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-500">Nenhum contacto encontrado.</p>
        ) : (
          telefonesFiltrados.map((item) => {
            const numeroLimpo = item.telefone.replace(/\D/g, "");
            const linkAcao = item.isWhatsapp
              ? `https://wa.me/55${numeroLimpo}`
              : `tel:${numeroLimpo}`;

            return (
              <div key={item.id} className="p-3.5 hover:bg-slate-50/80 transition flex items-center justify-between gap-3">
                
                {/* Ícone e Informações */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                    {item.icone}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{item.titulo}</h4>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {item.categoria}
                      </span>
                      {item.horario && item.horario !== "—" && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          item.horario === "24h" ? "bg-emerald-100 text-emerald-800" : item.horario === "WhatsApp" ? "bg-green-100 text-green-800" : "bg-blue-50 text-blue-700"
                        }`}>
                          {item.horario === "WhatsApp" ? "💬 WhatsApp" : `🕒 ${item.horario}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão de Disque Direto ou WhatsApp */}
                <a
                  href={linkAcao}
                  target={item.isWhatsapp ? "_blank" : "_self"}
                  rel={item.isWhatsapp ? "noopener noreferrer" : ""}
                  className={`flex-shrink-0 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5 ${
                    item.isWhatsapp ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-800 hover:bg-slate-900"
                  }`}
                >
                  <span>{item.isWhatsapp ? "💬" : "📞"}</span>
                  <span>{item.telefone}</span>
                </a>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}