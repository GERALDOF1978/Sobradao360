import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 sm:px-5">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs font-bold text-emerald-700 hover:underline">← Voltar ao Sobradão 360</Link>
        <article className="mt-4 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
          <div className="border-b border-slate-100 pb-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Sobradão 360</div>
            <h1 className="mt-1 text-2xl font-black text-slate-900">Política de Cookies</h1>
            <p className="mt-2 text-sm text-slate-500">Como o Sobradão 360 utiliza cookies e tecnologias semelhantes.</p>
          </div>
          <div className="mt-6 space-y-6 text-sm leading-7 text-slate-600">
            <section><h2 className="mb-2 text-base font-black text-slate-800">1. O que são cookies</h2><p className="whitespace-pre-line">Cookies são pequenos arquivos ou identificadores utilizados por sites para lembrar informações, manter sessões e melhorar a experiência de navegação.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">2. Uso no Sobradão 360</h2><p className="whitespace-pre-line">O portal pode utilizar cookies, armazenamento local e tecnologias semelhantes para autenticação, segurança, preferências, funcionamento de recursos e análise técnica do serviço.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">3. Serviços de terceiros</h2><p className="whitespace-pre-line">Recursos de autenticação, hospedagem, imagens, mapas ou outros serviços integrados podem utilizar suas próprias tecnologias. O tratamento realizado por terceiros segue também as respectivas políticas.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">4. Controle</h2><p className="whitespace-pre-line">O usuário pode controlar cookies pelas configurações do navegador. A desativação de determinados recursos pode impedir o funcionamento de algumas funcionalidades.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">5. Atualizações</h2><p className="whitespace-pre-line">Esta política pode ser alterada quando novas tecnologias ou funcionalidades forem incorporadas ao portal.</p></section>
          </div>
        </article>
      </div>
    </main>
  );
}
