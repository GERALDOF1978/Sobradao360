// src/app/page.js
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-5xl font-extrabold text-blue-900 tracking-tight">
  Sobradão 360
</h1>
<p className="text-xl text-gray-600">
  Tudo sobre a nossa região: notícias, guia comercial e conexão entre vizinhos em todas as direções.
</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
          <Link href="/noticias" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h2 className="text-2xl font-semibold text-gray-800">Mural de Avisos</h2>
            <p className="text-gray-500 mt-2">Fique por dentro das últimas novidades e alertas da vizinhança.</p>
          </Link>
          
          <Link href="/guia" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <h2 className="text-2xl font-semibold text-gray-800">Guia Comercial</h2>
            <p className="text-gray-500 mt-2">Encontre encanadores, padarias, e serviços direto do nosso bairro.</p>
          </Link>
        </div>
        
        <div className="pt-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition">
            Criar Minha Conta
          </button>
        </div>
      </div>
    </main>
  );
}