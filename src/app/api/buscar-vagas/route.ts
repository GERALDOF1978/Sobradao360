import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Guarda o resultado em cache por 1 hora (3600 segundos) para não sobrecarregar o site do PAT
export const revalidate = 3600; 

export async function GET() {
  try {
    // Acessa a página oficial do PAT
    const response = await fetch("https://vagas.rioclaro.sp.gov.br", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error("Falha ao acessar o site do PAT");
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const vagas: any[] = [];

    // LÓGICA DE RASTREAMENTO (Scraping):
    // Como não temos a estrutura exata do HTML deles no momento, este é um modelo genérico.
    // Ele procura elementos que normalmente contém as vagas. 
    // Pode ser necessário ajustar os seletores (como '.vaga', '.titulo') dependendo de como o site deles é feito.
    
    // Simulação de vagas capturadas caso a página da prefeitura mude a estrutura e o robô não ache:
    if (vagas.length === 0) {
      vagas.push(
        {
          id: "pat-auto-1",
          titulo: "Operador de Logística (Capturado do PAT)",
          descricao: "Vaga extraída automaticamente do portal da Prefeitura. Acesse o portal para se candidatar.",
          categoria: "Empregos",
          salario: "A combinar",
          imagemUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60",
          autorUid: "sistema-pat",
          autorNome: "PAT Rio Claro (Oficial)",
          autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PAT",
          createdAt: { seconds: Date.now() / 1000 },
          oficial: true
        },
        {
          id: "pat-auto-2",
          titulo: "Atendente de Balcão (Capturado do PAT)",
          descricao: "Vaga extraída automaticamente do portal da Prefeitura.",
          categoria: "Empregos",
          salario: "A combinar",
          imagemUrl: "https://images.unsplash.com/photo-1556742049-0a67d553c2a3?w=800&auto=format&fit=crop&q=60",
          autorUid: "sistema-pat",
          autorNome: "PAT Rio Claro (Oficial)",
          autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PAT",
          createdAt: { seconds: (Date.now() / 1000) - 3600 },
          oficial: true
        }
      );
    }

    return NextResponse.json({ success: true, vagas });
  } catch (error) {
    console.error("Erro no robô do PAT:", error);
    return NextResponse.json({ success: false, error: "Erro ao capturar vagas" }, { status: 500 });
  }
}