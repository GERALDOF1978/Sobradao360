"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Lock, 
  Newspaper 
} from "lucide-react";

import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface AppUser {
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
}

interface Noticia {
  id: string;
  titulo?: string;
  categoria?: string;
  conteudo?: string;
  autorNome?: string;
  autorUid?: string;
}

export default function NoticiasPage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);

  // Monitorar estado de autenticação (apenas para referência de sessão, se necessário)
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

  // Carregar notícias em tempo real do Firestore
  useEffect(() => {
    const q = query(collection(db, "noticias"), orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const docs: Noticia[] = [];
      snapshot.forEach((doc: any) => {
        docs.push({ id: doc.id, ...doc.data() } as Noticia);
      });
      setNoticias(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
  <div className="flex items-center gap-3">
    <button onClick={() => router.push("/")} className="p-1 text-slate-600">
      <ArrowLeft className="w-5 h-5" />
    </button>
    <h1 className="font-bold text-slate-900 text-base">Notícias da Região</h1>
  </div>
</header>

      <main className="p-4 max-w-md mx-auto space-y-4">
        {!user && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 text-xs text-amber-800">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <p>
              Inicie sessão para visualizar todas as informações e comunicados restritos.
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-center text-xs text-slate-400 py-8">A carregar notícias...</p>
        ) : noticias.length > 0 ? (
          noticias.map((item) => (
            <article key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {item.categoria || "Geral"}
                </span>
                <span className="text-[10px] text-slate-400">
                  {item.autorNome}
                </span>
              </div>
              <h2 className="font-bold text-slate-900 text-base leading-snug">{item.titulo}</h2>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {item.conteudo}
              </p>
            </article>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Newspaper className="w-8 h-8 mx-auto stroke-1" />
            <p className="text-xs">Nenhuma notícia publicada ainda.</p>
          </div>
        )}
      </main>
    </div>
  );
}