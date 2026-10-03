import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function adminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("Firebase Admin não configurado.");
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export async function GET() {
  try {
    const snap = await getFirestore(adminApp()).collection("noticias_importadas").get();
    const noticias = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((item: any) => item.publicadoNoPortal === true && item.status === "APROVADA" && item.arquivada !== true)
      .sort((a: any, b: any) => String(b.dataPublicacao || "").localeCompare(String(a.dataPublicacao || "")));

    const contagemPorFonte = new Map<string, number>();
    const limitadas = noticias.filter((item: any) => {
      const fonte = String(item.fonte || "Sem fonte");
      const atual = contagemPorFonte.get(fonte) || 0;
      if (atual >= 5) return false;
      contagemPorFonte.set(fonte, atual + 1);
      return true;
    });

    const resposta = limitadas
      .map((item: any) => ({
        id: item.id,
        titulo: item.tituloPortal || item.tituloOriginal || "",
        resumo: item.resumoPortal || "",
        fonte: item.fonte || "",
        linkOriginal: item.linkOriginal || "",
        dataPublicacao: item.dataPublicacao || null,
      }));

    return NextResponse.json({ success: true, noticias: resposta });
  } catch (error) {
    console.error("Erro ao listar notícias públicas:", error);
    return NextResponse.json({ success: false, noticias: [] }, { status: 500 });
  }
}
