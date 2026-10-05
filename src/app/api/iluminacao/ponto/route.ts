import { NextRequest, NextResponse } from "next/server";

const BASE="https://ip.somasig.com.br/api/ocorrencia-municipe/rioclaro/ponto-iluminacao/codigo";

export async function GET(req:NextRequest){
  const codigo=(req.nextUrl.searchParams.get("codigo")||"").trim().replace(/[^0-9]/g,"");
  if(!codigo || codigo.length>12) return NextResponse.json({sucesso:false,erro:"Informe o código da plaqueta."},{status:400});
  try{
    const r=await fetch(`${BASE}/${encodeURIComponent(codigo)}`,{headers:{Accept:"application/json"},cache:"no-store"});
    const d=await r.json().catch(()=>null);
    if(!r.ok || d?.status!=="success") return NextResponse.json({sucesso:false,erro:"Ponto de iluminação não encontrado."},{status:404});
    return NextResponse.json(d,{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    console.error("Erro ao buscar ponto por código:",e);
    return NextResponse.json({sucesso:false,erro:"Não foi possível consultar a plaqueta agora."},{status:502});
  }
}