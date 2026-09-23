import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-200">
      
      {/* CABEÇALHO (Navbar otimizada para toque) */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-base shadow-md shadow-blue-500/20">
              360
            </div>
            <h1 className="text-xl font-extrabold text-blue-900 dark:text-blue-400 tracking-tight">
              Sobradão <span className="text-orange-500">360</span>
            </h1>
          </div>
          <button className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold py-2 px-3 rounded-lg transition active:scale-95">
            Entrar
          </button>
        </div>
      </header>

      {/* SEÇÃO PRINCIPAL (Hero focada em mobile) */}
      <main>
        <section className="bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 text-white py-12 px-4 text-center border-b border-blue-800/50 dark:border-gray-800">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="inline-block bg-orange-500/20 text-orange-400 dark:text-orange-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-orange-500/30">
              Portal Comunitário
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              O seu bairro, <br className="hidden sm:block" /> em todas as direções.
            </h2>
            <p className="text-base sm:text-lg text-blue-100/90 dark:text-gray-300 max-w-xl mx-auto">
              Tudo sobre a nossa região: notícias, guia comercial e conexão direta entre vizinhos.
            </p>
            <div className="pt-2">
              <button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-orange-500/30 transition transform active:scale-95">
                Participar da Comunidade
              </button>
            </div>
          </div>
        </section>

        {/* MENU DE SERVIÇOS (Cards otimizados para toque no celular) */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Link href="/noticias" className="group bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm hover:shadow-md dark:shadow-none transition border border-gray-100 dark:border-gray-800 flex items-center sm:flex-col sm:text-center gap-4 sm:gap-0 active:scale-[0.98]">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl sm:rounded-full flex items-center justify-center shrink-0 sm:mb-4 group-hover:scale-105 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Mural & Avisos</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-2">Segurança, melhorias e avisos da região.</p>
              </div>
            </Link>

            <Link href="/guia" className="group bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm hover:shadow-md dark:shadow-none transition border border-gray-100 dark:border-gray-800 flex items-center sm:flex-col sm:text-center gap-4 sm:gap-0 active:scale-[0.98]">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rounded-xl sm:rounded-full flex items-center justify-center shrink-0 sm:mb-4 group-hover:scale-105 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Guia Comercial</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-2">Comércios e serviços locais pertinho de você.</p>
              </div>
            </Link>

            <Link href="/classificados" className="group bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm hover:shadow-md dark:shadow-none transition border border-gray-100 dark:border-gray-800 flex items-center sm:flex-col sm:text-center gap-4 sm:gap-0 active:scale-[0.98]">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 rounded-xl sm:rounded-full flex items-center justify-center shrink-0 sm:mb-4 group-hover:scale-105 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Classificados</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-2">Compre, venda e troque com vizinhos.</p>
              </div>
            </Link>

            <Link href="/eventos" className="group bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm hover:shadow-md dark:shadow-none transition border border-gray-100 dark:border-gray-800 flex items-center sm:flex-col sm:text-center gap-4 sm:gap-0 active:scale-[0.98]">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl sm:rounded-full flex items-center justify-center shrink-0 sm:mb-4 group-hover:scale-105 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Eventos</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-2">Festas e reuniões no Sobradão.</p>
              </div>
            </Link>

          </div>
        </section>
      </main>

      {/* RODAPÉ */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 py-6 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} Sobradão 360. Conectando vizinhos.</p>
      </footer>
    </div>
  );
}