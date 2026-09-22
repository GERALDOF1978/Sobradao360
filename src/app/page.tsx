export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-4">Sobradão 360</h1>
        <p className="text-lg text-gray-700 mb-6">
          O portal comunitário dos bairros está no ar e funcionando perfeitamente!
        </p>
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
            <h2 className="font-bold text-gray-900">Mural & Avisos</h2>
            <p className="text-sm text-gray-500">Fique por dentro das novidades.</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow border border-gray-100">
            <h2 className="font-bold text-gray-900">Guia Comercial</h2>
            <p className="text-sm text-gray-500">Comércio e serviços locais.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
