"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import TelefonesUteisLista from "@/components/TelefonesUteisLista";
import Curriculos from "@/components/Curriculos";


const imagensPadraoPorCategoria: Record<string, string> = {
  Anuncie: "https://i.ibb.co/zTTKfgLt/banner-s360-webp.webp",
  Empregos: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop&q=60",
  "Compre & Venda": "https://images.unsplash.com/photo-1555529771-835f59fc5efe?w=800&auto=format&fit=crop&q=60",
  Alimentação: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=60",
  Reformas: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop&q=60",
  Lazer: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60",
  Automotivo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=60",
  Zeladoria: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=60",
  Notícias: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=60",
  "Pet & Saúde": "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=60",
  Eventos: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=60",
  Utilidades: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=800&auto=format&fit=crop&q=60",
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

  // Campos das vagas do Trampolim
  origem?: "pat" | "trampolim" | "morador";
  urlTrampolim?: string | null;
  idTrampolim?: string | null;
  empresa?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  quantidadeVagas?: number | string | null;
  beneficios?: string | null;
  prazo?: string | null;
}

function compressImage(
  file: File,
  maxWidth = 1000,
  quality = 0.75
): Promise<File> {
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

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".webp",
              {
                type: "image/webp",
                lastModified: Date.now(),
              }
            );

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

function ClassificadosConteudo() {
  const searchParams = useSearchParams();
  const categoriaURL = searchParams.get("categoria") || "Todos";
  const { user } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isBloqueado, setIsBloqueado] = useState(false);

  const [anunciosFirestore, setAnunciosFirestore] = useState<Anuncio[]>([]);
  const [vagasPat, setVagasPat] = useState<Anuncio[]>([]);
  const [vagasTrampolim, setVagasTrampolim] = useState<Anuncio[]>([]);
  const [telefonesUteis, setTelefonesUteis] = useState<Anuncio[]>([]);

  const [loading, setLoading] = useState(true);
  const [limiteVisivel, setLimiteVisivel] = useState(15);
  const [filtroMeusAnuncios, setFiltroMeusAnuncios] = useState(false);
  const [categoria, setCategoria] = useState(categoriaURL);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [salario, setSalario] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [anuncioEmEdicao, setAnuncioEmEdicao] = useState<Anuncio | null>(null);
  const [filtroEmpregos, setFiltroEmpregos] = useState<
  "todos" | "trampolim" | "manual" | "curriculos"
