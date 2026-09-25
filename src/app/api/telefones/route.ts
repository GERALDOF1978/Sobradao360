import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Lista oficial de telefones úteis da Prefeitura / Rio Claro para exibição instantânea
    const telefonesUteis = [
      {
        id: "tel-1",
        titulo: "Guarda Civil Municipal (GCM)",
        descricao: "Emergências e segurança pública municipal 24h.",
        categoria: "Utilidades",
        preco: "153", // Usamos o campo preço para exibir o número em destaque
        imagemUrl: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60",
        autorUid: "sistema-pref",
        autorNome: "Prefeitura de Rio Claro (Oficial)",
        autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PMC",
        oficial: true
      },
      {
        id: "tel-2",
        titulo: "Polícia Militar",
        descricao: "Atendimento de emergência policial.",
        categoria: "Utilidades",
        preco: "190",
        imagemUrl: "https://images.unsplash.com/photo-1555529771-835f59fc5efe?w=800&auto=format&fit=crop&q=60",
        autorUid: "sistema-pref",
        autorNome: "Prefeitura de Rio Claro (Oficial)",
        autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PMC",
        oficial: true
      },
      {
        id: "tel-3",
        titulo: "Corpo de Bombeiros",
        descricao: "Resgate, combate a incêndios e salvamentos.",
        categoria: "Utilidades",
        preco: "193",
        imagemUrl: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop&q=60",
        autorUid: "sistema-pref",
        autorNome: "Prefeitura de Rio Claro (Oficial)",
        autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PMC",
        oficial: true
      },
      {
        id: "tel-4",
        titulo: "UPA 24 Horas (Bairro Cervezão)",
        descricao: "Atendimento de urgência e emergência médica.",
        categoria: "Utilidades",
        preco: "(19) 3535-7500",
        imagemUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=60",
        autorUid: "sistema-pref",
        autorNome: "Prefeitura de Rio Claro (Oficial)",
        autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PMC",
        oficial: true
      },
      {
        id: "tel-5",
        titulo: "Samu",
        descricao: "Atendimento pré-hospitalar de urgência.",
        categoria: "Utilidades",
        preco: "192",
        imagemUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=60",
        autorUid: "sistema-pref",
        autorNome: "Prefeitura de Rio Claro (Oficial)",
        autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PMC",
        oficial: true
      }
    ];

    return NextResponse.json({ success: true, telefones: telefonesUteis });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro ao buscar telefones" }, { status: 500 });
  }
}