"use client";

import Link from "next/link";

export default function Rodape() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-2 text-lg font-black text-white">Sobradão 360</div>
            <p className="text-xs leading-relaxed text-slate-400">
              Portal comunitário de informação, serviços, oportunidades e divulgação
              para moradores e negócios de Rio Claro/SP.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-white">Informações</h3>
            <div className="grid gap-2 text-xs">
              <Link href="/termos-de-uso" className="hover:text-white">Termos de Uso</Link>
              <Link href="/politica-de-privacidade" className="hover:text-white">Política de Privacidade</Link>
              <Link href="/politica-de-cookies" className="hover:text-white">Política de Cookies</Link>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-white">Comunidade</h3>
            <div className="grid gap-2 text-xs">
              <Link href="/regras-comunidade" className="hover:text-white">Regras da Comunidade</Link>
              <Link href="/regras-anunciantes" className="hover:text-white">Regras para Anunciantes</Link>
              <Link href="/responsabilidade" className="hover:text-white">Responsabilidades e Limitações</Link>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-white">Ajuda</h3>
            <div className="grid gap-2 text-xs">
              <Link href="/anuncie" className="hover:text-white">Quero anunciar</Link>
              <Link href="/comunidade" className="hover:text-white">Mural da Comunidade</Link>
              <Link href="/utilidades" className="hover:text-white">Utilidades</Link>
            </div>
          </div>
        </div>

        <div className="mt-7 border-t border-slate-800 pt-5 text-center text-[10px] leading-relaxed text-slate-500">
          <p>© {new Date().getFullYear()} Sobradão 360. Todos os direitos reservados.</p>
          <p className="mt-1">
            O Sobradão 360 é uma plataforma de informação e conexão comunitária.
            Usuários, anunciantes e terceiros são responsáveis pelo conteúdo, produtos,
            serviços e informações que publicam ou fornecem.
          </p>
        </div>
      </div>
    </footer>
  );
}
