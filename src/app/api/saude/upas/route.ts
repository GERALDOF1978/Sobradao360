import { NextResponse } from "next/server";

const BASE = "https://rioclaro-saudetransparente.ids.inf.br/saudetransparenteapi/saude-transparente/painel-atendimento";
const IDS = [1, 2, 3, 4];

async function buscar(path: string) {
  const resposta = await fetch(`${BASE}/${path}`, {
    next: { revalidate: 30 },
    headers: { Accept: "application/json" },
  });
  if (!resposta.ok) throw new Error(`Saúde Transparente respondeu ${resposta.status}`);
  return resposta.json();
}

export async function GET() {
  try {
    const paineis = await Promise.all(
      IDS.map(async (id) => {
        const [resumo, profissionais, classificacao] = await Promise.all([
          buscar(`resumo-unidades/codigo-configuracao-saude-transparente/${id}`),
          buscar(`profissionais/plantao/codigo-configuracao-saude-transparente/${id}`).catch(() => []),
          buscar(`classificacao-risco/codigo-configuracao-saude-transparente/${id}`).catch(() => []),
        ]);
        return { id, resumo: Array.isArray(resumo) ? resumo[0] ?? null : resumo, profissionais, classificacao };
      })
    );

    return NextResponse.json({
      sucesso: true,
      atualizadoEm: new Date().toISOString(),
      atualizacaoSegundos: 30,
      fonte: "Portal Saúde Transparente - Rio Claro",
      paineis,
    });
  } catch (erro) {
    console.error("Erro ao consultar Saúde Transparente:", erro);
    return NextResponse.json(
      { sucesso: false, erro: "Não foi possível atualizar os dados das UPAs agora." },
      { status: 502 }
    );
  }
}
