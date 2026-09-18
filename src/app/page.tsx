import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* CABEÇALHO (Navbar) */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              360
            </div>
            <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">
              Sobradão
            </h1>
          </div>
          <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
            Entrar
          </button>
        </div>
      </header>

      {/* SEÇÃO PRINCIPAL (Hero) */}
      <main>
        <section className="bg-gradient-to-b from-blue-900 to-blue-800 text-white py-20 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">
              O seu bairro, <br className="hidden md:block" /> em todas as direções.
            </h2>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
              Tudo sobre a nossa região: notícias em tempo real, guia comercial local e conexão entre vizinhos.
            </p>
            <div className="pt-6">
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105">
                Participar da Comunidade
              </button>
            </div>
          </div>
        </section>

        {/* MENU DE SERVIÇOS (Cards) */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <Link href="/noticias" className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Mural & Avisos</h3>
              <p className="text-sm text-gray-500 mt-2">Fique por dentro da segurança, melhorias e notícias da região.</p>
            </Link>

            <Link href="/guia" className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Guia Comercial</h3>
              <p className="text-sm text-gray-500 mt-2">Encontre e apoie os prestadores de serviço e comércios locais.</p>
            </Link>

            <Link href="/classificados" className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Classificados</h3>
              <p className="text-sm text-gray-500 mt-2">Venda, doe ou troque produtos diretamente com seus vizinhos.</p>
            </Link>

            <Link href="/eventos" className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition border border-gray-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Eventos</h3>
              <p className="text-sm text-gray-500 mt-2">Festas, reuniões e eventos que acontecem no Sobradão e arredores.</p>
            </Link>


          </div>
        </section>
      </main>
      

      {/* RODAPÉ */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Sobradão 360. Conectando vizinhos.</p>
      </footer>
    </div>
  );
}