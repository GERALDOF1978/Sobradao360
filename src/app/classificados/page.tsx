"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addifiable, getDocs, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

interface Anuncio {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  autorNome: string;
  autorFoto: string;
  createdAt: any;
}

export default function ClassificadosPage() {
  const { user } = useAuth();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do formulário de novo anúncio
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Comércio");
  const [salvando, setSalvando] = useState(false);

  // Buscar anúncios do Firestore
  const buscarAnuncios = async () => {
    try {
      const q = query(collection(db, "anuncios"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const lista: Anuncio[] = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() } as Anuncio);
      });
      setAnuncios(lista);
    } catch (error) {
      console.error("Erro ao buscar anúncios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarAnuncios();
  }, []);

  const handlePublicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Você precisa estar logado para publicar!");
      return;
    }
    if (!titulo.trim() || !descricao.trim()) {
      alert("Preencha todos os campos.");
      return;
    }

    setSalvando(true);
    try {
      await addDoc(collection(db, "anuncios"), {
        titulo,
        descricao,
        categoria,
        autorUid: user.uid,
        autorNome: user.displayName || "Morador",
        autorFoto: user.photoURL || "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao",
        createdAt: serverTimestamp(),
      });

      setTitulo("");
      setDescricao("");
      alert("Publicado com sucesso no mural do bairro! 🎉");
      buscarAnuncios(); // Atualiza a lista
    } catch (error) {
      console.error("Erro ao publicar:", error);
      alert("Erro ao salvar no Firestore.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 p-4 font-sans max-w-md mx-auto space-y-6 pb-20">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
        <Link href="/" className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-3 py-1.5 rounded-xl transition">
          ← Voltar ao Início
        </Link>
        <h1 className="text-sm font-black text-white">🛍️ Classificados & Mural</h1>
      </div>

      {/* FORMULÁRIO DE NOVO ANÚNCIO (Apenas para logados) */}
      {user ? (
        <form onSubmit={handlePublicar} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">Novo Anúncio ou Aviso</h2>
          
          <input 
            type="text" 
            placeholder="Título (Ex: Vendo bicicleta / Procura-se prestador...)" 
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          />

          <select 
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="Comércio">Comércio / Produtos</option>
            <option value="Serviços">Serviços (Reformas, Aulas, etc.)</option>
            <option value="Achados e Perdidos">Achados e Perdidos / Pets</option>
            <option value="Avisos do Bairro">Avisos do Bairro</option>
          </select>

          <textarea 
            placeholder="Descreva os detalhes..." 
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
          />

          <button 
            type="submit" 
            disabled={salvando}
            className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 font-black py-2.5 rounded-xl text-xs transition shadow-md disabled:opacity-50"
          >
            {salvando ? "Publicando..." : "Publicar no Mural"}
          </button>
        </form>
      ) : (
        <div className="bg-blue-950/40 border border-blue-800/50 p-4 rounded-2xl text-center space-y-2">
          <p className="text-xs text-blue-200">Faça login na página inicial para postar anúncios e avisos no mural comunitário.</p>
        </div>
      )}

      {/* LISTA DE ANÚNCIOS */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Mural Recente</h2>
        
        {loading ? (
          <p className="text-center text-xs text-gray-500 py-6">Carregando avisos do Firestore...</p>
        ) : anuncios.length === 0 ? (
          <p className="text-center text-xs text-gray-500 py-6">Nenhum anúncio cadastrado ainda. Seja o primeiro!</p>
        ) : (
          anuncios.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2.5 shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-lg border border-blue-700/40">{item.categoria}</span>
                <div className="flex items-center gap-1.5">
                  <img src={item.autorFoto} alt={item.autorNome} className="w-5 h-5 rounded-full border border-amber-400" />
                  <span className="text-[10px] text-gray-400">{item.autorNome}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-white">{item.titulo}</h3>
                <p className="text-xs text-gray-300 mt-1 whitespace-pre-line">{item.descricao}</p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}