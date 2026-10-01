import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 sm:px-5">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs font-bold text-emerald-700 hover:underline">← Voltar ao Sobradão 360</Link>
        <article className="mt-4 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
          <div className="border-b border-slate-100 pb-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Sobradão 360</div>
            <h1 className="mt-1 text-2xl font-black text-slate-900">Política de Privacidade</h1>
            <p className="mt-2 text-sm text-slate-500">Informações sobre tratamento e proteção de dados pessoais.</p>
          </div>
          <div className="mt-6 space-y-6 text-sm leading-7 text-slate-600">
            <section><h2 className="mb-2 text-base font-black text-slate-800">1. Compromisso com a privacidade</h2><p className="whitespace-pre-line">O Sobradão 360 busca tratar dados pessoais de forma transparente, segura e compatível com a legislação brasileira aplicável, incluindo a Lei Geral de Proteção de Dados Pessoais (LGPD).</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">2. Dados que podem ser tratados</h2><p className="whitespace-pre-line">Dependendo da utilização, podem ser tratados nome, e-mail, foto de perfil, telefone ou WhatsApp informado pelo usuário, dados de conta, conteúdo publicado, registros de interação e informações técnicas necessárias ao funcionamento do site.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">3. Finalidades</h2><p className="whitespace-pre-line">Os dados podem ser utilizados para autenticação, criação e manutenção de contas, publicação de conteúdos, comunicação com usuários, segurança, prevenção de abusos, funcionamento das funcionalidades e atendimento de solicitações.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">4. Conteúdo público</h2><p className="whitespace-pre-line">Informações escolhidas pelo próprio usuário para publicação em áreas públicas podem ficar visíveis para outros visitantes. Antes de publicar, o usuário deve evitar divulgar dados pessoais próprios ou de terceiros que não sejam necessários.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">5. Compartilhamento</h2><p className="whitespace-pre-line">Dados podem ser processados por fornecedores necessários à operação do portal, como serviços de autenticação, banco de dados, hospedagem, armazenamento de imagens e ferramentas de infraestrutura. Quando houver serviços externos, eles podem possuir suas próprias políticas.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">6. Segurança</h2><p className="whitespace-pre-line">São adotadas medidas técnicas e administrativas razoáveis para proteger informações contra acesso indevido, perda, alteração ou divulgação não autorizada. Nenhum sistema conectado à internet pode oferecer garantia absoluta de segurança.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">7. Direitos do titular</h2><p className="whitespace-pre-line">Nos limites da legislação, o titular pode solicitar informações sobre o tratamento de seus dados, correção, atualização e outras medidas previstas em lei. Solicitações podem ser encaminhadas pelos canais de contato disponibilizados no portal.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">8. Retenção</h2><p className="whitespace-pre-line">Os dados são mantidos pelo período necessário às finalidades do serviço, às obrigações legais e à proteção de direitos, observadas as hipóteses permitidas pela legislação.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">9. Crianças e adolescentes</h2><p className="whitespace-pre-line">O portal não deve ser utilizado para publicar dados pessoais de crianças ou adolescentes de forma indevida. Responsáveis devem acompanhar o uso quando necessário.</p></section>
<section><h2 className="mb-2 text-base font-black text-slate-800">10. Atualizações</h2><p className="whitespace-pre-line">Esta política pode ser atualizada sempre que houver mudança relevante no funcionamento do portal ou nas exigências legais.</p></section>
          </div>
        </article>
      </div>
    </main>
  );
}
