"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

// Função de compressão de imagens via Canvas (executada no navegador)
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

export default function ClassificadosPage() {
  const { user } = useAuth();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do formulário
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Anuncie");
  const [imagemUrl, setImagemUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // As 8 categorias do Sobradão 360
  const categorias = [
    { nome: "Anuncie", icone: "📢" },
    { nome: "Empregos", icone: "💼" },
    { nome: "Compre & Venda", icone: "🛍️" },
    { nome: "Lazer", icone: "🏡" },
    { nome: "Reformas", icone: "🛠️" },
    { nome: "Alimentação", icone: "🎂" },
    { nome: "Automotivo", icone: "🚗" },
    { nome: "Zeladoria", icone: "⚠️" },
    { nome: "Utilidades", icone: "📞" },
  ];

  // Buscar anúncios no Firestore
  const buscarAnuncios = async () => {
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

  // Upload com compressão automática antes de subir
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

    setSalvando(true);
    try {
      await addDoc(collection(db, "anuncios"), {
        titulo,
        descricao,
        categoria,
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

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 p-4 font-sans max-w-md mx-auto space-y-6 pb-20">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
        <Link href="/" className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-3 py-1.5 rounded-xl transition">
          ← Voltar ao Início
        </Link>
        <h1 className="text-sm font-black text-white">🛍️ Classificados & Guia</h1>
      </div>

      {/* FORMULÁRIO DE NOVO ANÚNCIO */}
      {user ? (
        <form onSubmit={handlePublicar} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">Publicar Novo Anúncio</h2>
          
          <input 
            type="text" 
            placeholder="Título do produto, serviço ou aviso" 
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          />

          {/* Seleção entre as 8 Categorias */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Selecione a Categoria:</label>
            <select 
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              {categorias.map((cat) => (
                <option key={cat.nome} value={cat.nome}>
                  {cat.icone} {cat.nome}
                </option>
              ))}
            </select>
          </div>

          <textarea 
            placeholder="Descreva os detalhes, telefone de contato, preços, etc..." 
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
          />

          {/* Campo de Upload de Foto com Compressão */}
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
              <div className="relative mt-2">
                <img src={imagemUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-slate-700" />
                <button 
                  type="button" 
                  onClick={() => setImagemUrl("")} 
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] font-bold"
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
          <p className="text-xs text-blue-200">Faça login para anunciar seus produtos, negócios e serviços no portal.</p>
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
                <span className="text-[10px] font-bold bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-lg border border-blue-700/40">
                  {item.categoria}
                </span>
                <div className="flex items-center gap-1.5">
                  <img src={item.autorFoto} alt={item.autorNome} className="w-5 h-5 rounded-full border border-amber-400" />
                  <span className="text-[10px] text-gray-400">{item.autorNome}</span>
                </div>
              </div>

              {item.imagemUrl && (
                <img src={item.imagemUrl} alt={item.titulo} className="w-full h-44 object-cover rounded-xl border border-slate-800" />
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