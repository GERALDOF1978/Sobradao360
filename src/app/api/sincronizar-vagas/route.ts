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
      console.log(
        `Buscando página ${pagina}/${totalPaginas}...`
      );

      // Criamos os parâmetros sem repetir "status"
      const params = new URLSearchParams({
        smart_filter: "false",
        q: "",
        type: "vacancy",
        order_by: "latest",
        page: String(pagina),
        page_limit: String(PAGE_LIMIT),
        locale: "Rio Claro",
        operation_range: "25",
      });

      // O Trampolim recebe os dois status
      params.append("status", "available");
      params.append("status", "extended");

      const response = await fetch(
        `${TRAMPOLIM_API}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "Sobradao360/1.0",
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
       * PROCESSA CADA VAGA
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
           * 12345
           *
           * Documento:
           * trampolim_12345
           */
          const idTrampolim = String(vaga.id);

          const documentoId = `trampolim_${idTrampolim}`;

          const referencia = adminDb
            .collection(COLECAO)
            .doc(documentoId);

          const existente = await referencia.get();

          /*
           * DADOS DA VAGA
           */
          const dados = {
            ...vaga,

            idTrampolim,

            fonte: "trampolim",

            cidadeBusca: "Rio Claro",

            raioBusca: 25,

            ativo: true,

            atualizadoEm:
              FieldValue.serverTimestamp(),
          };

          /*
           * VAGA JÁ EXISTE
           */
          if (existente.exists) {
            await referencia.set(dados, {
              merge: true,
            });

            atualizadas++;

            console.log(
              `Vaga atualizada: ${idTrampolim}`
            );
          }

          /*
           * VAGA NOVA
           */
          else {
            await referencia.set({
              ...dados,

              criadoEm:
                FieldValue.serverTimestamp(),
            });

            novas++;

            console.log(
              `Nova vaga: ${idTrampolim}`
            );
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

      mensagem:
        "Sincronização das vagas concluída.",

      fonte: "Trampolim",

      cidade: "Rio Claro",

      raioKm: 25,

      paginasConsultadas:
        totalPaginas,

      totalProcessadas,

      novas,

      atualizadas,

      ignoradas,

      tempoMs,

      sincronizadoEm:
        new Date().toISOString(),
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

        paginasConsultadas:
          pagina - 1,

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