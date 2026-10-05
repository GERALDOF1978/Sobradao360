import { NextRequest, NextResponse } from "next/server";

const BASE = "https://ip.somasig.com.br/api/ocorrencia-municipe/rioclaro";
const TIPOS = new Set(["Lâmpada apagada","Lâmpada oscilando","Lâmpada acesa durante o dia","Vandalismo","Problema no poste","Outro problema","Pedido de ponto de iluminação","Pedido de melhoria","Setor apagado","Setor aceso durante o dia"]);
const TELEFONES = new Set(["Celular","Residencial","Comercial"]);

function texto(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const tipo = texto(b.tipo, 100);
    const id = Number(b.id_ponto_iluminacao);
    const nome = texto(b.solicitante_nome, 120);
    const telefone = texto(b.solicitante_telefone_celular, 30);
    const tipoTelefone = texto(b.solicitante_tipo_telefone, 30);
    if (!TIPOS.has(tipo) || !Number.isInteger(id) || id <= 0 || !nome || !telefone || !TELEFONES.has(tipoTelefone)) {
      return NextResponse.json({ sucesso:false, erro:"Confira os dados obrigatórios." }, { status:400 });
    }

    const payload = {
      bairro: texto(b.bairro,120) || null,
      cep: texto(b.cep,20) || null,
      complemento: texto(b.complemento,150) || null,
      escolha_registro: "Endereço manual",
      id_ponto_iluminacao: id,
      id_urgencia_ocorrencia: "2",
      latitude: null,
      logradouro: texto(b.logradouro,160),
      longitude: null,
      numero: texto(b.numero,30) || "0",
      observacao_ocorrencia: texto(b.observacao_ocorrencia,1000) || null,
      origem: "Portal do munícipe",
      situacao: "Em aberto",
      solicitante_email: texto(b.solicitante_email,180) || null,
      solicitante_nome: nome,
      solicitante_telefone_celular: telefone,
      solicitante_tipo_telefone: tipoTelefone,
      tipo,
      tipo_logradouro: texto(b.tipo_logradouro,60),
    };

    const criar = await fetch(BASE, { method:"POST", headers:{ "Content-Type":"application/json", Accept:"application/json" }, body:JSON.stringify(payload), cache:"no-store" });
    const criado = await criar.json().catch(() => null);
    const ocorrenciaId = Number(criado?.data?.id);
    if (!criar.ok || criado?.status !== "success" || !Number.isInteger(ocorrenciaId)) {
      return NextResponse.json({ sucesso:false, erro:"O sistema oficial não confirmou o registro." }, { status:502 });
    }

    const consulta = await fetch(`${BASE}/ocorrencia/${ocorrenciaId}`, { headers:{ Accept:"application/json" }, cache:"no-store" });
    const detalhe = await consulta.json().catch(() => null);
    const protocolo = detalhe?.data?.numero_protocolo;
    if (!consulta.ok || detalhe?.status !== "success" || !protocolo) {
      return NextResponse.json({ sucesso:false, erro:"Ocorrência criada, mas o protocolo ainda não foi retornado.", ocorrenciaId }, { status:502 });
    }
    return NextResponse.json({ sucesso:true, protocolo:String(protocolo), ocorrenciaId }, { status:201 });
  } catch (e) {
    console.error("Erro ao registrar ocorrência de iluminação:", e);
    return NextResponse.json({ sucesso:false, erro:"Serviço de iluminação indisponível no momento." }, { status:502 });
  }
}