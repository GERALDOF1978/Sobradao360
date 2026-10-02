import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ROUTE_ID = "942470";
const TRIPS = ["8300811", "8300812", "8300813", "8300814"];

export async function GET() {
  try {
    const resultados = await Promise.all(
      TRIPS.map(async (tripId) => {
        try {
          const url = `https://mobilibus.com/api/vehicles?origin=web&trip_id=${tripId}&route_id=${ROUTE_ID}`;
          const resposta = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
          if (!resposta.ok) return { tripId, vehicles: [] };
          const dados = await resposta.json();
          return { tripId, vehicles: Array.isArray(dados) ? dados : [] };
        } catch {
          return { tripId, vehicles: [] };
        }
      })
    );

    const vehicles = resultados.flatMap((r) =>
      r.vehicles.map((v: Record<string, unknown>) => ({ ...v, tripId: r.tripId }))
    );

    return NextResponse.json(
      { routeId: ROUTE_ID, updatedAt: new Date().toISOString(), vehicles },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json({ routeId: ROUTE_ID, vehicles: [], error: "Não foi possível consultar os ônibus agora." }, { status: 502 });
  }
}
