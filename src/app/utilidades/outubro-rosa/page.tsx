import Link from "next/link";

export const metadata = {
  title: "Outubro Rosa | Sobradão 360",
  description: "Outubro Rosa: informação sobre saúde das mamas, sinais de atenção, diagnóstico precoce e atendimento pelo SUS.",
};

const sinais = [
  { icon: "🔎", title: "Caroço ou nódulo", text: "Na mama ou na axila, especialmente se for novo ou persistente." },
  { icon: "🌸", title: "Mudanças na pele", text: "Vermelhidão persistente, retrações ou aspecto de casca de laranja." },
  { icon: "💧", title: "Secreção pelo mamilo", text: "Principalmente se ocorrer espontaneamente e tiver sangue." },
  { icon: "🩷", title: "Alteração no mamilo", text: "Mudança recente de posição, retração ou ferida que não cicatriza." },
];

export default function OutubroRosaPage() {
  return (
    <div className="min-h-screen bg-rose-50 pb-16 text-slate-900">
      <header className="bg-gradient-to-br from-pink-700 via-rose-600 to-pink-400 text-white">
        <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
          <Link href="/" className="text-sm font-semibold text-white/90 hover:underline">← Voltar ao Sobradão 360</Link>
          <div className="mt-8 flex items-center gap-4">
            <span className="text-6xl" aria-hidden="true">🎗️</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-100">Saúde • Conscientização</p>
              <h1 className="mt-1 text-4xl font-black sm:text-5xl">Outubro Rosa</h1>
            </div>
          </div>
          <p className="mt-5 max-w-xl text-lg font-semibold leading-7">Cuidar da saúde também é um ato de amor.</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-pink-50">Informação, atenção aos sinais e acesso ao cuidado ajudam a identificar alterações mais cedo.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-pink-700">O que é o Outubro Rosa?</p>
          <h2 className="mt-2 text-2xl font-black">Um mês de conscientização. Um cuidado para o ano inteiro.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">A campanha chama a atenção para o câncer de mama e para a importância de reconhecer alterações no corpo, conversar com profissionais de saúde e realizar exames quando indicados. Homens também podem desenvolver câncer de mama, embora seja muito menos comum.</p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Sinais que merecem avaliação</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Esses sinais não significam necessariamente câncer, mas precisam ser avaliados por um profissional de saúde.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {sinais.map((s) => (
              <article key={s.title} className="rounded-2xl border border-pink-100 bg-pink-50/60 p-4">
                <div className="text-3xl" aria-hidden="true">{s.icon}</div>
                <h3 className="mt-2 text-sm font-black">{s.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{s.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-rose-100 p-4 text-sm font-semibold leading-6 text-rose-900">Percebeu alguma mudança? Procure uma unidade de saúde, mesmo que não sinta dor.</p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Mamografia e diagnóstico precoce</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">A mamografia pode identificar alterações antes de serem percebidas. A necessidade e a frequência do exame dependem da idade, do histórico pessoal e familiar e das orientações vigentes do SUS. Quem apresenta sintomas deve procurar avaliação sem esperar a idade de rastreamento.</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">Se houver casos de câncer de mama ou de ovário na família, conte ao profissional de saúde. Essa informação pode mudar a avaliação do risco e os cuidados recomendados.</p>
          <a href="https://www.gov.br/inca/pt-br/assuntos/cancer/tipos/mama" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-xl bg-pink-700 px-5 py-3 text-sm font-bold text-white hover:bg-pink-800">Orientações do INCA ↗</a>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Cuidados que fazem diferença</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["🚶", "Movimente-se", "Pratique atividade física regularmente, respeitando suas condições de saúde."],
              ["🥗", "Alimente-se bem", "Prefira uma alimentação variada e equilibrada."],
              ["🚭", "Evite o tabaco", "Não fumar ajuda a proteger sua saúde de diversas doenças."],
              ["🤝", "Converse sobre saúde", "Conheça seu corpo e compartilhe dúvidas com a equipe de saúde."],
            ].map(([icon, title, description]) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-slate-100 p-3">
                <span className="text-2xl" aria-hidden="true">{icon}</span>
                <div><h3 className="text-sm font-black">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{description}</p></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Hábitos saudáveis ajudam a reduzir riscos, mas não eliminam completamente a possibilidade de câncer.</p>
        </section>

        <section className="rounded-3xl border border-pink-200 bg-pink-100 p-6">
          <h2 className="text-xl font-black text-pink-950">Onde buscar atendimento em Rio Claro?</h2>
          <p className="mt-2 text-sm leading-7 text-pink-950">Procure a unidade de saúde do seu bairro para orientação, avaliação e encaminhamento quando necessário. O SUS oferece acompanhamento e exames conforme indicação clínica e protocolos de atendimento.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a href="https://rioclaro.sp.gov.br/fundacao-de-saude/" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-pink-700 px-5 py-3 text-center text-sm font-bold text-white hover:bg-pink-800">Fundação Municipal de Saúde ↗</a>
            <Link href="/utilidades/upas" className="rounded-xl border border-pink-300 bg-white px-5 py-3 text-center text-sm font-bold text-pink-900 hover:bg-pink-50">Unidades de pronto atendimento →</Link>
          </div>
        </section>

        <section className="rounded-3xl bg-gradient-to-r from-pink-700 to-rose-600 p-7 text-center text-white">
          <span className="text-4xl" aria-hidden="true">🩷</span>
          <h2 className="mt-3 text-2xl font-black">Compartilhe informação. Espalhe cuidado.</h2>
          <p className="mt-2 text-sm leading-6 text-pink-50">Neste Outubro Rosa, incentive quem você ama a cuidar da saúde.</p>
        </section>

        <footer className="pb-4 text-center text-xs leading-6 text-slate-500">
          <p className="font-black text-slate-700">Sobradão 360 • Informação para nossa comunidade</p>
          <p>Conteúdo educativo. Não substitui consulta, diagnóstico ou orientação médica.</p>
        </footer>
      </main>
    </div>
  );
}
