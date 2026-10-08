import Link from "next/link";

export const metadata = {
  title: "Dengue em Rio Claro | Sobradão 360",
  description: "Prevenção da dengue, sintomas, orientações e canais oficiais de saúde em Rio Claro.",
};

const prevencao = [
  { icone: "🪣", titulo: "Caixas-d’água", texto: "Mantenha reservatórios sempre bem tampados." },
  { icone: "🪴", titulo: "Vasos e plantas", texto: "Evite água acumulada em pratos e recipientes." },
  { icone: "🛞", titulo: "Pneus e objetos", texto: "Guarde pneus cobertos e elimine objetos que acumulem água." },
  { icone: "🏠", titulo: "Calhas e ralos", texto: "Limpe calhas e mantenha ralos protegidos." },
  { icone: "🗑️", titulo: "Lixo e recicláveis", texto: "Descarte corretamente garrafas, latas e embalagens." },
  { icone: "🔎", titulo: "Inspeção semanal", texto: "Reserve alguns minutos para procurar possíveis criadouros." },
];

export default function DenguePage() {
  return (
    <div className="min-h-screen bg-slate-100 pb-20 text-slate-900">
      <header className="bg-gradient-to-r from-red-700 to-red-600 text-white">
        <div className="mx-auto max-w-3xl px-4 py-5">
          <Link href="/" className="text-xs font-semibold text-white/90 hover:underline">← Voltar ao Sobradão 360</Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-red-100">Saúde • Utilidade pública</p>
          <h1 className="mt-1 text-3xl font-black">🦟 Dengue em Rio Claro</h1>
          <p className="mt-2 max-w-xl text-sm text-red-50">Informação e prevenção para proteger sua família e nossa comunidade.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-red-700">Atenção à dengue</p>
          <h2 className="mt-2 text-xl font-black">O mosquito não escolhe endereço. A prevenção começa em casa!</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">O Aedes aegypti se reproduz em recipientes com água parada. Pequenas atitudes ajudam a reduzir os criadouros no bairro.</p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Como prevenir</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {prevencao.map((item) => (
              <div key={item.titulo} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-2xl" aria-hidden="true">{item.icone}</div>
                <h3 className="mt-1 text-sm font-bold">{item.titulo}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">{item.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Sintomas e cuidados</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Febre alta, dor de cabeça, dor atrás dos olhos, dores no corpo, manchas vermelhas e cansaço podem ocorrer na dengue. Procure atendimento de saúde para avaliação.</p>
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-bold text-red-800">⚠️ Sinais de alarme</p>
            <p className="mt-1 text-sm leading-6 text-red-900">Dor abdominal intensa, vômitos persistentes, sangramento, tontura ou desmaio exigem avaliação médica imediata.</p>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-600">Hidrate-se e siga as orientações profissionais. Não se automedique: medicamentos como AAS (aspirina) e anti-inflamatórios podem aumentar o risco de sangramento.</p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">Atendimento e orientações oficiais</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Em caso de sintomas, procure uma unidade de saúde. Para orientações sobre focos do mosquito e ações de combate, consulte os canais da Fundação Municipal de Saúde.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <a href="https://rioclaro.sp.gov.br/fundacao-de-saude/" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-red-700 px-4 py-3 text-center text-sm font-bold text-white hover:bg-red-800">Fundação de Saúde ↗</a>
            <Link href="/utilidades/upas" className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-800 hover:bg-slate-50">UPAs de Rio Claro →</Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-red-700">Boletim oficial • 25/09/2026</p>
          <h2 className="mt-1 text-xl font-black">Dengue em Rio Claro — 2026</h2>
          <p className="mt-1 text-xs text-slate-500">Publicado pela Prefeitura em 28/09/2026. Retrato do boletim, não contagem em tempo real.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-red-50 p-4"><p className="text-xs font-semibold text-red-800">Casos confirmados no ano</p><p className="mt-1 text-4xl font-black text-red-700">26</p></div>
            <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-semibold text-amber-900">Novos casos no boletim</p><p className="mt-1 text-4xl font-black text-amber-700">3</p></div>
          </div>
          <h3 className="mt-5 text-sm font-black">Casos confirmados por bairro</h3>
          <p className="mt-1 text-xs text-slate-500">Distribuição informada no boletim de 25/09/2026.</p>
          <div className="mt-4 space-y-3" role="img" aria-label="Gráfico: Cidade Jardim, Parque Mãe Preta, Vila Olinda e Jardim Progresso com dois casos cada; outros dezoito bairros com um caso cada.">
            {[
              { nome: "Cidade Jardim", casos: 2 },
              { nome: "Parque Mãe Preta", casos: 2 },
              { nome: "Vila Olinda", casos: 2 },
              { nome: "Jardim Progresso", casos: 2 },
              { nome: "Outros 18 bairros (1 cada)", casos: 18 },
            ].map((item) => (
              <div key={item.nome}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs"><span className="font-semibold">{item.nome}</span><span className="font-bold tabular-nums">{item.casos}</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-red-600" style={{ width: `${(item.casos / 18) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Os 18 bairros agrupados possuem um caso cada. Os valores são históricos e poderão mudar em novos boletins.</p>
          <a href="https://rioclaro.sp.gov.br/fundacao-de-saude/rio-claro-registra-26-casos-de-dengue-neste-ano/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-800">Ver boletim original da Prefeitura ↗</a>
          <div className="mt-3"><a href="https://www.gov.br/saude/pt-br/composicao/svsa/cnie/observatorio-de-arboviroses" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-red-700 underline">Consultar painel nacional atualizado ↗</a></div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-black text-amber-950">Encontrou água parada ou um possível foco?</h2>
          <p className="mt-1 text-sm leading-6 text-amber-950">Evite contato com materiais perigosos e procure os canais oficiais da saúde municipal para solicitar orientação ou informar a situação.</p>
        </section>

        <footer className="pb-3 text-center text-xs leading-5 text-slate-500">
          <p className="font-bold text-slate-700">Sobradão 360 • O portal do nosso bairro</p>
          <p>Conteúdo informativo. Não substitui atendimento médico ou orientações oficiais.</p>
        </footer>
      </main>
    </div>
  );
}
