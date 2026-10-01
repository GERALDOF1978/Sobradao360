import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 sm:px-5">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs font-bold text-emerald-700 hover:underline">← Voltar ao Sobradão 360</Link>
        <article className="mt-4 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
          <div className="border-b border-slate-100 pb-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Sobradão 360</div>
            <h1 className="mt-1 text-2xl font-black text-slate-900">Responsabilidades e Limitações</h1>
            <p className="mt-2 text-sm text-slate-500">Como funciona a plataforma e quais responsabilidades pertencem a usuários, anunciantes e terceiros.</p>
          </div>
          <div className="mt-6 space-y-6 text-sm leading-7 text-slate-600">
            <section><h2 className="mb-2 text-base font-black text-slate-800">1. Papel da plataforma</h2><p className="whitespace-pre-line">O Sobradão 360 atua como plataforma de informação, publicação e conexão. O portal não substitui órgãos públicos, profissionais habilitados, empresas prestadoras de serviços, anunciantes ou autoridades competentes.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">2. Conteúdo de terceiros</h2><p className="whitespace-pre-line">Informações publicadas por moradores, anunciantes e terceiros pertencem a seus respectivos autores. A disponibilização de um conteúdo não significa que a administração do portal concorde com ele ou garanta sua veracidade.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">3. Administração do portal</h2><p className="whitespace-pre-line">A administração realiza a gestão técnica e a moderação possível dentro dos recursos disponíveis. Isso não transforma a administração em autora, garantidora ou responsável automática por cada publicação, comentário, anúncio, negociação ou serviço de terceiro.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">4. Denúncias e remoção</h2><p className="whitespace-pre-line">Quando um conteúdo for identificado como irregular ou denunciado, a administração poderá analisá-lo e, conforme o caso, restringir, ocultar ou remover o material e adotar outras medidas cabíveis.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">5. Serviços públicos</h2><p className="whitespace-pre-line">Informações sobre água, energia, iluminação, telefonia, empregos, clima e outros serviços podem depender de fontes externas. Para assuntos oficiais, o usuário deve confirmar a informação diretamente com o órgão ou empresa responsável.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">6. Negociações entre usuários</h2><p className="whitespace-pre-line">O usuário deve verificar identidade, condições, preço, documentação e segurança antes de contratar, comprar, vender, pagar ou fornecer informações pessoais. O portal não garante a execução de negócios realizados entre terceiros.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">7. Limites legais</h2><p className="whitespace-pre-line">Nenhuma disposição desta página pretende afastar direitos ou responsabilidades que não possam ser excluídos pela legislação brasileira. As limitações devem ser interpretadas dentro dos limites permitidos pela lei.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">8. Contato e correção</h2><p className="whitespace-pre-line">Problemas, denúncias, pedidos de remoção ou dúvidas sobre o funcionamento do portal podem ser encaminhados pelos canais oficiais de contato disponibilizados no site.</p></section>
          </div>
        </article>
      </div>
    </main>
  );
}
