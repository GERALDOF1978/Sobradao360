import Link from "next/link";

export default function NoticiasPage() {
  const avisos = [
    {
      id: 1,
      titulo: "Manutenção na rede de água na próxima terça-feira",
      categoria: "Aviso Geral",
      data: "23 de Set, 2026",
      autor: "Associação de Moradores",
      descricao: "A Sabesp informou que haverá interrupção temporária no abastecimento das ruas principais entre 8h e 14h."
    },
    {
      id: 2,
      titulo: "Feira de Adoção de Pets na Praça Central",
      categoria: "Evento",
      data: "25 de Set, 2026",
      autor: "Comissão de Bem-Estar",
      descricao: "Venha adotar um novo amigo e apoiar os protetores de animais locais neste fim de semana, a partir das 9h."
    },
    {
      id: 3,
      titulo: "Atenção: Achados e Perdidos",
      categoria: "Comunidade",
      data: "22 de Set, 2026",
      autor: "Morador (Bloco B)",
      descricao: "Encontrada chave com chaveiro azul próximo à padaria. Retirar na portaria ou falar com Carlos."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans pb-12">
      <header className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            &larr; Voltar ao Início
          </Link>
          <h1 className="text-base font-bold text-gray-800 dark:text-gray-200">Mural & Avisos</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-md space-y-2">
          <h2 className="text-xl font-extrabold">Fique por dentro do Sobradão</h2>
          <p className="text-sm text-blue-100">
            Aqui você encontra os avisos oficiais da comunidade e recados importantes postados pelos vizinhos.
          </p>
        </div>

        <div className="space-y-4">
          {avisos.map((aviso) => (
            <article key={aviso.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  {aviso.categoria}
                </span>
                <span className="text-xs text-gray-400">{aviso.data}</span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{aviso.titulo}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{aviso.descricao}</p>
              
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-400">
                <span>Por: {aviso.autor}</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">Ver detalhes</span>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}