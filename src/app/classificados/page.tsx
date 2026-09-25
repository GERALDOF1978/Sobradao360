"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

const imagensPadraoPorCategoria: Record<string, string> = {
  "Anuncie": "https://i.ibb.co/zTTKfgLt/banner-s360-webp.webp",
  "Empregos": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop&q=60",
  "Compre & Venda": "https://images.unsplash.com/photo-1555529771-835f59fc5efe?w=800&auto=format&fit=crop&q=60",
  // ... (mesmas imagens padrão) ...
};

interface Anuncio {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  preco?: string | null;
  salario?: string | null;
  imagemUrl?: string;
  autorUid: string;
  autorNome: string;
  autorFoto: string;
  createdAt: any;
  oficial?: boolean;
}

function compressImage(file: File, maxWidth = 1000, quality = 0.75): Promise<File> {
  // ... (mesma função de compressão que já tem) ...
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
            if (!blob) return reject("Erro ao compactar");
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" }));
          },
          "image/webp",
          quality
        );
      };
    };
  });
}

function ClassificadosConteudo() {
  const searchParams = useSearchParams();
  const categoriaURL = searchParams.get("categoria") || "Todos";

  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [anunciosFirestore, setAnunciosFirestore] = useState<Anuncio[]>([]);
  const [vagasPat, setVagasPat] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);

  // Paginação e Modais
  const [limiteVisivel, setLimiteVisivel] = useState(15);
  const [modalPatAberto, setModalPatAberto] = useState(false);

  const [categoria, setCategoria] = useState(categoriaURL);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [salario, setSalario] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const categorias = [
    { nome: "Todos", icone: "🌐" },
    { nome: "Anuncie", icone: "📢" },
    { nome: "Empregos", icone: "💼" },
    { nome: "Compre & Venda", icone: "🛍️" },
    // Adicione os outros aqui se quiser
  ];

  useEffect(() => {
    if (searchParams.get("categoria")) setCategoria(searchParams.get("categoria") as string);
  }, [searchParams]);

  useEffect(() => {
    async function verificarAdmin() {
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, "usuarios", user.uid));
        if ((docSnap.exists() && docSnap.data().isAdmin) || user.email?.includes("admin")) setIsAdmin(true);
      } catch (err) {}
    }
    verificarAdmin();
  }, [user]);

  const buscarDados = async () => {
    setLoading(true);
    try {
      // 1. Busca os anúncios criados pelos usuários no Firebase
      const q = query(collection(db, "anuncios"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const listaFirebase: Anuncio[] = [];
      querySnapshot.forEach((docSnap) => {
        listaFirebase.push({ id: docSnap.id, ...docSnap.data() } as Anuncio);
      });
      setAnunciosFirestore(listaFirebase);

      // 2. Busca as vagas do PAT chamando o nosso Robô (API)
      const resPat = await fetch("/api/pat");
      if (resPat.ok) {
        const dadosPat = await resPat.json();
        if (dadosPat.success) setVagasPat(dadosPat.vagas);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (Mantém a sua mesma lógica de upload já existente) ...
  };

  const handlePublicar = async (e: React.FormEvent) => {
    // ... (Mantém a sua mesma lógica de publicar já existente) ...
  };

  const deletarAnuncio = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este anúncio?")) return;
    try {
      await deleteDoc(doc(db, "anuncios", id));
      buscarDados();
    } catch (error) {}
  };

  // Junta o Firebase + PAT
  const todosOsAnuncios = [...vagasPat, ...anunciosFirestore];

  // Filtra pela Categoria
  const anunciosFiltrados = categoria === "Todos" 
    ? todosOsAnuncios 
    : todosOsAnuncios.filter((a) => a.categoria?.toLowerCase() === categoria.toLowerCase());

  // Corta a lista para mostrar apenas o "Limite Visível" (ex: 15)
  const anunciosPaginados = anunciosFiltrados.slice(0, limiteVisivel);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 font-sans max-w-md mx-auto space-y-6 pb-20">
      
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <Link href="/" className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-xl transition">
          ← Início
        </Link>
        <h1 className="text-sm font-black text-slate-900">🛍️ Classificados</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categorias.map((cat) => (
          <button
            key={cat.nome}
            onClick={() => { setCategoria(cat.nome); setLimiteVisivel(15); }}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              categoria === cat.nome ? "bg-amber-400 text-slate-950 shadow" : "bg-white border text-slate-600"
            }`}
          >
            <span>{cat.icone} {cat.nome}</span>
          </button>
        ))}
      </div>

      {categoria === "Empregos" && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-4 shadow-md space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-lg">PAT</span>
            <h2 className="text-xs font-black uppercase text-amber-300">Vagas Oficiais - Rio Claro</h2>
          </div>
          <p className="text-xs text-indigo-100 leading-relaxed">
            Estas vagas são atualizadas automaticamente através do nosso sistema conectado à prefeitura.
          </p>
          <button 
            onClick={() => setModalPatAberto(true)}
            className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs flex justify-center items-center gap-2"
          >
            🌐 Acessar Portal do PAT (Sem sair do App)
          </button>
        </div>
      )}

      {/* AQUI FICARIA SEU BOTÃO DE PUBLICAR E FORMULÁRIO (Pode manter o mesmo que já tínhamos) */}

      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-xs text-slate-500 py-6">Atualizando mural...</p>
        ) : (
          anunciosPaginados.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-2.5 shadow-sm">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200">{item.categoria}</span>
                {item.oficial && <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">🏛️ OFICIAL</span>}
              </div>
              <h3 className="font-bold text-sm text-slate-900">{item.titulo}</h3>
              <p className="text-xs text-slate-600 whitespace-pre-line">{item.descricao}</p>
            </div>
          ))
        )}

        {/* BOTÃO CARREGAR MAIS (PAGINAÇÃO) */}
        {!loading && anunciosFiltrados.length > limiteVisivel && (
          <button 
            onClick={() => setLimiteVisivel(limiteVisivel + 15)}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 rounded-xl text-xs transition mt-4"
          >
            ⬇️ Ver mais anúncios...
          </button>
        )}
      </div>

      {/* MODAL DO PAT (IFRAME) - Abre o site da prefeitura por cima do app */}
      {modalPatAberto && (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-slate-800 text-white">
            <h2 className="text-sm font-bold">Portal PAT Rio Claro</h2>
            <button 
              onClick={() => setModalPatAberto(false)}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold"
            >
              Fechar X
            </button>
          </div>
          
          {/* Alerta de Segurança de Navegador */}
          <div className="bg-amber-100 text-amber-800 text-[10px] p-2 text-center">
            Se a página ficar em branco, o site do governo bloqueia navegação interna. <a href="https://vagas.rioclaro.sp.gov.br" target="_blank" className="font-bold underline">Clique aqui para abrir no navegador.</a>
          </div>

          <iframe 
            src="https://vagas.rioclaro.sp.gov.br" 
            className="flex-1 w-full bg-white"
            title="Portal PAT Rio Claro"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      )}
    </div>
  );
}

export default function ClassificadosPage() {
  return (
    <Suspense>
      <ClassificadosConteudo />
    </Suspense>
  );
}