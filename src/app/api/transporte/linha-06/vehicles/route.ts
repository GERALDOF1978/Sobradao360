import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PROJECT_ID = "964";
const ROUTE_ID = "942470";

type VeiculoMobilibus = Record<string, unknown> & {
  vehicleId?: unknown;
  positionTime?: unknown;
};

type TripMobilibus = {
  tripId?: number | string;
  tripDesc?: string;
  directionId?: number;
  seq?: number;
};

type TimetableMobilibus = {
  timetable?: {
    trips?: TripMobilibus[];
  };
};

type TripAtual = {
  tripId: string;
  tripDesc: string;
  directionId?: number;
  seq?: number;
};

function segundos(hora: unknown) {
  if (typeof hora !== "string") return -1;
  const p = hora.split(":").map(Number);
  if (p.length < 2 || p.some(Number.isNaN)) return -1;
  return (p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0);
}

async function consultarVeiculos(url: string): Promise<VeiculoMobilibus[]> {
  const resposta = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!resposta.ok) throw new Error(`Mobilibus respondeu ${resposta.status}`);

  const dados: unknown = await resposta.json();
  return Array.isArray(dados) ? (dados as VeiculoMobilibus[]) : [];
}

async function descobrirTripsAtuais(): Promise<TripAtual[]> {
  const resposta = await fetch(
    `https://mobilibus.com/api/timetable?origin=web&v=2&project_id=${PROJECT_ID}&route_id=${ROUTE_ID}`,
    { cache: "no-store", headers: { Accept: "application/json" } }
  );

  if (!resposta.ok) throw new Error(`Timetable Mobilibus respondeu ${resposta.status}`);

  const dados = (await resposta.json()) as TimetableMobilibus;
  const trips = dados?.timetable?.trips ?? [];
  const unicos = new Map<string, TripAtual>();

  trips.forEach((trip) => {
    const tripId = String(trip.tripId ?? "").trim();
    if (!tripId) return;
    unicos.set(tripId, {
      tripId,
      tripDesc: String(trip.tripDesc ?? "").trim(),
      directionId: trip.directionId,
      seq: trip.seq,
    });
  });

  return Array.from(unicos.values());
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

async function buscarPorTrips(trips: TripAtual[]) {
  const resultados = await Promise.all(
    trips.map(async (trip) => {
      try {
        const vehicles = await consultarVeiculos(
          `https://mobilibus.com/api/vehicles?origin=web&trip_id=${encodeURIComponent(trip.tripId)}&route_id=${ROUTE_ID}`
        );
        return vehicles.map((v) => ({
          ...v,
          tripId: trip.tripId,
          tripDesc: trip.tripDesc,
          directionId: trip.directionId,
          tripSeq: trip.seq,
        }));
      } catch {
        return [] as VeiculoMobilibus[];
      }
    })
  );
  return resultados.flat();
}

export async function GET() {
  try {
    const trips = await descobrirTripsAtuais();

    if (trips.length === 0) {
      return NextResponse.json(
        { projectId: PROJECT_ID, routeId: ROUTE_ID, modo: "timetable", trips: [], updatedAt: new Date().toISOString(), vehicles: [], error: "Nenhuma viagem encontrada para a Linha 06." },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const vehicles = await buscarPorTrips(trips);

    return NextResponse.json(
      {
        projectId: PROJECT_ID,
        routeId: ROUTE_ID,
        modo: "timetable",
        trips,
        updatedAt: new Date().toISOString(),
        vehicles: removerDuplicados(vehicles),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json(
      { projectId: PROJECT_ID, routeId: ROUTE_ID, modo: "timetable", trips: [], vehicles: [], error: "Não foi possível consultar os ônibus agora." },
      { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
