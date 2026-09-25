import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

const TRAMPOLIM_API =
  "https://www.trampolim.sp.gov.br/api/v1/vacancy-allowany/search/";

const COLECAO = "vagas";

const PAGE_LIMIT = 50;

export async function GET() {
  const inicio = Date.now();

  let pagina = 1;
  let totalPaginas = 1;

  let totalProcessadas = 0;
  let novas = 0;
  let atualizadas = 0;
  let ignoradas = 0;

  try {
    console.log("======================================");
    console.log("INICIANDO SINCRONIZAÇÃO TRAMPOLIM");
    console.log("======================================");

    do {
      console.log(`Buscando página ${pagina}/${totalPaginas}...`);

      const params = new URLSearchParams({
        smart_filter: "false",
        q: "",
        type: "vacancy",
        order_by: "latest",

        page: String(pagina),
        page_limit: String(PAGE_LIMIT),

        status: "available",
        status: "extended",

        locale: "Rio Claro",
        operation_range: "25",
      });

      const response = await fetch(
        `${TRAMPOLIM_API}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "Sobradão360/1.0",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Trampolim retornou HTTP ${response.status}`
        );
      }

      const resultado = await response.json();

      const vagas = Array.isArray(resultado.data)
        ? resultado.data
        : [];

      totalPaginas = Number(resultado.pages ?? 1);

      console.log(
        `Página ${pagina}: ${vagas.length} vagas encontradas`
      );

      /*
       * Processa cada vaga
       */
      for (const vaga of vagas) {
        try {
          if (!vaga?.id) {
            ignoradas++;
            continue;
          }

          /*
           * ID ORIGINAL DO TRAMPOLIM
           *
           * Exemplo:
           * trampolim_12345
           *
           * Dessa maneira, a mesma vaga nunca
           * será criada novamente.
           */
          const idTrampolim = String(vaga.id);

          const documentoId = `trampolim_${idTrampolim}`;

          const referencia = adminDb
            .collection(COLECAO)
            .doc(documentoId);

          const existente = await referencia.get();

          /*
           * Dados que serão armazenados
           */
          const dados = {
            ...vaga,

            // Controle da integração
            idTrampolim,
            fonte: "trampolim",

            // Parâmetros usados na pesquisa
            cidadeBusca: "Rio Claro",
            raioBusca: 25,

            // Status no Sobradão 360
            ativo: true,

            // Controle de sincronização
            atualizadoEm: FieldValue.serverTimestamp(),
          };

          if (existente.exists) {
            /*
             * VAGA JÁ EXISTE
             *
             * Atualiza sem apagar outros campos
             * que eventualmente existam no documento.
             */
            await referencia.set(dados, {
              merge: true,
            });

            atualizadas++;
          } else {
            /*
             * VAGA NOVA
             */
            await referencia.set({
              ...dados,

              criadoEm: FieldValue.serverTimestamp(),
            });

            novas++;
          }

          totalProcessadas++;
        } catch (erroVaga) {
          console.error(
            "Erro ao processar vaga:",
            erroVaga
          );

          ignoradas++;
        }
      }

      pagina++;
    } while (pagina <= totalPaginas);

    const tempoMs = Date.now() - inicio;

    console.log("======================================");
    console.log("SINCRONIZAÇÃO CONCLUÍDA");
    console.log("======================================");

    console.log({
      totalProcessadas,
      novas,
      atualizadas,
      ignoradas,
      paginasConsultadas: totalPaginas,
      tempoMs,
    });

    return NextResponse.json({
      success: true,

      mensagem: "Sincronização das vagas concluída.",

      fonte: "Trampolim",

      cidade: "Rio Claro",

      raioKm: 25,

      paginasConsultadas: totalPaginas,

      totalProcessadas,

      novas,

      atualizadas,

      ignoradas,

      tempoMs,

      sincronizadoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "ERRO GERAL NA SINCRONIZAÇÃO:",
      error
    );

    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido";

    return NextResponse.json(
      {
        success: false,

        mensagem:
          "Não foi possível sincronizar as vagas do Trampolim.",

        erro: mensagem,

        paginasConsultadas: pagina - 1,

        totalProcessadas,

        novas,

        atualizadas,

        ignoradas,
      },
      {
        status: 500,
      }
    );
  }
}