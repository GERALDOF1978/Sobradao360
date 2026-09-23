import Link from "next/link";

export default function EventosPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans pb-12">
      <header className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            &larr; Voltar ao Início
          </Link>
          <h1 className="text-base font-bold text-gray-800 dark:text-gray-200">Eventos</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-purple-800 text-white p-6 rounded-2xl shadow-md space-y-2">
          <h2 className="text-xl font-extrabold">Agenda do Bairro</h2>
          <p className="text-sm text-purple-100">
            Fique por dentro das festas, reuniões comunitárias e eventos esportivos da região.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-center space-y-3">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum evento agendado para esta semana.</p>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition active:scale-95">
            Sugerir Evento
          </button>
        </div>
      </main>
    </div>
  );
}