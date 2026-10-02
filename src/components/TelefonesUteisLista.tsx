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
  servicos?: string[];
}

export default function TelefonesUteisLista() {
  const [telefones, setTelefones] = useState<TelefoneUtil[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [servicosAtivos, setServicosAtivos] = useState<string[]>([]);

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
  const categoriasFiltro = ["Todos", "Serviços da Comunidade", "Água", "Energia", "Internet", "Saúde", "Emergência", "Prefeitura", "Segurança", "Transporte", "Social", "Serviços Públicos"];

  const servicosDisponiveis = Array.from(
    telefones
      .filter(item => item.categoria.toLowerCase().includes("serviços da comunidade"))
      .flatMap(item => item.servicos || [])
      .reduce((map, servico) => map.set(servico, (map.get(servico) || 0) + 1), new Map<string, number>())
  ).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));

  function alternarServico(servico: string) {
    setServicosAtivos(atuais => atuais.includes(servico) ? atuais.filter(item => item !== servico) : [...atuais, servico]);
  }

  const telefonesFiltrados = telefones.filter((item) => {
    const correspondeBusca =
      item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      item.categoria.toLowerCase().includes(busca.toLowerCase()) ||
      (item.servicos || []).some(servico => servico.toLowerCase().includes(busca.toLowerCase())) ||
      item.telefone.includes(busca);

    if (filtroAtivo === "Todos") return correspondeBusca;

    const categoria = item.categoria.toLowerCase();
    if (filtroAtivo === "Serviços da Comunidade") {
      if (!correspondeBusca || !categoria.includes("serviços da comunidade")) return false;
      if (servicosAtivos.length === 0) return true;
      return servicosAtivos.some(servico => (item.servicos || []).includes(servico));
    }
    if (filtroAtivo === "Serviços Públicos") {
      const categoriasPublicas = ["água", "esgoto", "energia", "internet", "prefeitura", "segurança", "social", "assistência", "iluminação", "obras públicas", "trânsito", "meio ambiente", "lixo", "inclusão", "previdência", "encomendas", "reclamação", "direitos", "governo", "administração", "planejamento", "agricultura", "educação", "turismo", "cursos", "empreendedorismo", "inovação", "celular"];
      return correspondeBusca && categoriasPublicas.some((cat) => categoria.includes(cat));
    }

    return correspondeBusca && categoria.includes(filtroAtivo.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* BOTÕES DE FILTRO RÁPIDO NO CABEÇALHO */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categoriasFiltro.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setFiltroAtivo(cat);
              if (cat !== "Serviços da Comunidade") setServicosAtivos([]);
            }}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl whitespace-nowrap transition shadow-sm ${
              filtroAtivo === cat
                ? "bg-amber-500 text-white shadow-amber-200"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat === "Água" && "💧 "}
            {cat === "Energia" && "⚡ "}
            {cat === "Internet" && "🌐 "}
            {cat === "Prefeitura" && "🏛️ "}
            {cat === "Segurança" && "🛡️ "}
            {cat === "Social" && "🤝 "}
            {cat === "Serviços da Comunidade" && "🔧 "}
            {cat === "Automotivo" && "🚗 "}
            {cat === "Transporte" && "🚕 "}
            {cat === "Limpeza e Cuidados" && "🧹 "}
            {cat === "Saúde" && "🏥 "}
            {cat === "Beleza" && "✂️ "}
            {cat === "Alimentação" && "🍴 "}
            {cat === "Comércio" && "🛍️ "}
            {cat === "Pet" && "🐾 "}
            {cat === "Emergência" && "🚨 "}
            {cat === "Serviços Públicos" && "🏛️ "}
            {cat}
          </button>
        ))}
      </div>

      {filtroAtivo === "Serviços da Comunidade" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-slate-800">🔧 Escolha um ou mais serviços</p>
              <p className="text-[10px] text-slate-500">Só aparecem serviços com profissionais cadastrados.</p>
            </div>
            {servicosAtivos.length > 0 && <button onClick={() => setServicosAtivos([])} className="text-[10px] font-black text-amber-700">Limpar</button>}
          </div>
          {servicosDisponiveis.length === 0 ? (
            <p className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-500">Ainda não há profissionais aprovados nesta área.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {servicosDisponiveis.map(([servico, quantidade]) => {
                const ativo = servicosAtivos.includes(servico);
                return <button key={servico} onClick={() => alternarServico(servico)} className={`rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition ${ativo ? "border-amber-500 bg-amber-500 text-white" : "border-slate-200 bg-white text-slate-700"}`}>
                  {ativo ? "✓ " : ""}{servico} <span className={ativo ? "text-white/80" : "text-slate-400"}>({quantidade})</span>
                </button>;
              })}
            </div>
          )}
        </div>
      )}

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
                      {(item.servicos || []).slice(0,4).map(servico => <span key={servico} className="text-[9px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">{servico}</span>)}
                      {item.horario && item.horario !== "—" && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          item.horario === "24h" ? "bg-emerald-100 text-emerald-800" : "bg-blue-50 text-blue-700"
                        }`}>
                          {`🕒 ${item.horario}`}
                        </span>
                      )}
                      {item.isWhatsapp && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-800">💬 WhatsApp</span>
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