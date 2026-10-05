import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    latitude: "-22.4114",
    longitude: "-47.5614",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,is_day",
    hourly: "temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,visibility,uv_index",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max",
    timezone: "America/Sao_Paulo",
    forecast_days: "7",
  });
  try {
    const resposta = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { next: { revalidate: 900 }, headers: { Accept: "application/json" } });
    if (!resposta.ok) throw new Error(`Open-Meteo respondeu ${resposta.status}`);
    const dados = await resposta.json();
    return NextResponse.json({ ...dados, cidade: "Rio Claro", estado: "SP", atualizadoEm: new Date().toISOString(), fonte: "Open-Meteo" });
  } catch (erro) {
    console.error("Erro clima:", erro);
    return NextResponse.json({ erro: "Não foi possível consultar a previsão agora." }, { status: 502 });
  }
}
