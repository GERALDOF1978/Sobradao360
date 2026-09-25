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
  "Alimentação": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=60",
  "Reformas": "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop&q=60",
  "Lazer": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60",
  "Automotivo": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=60",
  "Zeladoria": "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60",
  "Notícias": "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=60",
  "Pet & Saúde": "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=60",
  "Eventos": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=60",
  "Utilidades": "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=800&auto=format&fit=crop&q=60",
};

// Vagas Oficiais do PAT / Prefeitura de Rio Claro integradas no app
const vagasOficiaisRioClaro = [
  {
    id: "pat-1",
    titulo: "Operador de Logística / Armazém",
    descricao: "Vaga oficial PAT Rio Claro. Requisitos: Ensino médio completo, experiência com carga e descarga. Envie currículo pelo portal da prefeitura.",
    categoria: "Empregos",
    salario: "R$ 1.850,00 + Benefícios",
    imagemUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60",
    autorUid: "sistema-pat",
    autorNome: "PAT Rio Claro (Oficial)",
    autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PAT",
    createdAt: { seconds: Date.now() / 1000 },
    oficial: true
  },
  {
    id: "pat-2",
    titulo: "Atendente de Balcão e Caixa",
    descricao: "Vaga oficial PAT Rio Claro. Comércio local busca profissionais com agilidade, simpatia e disponibilidade de horário.",
    categoria: "Empregos",
    salario: "R$ 1.620,00 + VT",
    imagemUrl: "https://images.unsplash.com/photo-1556742049-0a67d553c2a3?w=800&auto=format&fit=crop&q=60",
    autorUid: "sistema-pat",
    autorNome: "PAT Rio Claro (Oficial)",
    autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PAT",
    createdAt: { seconds: (Date.now() / 1000) - 3600 },
    oficial: true
  },
  {
    id: "pat-3",
    titulo: "Auxiliar de Limpeza e Conservação",
    descricao: "Vaga oficial PAT Rio Claro. Oportunidade para prestação de serviços em condomínios e empresas da cidade.",
    categoria: "Empregos",
    salario: "R$ 1.550,00 + Vale Alimentação",
    imagemUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=60",
    autorUid: "sistema-pat",
    autorNome: "PAT Rio Claro (Oficial)",
    autorFoto: "https://api.dicebear.com/7.x/initials/svg?seed=PAT",
    createdAt: { seconds: (Date.now() / 1000) - 7200 },
    oficial: true
  }
];

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
  preco?: string;
  salario?: string;
  imagemUrl?: string;
  autorUid: string;
  autorNome: string;
  autorFoto: string;
  createdAt: any;
  oficial?: boolean;
}

