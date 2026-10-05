import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ROUTE_ID = "942470";

// Fallback temporário: só é usado se o Mobilibus não aceitar a consulta
// direta pela linha. A consulta principal NÃO depende mais destes trip_ids.
const TRIP_IDS_FALLBACK = ["8300811", "8300812", "8300813", "8300814"] as const;

type VeiculoMobilibus = Record<string, unknown> & {
  vehicleId?: unknown;
  positionTime?: unknown;
};

function segundos(hora: unknown) {
  if (typeof hora !== "string") return -1;
  const p = hora.split(":").map(Number);
  if (p.length < 2 || p.some(Number.isNaN)) return -1;
  return (p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0);
}

async function consultar(url: string): Promise<VeiculoMobilibus[]> {
  const resposta = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!resposta.ok) {
    throw new Error(`Mobilibus respondeu ${resposta.status}`);
  }

  const dados: unknown = await resposta.json();
  return Array.isArray(dados) ? (dados as VeiculoMobilibus[]) : [];
}

function removerDuplicados(veiculos: VeiculoMobilibus[]) {
  const porVeiculo = new Map<string, VeiculoMobilibus>();

  veiculos.forEach((v) => {
    const id = String(v.vehicleId ?? "");
    if (!id) return;

    const anterior = porVeiculo.get(id);
    if (!anterior || segundos(v.positionTime) >= segundos(anterior.positionTime)) {
      porVeiculo.set(id, v);
    }
  });

  return Array.from(porVeiculo.values());
}

async function buscarPelaLinha() {
  // A linha é a referência estável. O Mobilibus decide quais viagens e
  // veículos estão vinculados a ela naquele momento.
  return consultar(
    `https://mobilibus.com/api/vehicles?origin=web&route_id=${ROUTE_ID}`
  );
}

async function buscarFallback() {
  const resultados = await Promise.all(
    TRIP_IDS_FALLBACK.map(async (tripId) => {
      try {
        const vehicles = await consultar(
          `https://mobilibus.com/api/vehicles?origin=web&trip_id=${tripId}&route_id=${ROUTE_ID}`
        );
        return vehicles.map((v) => ({ ...v, tripId }));
      } catch {
        return [] as VeiculoMobilibus[];
      }
    })
  );

  return resultados.flat();
}

export async function GET() {
  try {
    let vehicles: VeiculoMobilibus[] = [];
    let modo: "linha" | "fallback-trip" = "linha";

    try {
      vehicles = await buscarPelaLinha();
    } catch {
      modo = "fallback-trip";
      vehicles = await buscarFallback();
    }

    return NextResponse.json(
      {
        routeId: ROUTE_ID,
        modo,
        updatedAt: new Date().toISOString(),
        vehicles: removerDuplicados(vehicles),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json(
      {
        routeId: ROUTE_ID,
        vehicles: [],
        error: "Não foi possível consultar os ônibus agora.",
      },
      { status: 502 }
    );
  }
}
