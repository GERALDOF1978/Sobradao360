"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  PlusCircle, 
  Send, 
  Lock, 
  Newspaper 
} from "lucide-react";

import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
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

const SUBCATEGORIAS_NOTICIAS = [
  "Eventos Locais",
  "Segurança e Alertas",
  "Achados e Perdidos",
  "Obras e Melhorias",
  "Comunicados Gerais",
];

export default function NoticiasPage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState(SUBCATEGORIAS_NOTICIAS[0]);
  const [conteudo, setConteudo] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Solução: Utilizar 'any' explícito
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

  // Solução: Utilizar 'any' explícito
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

  const handleAbrirCriacao = () => {
    if (!user) {
      alert("É necessário iniciar sessão para publicar uma notícia!");
      router.push("/login");
      return;
    }
    setModalAberto(true);
  };

  const handleSalvarNoticia = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!titulo || !conteudo) {
      alert("Por favor, preencha o título e o conteúdo.");
      return;
    }

    try {
      setEnviando(true);
      await addDoc(collection(db, "noticias"), {
        titulo,
        categoria,
        conteudo,
        autorUid: user.uid,
        autorNome: user.displayName || "Morador do Sobradão",
        criadoEm: serverTimestamp(),
      });

      setTitulo("");
      setConteudo("");
      setCategoria(SUBCATEGORIAS_NOTICIAS[0]);
      setModalAberto(false);
      alert("Notícia publicada com sucesso!");
    } catch (err) {
      console.error("Erro ao guardar notícia:", err);
      alert("Ocorreu um erro ao publicar a notícia.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="p-1 text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-slate-900 text-base">Notícias da Região</h1>
        </div>

        <button
          onClick={handleAbrirCriacao}
          className="flex items-center gap-1.5 text-xs bg-sky-600 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-sky-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publicar</span>
        </button>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-4">
        {!user && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 text-xs text-amber-800">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <p>
              Inicie sessão para poder partilhar novidades e notícias com os seus vizinhos.
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

      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Nova Notícia Comunitária</h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSalvarNoticia} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Categoria da Notícia
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {SUBCATEGORIAS_NOTICIAS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reunião de moradores no sábado"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Descrição detalhada
                </label>
                <textarea
                  rows={4}
                  placeholder="Escreva os detalhes da notícia..."
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-sky-600 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-sky-600/20 hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{enviando ? "A publicar..." : "Publicar Notícia"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}