>("todos");

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
      setLimiteVisivel(15);
    }
  }, [searchParams]);

  useEffect(() => {
    async function verificarPermissoesUser() {
      if (!user) {
        setIsAdmin(false);
        setIsBloqueado(false);
        return;
      }

      try {
        const userRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const dados = docSnap.data();
          if (dados.isAdmin || user.email?.includes("admin")) {
            setIsAdmin(true);
          }
          if (dados.bloqueado) {
            setIsBloqueado(true);
          }
        } else {
          await setDoc(
            userRef,
            {
              nome: user.displayName || "Morador",
              email: user.email,
              isAdmin: user.email?.includes("admin") || false,
              bloqueado: false,
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (err) {
        console.error("Erro ao verificar permissões:", err);
      }
    }

    verificarPermissoesUser();
  }, [user]);

  const buscarDados = async () => {
    setLoading(true);

    try {
      // 1. ANÚNCIOS DOS MORADORES
      const q = query(collection(db, "anuncios"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const lista: Anuncio[] = [];

      querySnapshot.forEach((docSnap: any) => {
        lista.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as Anuncio);
      });
      setAnunciosFirestore(lista);

      // 2. VAGAS PAT / MANUAIS
      const resPat = await fetch("/api/pat");
      if (resPat.ok) {
        const dadosPat = await resPat.json();
        if (dadosPat.success) {
          setVagasPat(dadosPat.vagas);
        }
      }

      // 3. VAGAS DO TRAMPOLIM
  const vagasSnapshot = await getDocs(collection(db, "vagas"));

const vagasConvertidas: Anuncio[] = [];

for (let i = 0; i < vagasSnapshot.docs.length; i++) {
  const item = vagasSnapshot.docs[i];
  const vaga = item.data();

  const anuncio: Anuncio = {
    id: item.id,
    titulo: vaga.name || "Vaga de emprego",
    descricao:
      vaga.description ||
      "Vaga disponível no Trampolim.",
    categoria: "Empregos",
    salario:
      vaga.salary != null
        ? String(vaga.salary)
        : null,
    imagemUrl:
      vaga.logo ||
      imagensPadraoPorCategoria["Empregos"],
    autorUid: "trampolim",
    autorNome: "Trampolim",
    autorFoto:
      vaga.logo ||
      imagensPadraoPorCategoria["Empregos"],
    createdAt: null,
    oficial: true,
  };

  vagasConvertidas.push(anuncio);
}

setVagasTrampolim(vagasConvertidas);

      // 4. TELEFONES ÚTEIS
      const resTel = await fetch("/api/telefones");
      if (resTel.ok) {
        const dadosTel = await resTel.json();
        if (dadosTel.success) {
          setTelefonesUteis(dadosTel.telefones);
        }
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

  const alternarBloqueioMorador = async (
    autorUid: string,
    autorNome: string,
    statusAtualBloqueio: boolean
  ) => {
    if (!isAdmin) return;

    const acao = statusAtualBloqueio ? "desbloquear" : "bloquear";
    if (
      !confirm(
        `Tem certeza que deseja ${acao} o morador ${autorNome} de publicar anúncios?`
      )
    ) {
      return;
    }

    try {
      const userRef = doc(db, "usuarios", autorUid);
      await setDoc(userRef, { bloqueado: !statusAtualBloqueio }, { merge: true });

      alert(
        `Morador ${autorNome} foi ${
          statusAtualBloqueio ? "desbloqueado" : "bloqueado"
        } com sucesso.`
      );
      buscarDados();
    } catch (error) {
      alert("Erro ao alterar o status de bloqueio do morador.");
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    isEditing = false
  ) => {
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
        if (isEditing && anuncioEmEdicao) {
          setAnuncioEmEdicao({
            ...anuncioEmEdicao,
            imagemUrl: result.url,
          });
        } else {
          setImagemUrl(result.url);
        }
      } else {
        alert(`Erro no upload: ${result.error}`);
      }
    } catch (error) {
      alert("Erro ao enviar a imagem.");
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

    if (isBloqueado) {
      alert(
        "Sua conta está bloqueada pela administração e você não pode publicar novos anúncios."
      );
      return;
    }

    if (!titulo.trim() || !descricao.trim()) {
      alert("Preencha o título e a descrição.");
      return;
    }

    const categoriaPublicacao = categoria === "Todos" ? "Anuncie" : categoria;
    const imagemFinal =
      imagemUrl ||
      imagensPadraoPorCategoria[categoriaPublicacao] ||
      imagensPadraoPorCategoria["Anuncie"];

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
        autorFoto:
          user.photoURL ||
          "https://api.dicebear.com/7.x/thumbs/svg?seed=padrao",
        createdAt: serverTimestamp(),
        origem: "morador",
      });

      setTitulo("");
      setDescricao("");
      setPreco("");
      setSalario("");
      setImagemUrl("");
      setMostrarForm(false);

      alert("Anúncio publicado com sucesso!");
      buscarDados();
    } catch (error) {
      alert("Erro ao salvar no Firestore.");
    } finally {
      setSalvando(false);
    }
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anuncioEmEdicao) return;

    try {
      const docRef = doc(db, "anuncios", anuncioEmEdicao.id);
      await updateDoc(docRef, {
        titulo: anuncioEmEdicao.titulo,
        descricao: anuncioEmEdicao.descricao,
        preco: anuncioEmEdicao.preco || null,
        salario: anuncioEmEdicao.salario || null,
        imagemUrl: anuncioEmEdicao.imagemUrl,
      });

      setAnuncioEmEdicao(null);
      alert("Anúncio atualizado com sucesso!");
      buscarDados();
    } catch (error) {
      alert("Erro ao atualizar anúncio.");
    }
  };

  const deletarAnuncio = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este anúncio?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "anuncios", id));
      alert("Anúncio removido com sucesso.");
      buscarDados();
    } catch (error) {
      alert("Erro ao excluir anúncio.");
    }
  };

 let todosOsAnuncios = [
  ...vagasPat,
  ...vagasTrampolim,
  ...telefonesUteis,
  ...anunciosFirestore,
];

