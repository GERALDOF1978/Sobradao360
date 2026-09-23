"use client";

import { useState, useEffect } from "react";

interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  city: string;
}

export default function PainelComunitario() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Dados reais demográficos e estruturais de Sobradinho / DF (Fonte: IBGE / PDAD)
  const populacaoReal = "72.273";
  const altitudeMedia = "1.176 m";
  const anilhaFundacao = "13 de Maio de 1960";

  useEffect(() => {
    async function fetchWeather() {
      try {
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY || "demo_key";
        // Coordenadas aproximadas para Sobradinho, DF (-15.6456, -47.7905)
        const lat = -15.6456;
        const lon = -47.7905;
        
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${apiKey}`
        );
        
        if (res.ok) {
          const data = await res.json();
          setWeather({
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            city: "Sobradinho - DF"
          });
        }
      } catch (error) {
        console.error("Erro ao buscar clima:", error);
      } finally {
        setLoadingWeather(false);
      }
    }

    fetchWeather();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
      
      {/* CARD DE CLIMA EM TEMPO REAL */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Clima na Região</span>
          {loadingWeather ? (
            <p className="text-xs text-gray-400 mt-1">Carregando clima ao vivo...</p>
          ) : weather ? (
            <div>
              <div className="text-2xl font-black text-white mt-0.5">{weather.temp}°C <span className="text-xs font-normal text-gray-300 capitalize">({weather.description})</span></div>
              <p className="text-[11px] text-gray-400 mt-1">Umidade: {weather.humidity}% | Vento: {weather.windSpeed} m/s</p>
            </div>
          ) : (
            <p className="text-xs text-red-400 mt-1">Dados indisponíveis (Verifique a API Key)</p>
          )}
        </div>
        <div className="text-3xl">🌤️</div>
      </div>

      {/* CARD DE INDICADORES DEMOGRÁFICOS REAIS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Portal Oficial do Bairro</span>
          <div className="text-xl font-black text-white mt-0.5">{populacaoReal} <span className="text-xs font-normal text-gray-300">Habitantes (IBGE)</span></div>
          <p className="text-[11px] text-gray-400 mt-1">Fundação: {anilhaFundacao} | Alt.: {altitudeMedia}</p>
        </div>
        <div className="text-3xl">🏘️</div>
      </div>

    </div>
  );
}