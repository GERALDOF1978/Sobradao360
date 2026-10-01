import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
const TRAMPOLIM_API = "https://www.trampolim.sp.gov.br/api/v1/vacancy-allowany/search/";
const COLECAO = "vagas";
const PAGE_LIMIT = 50;
async function buscarTodasAsVagas() {
  const todas: any[] = []; let pagina = 1; let totalPaginas = 1;
  do {
    const params = new URLSearchParams({smart_filter:"false",q:"",type:"vacancy",order_by:"latest",page:String(pagina),page_limit:String(PAGE_LIMIT),locale:"Rio Claro",operation_range:"25"});
    params.append("status","available"); params.append("status","extended");
    const response = await fetch(`${TRAMPOLIM_API}?${params.toString()}`,{method:"GET",headers:{Accept:"application/json","User-Agent":"Sobradao360/1.0"},cache:"no-store"});
    const texto = await response.text();
    if (!response.ok) throw new Error(`Trampolim retornou HTTP ${response.status}`);
    if (!texto.trim()) throw new Error("Trampolim retornou uma resposta vazia.");
    let resultado:any; try { resultado=JSON.parse(texto); } catch { throw new Error("Trampolim retornou uma resposta inválida."); }
    if (!resultado || !Array.isArray(resultado.data)) throw new Error("Formato inesperado na resposta do Trampolim.");
    todas.push(...resultado.data); totalPaginas=Math.max(1,Number(resultado.pages??1)||1); pagina++;
  } while(pagina<=totalPaginas);
  return {vagas:todas,paginas:totalPaginas};
}
async function apagarVagasTrampolim() {
  const snapshot=await adminDb.collection(COLECAO).where("fonte","==","trampolim").get();
  for(let i=0;i<snapshot.docs.length;i+=400){const batch=adminDb.batch();snapshot.docs.slice(i,i+400).forEach(item=>batch.delete(item.ref));await batch.commit();}
  return snapshot.docs.length;
}
async function gravarVagas(vagas:any[]) {
  let gravadas=0;
  for(let i=0;i<vagas.length;i+=400){const batch=adminDb.batch();for(const vaga of vagas.slice(i,i+400)){if(!vaga?.id)continue;const idTrampolim=String(vaga.id);const ref=adminDb.collection(COLECAO).doc(`trampolim_${idTrampolim}`);batch.set(ref,{...vaga,idTrampolim,fonte:"trampolim",cidadeBusca:"Rio Claro",raioBusca:25,ativo:true,criadoEm:FieldValue.serverTimestamp(),atualizadoEm:FieldValue.serverTimestamp()});gravadas++;}await batch.commit();}
  return gravadas;
}
async function executarSincronizacao() {
  const inicio=Date.now();
  try {const consulta=await buscarTodasAsVagas();const excluidas=await apagarVagasTrampolim();const importadas=await gravarVagas(consulta.vagas);return NextResponse.json({success:true,mensagem:"Vagas do Trampolim substituídas com sucesso.",fonte:"Trampolim",cidade:"Rio Claro",raioKm:25,paginasConsultadas:consulta.paginas,encontradas:consulta.vagas.length,excluidas,importadas,tempoMs:Date.now()-inicio,sincronizadoEm:new Date().toISOString()});}
  catch(error){console.error("Erro na sincronização do Trampolim:",error);return NextResponse.json({success:false,mensagem:"Não foi possível sincronizar as vagas do Trampolim.",erro:error instanceof Error?error.message:"Erro desconhecido"},{status:500});}
}
export async function GET(){return executarSincronizacao();}
export async function POST(request:Request){try{const autorizacao=request.headers.get("authorization")||"";if(!autorizacao.startsWith("Bearer "))return NextResponse.json({success:false,mensagem:"Autenticação necessária."},{status:401});const decoded=await adminAuth.verifyIdToken(autorizacao.slice(7).trim());const usuarioMaster=await adminDb.collection("usuarios").doc(decoded.uid).get();if(!usuarioMaster.exists||usuarioMaster.data()?.perfil!=="master")return NextResponse.json({success:false,mensagem:"Acesso permitido somente ao Master."},{status:403});return executarSincronizacao();}catch(error){console.error("Erro ao autorizar sincronização manual:",error);return NextResponse.json({success:false,mensagem:"Não foi possível autorizar a sincronização."},{status:401});}}
