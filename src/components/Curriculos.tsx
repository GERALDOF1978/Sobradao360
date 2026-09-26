"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Curriculo {
  id: string;
  uid: string;
  nome: string;
  profissao: string;
  cidade: string;
  bairro: string;
  resumo: string;
  experiencia: string;
  escolaridade: string;
  habilidades: string;
  pretensao: string;
  disponibilidade: string;
  imagemCurriculo?: string;
}

interface ContatoCurriculo {
  telefone?: string;
  whatsapp?: string;
  email?: string;
}

export default function Curriculos() {
  const { user } = useAuth();

  const [curriculos, setCurriculos] = useState<Curriculo[]>([]);
  const [contatos, setContatos] = useState<
    Record<string, ContatoCurriculo>
  >({});

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);

  const [nome, setNome] = useState("");
  const [profissao, setProfissao] = useState("");
  const [cidade, setCidade] = useState("Rio Claro");
  const [bairro, setBairro] = useState("");
  const [resumo, setResumo] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [escolaridade, setEscolaridade] = useState("");
  const [habilidades, setHabilidades] = useState("");
  const [pretensao, setPretensao] = useState("");
  const [disponibilidade, setDisponibilidade] =
    useState("");

  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  // ================================
  // IMAGEM DO CURRÍCULO
  // ================================
  const [arquivoCurriculo, setArquivoCurriculo] =
    useState<File | null>(null);

  const [previewCurriculo, setPreviewCurriculo] =
    useState("");

  const [imagemCurriculoUrl, setImagemCurriculoUrl] =
    useState("");

  // ================================
  // CARREGAR CURRÍCULOS
  // ================================
  const carregarCurriculos = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(
        collection(db, "curriculos")
      );

      const lista: Curriculo[] = [];

      for (let i = 0; i < snapshot.docs.length; i++) {
        const registro = snapshot.docs[i];
        const dados = registro.data();

        const curriculo: Curriculo = {
          id: registro.id,
          uid: dados.uid || registro.id,
          nome: dados.nome || "",
          profissao: dados.profissao || "",
          cidade: dados.cidade || "",
          bairro: dados.bairro || "",
          resumo: dados.resumo || "",
          experiencia: dados.experiencia || "",
          escolaridade: dados.escolaridade || "",
          habilidades: dados.habilidades || "",
          pretensao: dados.pretensao || "",
          disponibilidade:
            dados.disponibilidade || "",
          imagemCurriculo:
            dados.imagemCurriculo || "",
        };

        lista.push(curriculo);
      }

      setCurriculos(lista);
    } catch (error) {
      console.error(
        "Erro ao carregar currículos:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCurriculos();
  }, []);

  // ================================
  // SELECIONAR IMAGEM
  // ================================
  const selecionarImagem = (
    arquivo: File | null
  ) => {
    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      alert(
        "Selecione uma imagem JPG, PNG ou WEBP."
      );
      return;
    }

    if (arquivo.size > 10 * 1024 * 1024) {
      alert(
        "A imagem deve ter no máximo 10 MB."
      );
      return;
    }

    setArquivoCurriculo(arquivo);

    const preview =
      URL.createObjectURL(arquivo);

    setPreviewCurriculo(preview);
  };

  // ================================
  // ENVIAR IMAGEM PARA IMGBB
  // ================================
  const enviarImagemCurriculo = async (
    arquivo: File
  ): Promise<string> => {
    const formData = new FormData();

    formData.append("file", arquivo);

    const response = await fetch(
      "/api/upload-imagem",
      {
        method: "POST",
        body: formData,
      }
    );

    const dados = await response.json();

    if (!response.ok || !dados.success) {
      throw new Error(
        dados.error ||
          "Não foi possível enviar a imagem."
      );
    }

    if (!dados.url) {
      throw new Error(
        "O servidor não retornou a URL da imagem."
      );
    }

    return dados.url;
  };

  // ================================
  // SALVAR CURRÍCULO
  // ================================
  const salvarCurriculo = async () => {
    if (!user) {
      alert(
        "Entre ou cadastre-se para cadastrar seu currículo."
      );
      return;
    }

    if (!nome.trim() || !profissao.trim()) {
      alert(
        "Informe seu nome e sua profissão."
      );
      return;
    }

    try {
      setSalvando(true);

      let urlImagem = imagemCurriculoUrl;

      // ================================
      // ENVIA IMAGEM SE FOI SELECIONADA
      // ================================
      if (arquivoCurriculo) {
        try {
          setEnviandoImagem(true);

          urlImagem =
            await enviarImagemCurriculo(
              arquivoCurriculo
            );

          setImagemCurriculoUrl(
            urlImagem
          );
        } catch (erroImagem) {
          console.error(
            "Erro ao enviar imagem:",
            erroImagem
          );

          alert(
            "Não foi possível enviar a imagem do currículo."
          );

          return;
        } finally {
          setEnviandoImagem(false);
        }
      }

      const referencia = doc(
        db,
        "curriculos",
        user.uid
      );

      // ================================
      // DADOS PÚBLICOS
      // ================================
      await setDoc(
        referencia,
        {
          uid: user.uid,

          nome: nome.trim(),

          profissao:
            profissao.trim(),

          cidade:
            cidade.trim(),

          bairro:
            bairro.trim(),

          resumo:
            resumo.trim(),

          experiencia:
            experiencia.trim(),

          escolaridade:
            escolaridade.trim(),

          habilidades:
            habilidades.trim(),

          pretensao:
            pretensao.trim(),

          disponibilidade:
            disponibilidade.trim(),

          imagemCurriculo:
            urlImagem || "",

          atualizadoEm:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      // ================================
      // CONTATO PRIVADO
      // ================================
      await setDoc(
        doc(
          db,
          "curriculos",
          user.uid,
          "privado",
          "contato"
        ),
        {
          telefone:
            telefone.trim(),

          whatsapp:
            whatsapp.trim(),

          email:
            email.trim() ||
            user.email ||
            "",

          atualizadoEm:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      alert(
        "Currículo cadastrado com sucesso!"
      );

      setMostrarFormulario(false);

      // Limpa campos de upload
      setArquivoCurriculo(null);
      setPreviewCurriculo("");
      setImagemCurriculoUrl("");

      await carregarCurriculos();
    } catch (error) {
      console.error(
        "Erro ao salvar currículo:",
        error
      );

      alert(
        "Não foi possível salvar o currículo."
      );
    } finally {
      setSalvando(false);
    }
  };

  // ================================
  // VER CONTATO
  // ================================
  const verContato = async (
    id: string
  ) => {
    if (!user) {
      alert(
        "Entre ou cadastre-se para visualizar o contato."
      );
      return;
    }

    try {
      const referencia = doc(
        db,
        "curriculos",
        id,
        "privado",
        "contato"
      );

      const contatoSnap = await getDoc(
        referencia
      );

      if (!contatoSnap.exists()) {
        alert(
          "Este candidato não cadastrou informações de contato."
        );
        return;
      }

      setContatos((anterior) => ({
        ...anterior,
        [id]:
          contatoSnap.data() as ContatoCurriculo,
      }));
    } catch (error) {
      console.error(
        "Erro ao buscar contato:",
        error
      );

      alert(
        "Não foi possível consultar o contato."
      );
    }
  };

  return (
    <div className="space-y-5">

      {/* ================================
          CABEÇALHO
      ================================= */}
      <div className="rounded-2xl bg-slate-900 p-5 text-white">
        <h2 className="text-lg font-bold">
          📄 Currículos
        </h2>

        <p className="mt-1 text-sm text-slate-300">
          Cadastre seu currículo e fique disponível
          para novas oportunidades em Rio Claro.
        </p>

        <button
          onClick={() =>
            setMostrarFormulario(true)
          }
          className="mt-4 rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400"
        >
          + Cadastrar meu currículo
        </button>
      </div>

      {/* ================================
          FORMULÁRIO
      ================================= */}
      {mostrarFormulario && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <h3 className="mb-4 text-base font-bold text-slate-800">
            📄 Meu Currículo
          </h3>

          {/* ================================
              ARTE DO CURRÍCULO
          ================================= */}
          <div className="mb-5 rounded-2xl border-2 border-dashed border-yellow-400 bg-yellow-50 p-4">

            <p className="text-sm font-bold text-slate-800">
              🖼️ Já possui uma arte do seu currículo?
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Você pode enviar a imagem do currículo
              que já criou.
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              JPG, PNG ou WEBP • Máximo de 10 MB
            </p>

            <label className="mt-3 inline-block cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
              📤 Enviar imagem do currículo

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const arquivo =
                    e.target.files?.[0] ||
                    null;

                  selecionarImagem(
                    arquivo
                  );
                }}
              />
            </label>

            {previewCurriculo && (
              <div className="mt-4">

                <p className="mb-2 text-xs font-semibold text-slate-600">
                  Pré-visualização:
                </p>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <img
                    src={previewCurriculo}
                    alt="Pré-visualização do currículo"
                    className="max-h-[600px] w-full object-contain"
                  />
                </div>

                <p className="mt-2 text-xs text-green-700">
                  ✅ Imagem selecionada:
                  {" "}
                  {arquivoCurriculo?.name}
                </p>

              </div>
            )}
          </div>

          {/* ================================
              DADOS DO CURRÍCULO
          ================================= */}
          <div className="grid gap-3">

            <input
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              placeholder="Nome completo"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <input
              value={profissao}
              onChange={(e) =>
                setProfissao(
                  e.target.value
                )
              }
              placeholder="Profissão / cargo desejado"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <div className="grid gap-3 sm:grid-cols-2">

              <input
                value={cidade}
                onChange={(e) =>
                  setCidade(
                    e.target.value
                  )
                }
                placeholder="Cidade"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />

              <input
                value={bairro}
                onChange={(e) =>
                  setBairro(
                    e.target.value
                  )
                }
                placeholder="Bairro"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />

            </div>

            <textarea
              value={resumo}
              onChange={(e) =>
                setResumo(
                  e.target.value
                )
              }
              placeholder="Apresentação profissional"
              rows={3}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <textarea
              value={experiencia}
              onChange={(e) =>
                setExperiencia(
                  e.target.value
                )
              }
              placeholder="Experiência profissional"
              rows={4}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <input
              value={escolaridade}
              onChange={(e) =>
                setEscolaridade(
                  e.target.value
                )
              }
              placeholder="Escolaridade"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <textarea
              value={habilidades}
              onChange={(e) =>
                setHabilidades(
                  e.target.value
                )
              }
              placeholder="Habilidades e conhecimentos"
              rows={3}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <input
              value={pretensao}
              onChange={(e) =>
                setPretensao(
                  e.target.value
                )
              }
              placeholder="Pretensão salarial"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            <input
              value={disponibilidade}
              onChange={(e) =>
                setDisponibilidade(
                  e.target.value
                )
              }
              placeholder="Disponibilidade (horário, início imediato etc.)"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />

            {/* ================================
                CONTATO
            ================================= */}
            <div className="mt-2 border-t pt-4">

              <p className="mb-3 text-xs font-bold text-slate-600">
                🔒 Dados de contato
              </p>

              <p className="mb-3 text-[11px] text-slate-500">
                Seus dados de contato ficam separados
                e só poderão ser consultados por usuários
                que estiverem logados.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">

                <input
                  value={telefone}
                  onChange={(e) =>
                    setTelefone(
                      e.target.value
                    )
                  }
                  placeholder="Telefone"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />

                <input
                  value={whatsapp}
                  onChange={(e) =>
                    setWhatsapp(
                      e.target.value
                    )
                  }
                  placeholder="WhatsApp"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />

              </div>

              <input
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="E-mail"
                type="email"
                className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />

            </div>

            {/* ================================
                BOTÕES
            ================================= */}
            <div className="flex flex-wrap gap-2 pt-2">

              <button
                onClick={
                  salvarCurriculo
                }
                disabled={
                  salvando ||
                  enviandoImagem
                }
                className="rounded-xl bg-yellow-500 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviandoImagem
                  ? "Enviando imagem..."
                  : salvando
                  ? "Salvando..."
                  : "Salvar currículo"}
              </button>

              <button
                onClick={() => {
                  setMostrarFormulario(
                    false
                  );

                  setArquivoCurriculo(
                    null
                  );

                  setPreviewCurriculo(
                    ""
                  );
                }}
                className="rounded-xl bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
              >
                Cancelar
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ================================
          LISTA DE CURRÍCULOS
      ================================= */}
      <div>

        <h3 className="mb-3 text-sm font-bold text-slate-700">
          Profissionais disponíveis
        </h3>

        {loading ? (
          <p className="py-6 text-center text-xs text-slate-500">
            Carregando currículos...
          </p>
        ) : curriculos.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            Nenhum currículo cadastrado ainda.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">

            {curriculos.map(
              (curriculo) => (
                <div
                  key={curriculo.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >

                  {/* ================================
                      ARTE DO CURRÍCULO
                  ================================= */}
                  {curriculo.imagemCurriculo && (
                    <div className="border-b border-slate-200 bg-slate-50 p-3">

                      <img
                        src={
                          curriculo.imagemCurriculo
                        }
                        alt={`Currículo de ${curriculo.nome}`}
                        className="max-h-[650px] w-full rounded-xl object-contain"
                        loading="lazy"
                      />

                    </div>
                  )}

                  <div className="p-5">

                    <h4 className="text-base font-bold text-slate-900">
                      {curriculo.nome}
                    </h4>

                    <p className="text-sm font-semibold text-yellow-600">
                      {curriculo.profissao}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      📍{" "}
                      {curriculo.bairro
                        ? `${curriculo.bairro}, `
                        : ""}
                      {curriculo.cidade}
                    </p>

                    {curriculo.resumo && (
                      <p className="mt-3 text-sm text-slate-600">
                        {curriculo.resumo}
                      </p>
                    )}

                    {curriculo.experiencia && (
                      <p className="mt-3 text-xs text-slate-600">
                        <strong>
                          Experiência:
                        </strong>{" "}
                        {curriculo.experiencia}
                      </p>
                    )}

                    {curriculo.escolaridade && (
                      <p className="mt-2 text-xs text-slate-600">
                        <strong>
                          Escolaridade:
                        </strong>{" "}
                        {curriculo.escolaridade}
                      </p>
                    )}

                    {curriculo.habilidades && (
                      <p className="mt-2 text-xs text-slate-600">
                        <strong>
                          Habilidades:
                        </strong>{" "}
                        {curriculo.habilidades}
                      </p>
                    )}

                    {curriculo.pretensao && (
                      <p className="mt-2 text-xs text-slate-600">
                        <strong>
                          Pretensão:
                        </strong>{" "}
                        {curriculo.pretensao}
                      </p>
                    )}

                    {curriculo.disponibilidade && (
                      <p className="mt-2 text-xs text-slate-600">
                        <strong>
                          Disponibilidade:
                        </strong>{" "}
                        {curriculo.disponibilidade}
                      </p>
                    )}

                    {/* ================================
                        CONTATO
                    ================================= */}
                    {contatos[
                      curriculo.id
                    ] ? (
                      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs">

                        {contatos[
                          curriculo.id
                        ].telefone && (
                          <p>
                            📞{" "}
                            {
                              contatos[
                                curriculo.id
                              ].telefone
                            }
                          </p>
                        )}

                        {contatos[
                          curriculo.id
                        ].whatsapp && (
                          <p className="mt-1">
                            💬{" "}
                            {
                              contatos[
                                curriculo.id
                              ].whatsapp
                            }
                          </p>
                        )}

                        {contatos[
                          curriculo.id
                        ].email && (
                          <p className="mt-1">
                            ✉️{" "}
                            {
                              contatos[
                                curriculo.id
                              ].email
                            }
                          </p>
                        )}

                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          verContato(
                            curriculo.id
                          )
                        }
                        className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                      >
                        🔒 Ver contato
                      </button>
                    )}

                  </div>
                </div>
              )
            )}

          </div>
        )}

      </div>
    </div>
  );
}