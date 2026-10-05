import { NextRequest, NextResponse } from "next/server";

const BASE = "https://ip.somasig.com.br/api/ocorrencia-municipe/protocolo/rioclaro";

export async function GET(req: NextRequest) {
  const protocolo = req.nextUrl.searchParams.get("protocolo")?.replace(/\D/g, "") || "";
  if (!/^\d{9}$/.test(protocolo)) {
    return NextResponse.json({ sucesso:false, erro:"Informe um protocolo válido com 9 números." }, { status:400 });
  }
  try {
    const r = await fetch(`${BASE}/${protocolo}`, { headers:{ Accept:"application/json" }, cache:"no-store" });
    const d = await r.json().catch(() => null);
    if (!r.ok || d?.status !== "success" || !d?.data?.id) {
      return NextResponse.json({ sucesso:false, erro:"Protocolo não encontrado." }, { status:404 });
    }
    const x=d.data, p=x.ponto_iluminacao || {};
    return NextResponse.json({
      sucesso:true,
      protocolo,
      ocorrencia:{
        id:x.id,
        ordemServico:x.id_ordem_servico ?? null,
        situacao:x.situacao ?? "",
        status:x.situacaoStatus?.status ?? "",
        prazo:x.data_ocorrencia_prazo ?? null,
        data:x.data_ocorrencia ?? null,
        observacao:x.observacao_ocorrencia ?? null,
        ponto:{
          id:p.id ?? x.id_ponto_iluminacao ?? null,
          codigo:p.codigo ?? null,
          tipoLogradouro:p.tipo_logradouro ?? "",
          logradouro:p.logradouro ?? "",
          numero:p.numero ?? "",
          bairro:p.bairro ?? "",
          cep:p.cep ?? "",
          luminarias:p.quantidade_luminarias ?? null,
          potencia:p.potencia_total ?? null
        }
      }
    }, { headers:{ "Cache-Control":"no-store" } });
  } catch(e) {
    console.error("Erro ao consultar protocolo SOMASIG:",e);
    return NextResponse.json({ sucesso:false, erro:"Serviço de consulta indisponível no momento." }, { status:502 });
  }
}