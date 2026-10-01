import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 sm:px-5">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs font-bold text-emerald-700 hover:underline">← Voltar ao Sobradão 360</Link>
        <article className="mt-4 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
          <div className="border-b border-slate-100 pb-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Sobradão 360</div>
            <h1 className="mt-1 text-2xl font-black text-slate-900">Termos de Uso</h1>
            <p className="mt-2 text-sm text-slate-500">Regras gerais para utilização do Sobradão 360.</p>
          </div>
          <div className="mt-6 space-y-6 text-sm leading-7 text-slate-600">
            <section><h2 className="mb-2 text-base font-black text-slate-800">1. Sobre o portal</h2><p className="whitespace-pre-line">O Sobradão 360 é uma plataforma comunitária destinada a reunir informações, oportunidades, serviços, anúncios e conteúdos de interesse local. O portal funciona como ambiente de publicação e conexão entre usuários, moradores, anunciantes e terceiros.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">2. Aceitação</h2><p className="whitespace-pre-line">Ao acessar ou utilizar o portal, o usuário declara que leu estas regras e concorda em utilizá-lo de forma lícita, responsável e respeitosa.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">3. Conteúdo publicado por usuários</h2><p className="whitespace-pre-line">Publicações, comentários, fotos, anúncios, vagas e demais materiais enviados por usuários são de responsabilidade de quem os publicou. O portal não declara que todo conteúdo de terceiros seja verdadeiro, completo, atualizado ou adequado.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">4. Anúncios e negócios</h2><p className="whitespace-pre-line">O anunciante é responsável por seus produtos, serviços, preços, disponibilidade, informações, atendimento, entrega, garantias, documentos e obrigações legais. O Sobradão 360 não é parte de contratos ou negociações realizados diretamente entre usuários e anunciantes, salvo quando expressamente informado.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">5. Links e serviços externos</h2><p className="whitespace-pre-line">O portal pode disponibilizar links para órgãos públicos, empresas, WhatsApp, redes sociais e outros sites. Esses ambientes possuem suas próprias regras e políticas. O usuário deve verificar as informações diretamente com o responsável pelo serviço.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">6. Moderação</h2><p className="whitespace-pre-line">O portal poderá remover, ocultar, limitar ou recusar conteúdos que violem a legislação, estas regras ou a segurança da comunidade, especialmente quando houver denúncia, abuso, fraude, conteúdo ilegal ou risco aos usuários.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">7. Conta e segurança</h2><p className="whitespace-pre-line">Cada usuário deve manter seus dados de acesso sob sua responsabilidade e não utilizar a conta de outra pessoa. O portal poderá restringir contas utilizadas de forma abusiva ou fraudulenta.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">8. Disponibilidade</h2><p className="whitespace-pre-line">Serviços digitais podem sofrer interrupções, manutenção, falhas de terceiros ou indisponibilidade temporária. O portal não garante funcionamento ininterrupto.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">9. Alterações</h2><p className="whitespace-pre-line">Estas regras podem ser atualizadas para acompanhar mudanças no portal, na legislação ou nas práticas de segurança. A versão publicada nesta página será a referência vigente.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">10. Legislação</h2><p className="whitespace-pre-line">A utilização do portal deverá observar a legislação brasileira aplicável, incluindo normas de proteção de dados, direitos do consumidor, propriedade intelectual e demais normas pertinentes.</p></section>
          </div>
        </article>
      </div>
    </main>
  );
}
