"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  PhoneCall, 
  Newspaper, 
  Megaphone, 
  CloudSun, 
  LogOut, 
  User as UserIcon, 
  Bell, 
  ChevronRight,
  Sparkles
} from "lucide-react";

import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

interface AppUser {
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
}

interface AnunciantePago {
  id: string;
  nomeComercio?: string;
  descricaoCurta?: string;
  imagemUrl?: string;
  ramo?: string;
  ativo?: boolean;
}

const CATEGORIAS_PRINCIPAIS = [
  {
    id: "vagas",
    label: "Vagas de Emprego",
    desc: "Oportunidades locais",
    icon: Briefcase,
    color: "bg-blue-50 text-blue-600 border-blue-100",
    href: "/classificados?categoria=Empregos",
  },
  {
    id: "telefones",
    label: "Telefones Úteis",
    desc: "Emergência e serviços",
    icon: PhoneCall,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    href: "/classificados?categoria=Utilidades",
  },
  {
    id: "noticias",
    label: "Notícias da Região",
    desc: "Avisos e novidades",
    icon: Newspaper,
    color: "bg-amber-50 text-amber-600 border-amber-100",
    href: "/noticias",
  },
  {
    id: "anuncie",
    label: "Anuncie Aqui",
    desc: "Divulgue o seu negócio",
    icon: Megaphone,
    color: "bg-purple-50 text-purple-600 border-purple-100",
    href: "/classificados?categoria=Anuncie",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [clima, setClima] = useState({ temp: "--", condicao: "A carregar..." });
  const [avisos] = useState<string[]>([
    "Alerta de pet perdido: Poodle branco próximo da Praça Central",
    "Manutenção na rede elétrica agendada para quinta-feira",
  ]);
  const [avisoIndex, setAvisoIndex] = useState(0);
  const [anunciantesPagos, setAnunciantesPagos] = useState<AnunciantePago[]>([]);
  const [loadingAnuncios, setLoadingAnuncios] = useState(true);

  // Solução: Utilizar 'any' explícito para evitar conflito de namespace e satisfazer o noImplicitAny
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: any) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchClima() {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-22.4147&longitude=-47.5614&current_weather=true"
        );
        const data = await res.json();
        if (data?.current_weather) {
          setClima({
            temp: `${Math.round(data.current_weather.temperature)}°C`,
            condicao: "Rio Claro",
          });
        }
      } catch (err) {
        console.error("Erro ao procurar clima:", err);
      }
    }
    fetchClima();
  }, []);

  useEffect(() => {
    if (avisos.length <= 1) return;
    const interval = setInterval(() => {
      setAvisoIndex((prev) => (prev + 1) % avisos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [avisos]);

  // Solução: Utilizar 'any' explícito no doc do Firestore
  useEffect(() => {
    async function fetchAnunciantes() {
      try {
        setLoadingAnuncios(true);
        const q = query(
          collection(db, "anuncios_pagos"),
          where("ativo", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const lista: AnunciantePago[] = [];
        querySnapshot.forEach((doc: any) => {
          lista.push({ id: doc.id, ...doc.data() } as AnunciantePago);
        });
        setAnunciantesPagos(lista);
      } catch (error) {
        console.error("Erro ao carregar anúncios pagos:", error);
      } finally {
        setLoadingAnuncios(false);
      }
    }
    fetchAnunciantes();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-200">
            360
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight">
              Sobradão 360
            </h1>
            <span className="text-[11px] text-slate-500 font-medium">
              Portal Comunitário
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700">
            <CloudSun className="w-4 h-4 text-amber-500" />
            <span>{clima.temp}</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/perfil")}
                className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300 flex items-center justify-center"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-slate-600" />
                )}
              </button>
              <button
                onClick={handleLogout}
                title="Sair"
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="text-xs bg-sky-600 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-sky-700 transition-colors"
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      {avisos.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200/60 px-4 py-2 flex items-center gap-2 text-xs text-amber-900">
          <Bell className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
          <p className="truncate font-medium">{avisos[avisoIndex]}</p>
        </div>
      )}

      <main className="p-4 space-y-6 max-w-md mx-auto">
        <section className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-2xl p-4 text-white shadow-lg shadow-sky-600/15">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                Portal Oficial
              </span>
              <h2 className="text-lg font-extrabold mt-1">Bairro Sobradão</h2>
              <p className="text-xs text-sky-100 mt-0.5">
                Tudo o que precisa no seu dia a dia local.
              </p>
            </div>
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Acesso Rápido
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIAS_PRINCIPAIS.map((cat) => {
              const Icone = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => router.push(cat.href)}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-start justify-between text-left transition-all hover:border-sky-300 hover:shadow-md active:scale-95 group"
                >
                  <div className={`p-2.5 rounded-xl border ${cat.color} mb-3 group-hover:scale-110 transition-transform`}>
                    <Icone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
                      {cat.label}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{cat.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="pt-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Guia Comercial & Destaques
            </h2>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
              Patrocinado
            </span>
          </div>

          {loadingAnuncios ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white p-3 rounded-2xl border border-slate-100 animate-pulse flex gap-3">
                  <div className="w-20 h-20 bg-slate-200 rounded-xl" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : anunciantesPagos.length > 0 ? (
            <div className="space-y-3">
              {anunciantesPagos.map((anuncio) => (
                <div
                  key={anuncio.id}
                  onClick={() => router.push(`/anunciante/${anuncio.id}`)}
                  className="cursor-pointer bg-white p-3 rounded-2xl border border-amber-200/70 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex items-center gap-3 group"
                >
                  <img
                    src={anuncio.imagemUrl || "/placeholder.png"}
                    alt={anuncio.nomeComercio || "Anúncio"}
                    className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                      {anuncio.ramo || "Comércio"}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-sky-600 transition-colors">
                      {anuncio.nomeComercio}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {anuncio.descricaoCurta}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-sky-600 font-semibold mt-1.5">
                      <span>Ver página completa</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => router.push("/classificados?categoria=Anuncie")}
              className="cursor-pointer bg-white p-4 rounded-2xl border border-dashed border-sky-300 text-center space-y-2 hover:bg-sky-50/50 transition-colors"
            >
              <p className="text-xs font-bold text-sky-700">
                Deseja destacar o seu negócio aqui?
              </p>
              <p className="text-[11px] text-slate-500">
                Alcance os moradores do Sobradão diariamente.
              </p>
              <span className="inline-block text-xs font-bold text-white bg-sky-600 px-3 py-1.5 rounded-lg shadow-sm">
                Criar Anúncio Pago
              </span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}