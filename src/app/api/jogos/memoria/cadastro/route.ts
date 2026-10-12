import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function erro(mensagem: string, status = 400) {
  return NextResponse.json({ erro: mensagem }, { status });
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return erro("Faça login com Google.", 401);
    const { adminAuth, adminDb } = await import("@/lib/firebase-admin");
    const usuario = await adminAuth.verifyIdToken(token);
    const snap = await adminDb.collection("jogadores_memoria360").doc(usuario.uid).get();
    return NextResponse.json({ cadastro: snap.exists ? { nome: snap.get("nome"), celular: snap.get("celular") } : null });
  } catch { return erro("Não foi possível consultar o cadastro.", 401); }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return erro("Faça login com Google.", 401);
    const { adminAuth, adminDb } = await import("@/lib/firebase-admin");
    const usuario = await adminAuth.verifyIdToken(token);
    const provider = usuario.firebase?.sign_in_provider;
    if (provider !== "google.com") return erro("Entre com uma conta Google para participar.", 403);
    const dados = await request.json();
    const nome = String(dados.nome || "").trim().replace(/\s+/g, " ");
    const celular = String(dados.celular || "").replace(/\D/g, "");
    if (nome.length < 5 || nome.length > 100 || nome.split(" ").length < 2) return erro("Informe seu nome completo.");
    if (!/^55[1-9]\d9\d{8}$/.test(celular)) return erro("Informe um celular brasileiro válido com DDD e código 55.");
    const jogadorRef = adminDb.collection("jogadores_memoria360").doc(usuario.uid);
    const hash = createHash("sha256").update(celular).digest("hex");
    const numeroRef = adminDb.collection("celulares_memoria360").doc(hash);
    await adminDb.runTransaction(async tx => {
      const [jogador, numero] = await Promise.all([tx.get(jogadorRef), tx.get(numeroRef)]);
      if (jogador.exists) throw new Error("CADASTRO_EXISTENTE");
      if (numero.exists) throw new Error("CELULAR_EM_USO");
      tx.create(numeroRef, { uid: usuario.uid, criadoEm: new Date() });
      tx.create(jogadorRef, { uid: usuario.uid, nome, celular, email: usuario.email || "", criadoEm: new Date() });
    });
    return NextResponse.json({ cadastro: { nome, celular } });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "";
    if (mensagem === "CELULAR_EM_USO") return erro("Este celular já está vinculado a outra conta.", 409);
    if (mensagem === "CADASTRO_EXISTENTE") return erro("Você já possui um cadastro. Solicite alterações ao Master.", 409);
    return erro("Não foi possível salvar o cadastro. Tente novamente.", 500);
  }
}
