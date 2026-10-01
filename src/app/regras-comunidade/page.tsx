import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 sm:px-5">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs font-bold text-emerald-700 hover:underline">← Voltar ao Sobradão 360</Link>
        <article className="mt-4 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
          <div className="border-b border-slate-100 pb-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Sobradão 360</div>
            <h1 className="mt-1 text-2xl font-black text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="mt-6 space-y-6 text-sm leading-7 text-slate-600">
            <section><h2 className="mb-2 text-base font-black text-slate-800">1. Respeito</h2><p className="whitespace-pre-line">Não publique ameaças, perseguição, assédio, discriminação, ofensas ou conteúdo destinado a intimidar outras pessoas.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">2. Informações verdadeiras</h2><p className="whitespace-pre-line">Evite boatos apresentados como fatos. Em denúncias e relatos, informe o que realmente ocorreu e, quando possível, indique data, local e fonte.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">3. Privacidade de terceiros</h2><p className="whitespace-pre-line">Não publique documentos, telefones, endereços, imagens ou outros dados pessoais de terceiros sem base legítima ou autorização adequada.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">4. Conteúdo proibido</h2><p className="whitespace-pre-line">Não são permitidos conteúdos ilegais, golpes, fraude, spam, malware, pornografia, exploração sexual, venda de produtos ou serviços ilícitos ou materiais que coloquem pessoas em risco.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">5. Anúncios no lugar correto</h2><p className="whitespace-pre-line">Use as categorias de Anuncie para ofertas de produtos e serviços. O Mural deve priorizar assuntos, relatos e informações de interesse comunitário.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">6. Moderação e denúncias</h2><p className="whitespace-pre-line">Conteúdos podem ser analisados e removidos quando violarem estas regras ou a legislação. Usuários podem comunicar conteúdos problemáticos pelos canais de atendimento do portal.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">7. Responsabilidade do autor</h2><p className="whitespace-pre-line">Quem publica é responsável pelo conteúdo e por eventuais direitos de terceiros relacionados a texto, imagem, marca ou informação utilizada.</p></section>
          </div>
        </article>
      </div>
    </main>
  );
}
