import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ROUTE_ID = "942470";
const TRIP_IDS = ["8300811", "8300812", "8300813", "8300814"] as const;

function segundos(hora: unknown) {
  if (typeof hora !== "string") return -1;
  const p = hora.split(":").map(Number);
  if (p.length < 2 || p.some(Number.isNaN)) return -1;
  return (p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0);
}

export async function GET() {
  try {
    const resultados = await Promise.all(
      TRIP_IDS.map(async (tripId) => {
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

    const porVeiculo = new Map<string, Record<string, unknown>>();
    resultados.forEach((r) => {
      r.vehicles.forEach((v: Record<string, unknown>) => {
        const id = String(v.vehicleId ?? "");
        if (!id) return;
        const atual = { ...v, tripId: r.tripId };
        const anterior = porVeiculo.get(id);
        if (!anterior || segundos(atual.positionTime) >= segundos(anterior.positionTime)) porVeiculo.set(id, atual);
      });
    });

    return NextResponse.json(
      { routeId: ROUTE_ID, updatedAt: new Date().toISOString(), vehicles: Array.from(porVeiculo.values()) },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json({ routeId: ROUTE_ID, vehicles: [], error: "Não foi possível consultar os ônibus agora." }, { status: 502 });
  }
}
