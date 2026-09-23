"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

interface ClimaData {
  temp: number;
  condicao: string;
}

export default function Home() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [clima, setClima] = useState<ClimaData | null>(null);
  const [moradoresReais, setMoradoresReais] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca dados reais do clima em Rio Claro - SP
    async function carregarClimaReal() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-22.4111&longitude=-47.5614&current=temperature_2m,weather_code"
        );
        const data = await res.json();
        if (data?.current) {
          setClima({
            temp: Math.round(data.current.temperature_2m),
            condicao: data.current.weather_code <= 3 ? "☀️ Ensolarado/Parcial" : "🌧️ Chuvoso",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar clima:", err);
      }
    }

    // Busca contagem real de usuários gravados no Firestore
    async function carregarVisitantesReais() {
      try {
        const snapshot = await getDocs(collection(db, "usuarios"));
        setMoradoresReais(snapshot.size);
      } catch (err) {
        console.error("Erro ao consultar Firestore:", err);
      } finally {
        setLoading(false);
      }
    }

    carregarClimaReal();
    carregarVisitantesReais();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 p-4 font-sans max-w-md mx-auto space-y-4">
      {/* HEADER DE STATUS REAIS */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div>
          <h1 className="text-sm font-black text-white">SOBRADÃO 360</h1>
          <p className="text-[10px] text-amber-400">Rio Claro - SP</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-blue-300">
            {clima ? `${clima.temp}°C ${clima.condicao}` : "Carregando clima..."}
          </span>
          <p className="text-[10px] text-emerald-400 font-medium">
            ● {loading ? "..." : `${moradoresReais} moradores cadastrados`}
          </p>
        </div>
      </div>

      {/* AÇÕES DE AUTENTICAÇÃO E NAVEGAÇÃO */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={user.photoURL || ""} alt="User" className="w-8 h-8 rounded-full border border-amber-400" />
              <span className="text-xs font-bold text-white">{user.displayName}</span>
            </div>
            <button onClick={logout} className="text-xs bg-red-950 text-red-300 px-3 py-1 rounded-xl font-bold">
              Sair
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 font-black py-2.5 rounded-xl text-xs transition"
          >
            🔑 Entrar com Google
          </button>
        )}

        <Link
          href="/classificados"
          className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
        >
          🛍️ Acessar Classificados & Anúncios
        </Link>
      </div>
    </div>
  );
}