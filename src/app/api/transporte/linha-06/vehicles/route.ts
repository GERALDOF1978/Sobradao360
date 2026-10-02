import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ROUTE_ID = "942470";

const TRIPS = [
  { tripId: "8300811", sentido: "bairro" },
  { tripId: "8300812", sentido: "centro" },
  { tripId: "8300813", sentido: "centro" },
  { tripId: "8300814", sentido: "bairro" },
] as const;

export async function GET() {
  try {
    const resultados = await Promise.all(
      TRIPS.map(async ({ tripId, sentido }) => {
        try {
          const url = `https://mobilibus.com/api/vehicles?origin=web&trip_id=${tripId}&route_id=${ROUTE_ID}`;
          const resposta = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
          if (!resposta.ok) return { tripId, sentido, vehicles: [] };
          const dados = await resposta.json();
          return { tripId, sentido, vehicles: Array.isArray(dados) ? dados : [] };
        } catch {
          return { tripId, sentido, vehicles: [] };
        }
      })
    );

    const vistos = new Set<string>();
    const vehicles = resultados.flatMap((r) =>
      r.vehicles
        .map((v: Record<string, unknown>) => ({ ...v, tripId: r.tripId, sentido: r.sentido }))
        .filter((v: Record<string, unknown>) => {
          const chave = `${String(v.vehicleId ?? "")}-${r.sentido}`;
          if (vistos.has(chave)) return false;
          vistos.add(chave);
          return true;
        })
    );

    return NextResponse.json(
      { routeId: ROUTE_ID, updatedAt: new Date().toISOString(), vehicles },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json({ routeId: ROUTE_ID, vehicles: [], error: "Não foi possível consultar os ônibus agora." }, { status: 502 });
  }
}
