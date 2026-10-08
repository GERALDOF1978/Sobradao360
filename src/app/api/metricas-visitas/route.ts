import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
const dayBR = () => new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const json = (data: object, status=200) => NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.nextUrl.host && !["https://sobradao360.com.br","https://www.sobradao360.com.br"].includes(origin)) return json({erro:"Origem não permitida"},403);
    const body = await req.json();
    if (typeof body?.sid !== "string" || !/^[a-f0-9]{32}$/.test(body.sid)) return json({erro:"Sessão inválida"},400);
    const sid = createHash("sha256").update(body.sid).digest("hex");
    const ref = adminDb.collection("metricas_sessoes").doc(sid);
    const hoje = dayBR();
    const diario = adminDb.collection("metricas_diarias").doc(hoje);
    const geral = adminDb.collection("metricas_resumo").doc("geral");
    const agora = Date.now();
    await adminDb.runTransaction(async tx => {
      const snap = await tx.get(ref);
      const prev = snap.exists ? snap.data() : undefined;
      const last = prev?.ultimoAcesso?.toMillis?.() || 0;
      if (agora - last < 60000) return;
      const novaVisita = !prev || agora - last > 30*60*1000;
      const data = {ultimoAcesso:Timestamp.fromMillis(agora),dia:hoje,criadoEm:prev?.criadoEm || Timestamp.fromMillis(agora)};
      tx.set(ref,data);
      if(novaVisita) {
        tx.set(diario,{visitas:FieldValue.increment(1)}, {merge:true});
        tx.set(geral,{visitas:FieldValue.increment(1)}, {merge:true});
      }
    });
    return json({ok:true});
  } catch(e) { console.error("Erro métricas",e); return json({erro:"Medição indisponível"},503); }
}

export async function GET(req: NextRequest) {
  try {
    const bearer = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
    if(!bearer) return json({erro:"Acesso restrito"},401);
    const user = await adminAuth.verifyIdToken(bearer);
    const profile = await adminDb.collection("usuarios").doc(user.uid).get();
    if(profile.data()?.perfil !== "master") return json({erro:"Acesso restrito"},403);
    const hoje = dayBR();
    const [diario,geral,ativos] = await Promise.all([
      adminDb.collection("metricas_diarias").doc(hoje).get(),
      adminDb.collection("metricas_resumo").doc("geral").get(),
      adminDb.collection("metricas_sessoes").where("ultimoAcesso",">=",Timestamp.fromMillis(Date.now()-5*60*1000)).count().get()
    ]);
    return json({hoje:diario.data()?.visitas||0,total:geral.data()?.visitas||0,ativos:ativos.data().count,atualizadoEm:new Date().toISOString()});
  } catch(e) {console.error("Erro leitura métricas",e);return json({erro:"Não foi possível carregar as estatísticas"},503);}
}
