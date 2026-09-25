import { NextResponse } from "next/server";

export async function GET() {
  try {
    const telefonesUteis = [
      {
        id: "tel-1",
        titulo: "Guarda Civil Municipal (GCM)",
        descricao: "Emergências e segurança pública municipal 24h.",
        categoria: "Utilidades",
        preco: "153",
        imagemUrl: "https://i.ibb.co/sJzrvQ1W/GCM-RIO-CLARO-webp.webp",
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
        imagemUrl: "https://i.ibb.co/4ZxJgBfF/PM-webp.webp",
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
        imagemUrl: "https://i.ibb.co/ym5Jx1YQ/BOMBEIRO-webp.webp",
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
        imagemUrl: "https://i.ibb.co/v67dvJp3/UPA-webp.webp",
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
        imagemUrl: "https://i.ibb.co/SDGyXCSv/SAMU-webp.webp",
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