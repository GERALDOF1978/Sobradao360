import { NextResponse } from "next/server";

export const revalidate = 21600;

const FONTE_VPS = "https://anp.sobradao360.com.br/combustiveis.json";

function parseData(valor: string) {
  const [d, m, a] = String(valor || "").split("/");
  if (!a) return 0;
  return new Date(Number(a), Number(m) - 1, Number(d)).getTime();
}

type PrecoVPS = {
  revenda?: string;
  cnpj?: string;
  endereco?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  produto?: string;
  dataColeta?: string;
  valor?: number | string;
  bandeira?: string;
};

type RespostaVPS = {
  sucesso?: boolean;
  cidade?: string;
  uf?: string;
  totalRegistros?: number;
  totalPostos?: number;
  precos?: PrecoVPS[];
};

type CadastroANP = {
  cnpj: string;
  codigoSIMP?: string;
  autorizacao?: string;
  dataPublicacao?: string;
  distribuidora?: string;
  produtos?: Array<{
    produto?: string;
    tancagem?: number;
    unidMedidaTancagem?: string;
    qtdeBicos?: number;
  }>;
  latitude?: string;
  longitude?: string;
  latitude_ANP4C?: string;
  longitude_ANP4C?: string;
  validacao?: string;
  statusSIGAF?: string;
};

async function obterCadastrosRioClaro() {
  try {
    const url =
      "https://revendedoresapi.anp.gov.br/v1/combustivel?municipio=RIO%20CLARO&uf=SP";
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return new Map<string, CadastroANP>();

    const json = await res.json();
    const lista: CadastroANP[] = Array.isArray(json?.data) ? json.data : [];

    return new Map(
      lista
        .filter((x) => x.cnpj)
        .map((x) => [String(x.cnpj).replace(/\D/g, ""), x])
    );
  } catch (error) {
    console.error("API de revendedores ANP indisponível:", error);
    return new Map<string, CadastroANP>();
  }
}

async function obterPrecosDaVPS(): Promise<RespostaVPS> {
  const res = await fetch(FONTE_VPS, {
    next: { revalidate: 21600 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Cache ANP da VPS respondeu HTTP ${res.status}.`);
  }

  const json = (await res.json()) as RespostaVPS;
  if (!json?.sucesso || !Array.isArray(json.precos)) {
    throw new Error("Cache ANP da VPS retornou uma resposta inválida.");
  }

  return json;
}

export async function GET() {
  try {
    const [dadosVPS, cadastros] = await Promise.all([
      obterPrecosDaVPS(),
      obterCadastrosRioClaro(),
    ]);

    const base = dadosVPS.precos || [];

    const precos = base
      .map((x) => {
        const cnpj = String(x.cnpj || "").replace(/\D/g, "");
        const cadastro = cadastros.get(cnpj);
        const latitude = cadastro?.latitude || cadastro?.latitude_ANP4C || "";
        const longitude = cadastro?.longitude || cadastro?.longitude_ANP4C || "";
        const valor =
          typeof x.valor === "number"
            ? x.valor
            : Number(String(x.valor || "0").replace(",", "."));

        return {
          revenda: x.revenda || "Posto revendedor",
          cnpj: x.cnpj || "",
          endereco: x.endereco || "",
          complemento: x.complemento || "",
          bairro: x.bairro || "",
          cep: x.cep || "",
          produto: x.produto || "",
          dataColeta: x.dataColeta || "",
          valor,
          bandeira: x.bandeira || "",
          cadastroANP: cadastro
            ? {
                codigoSIMP: cadastro.codigoSIMP || "",
                autorizacao: cadastro.autorizacao || "",
                dataPublicacao: cadastro.dataPublicacao || "",
                distribuidora: cadastro.distribuidora || "",
                produtos: cadastro.produtos || [],
                latitude,
                longitude,
                validacao: cadastro.validacao || "",
                statusSIGAF: cadastro.statusSIGAF || "",
              }
            : null,
        };
      })
      .filter((x) => x.valor > 0)
      .sort((a, b) => a.valor - b.valor);

    const datasValidas = precos
      .map((x) => parseData(x.dataColeta))
      .filter((x) => x > 0);
    const ultima = datasValidas.length ? Math.max(...datasValidas) : 0;
    const atualizadoEm = ultima
      ? precos.find((x) => parseData(x.dataColeta) === ultima)?.dataColeta || null
      : null;

    return NextResponse.json(
      {
        sucesso: true,
        cidade: "Rio Claro",
        uf: "SP",
        atualizadoEm,
        totalRegistros: dadosVPS.totalRegistros ?? precos.length,
        totalPostos: dadosVPS.totalPostos,
        precos,
        fonte: "ANP - Levantamento de Preços de Combustíveis",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Erro ANP combustíveis:", error);
    const detalhe = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        sucesso: false,
        erro: "Não foi possível carregar os preços da ANP agora.",
        detalhe,
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