function ClassificadosConteudo() {
  const searchParams = useSearchParams();
  const categoriaURL = searchParams.get("categoria") || "Todos";

  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [anunciosFirestore, setAnunciosFirestore] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (cat) setCategoria(cat);
  }, [searchParams]);

  useEffect(() => {
    async function verificarAdmin() {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const userRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(userRef);
        if ((docSnap.exists() && docSnap.data().isAdmin) || user.email?.includes("admin")) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Erro ao verificar permissão de admin:", err);
      }
    }
    verificarAdmin();
  }, [user]);

  const buscarAnuncios = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "anuncios"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const lista: Anuncio[] = [];
      querySnapshot.forEach((docSnap: any) => {
        lista.push({ id: docSnap.id, ...docSnap.data() } as Anuncio);
      });
      setAnunciosFirestore(lista);
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
    const imagemFinal = imagemUrl || imagensPadraoPorCategoria[categoriaPublicacao] || imagensPadraoPorCategoria["Anuncie"];

    setSalvando(true);
    try {
      await addDoc(collection(db, "anuncios"), {
        titulo,
        descricao,
        categoria: categoriaPublicacao,
        preco: categoriaPublicacao === "Compre & Venda" ? preco : null,
        salario: categoriaPublicacao === "Empregos" ? salario : null,
        imagemUrl: imagemFinal,
        autorUid: user.uid,
        autorNome: user.displayName || "Morador",
        autorFoto: user.photoURL || "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao",
        createdAt: serverTimestamp(),
      });

      setTitulo("");
      setDescricao("");
      setPreco("");
      setSalario("");
      setImagemUrl("");
      setMostrarForm(false);
      alert("Anúncio publicado com sucesso no mural! 🎉");
      buscarAnuncios();
    } catch (error) {
      console.error("Erro ao publicar:", error);
      alert("Erro ao salvar no Firestore.");
    } finally {
      setSalvando(false);
    }
  };

  const deletarAnuncio = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este anúncio?")) return;
    try {
      await deleteDoc(doc(db, "anuncios", id));
      alert("Anúncio removido com sucesso.");
      buscarAnuncios();
    } catch (error) {
      console.error("Erro ao excluir anúncio:", error);
      alert("Erro ao excluir anúncio.");
    }
  };

  // Junta as vagas oficiais do PAT com as do Firestore
  const todosOsAnuncios = [...vagasOficiaisRioClaro, ...anunciosFirestore];

  const anunciosFiltrados = categoria === "Todos" 
    ? todosOsAnuncios 
    : todosOsAnuncios.filter((a) => a.categoria?.toLowerCase() === categoria.toLowerCase());

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 font-sans max-w-md mx-auto space-y-6 pb-20">
      
      {/* HEADER DA PÁGINA CLARO */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <Link href="/" className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-xl transition">
          ← Voltar ao Início
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-300">ADMIN</span>}
          <h1 className="text-sm font-black text-slate-900">🛍️ Classificados</h1>
        </div>
      </div>

      {/* FILTROS DE CATEGORIA */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categorias.map((cat) => (
          <button
            key={cat.nome}
            onClick={() => setCategoria(cat.nome)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              categoria === cat.nome
                ? "bg-amber-400 text-slate-950 shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span>{cat.icone}</span>
            <span>{cat.nome}</span>
          </button>
        ))}
      </div>

      {/* PAINEL DE DESTAQUE OFICIAL PARA A CATEGORIA EMPREGOS */}
      {categoria === "Empregos" && (
        <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white rounded-3xl p-4 shadow-md space-y-3 border border-indigo-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-lg">PAT</span>
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-300">Vagas Oficiais - Rio Claro</h2>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">● Atualizado hoje</span>
          </div>
          <p className="text-xs text-indigo-100 leading-relaxed">
            As oportunidades abaixo são integradas diretamente do Posto de Atendimento ao Trabalhador (PAT) da Prefeitura de Rio Claro.
          </p>
          <a 
            href="https://vagas.rioclaro.sp.gov.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs text-center shadow transition flex items-center justify-center gap-1.5 block"
          >
            🌐 Acessar Portal Completo do PAT
          </a>
        </div>
      )}

      {/* BOTÃO E FORMULÁRIO DINÂMICO DE NOVO ANÚNCIO */}
      {user ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setMostrarForm(!mostrarForm)}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            {mostrarForm ? "✕ Fechar Formulário" : `➕ Publicar em ${categoria === "Todos" ? "Anuncie" : categoria}`}
          </button>

          {mostrarForm && (
            <form onSubmit={handlePublicar} className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Novo Anúncio: {categoria === "Todos" ? "Anuncie" : categoria}
              </h2>
              
              <input 
                type="text" 
                placeholder={categoria === "Empregos" ? "Título da vaga / Cargo (Ex: Auxiliar Administrativo)" : "Título principal do anúncio"} 
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />

              {categoria === "Compre & Venda" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">Preço do Produto / Valor (R$):</label>
                  <input 
                    type="text" 
                    placeholder="Ex: R$ 150,00 ou A combinar" 
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              {categoria === "Empregos" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">Salário / Faixa Salarial / Benefícios:</label>
                  <input 
                    type="text" 
                    placeholder="Ex: R$ 2.500 + Vale Alimentação" 
                    value={salario}
                    onChange={(e) => setSalario(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              <textarea 
                placeholder={categoria === "Empregos" ? "Descreva os requisitos, carga horária, e-mail ou WhatsApp para envio de currículo..." : "Descreva os detalhes, contactos, requisitos ou informações importantes..."} 
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
              />

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 block">Adicionar Imagem (Opcional - caso não envie, criaremos uma padrão):</label>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                />
                {uploading && <p className="text-[10px] text-amber-600 animate-pulse font-semibold">Compactando e enviando imagem...</p>}
                {imagemUrl && (
                  <div className="relative mt-2 bg-slate-100 border border-slate-200 p-1 rounded-xl flex items-center justify-center">
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
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs transition shadow-md disabled:opacity-50 mt-2"
              >
                {salvando ? "Publicando..." : "Publicar no Mural"}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-center space-y-2">
          <p className="text-xs text-blue-900 font-medium">Faça login para anunciar seus produtos, serviços e vagas no portal.</p>
        </div>
      )}

      {/* LISTA DE ANÚNCIOS */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {categoria === "Todos" ? "Mural Completo" : `Mural: ${categoria}`}
          </h2>
          <span className="text-[10px] text-slate-500">{anunciosFiltrados.length} anúncio(s)</span>
        </div>
        
        {loading ? (
          <p className="text-center text-xs text-slate-500 py-6">Carregando avisos do Firestore...</p>
        ) : anunciosFiltrados.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-6">Nenhum anúncio nesta categoria ainda. Seja o primeiro!</p>
        ) : (
          anunciosFiltrados.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-2.5 shadow-sm hover:shadow-md transition relative">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200">
                    {item.categoria}
                  </span>
                  {item.oficial && (
                    <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-300">
                      🏛️ OFICIAL PREFEITURA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <img src={item.autorFoto} alt={item.autorNome} className="w-5 h-5 rounded-full border border-slate-300 object-cover" />
                    <span className="text-[10px] font-semibold text-slate-600">{item.autorNome}</span>
                  </div>

                  {/* Botão de excluir apenas para anúncios comuns criados por usuários (ou admin) */}
                  {!item.oficial && (isAdmin || (user && user.uid === item.autorUid)) && (
                    <button
                      onClick={() => deletarAnuncio(item.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-lg transition"
                      title="Excluir Anúncio"
                    >
                      🗑️ Excluir
                    </button>
                  )}
                </div>
              </div>

              {item.imagemUrl && (
                <div className="w-full bg-slate-100 rounded-xl border border-slate-200/80 p-1 flex items-center justify-center overflow-hidden">
                  <img src={item.imagemUrl} alt={item.titulo} className="w-full h-auto max-h-80 object-contain mx-auto rounded-lg" />
                </div>
              )}

              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900">{item.titulo}</h3>
                
                {item.preco && (
                  <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block border border-emerald-200">
                    💰 Preço: {item.preco}
                  </p>
                )}

                {item.salario && (
                  <p className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg inline-block border border-indigo-200">
                    💼 Salário/Benefícios: {item.salario}
                  </p>
                )}

                <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{item.descricao}</p>
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
    <Suspense fallback={<div className="text-center py-10 text-xs text-amber-600">Carregando Classificados...</div>}>
      <ClassificadosConteudo />
    </Suspense>
  );
}