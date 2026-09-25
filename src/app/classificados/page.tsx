"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

// Função de compressão de imagens via Canvas
function compressImage(file: File, maxWidth = 1000, quality = 0.75): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Erro ao obter contexto do canvas");

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject("Erro ao compactar imagem");
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/webp",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

interface Anuncio {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  imagemUrl?: string;
  autorNome: string;
  autorFoto: string;
  createdAt: any;
}

function ClassificadosConteudo() {
  const searchParams = useSearchParams();
  const categoriaURL = searchParams.get("categoria") || "Todos";

  const { user } = useAuth();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoria, setCategoria] = useState(categoriaURL);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const categorias = [
    { nome: "Todos", icone: "🌐" },
    { nome: "Anuncie", icone: "📢" },
    { nome: "Empregos", icone: "💼" },
    { nome: "Compre & Venda", icone: "🛍️" },
    { nome: "Alimentação", icone: "🎂" },
    { nome: "Reformas", icone: "🛠️" },
    { nome: "Lazer", icone: "🏡" },
    { nome: "Automotivo", icone: "🚗" },
    { nome: "Zeladoria", icone: "⚠️" },
    { nome: "Notícias", icone: "📰" },
    { nome: "Pet & Saúde", icone: "🐾" },
    { nome: "Eventos", icone: "🎉" },
    { nome: "Utilidades", icone: "📞" },
  ];

  useEffect(() => {
    const cat = searchParams.get("categoria");
    if (cat) {
      setCategoria(cat);
    }
  }, [searchParams]);

  const buscarAnuncios = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "anuncios"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const lista: Anuncio[] = [];
      querySnapshot.forEach((doc: any) => {
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const rawFile = files[0];
      const compressedFile = await compressImage(rawFile, 1000, 0.75);

      const formData = new FormData();
      formData.append("file", compressedFile);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        setImagemUrl(result.url);
      } else {
        alert(`Erro no upload: ${result.error}`);
      }
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      alert("Erro ao compactar ou enviar a imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handlePublicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Você precisa estar logado para publicar!");
      return;
    }
    if (!titulo.trim() || !descricao.trim()) {
      alert("Preencha o título e a descrição.");
      return;
    }

    const categoriaPublicacao = categoria === "Todos" ? "Anuncie" : categoria;

    setSalvando(true);
    try {
      await addDoc(collection(db, "anuncios"), {
        titulo,
        descricao,
        categoria: categoriaPublicacao,
        imagemUrl: imagemUrl || null,
        autorUid: user.uid,
        autorNome: user.displayName || "Morador",
        autorFoto: user.photoURL || "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao",
        createdAt: serverTimestamp(),
      });

      setTitulo("");
      setDescricao("");
      setImagemUrl("");
      alert("Anúncio publicado com sucesso no mural! 🎉");
      buscarAnuncios();
    } catch (error) {
      console.error("Erro ao publicar:", error);
      alert("Erro ao salvar no Firestore.");
    } finally {
      setSalvando(false);
    }
  };

  const anunciosFiltrados = categoria === "Todos" 
    ? anuncios 
    : anuncios.filter((a) => a.categoria?.toLowerCase() === categoria.toLowerCase());

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 p-4 font-sans max-w-md mx-auto space-y-6 pb-20">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
        <Link href="/" className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-3 py-1.5 rounded-xl transition">
          ← Voltar ao Início
        </Link>
        <h1 className="text-sm font-black text-white">🛍️ Classificados & Guia</h1>
      </div>

      {/* FILTROS DE CATEGORIA */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categorias.map((cat) => (
          <button
            key={cat.nome}
            onClick={() => setCategoria(cat.nome)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              categoria === cat.nome
                ? "bg-amber-400 text-blue-950 shadow"
                : "bg-slate-900 border border-slate-800 text-gray-400 hover:text-white"
            }`}
          >
            <span>{cat.icone}</span>
            <span>{cat.nome}</span>
          </button>
        ))}
      </div>

      {/* FORMULÁRIO DE NOVO ANÚNCIO */}
      {user ? (
        <form onSubmit={handlePublicar} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">Publicar Novo Anúncio</h2>
          
          <input 
            type="text" 
            placeholder="Título do produto, serviço ou vaga" 
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          />

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
            <span className="text-[11px] text-gray-400">Categoria da publicação:</span>
            <span className="text-xs font-black bg-amber-400 text-blue-950 px-2.5 py-0.5 rounded-lg shadow">
              {categoria === "Todos" ? "Anuncie" : categoria}
            </span>
          </div>

          <textarea 
            placeholder="Descreva os detalhes, telefone de contato, requisitos ou valores..." 
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
          />

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 block">Adicionar Imagem (Compactada automaticamente):</label>
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp"
              onChange={handleImageUpload}
              disabled={uploading}
              className="w-full text-xs text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 cursor-pointer"
            />
            {uploading && <p className="text-[10px] text-amber-400 animate-pulse">Compactando e enviando imagem...</p>}
            {imagemUrl && (
              <div className="relative mt-2 bg-slate-950 border border-slate-700 p-1 rounded-xl flex items-center justify-center">
                <img src={imagemUrl} alt="Preview" className="w-full h-auto max-h-48 object-contain rounded-lg" />
                <button 
                  type="button" 
                  onClick={() => setImagemUrl("")} 
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] font-bold shadow"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={salvando || uploading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 font-black py-2.5 rounded-xl text-xs transition shadow-md disabled:opacity-50 mt-2"
          >
            {salvando ? "Publicando..." : "Publicar no Mural"}
          </button>
        </form>
      ) : (
        <div className="bg-blue-950/40 border border-blue-800/50 p-4 rounded-2xl text-center space-y-2">
          <p className="text-xs text-blue-200">Faça login para anunciar seus produtos, serviços e vagas no portal.</p>
        </div>
      )}

      {/* LISTA DE ANÚNCIOS COM IMAGEM SEM CORTES */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {categoria === "Todos" ? "Mural Completo" : `Mural: ${categoria}`}
          </h2>
          <span className="text-[10px] text-gray-500">{anunciosFiltrados.length} anúncio(s)</span>
        </div>
        
        {loading ? (
          <p className="text-center text-xs text-gray-500 py-6">Carregando avisos do Firestore...</p>
        ) : anunciosFiltrados.length === 0 ? (
          <p className="text-center text-xs text-gray-500 py-6">Nenhum anúncio nesta categoria ainda. Seja o primeiro!</p>
        ) : (
          anunciosFiltrados.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2.5 shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-lg border border-blue-700/40">
                  {item.categoria}
                </span>
                <div className="flex items-center gap-1.5">
                  <img src={item.autorFoto} alt={item.autorNome} className="w-5 h-5 rounded-full border border-amber-400 object-cover" />
                  <span className="text-[10px] text-gray-400">{item.autorNome}</span>
                </div>
              </div>

              {/* CONTEINER DE IMAGEM COM OBJECT-CONTAIN */}
              {item.imagemUrl && (
                <div className="w-full bg-slate-950 rounded-xl border border-slate-800 p-1 flex items-center justify-center overflow-hidden">
                  <img src={item.imagemUrl} alt={item.titulo} className="w-full h-auto max-h-80 object-contain mx-auto rounded-lg" />
                </div>
              )}

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

export default function ClassificadosPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-xs text-amber-400">Carregando Classificados...</div>}>
      <ClassificadosConteudo />
    </Suspense>
  );
}