import Link from "next/link";

export default function NoticiasPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-bold text-blue-700 hover:underline"
        >
          ← Voltar para o Sobradão 360
        </Link>

        <section className="mt-4 rounded-3xl bg-white p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wider text-blue-600">
            Sobradão 360
          </div>
          <h1 className="mt-1 text-3xl font-black text-slate-900">
            📰 Giro de Notícias
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Notícias de Rio Claro e região reunidas pelo Sobradão 360.
          </p>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="font-black text-slate-900">
              Estamos preparando o Giro de Notícias
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              As matérias importadas estão passando pela revisão do Master.
              Em seguida, esta página mostrará apenas os resumos aprovados,
              sempre identificando a fonte e oferecendo acesso à matéria original.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
