"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type Posicoes = {
  marquee: boolean;
  publicidade: boolean;
  destaques: boolean;
  parceiros: boolean;
};

type Pacote = {
  id: string;
  nome: string;
  valor: number;
  duracaoDias: number;
  exibicaoPadrao: Posicoes;
  ativo: boolean;
};

type Contrato = {
  id: string;
  lojaId: string;
  pacoteId?: string;
  pacoteNome: string;
  valorContratado: number;
  duracaoDias: number;
  inicio?: unknown;
  vencimento?: unknown;
  status: "ativo" | "expirado" | "cancelado";
  exibicao: Posicoes;
};

type Loja = {
  id: string;
  nome?: string;
  titulo?: string;
};

const DURACOES = [
  7, 15, 30, 45, 60,
  90, 120, 180, 240, 360,
];

const POSICOES: Array<{
  chave: keyof Posicoes;
  nome: string;
}> = [
  { chave: "marquee", nome: "Marquee" },
  { chave: "publicidade", nome: "Publicidade" },
  { chave: "destaques", nome: "Destaques" },
  { chave: "parceiros", nome: "Parceiros" },
];

const VAZIO: Posicoes = {
  marquee: false,
  publicidade: false,
  destaques: false,
  parceiros: false,
};

function dinheiro(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataInput(valor: unknown) {
  try {
    if (
      valor &&
      typeof valor === "object" &&
      "toDate" in valor
    ) {
      return (
        valor as { toDate: () => Date }
      )
        .toDate()
        .toISOString()
        .slice(0, 10);
    }

    if (valor instanceof Date) {
      return valor.toISOString().slice(0, 10);
    }
  } catch {}

  return "";
}

function dataTexto(valor: unknown) {
  const data = dataInput(valor);

  if (!data) return "-";

  return new Date(`${data}T00:00:00`)
    .toLocaleDateString("pt-BR");
}

function calcularVencimento(
  inicio: string,
  dias: number
) {
  const data = new Date(`${inicio}T00:00:00`);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  data.setDate(data.getDate() + dias);

  return data;
}

export default function ContratosAnuncio({
  lojas,
}: {
  lojas: Loja[];
}) {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [contratos, setContratos] =
    useState<Contrato[]>([]);

  const [lojaId, setLojaId] = useState("");
  const [pacoteEditando, setPacoteEditando] =
    useState<string | null>(null);
  const [contratoEditando, setContratoEditando] =
    useState<string | null>(null);

  const [salvando, setSalvando] = useState(false);

  const [pacote, setPacote] = useState({
    nome: "",
    valor: "",
    duracaoDias: 30,
    ativo: true,
    exibicaoPadrao: { ...VAZIO },
  });

  const [contrato, setContrato] = useState({
    pacoteId: "",
    valor: "",
    duracaoDias: 30,
    inicio: new Date()
      .toISOString()
      .slice(0, 10),
    status: "ativo" as
      | "ativo"
      | "expirado"
      | "cancelado",
    exibicao: { ...VAZIO },
  });

  async function carregar() {
    const [
      pacotesSnapshot,
      contratosSnapshot,
    ] = await Promise.all([
      getDocs(
        collection(db, "pacotes_anuncio")
      ),
      getDocs(
        collection(db, "contratos_anuncio")
      ),
    ]);

    setPacotes(
      pacotesSnapshot.docs.map((item) => {
        const d = item.data();

        return {
          id: item.id,
          nome: String(d.nome || ""),
          valor: Number(d.valor || 0),
          duracaoDias: Number(
            d.duracaoDias || 30
          ),
          ativo: d.ativo !== false,
          exibicaoPadrao: {
            marquee: Boolean(
              d.exibicaoPadrao?.marquee
            ),
            publicidade: Boolean(
              d.exibicaoPadrao?.publicidade
            ),
            destaques: Boolean(
              d.exibicaoPadrao?.destaques
            ),
            parceiros: Boolean(
              d.exibicaoPadrao?.parceiros
            ),
          },
        };
      })
    );

    setContratos(
      contratosSnapshot.docs.map((item) => {
        const d = item.data();

        return {
          id: item.id,
          lojaId: String(d.lojaId || ""),
          pacoteId: d.pacoteId || "",
          pacoteNome: String(
            d.pacoteNome || ""
          ),
          valorContratado: Number(
            d.valorContratado || 0
          ),
          duracaoDias: Number(
            d.duracaoDias || 0
          ),
          inicio: d.inicio,
          vencimento: d.vencimento,
          status:
            d.status || "ativo",
          exibicao: {
            marquee: Boolean(
              d.exibicao?.marquee
            ),
            publicidade: Boolean(
              d.exibicao?.publicidade
            ),
            destaques: Boolean(
              d.exibicao?.destaques
            ),
            parceiros: Boolean(
              d.exibicao?.parceiros
            ),
          },
        };
      })
    );
  }

  useEffect(() => {
    void carregar();
  }, []);

  const contratosLoja = useMemo(
    () =>
      contratos
        .filter(
          (item) => item.lojaId === lojaId
        )
        .sort((a, b) =>
          dataInput(b.inicio).localeCompare(
            dataInput(a.inicio)
          )
        ),
    [contratos, lojaId]
  );

  function selecionarPacote(id: string) {
    const item = pacotes.find(
      (p) => p.id === id
    );

    if (!item) {
      setContrato((c) => ({
        ...c,
        pacoteId: "",
      }));
      return;
    }

    setContrato((c) => ({
      ...c,
      pacoteId: item.id,
      valor: String(item.valor),
      duracaoDias: item.duracaoDias,

      // O pacote marca automaticamente.
      exibicao: {
        ...item.exibicaoPadrao,
      },
    }));
  }

  async function salvarPacote() {
    const nome = pacote.nome.trim();
    const valor = Number(pacote.valor);

    if (!nome) {
      alert("Informe o nome do pacote.");
      return;
    }

    if (!Number.isFinite(valor)) {
      alert("Informe um valor válido.");
      return;
    }

    setSalvando(true);

    try {
      const dados = {
        nome,
        valor,
        duracaoDias: pacote.duracaoDias,
        ativo: pacote.ativo,
        exibicaoPadrao:
          pacote.exibicaoPadrao,
        updatedAt: serverTimestamp(),
      };

      if (pacoteEditando) {
        await updateDoc(
          doc(
            db,
            "pacotes_anuncio",
            pacoteEditando
          ),
          dados
        );
      } else {
        await addDoc(
          collection(
            db,
            "pacotes_anuncio"
          ),
          {
            ...dados,
            createdAt: serverTimestamp(),
          }
        );
      }

      setPacoteEditando(null);

      setPacote({
        nome: "",
        valor: "",
        duracaoDias: 30,
        ativo: true,
        exibicaoPadrao: {
          ...VAZIO,
        },
      });

      await carregar();
    } catch (error) {
      console.error(error);
      alert(
        "Erro ao salvar pacote."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirPacote(id: string) {
    if (
      !confirm(
        "Excluir este pacote? Os contratos antigos continuarão registrados."
      )
    ) {
      return;
    }

    await deleteDoc(
      doc(db, "pacotes_anuncio", id)
    );

    await carregar();
  }

  function editarPacote(item: Pacote) {
    setPacoteEditando(item.id);

    setPacote({
      nome: item.nome,
      valor: String(item.valor),
      duracaoDias: item.duracaoDias,
      ativo: item.ativo,
      exibicaoPadrao: {
        ...item.exibicaoPadrao,
      },
    });
  }

  async function salvarContrato() {
    if (!lojaId) {
      alert("Selecione o anunciante.");
      return;
    }

    const valor = Number(
      contrato.valor
    );

    if (!Number.isFinite(valor)) {
      alert("Informe o valor.");
      return;
    }

    const inicio = new Date(
      `${contrato.inicio}T00:00:00`
    );

    const vencimento =
      calcularVencimento(
        contrato.inicio,
        contrato.duracaoDias
      );

    if (
      Number.isNaN(inicio.getTime()) ||
      !vencimento
    ) {
      alert("Data inválida.");
      return;
    }

    const pacoteSelecionado =
      pacotes.find(
        (p) =>
          p.id === contrato.pacoteId
      );

    setSalvando(true);

    try {
      const dados = {
        lojaId,

        pacoteId:
          pacoteSelecionado?.id ||
          contrato.pacoteId ||
          null,

        pacoteNome:
          pacoteSelecionado?.nome ||
          "Contrato manual",

        valorContratado: valor,

        duracaoDias:
          contrato.duracaoDias,

        inicio:
          Timestamp.fromDate(inicio),

        vencimento:
          Timestamp.fromDate(vencimento),

        status: contrato.status,

        // ESTA é a configuração final.
        // O Master pode alterar
        // independentemente do pacote.
        exibicao: {
          ...contrato.exibicao,
        },

        updatedAt:
          serverTimestamp(),
      };

      if (contratoEditando) {
        await updateDoc(
          doc(
            db,
            "contratos_anuncio",
            contratoEditando
          ),
          dados
        );
      } else {
        await addDoc(
          collection(
            db,
            "contratos_anuncio"
          ),
          {
            ...dados,
            createdAt:
              serverTimestamp(),
          }
        );
      }

      setContratoEditando(null);

      await carregar();

      alert(
        "Contrato salvo com sucesso."
      );
    } catch (error) {
      console.error(error);
      alert(
        "Erro ao salvar contrato."
      );
    } finally {
      setSalvando(false);
    }
  }

  function editarContrato(item: Contrato) {
    setContratoEditando(item.id);

    setContrato({
      pacoteId:
        item.pacoteId || "",
      valor:
        String(item.valorContratado),
      duracaoDias:
        item.duracaoDias,
      inicio:
        dataInput(item.inicio) ||
        new Date()
          .toISOString()
          .slice(0, 10),
      status: item.status,
      exibicao: {
        ...item.exibicao,
      },
    });
  }

  return (
    <section className="mb-8 space-y-6">

      {/* ============================= */}
      {/* PACOTES */}
      {/* ============================= */}

      <div className="rounded-2xl bg-white p-6 shadow-sm">

        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Pacotes de publicidade
          </h2>

          <p className="text-sm text-slate-500">
            O Master controla os valores,
            duração e posições padrão.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          <div className="rounded-xl bg-slate-50 p-5">

            <h3 className="mb-4 font-bold">
              {pacoteEditando
                ? "Editar pacote"
                : "Novo pacote"}
            </h3>

            <div className="space-y-3">

              <input
                value={pacote.nome}
                onChange={(e) =>
                  setPacote({
                    ...pacote,
                    nome: e.target.value,
                  })
                }
                placeholder="Nome do pacote"
                className="w-full rounded-xl border p-3"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                value={pacote.valor}
                onChange={(e) =>
                  setPacote({
                    ...pacote,
                    valor: e.target.value,
                  })
                }
                placeholder="Valor"
                className="w-full rounded-xl border p-3"
              />

              <select
                value={pacote.duracaoDias}
                onChange={(e) =>
                  setPacote({
                    ...pacote,
                    duracaoDias:
                      Number(
                        e.target.value
                      ),
                  })
                }
                className="w-full rounded-xl border bg-white p-3"
              >
                {DURACOES.map(
                  (dias) => (
                    <option
                      key={dias}
                      value={dias}
                    >
                      {dias} dias
                    </option>
                  )
                )}
              </select>

              <div>
                <div className="mb-2 font-bold">
                  Posições padrão
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {POSICOES.map(
                    (posicao) => (
                      <label
                        key={
                          posicao.chave
                        }
                        className="flex gap-2 rounded-xl bg-white p-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={
                            pacote
                              .exibicaoPadrao[
                              posicao.chave
                            ]
                          }
                          onChange={(e) =>
                            setPacote({
                              ...pacote,
                              exibicaoPadrao:
                                {
                                  ...pacote.exibicaoPadrao,
                                  [posicao.chave]:
                                    e.target
                                      .checked,
                                },
                            })
                          }
                        />

                        {posicao.nome}
                      </label>
                    )
                  )}
                </div>
              </div>

              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={pacote.ativo}
                  onChange={(e) =>
                    setPacote({
                      ...pacote,
                      ativo:
                        e.target.checked,
                    })
                  }
                />

                Pacote ativo
              </label>

              <button
                type="button"
                disabled={salvando}
                onClick={() =>
                  void salvarPacote()
                }
                className="w-full rounded-xl bg-slate-900 p-3 font-bold text-white"
              >
                {salvando
                  ? "Salvando..."
                  : pacoteEditando
                  ? "Salvar pacote"
                  : "Criar pacote"}
              </button>

            </div>
          </div>

          <div>

            <h3 className="mb-3 font-bold">
              Pacotes cadastrados
            </h3>

            <div className="space-y-3">

              {pacotes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border p-4"
                >

                  <div className="flex justify-between gap-3">

                    <div>
                      <strong>
                        {item.nome}
                      </strong>

                      <div className="text-sm text-slate-500">
                        {dinheiro(
                          item.valor
                        )}{" "}
                        ·{" "}
                        {item.duracaoDias} dias
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {POSICOES
                          .filter(
                            (p) =>
                              item
                                .exibicaoPadrao[
                                p.chave
                              ]
                          )
                          .map((p) => (
                            <span
                              key={
                                p.chave
                              }
                              className="rounded-full bg-amber-100 px-2 py-1 text-xs"
                            >
                              {p.nome}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          editarPacote(
                            item
                          )
                        }
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void excluirPacote(
                            item.id
                          )
                        }
                        className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700"
                      >
                        Excluir
                      </button>
                    </div>

                  </div>

                </div>
              ))}

            </div>
          </div>

        </div>
      </div>

      {/* ============================= */}
      {/* CONTRATO */}
      {/* ============================= */}

      <div className="rounded-2xl bg-white p-6 shadow-sm">

        <h2 className="text-xl font-bold">
          Contrato do anunciante
        </h2>

        <p className="mb-5 text-sm text-slate-500">
          Ao selecionar o pacote, as
          posições são preenchidas
          automaticamente. O Master pode
          alterar qualquer uma delas.
        </p>

        <select
          value={lojaId}
          onChange={(e) => {
            setLojaId(e.target.value);
            setContratoEditando(null);
          }}
          className="mb-5 w-full rounded-xl border bg-white p-3"
        >
          <option value="">
            Selecione o anunciante
          </option>

          {lojas.map((loja) => (
            <option
              key={loja.id}
              value={loja.id}
            >
              {loja.nome ||
                loja.titulo ||
                "Sem nome"}
            </option>
          ))}
        </select>

        {lojaId && (
          <div className="rounded-xl bg-amber-50 p-5">

            <div className="grid gap-4 md:grid-cols-2">

              <div>
                <label className="mb-1 block text-sm font-bold">
                  Pacote
                </label>

                <select
                  value={
                    contrato.pacoteId
                  }
                  onChange={(e) =>
                    selecionarPacote(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border bg-white p-3"
                >
                  <option value="">
                    Contrato manual
                  </option>

                  {pacotes
                    .filter(
                      (p) =>
                        p.ativo ||
                        p.id ===
                          contrato.pacoteId
                    )
                    .map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                      >
                        {p.nome} —{" "}
                        {dinheiro(
                          p.valor
                        )} —{" "}
                        {p.duracaoDias} dias
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold">
                  Valor contratado
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={contrato.valor}
                  onChange={(e) =>
                    setContrato({
                      ...contrato,
                      valor:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold">
                  Duração
                </label>

                <select
                  value={
                    contrato.duracaoDias
                  }
                  onChange={(e) =>
                    setContrato({
                      ...contrato,
                      duracaoDias:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl border bg-white p-3"
                >
                  {DURACOES.map(
                    (dias) => (
                      <option
                        key={dias}
                        value={dias}
                      >
                        {dias} dias
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold">
                  Início
                </label>

                <input
                  type="date"
                  value={contrato.inicio}
                  onChange={(e) =>
                    setContrato({
                      ...contrato,
                      inicio:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl border p-3"
                />
              </div>

            </div>

            <div className="mt-4 rounded-xl bg-white p-4">
              <strong>
                Vencimento:
              </strong>{" "}
              {calcularVencimento(
                contrato.inicio,
                contrato.duracaoDias
              )?.toLocaleDateString(
                "pt-BR"
              ) || "-"}
            </div>

            {/* MASTER TEM A ÚLTIMA PALAVRA */}
            <div className="mt-5">

              <div className="mb-2 font-bold">
                Exibição final
              </div>

              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">

                {POSICOES.map(
                  (posicao) => (
                    <label
                      key={
                        posicao.chave
                      }
                      className="flex gap-2 rounded-xl bg-white p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={
                          contrato
                            .exibicao[
                            posicao.chave
                          ]
                        }
                        onChange={(e) =>
                          setContrato({
                            ...contrato,
                            exibicao:
                              {
                                ...contrato.exibicao,
                                [posicao.chave]:
                                  e.target
                                    .checked,
                              },
                          })
                        }
                      />

                      {posicao.nome}
                    </label>
                  )
                )}

              </div>
            </div>

            <button
              type="button"
              disabled={salvando}
              onClick={() =>
                void salvarContrato()
              }
              className="mt-5 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white"
            >
              {contratoEditando
                ? "Salvar contrato"
                : "Criar contrato"}
            </button>

          </div>
        )}

        {/* ============================= */}
        {/* HISTÓRICO */}
        {/* ============================= */}

        {lojaId && (
          <div className="mt-7">

            <h3 className="mb-3 font-bold">
              Histórico de contratos
            </h3>

            {contratosLoja.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                Nenhum contrato cadastrado.
              </div>
            ) : (
              <div className="space-y-3">

                {contratosLoja.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border p-4"
                    >

                      <div className="flex justify-between gap-3">

                        <div>
                          <strong>
                            {
                              item.pacoteNome
                            }
                          </strong>

                          <div className="text-sm text-slate-500">
                            {dinheiro(
                              item.valorContratado
                            )}{" "}
                            ·{" "}
                            {item.duracaoDias}{" "}
                            dias
                          </div>

                          <div className="text-sm text-slate-500">
                            {dataTexto(
                              item.inicio
                            )}{" "}
                            até{" "}
                            {dataTexto(
                              item.vencimento
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1">
                            {POSICOES
                              .filter(
                                (p) =>
                                  item
                                    .exibicao[
                                    p.chave
                                  ]
                              )
                              .map((p) => (
                                <span
                                  key={
                                    p.chave
                                  }
                                  className="rounded-full bg-amber-100 px-2 py-1 text-xs"
                                >
                                  {p.nome}
                                </span>
                              ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            editarContrato(
                              item
                            )
                          }
                          className="h-fit rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                        >
                          Editar
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}