if (filtroMeusAnuncios && user) {
  todosOsAnuncios = todosOsAnuncios.filter(
    (a) => a.autorUid === user.uid
  );
}

let anunciosFiltrados =
  categoria === "Todos"
    ? todosOsAnuncios
    : todosOsAnuncios.filter((a) => {
        const categoriaAnuncio =
          a.categoria?.toLowerCase().trim();

        const categoriaSelecionada =
          categoria.toLowerCase().trim();

        if (categoriaSelecionada === "empregos") {
          return (
            categoriaAnuncio === "empregos" ||
            categoriaAnuncio === "emprego"
          );
        }

        return (
          categoriaAnuncio ===
          categoriaSelecionada
        );
      });

// ==========================================
// FILTROS INTERNOS DE EMPREGOS
// ==========================================
if (categoria === "Empregos") {
  if (filtroEmpregos === "trampolim") {
    anunciosFiltrados =
      anunciosFiltrados.filter(
        (a) =>
          a.autorUid ===
          "trampolim-oficial"
      );
  }

  if (filtroEmpregos === "manual") {
    anunciosFiltrados =
      anunciosFiltrados.filter(
        (a) =>
          a.autorUid !==
          "trampolim-oficial"
      );
  }

  // ========================================
  // ORDENAÇÃO: MAIS RECENTES PRIMEIRO
  // ========================================
  const transformarData = (valor: any) => {
    if (!valor) return 0;

    // Firestore Timestamp
    if (
      typeof valor.toDate ===
      "function"
    ) {
      return valor.toDate().getTime();
    }

    // Data em texto
    const data =
      new Date(valor).getTime();

    return Number.isNaN(data)
      ? 0
      : data;
  };

  anunciosFiltrados.sort(
    (a, b) =>
      transformarData(b.createdAt) -
      transformarData(a.createdAt)
  );
}

