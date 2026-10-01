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
            <section><h2 className="mb-2 text-base font-black text-slate-800">1. Responsabilidade comercial</h2><p className="whitespace-pre-line">O anunciante é responsável pela atividade divulgada, pela legalidade de seu negócio, pelos produtos e serviços oferecidos e pelo atendimento ao consumidor.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">2. Informações corretas</h2><p className="whitespace-pre-line">Nome, descrição, telefone, endereço, preços, imagens, horários, condições comerciais e demais informações devem ser verdadeiros e mantidos atualizados.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">3. Produtos e serviços</h2><p className="whitespace-pre-line">Não é permitido utilizar a plataforma para comércio de produtos ou serviços proibidos pela legislação ou pelas regras da plataforma.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">4. Imagens e marcas</h2><p className="whitespace-pre-line">O anunciante deve possuir autorização para utilizar imagens, logos, textos e demais materiais enviados ao portal.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">5. Pagamentos e contratos</h2><p className="whitespace-pre-line">Quando houver plano de divulgação, valores, períodos, limites ou posições publicitárias, essas condições deverão constar do cadastro ou contrato comercial. O anunciante é responsável por cumprir suas obrigações contratuais.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">6. Cancelamento e moderação</h2><p className="whitespace-pre-line">O portal poderá suspender ou remover divulgação que viole a legislação, estas regras, o contrato comercial ou a segurança dos usuários, sem prejuízo das medidas previstas contratualmente.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">7. Relação com consumidores</h2><p className="whitespace-pre-line">Negociações, pagamentos, entregas, garantias, trocas, orçamentos e prestação dos serviços são responsabilidades do anunciante, salvo quando o próprio portal participar expressamente da operação.</p></section>
          </div>
        </article>
      </div>
    </main>
  );
}
