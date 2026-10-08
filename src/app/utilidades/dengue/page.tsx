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
          <h2 className="text-lg font-black">Casos de dengue em Rio Claro</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Para evitar números incorretos, esta página não apresenta um total de casos sem confirmação de data e fonte. Consulte o painel oficial do Ministério da Saúde para os indicadores mais recentes disponíveis.</p>
          <a href="https://www.gov.br/saude/pt-br/composicao/svsa/cnie/observatorio-de-arboviroses" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800 hover:bg-red-100">Consultar dados oficiais de arboviroses ↗</a>
          <p className="mt-3 text-xs text-slate-500">Fonte: Ministério da Saúde. Os dados podem ser revisados e ter atraso de notificação.</p>
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