const anunciosPaginados =
  anunciosFiltrados.slice(
    0,
    limiteVisivel
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 font-sans max-w-md mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <Link
          href="/"
          className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-xl transition"
        >
          ← Início
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-300">
              ADMIN
            </span>
          )}
          <h1 className="text-sm font-black text-slate-900">🛍️ Classificados</h1>
        </div>
      </div>

      {isBloqueado && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-2xl text-xs font-semibold text-center">
          🚫 A sua conta está atualmente bloqueada pela administração e não pode publicar novos classificados.
        </div>
      )}

      {user && (
        <button
          onClick={() => setFiltroMeusAnuncios(!filtroMeusAnuncios)}
          className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition shadow-sm border ${
            filtroMeusAnuncios
              ? "bg-indigo-600 text-white border-indigo-700"
              : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          }`}
        >
          {filtroMeusAnuncios
            ? "👤 A mostrar apenas os seus anúncios"
            : "📋 Ver os meus anúncios (Gerir / Excluir)"}
        </button>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categorias.map((cat) => (
          <button
            key={cat.nome}
            onClick={() => {
              setCategoria(cat.nome);
              setLimiteVisivel(15);
            }}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              categoria === cat.nome
                ? "bg-amber-400 text-slate-950 shadow"
                : "bg-white border text-slate-600"
            }`}
          >
            <span>
              {cat.icone} {cat.nome}
            </span>
          </button>
        ))}
      </div>

      {user && !filtroMeusAnuncios && !isBloqueado && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setMostrarForm(!mostrarForm)}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            {mostrarForm
              ? "✕ Fechar Formulário"
              : `➕ Publicar em ${categoria === "Todos" ? "Anuncie" : categoria}`}
          </button>

          {mostrarForm && (
            <form
              onSubmit={handlePublicar}
              className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm"
            >
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600">
                Novo Anúncio
              </h2>

              <input
                type="text"
                placeholder="Título principal"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />

              {categoria === "Compre & Venda" && (
                <input
                  type="text"
                  placeholder="Preço (Ex: R$ 150,00)"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              )}

              {categoria === "Empregos" && (
                <input
                  type="text"
                  placeholder="Salário / Benefícios"
                  value={salario}
                  onChange={(e) => setSalario(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              )}

              <textarea
                placeholder="Descreva os detalhes..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs resize-none"
              />

              <input
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={(e) => handleImageUpload(e, false)}
                disabled={uploading}
                className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200"
              />

              {uploading && (
                <p className="text-[10px] text-amber-600 animate-pulse">
                  Enviando imagem...
                </p>
              )}

              {imagemUrl && (
                <div className="relative bg-slate-100 p-1 rounded-xl flex items-center justify-center">
                  <img
                    src={imagemUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-36 object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setImagemUrl("")}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={salvando || uploading}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-md"
              >
                {salvando ? "Publicando..." : "Publicar"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* LISTA DE ANÚNCIOS OU UTILIDADES */}
      <div className="space-y-3">
        {categoria === "Utilidades" ? (
          <TelefonesUteisLista />
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {filtroMeusAnuncios
                  ? "Meus Anúncios"
                  : categoria === "Todos"
                  ? "Mural Completo"
                  : categoria}
              </h2>
              <span className="text-[10px] text-slate-500">
                {anunciosFiltrados.length} item(ns)
              </span>
            </div>

            {/* CARD OFICIAL PAT / PREFEITURA */}
            {(categoria === "Empregos" || categoria === "Emprego") &&
              !filtroMeusAnuncios && (
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden space-y-3 border border-indigo-700/50">
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                        <span>🏛️</span> Prefeitura de Rio Claro
                      </span>
                      <h3 className="font-extrabold text-base text-white leading-snug">
                        Posto de Atendimento ao Trabalhador (PAT)
                      </h3>
                      <p className="text-xs text-indigo-100/90 leading-relaxed">
                        Consulte vagas de emprego abertas e serviços oficiais de intermediação de mão de obra.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 relative z-10">
                    <a
                      href="https://www.trampolim.sp.gov.br/pt/busca/?smart_filter=false&q=&type=vacancy&order_by=latest&page=1&page_limit=10&status=available&status=extended&locale=Rio+Claro&operation_range=25"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-center"
                    >
                      <span>🌐</span>
                      <span>Acessar Vagas no Trampolim</span>
                    </a>
                    <a
                      href="tel:1935331238"
                      className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-3 px-4 rounded-xl backdrop-blur-md transition flex items-center gap-1.5 border border-white/20"
                    >
                      <span>📞</span>
                      <span>Ligar</span>
                    </a>
                  </div>
                </div>
              )}


              {categoria === "Empregos" && (
  <div className="mb-5 flex flex-wrap gap-2">
    <button
      onClick={() => setFiltroEmpregos("todos")}
      className={`rounded-full px-4 py-2 text-xs font-bold transition ${
        filtroEmpregos === "todos"
          ? "bg-yellow-500 text-black"
          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
      }`}
    >
      💼 Todas
    </button>

    <button
      onClick={() => setFiltroEmpregos("trampolim")}
      className={`rounded-full px-4 py-2 text-xs font-bold transition ${
        filtroEmpregos === "trampolim"
          ? "bg-yellow-500 text-black"
          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
      }`}
    >
      🌐 Trampolim
    </button>

    <button
      onClick={() => setFiltroEmpregos("manual")}
      className={`rounded-full px-4 py-2 text-xs font-bold transition ${
        filtroEmpregos === "manual"
          ? "bg-yellow-500 text-black"
          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
      }`}
    >
      👤 Manual
    </button>
    
    <button
  onClick={() => setFiltroEmpregos("curriculos")}
  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
    filtroEmpregos === "curriculos"
      ? "bg-yellow-500 text-black"
      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
  }`}
>
  📄 Currículos
</button>
</div>
)}

{categoria === "Empregos" &&
  filtroEmpregos === "curriculos" && (
    <Curriculos />
)}

{categoria === "Empregos" &&
filtroEmpregos === "curriculos" ? null : loading ? (
  <p className="text-center text-xs text-slate-500 py-6">
    Carregando anúncios...
  </p>
) : anunciosPaginados.length === 0 ? (
  <p className="text-center text-xs text-slate-500 py-6">
    Nenhum anúncio encontrado.
  </p>
) : (
  anunciosPaginados.map((item) => {

                const isMeuAnuncio = user && user.uid === item.autorUid;
                const isTrampolim = item.origem === "trampolim";
                const isPat =
                  item.origem === "pat" ||
                  (item.oficial === true && !isTrampolim);

                return (
                  <div
                    key={`${item.origem || "anuncio"}-${item.id}`}
                    className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-2.5 shadow-sm relative"
                  >
                    {/* IDENTIFICAÇÃO DA ORIGEM */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200">
                          {item.categoria}
                        </span>
                        {isPat && (
                          <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                            🏛️ PAT / OFICIAL
                          </span>
                        )}
                        {isTrampolim && (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                            🌐 TRAMPOLIM
                          </span>
                        )}
                        {item.oficial && !isPat && !isTrampolim && (
                          <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                            🏛️ OFICIAL
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={item.autorFoto}
                            alt={item.autorNome}
                            className="w-5 h-5 rounded-full border object-cover"
                          />
                          <span className="text-[10px] font-semibold text-slate-600">
                            {item.autorNome}
                          </span>
                        </div>

                        {!item.oficial && (
                          <div className="flex items-center gap-1">
                            {isMeuAnuncio && (
                              <button
                                onClick={() => setAnuncioEmEdicao(item)}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-lg transition"
                                title="Editar"
                              >
                                ✏️
                              </button>
                            )}
                            {(isAdmin || isMeuAnuncio) && (
                              <button
                                onClick={() => deletarAnuncio(item.id)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-lg transition"
                                title="Excluir"
                              >
                                🗑️
                              </button>
                            )}
                            {isAdmin && !isMeuAnuncio && (
                              <button
                                onClick={() =>
                                  alternarBloqueioMorador(
                                    item.autorUid,
                                    item.autorNome,
                                    false
                                  )
                                }
                                className="bg-slate-200 hover:bg-red-600 hover:text-white text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-lg transition"
                                title="Bloquear Morador"
                              >
                                🚫 Bloquear
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* IMAGEM */}
                    {item.imagemUrl && (
                      <div className="w-full bg-slate-100 rounded-xl border p-1 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.imagemUrl}
                          alt={item.titulo}
                          className="w-full h-auto max-h-72 object-contain mx-auto rounded-lg"
                        />
                      </div>
                    )}

                    {/* CONTEÚDO */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-slate-900">
                        {item.titulo}
                      </h3>

                      {item.empresa && (
                        <p className="text-xs font-semibold text-slate-700">
                          🏢 {item.empresa}
                        </p>
                      )}

                      {item.cidade && (
                        <p className="text-xs text-slate-600">
                          📍 {item.cidade}
                          {item.bairro ? ` — ${item.bairro}` : ""}
                        </p>
                      )}

                      {item.quantidadeVagas && (
                        <p className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg inline-block border">
                          👥 {item.quantidadeVagas} vaga(s)
                        </p>
                      )}

                      {item.preco &&
                        (categoria === "Utilidades" ? (
                          <a
                            href={`tel:${item.preco.replace(/\D/g, "")}`}
                            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 shadow transition"
                          >
                            📞 Ligar Agora: {item.preco}
                          </a>
                        ) : (
                          <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block border">
                            💰 Preço: {item.preco}
                          </p>
                        ))}

                      {item.salario && (
                        <p className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg inline-block border">
                          💼 Salário: {item.salario}
                        </p>
                      )}

                      {item.beneficios && (
                        <p className="text-xs text-slate-600">
                          🎁 <strong>Benefícios:</strong> {item.beneficios}
                        </p>
                      )}

                      <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">
                        {item.descricao}
                      </p>
                    </div>

                    {/* BOTÃO DA VAGA TRAMPOLIM */}
                    {isTrampolim && item.urlTrampolim && (
                      <a
                        href={item.urlTrampolim}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
                      >
                        🌐 Ver esta vaga no Trampolim
                      </a>
                    )}
                  </div>
                );
              })
            )}

            {!loading && anunciosFiltrados.length > limiteVisivel && (
              <button
                onClick={() => setLimiteVisivel(limiteVisivel + 15)}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 rounded-xl text-xs transition mt-4"
              >
                ⬇️ Ver mais...
              </button>
            )}
          </>
        )}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {anuncioEmEdicao && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={salvarEdicao}
            className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-xs font-black uppercase text-amber-600">
                ✏️ Editar Anúncio
              </h2>
              <button
                type="button"
                onClick={() => setAnuncioEmEdicao(null)}
                className="text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600">
                Título:
              </label>
              <input
                type="text"
                value={anuncioEmEdicao.titulo}
                onChange={(e) =>
                  setAnuncioEmEdicao({
                    ...anuncioEmEdicao,
                    titulo: e.target.value,
                  })
                }
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs"
              />
            </div>

            {anuncioEmEdicao.preco !== undefined &&
              anuncioEmEdicao.preco !== null && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">
                    Preço / Telefone:
                  </label>
                  <input
                    type="text"
                    value={anuncioEmEdicao.preco || ""}
                    onChange={(e) =>
                      setAnuncioEmEdicao({
                        ...anuncioEmEdicao,
                        preco: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              )}

            {anuncioEmEdicao.salario !== undefined &&
              anuncioEmEdicao.salario !== null && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-600">
                    Salário / Benefícios:
                  </label>
                  <input
                    type="text"
                    value={anuncioEmEdicao.salario || ""}
                    onChange={(e) =>
                      setAnuncioEmEdicao({
                        ...anuncioEmEdicao,
                        salario: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              )}

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600">
                Descrição:
              </label>
              <textarea
                value={anuncioEmEdicao.descricao}
                onChange={(e) =>
                  setAnuncioEmEdicao({
                    ...anuncioEmEdicao,
                    descricao: e.target.value,
                  })
                }
                rows={4}
                className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600">
                Alterar Imagem:
              </label>
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={(e) => handleImageUpload(e, true)}
                className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-200"
              />

              {anuncioEmEdicao.imagemUrl && (
                <div className="relative mt-2 bg-slate-100 p-1 rounded-xl flex items-center justify-center">
                  <img
                    src={anuncioEmEdicao.imagemUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-36 object-contain rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs"
              >
                Salvar Alterações
              </button>
              <button
                type="button"
                onClick={() => setAnuncioEmEdicao(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ClassificadosPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-10 text-xs text-amber-600">
          A carregar Classificados...
        </div>
      }
    >
      <ClassificadosConteudo />
    </Suspense>
  );
}