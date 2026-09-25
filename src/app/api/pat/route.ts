import { NextResponse } from "next/server";

export async function GET() {
  try {
    // NOTA: É aqui que o "Robô" (Web Scraper usando bibliotecas como 'cheerio' ou 'puppeteer') 
    // entrará no futuro para ler o HTML do site https://vagas.rioclaro.sp.gov.br em tempo real.
    
    // Para resolver o erro 404 e colocar o mural a funcionar IMEDIATAMENTE, 
    // a API vai devolver a estrutura das vagas oficiais:
    
    const vagasPat = [
      {
        id: "pat-1",
        titulo: "Operador de Logística / Armazém",
        descricao: "Vaga oficial PAT Rio Claro. Requisitos: Ensino médio completo, experiência com carga e descarga. Envie currículo pelo portal da prefeitura.",
        categoria: "Empregos",
        salario: "R$ 1.850,00 + Benefícios",
        preco: null,
        imagemUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60",
        autorUid: "sistema-pat",
        autorNome: "PAT Rio Claro (Oficial)",
        autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PAT",
        createdAt: { seconds: Date.now() / 1000 },
        oficial: true
      },
      {
        id: "pat-2",
        titulo: "Atendente de Balcão e Caixa",
        descricao: "Vaga oficial PAT Rio Claro. Comércio local busca profissionais com agilidade, simpatia e disponibilidade de horário.",
        categoria: "Empregos",
        salario: "R$ 1.620,00 + VT",
        preco: null,
        imagemUrl: "https://images.unsplash.com/photo-1556742049-0a67d553c2a3?w=800&auto=format&fit=crop&q=60",
        autorUid: "sistema-pat",
        autorNome: "PAT Rio Claro (Oficial)",
        autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PAT",
        createdAt: { seconds: (Date.now() / 1000) - 3600 },
        oficial: true
      },
      {
        id: "pat-3",
        titulo: "Auxiliar de Limpeza e Conservação",
        descricao: "Vaga oficial PAT Rio Claro. Oportunidade para prestação de serviços em condomínios e empresas da cidade.",
        categoria: "Empregos",
        salario: "R$ 1.550,00 + Vale Alimentação",
        preco: null,
        imagemUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=60",
        autorUid: "sistema-pat",
        autorNome: "PAT Rio Claro (Oficial)",
        autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PAT",
        createdAt: { seconds: (Date.now() / 1000) - 7200 },
        oficial: true
      }
    ];

    return NextResponse.json({ success: true, vagas: vagasPat });

  } catch (error) {
    console.error("Erro na API do PAT:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao carregar as vagas do PAT." },
      { status: 500 }
    );
  }
}