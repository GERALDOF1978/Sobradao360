import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function validarMaster(request: Request) {
  const autorizacao = request.headers.get("authorization") || "";
  if (!autorizacao.startsWith("Bearer ")) throw new Error("AUTH");
  const decoded = await adminAuth.verifyIdToken(autorizacao.slice(7).trim());
  const usuario = await adminDb.collection("usuarios").doc(decoded.uid).get();
  if (!usuario.exists || usuario.data()?.perfil !== "master") throw new Error("MASTER");
  return decoded;
}

export async function GET(request: Request) {
  try {
    await validarMaster(request);
    const snapshot = await adminDb.collection("solicitacoes_telefones").orderBy("createdAt", "desc").get();
    const itens = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, itens });
  } catch (error) {
    const codigo = error instanceof Error ? error.message : "";
    const status = codigo === "AUTH" ? 401 : codigo === "MASTER" ? 403 : 500;
    console.error("Erro ao listar solicitações de telefones:", error);
    return NextResponse.json({ success: false, error: status === 403 ? "Acesso permitido somente ao Master." : status === 401 ? "Autenticação necessária." : "Não foi possível carregar as solicitações." }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    await validarMaster(request);
    const { id, acao } = await request.json();
    if (!id || !["aprovar", "recusar"].includes(acao)) {
      return NextResponse.json({ success: false, error: "Solicitação inválida." }, { status: 400 });
    }

    const ref = adminDb.collection("solicitacoes_telefones").doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: "Solicitação não encontrada." }, { status: 404 });
    const item = snap.data() || {};

    if (acao === "aprovar") {
      if (!item.telefone || !item.nome || !item.servico) {
        return NextResponse.json({ success: false, error: "Cadastro incompleto." }, { status: 400 });
      }
      const telefoneRef = adminDb.collection("telefones").doc();
      const batch = adminDb.batch();
      batch.set(telefoneRef, {
        nome: item.nome,
        servico: item.servico,
        titulo: item.nome,
        categoria: item.categoria || "Serviços",
        telefone: item.telefone,
        whatsapp: item.whatsapp === true,
        isWhatsapp: item.whatsapp === true,
        bairro: item.bairro || "",
        descricao: item.descricao || "",
        instagram: item.instagram || "",
        site: item.site || "",
        autorUid: item.autorUid || "",
        status: "APROVADO",
        origem: "comunidade",
        icone: "📞",
        horario: "—",
        createdAt: FieldValue.serverTimestamp(),
      });
      batch.update(ref, { status: "APROVADO", aprovadoEm: FieldValue.serverTimestamp() });
      await batch.commit();
    } else {
      await ref.update({ status: "RECUSADO", recusadoEm: FieldValue.serverTimestamp() });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const codigo = error instanceof Error ? error.message : "";
    const status = codigo === "AUTH" ? 401 : codigo === "MASTER" ? 403 : 500;
    console.error("Erro ao processar solicitação de telefone:", error);
    return NextResponse.json({ success: false, error: status === 403 ? "Acesso permitido somente ao Master." : status === 401 ? "Autenticação necessária." : "Não foi possível processar a solicitação." }, { status });
  }
}
