import { NextResponse } from 'next/server';
import sharp from 'sharp';
import FormData from 'form-data';
import axios from 'axios';

// Sua chave de API do ImgBB fornecida anteriormente
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '00f5e74d2657312c5173d6aa4018c614';

export async function POST(request: Request) {
  try {
    // 1. Receber os dados do formulário
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Validar se é realmente uma imagem (simples)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'O arquivo enviado não é uma imagem válida.' }, { status: 400 });
    }

    // 2. Converter o arquivo para um Buffer para manipulação
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. A MÁGICA DA COMPACTAÇÃO: Usar Sharp para converter para WebP e comprimir
    // Quality 80 é um excelente balanço entre qualidade visual e tamanho reduzido.
    // progressive: true ajuda a carregar mais rápido em conexões lentas.
    const compressedBuffer = await sharp(buffer)
      .webp({ quality: 80, lossless: false, effort: 4 }) 
      .toBuffer();

    // 4. Preparar o envio para o ImgBB
    // O ImgBB requer a imagem em base64 ou como um FormData (multipart/form-data)
    const imgbbFormData = new FormData();
    imgbbFormData.append('key', IMGBB_API_KEY);
    // Adicionar a imagem bufferizada como base64 (método mais robusto via API)
    imgbbFormData.append('image', compressedBuffer.toString('base64'));
    // Opcional: Definir nome do arquivo no ImgBB (substituindo extensão por .webp)
    imgbbFormData.append('name', file.name.split('.').slice(0, -1).join('.') + '.webp');

    // 5. Chamar a API do ImgBB
    const response = await axios.post('https://api.imgbb.com/1/upload', imgbbFormData, {
      headers: {
        ...imgbbFormData.getHeaders(),
      },
    });

    // 6. Retornar o link da imagem otimizada para o seu portal
    const imageUrl = response.data.data.url;
    const imageDeleteUrl = response.data.data.delete_url;
    const imageName = response.data.data.title;
    const imageSize = response.data.data.size; // em bytes

    console.log(`✅ Imagem processada e enviada: ${imageName} | Tamanho original: ${buffer.length} bytes -> Comprimida: ${imageSize} bytes`);

    return NextResponse.json({
      success: true,
      url: imageUrl, // Use este URL no seu src/app/page.tsx
      deleteUrl: imageDeleteUrl,
      name: imageName,
      sizeKb: Math.round(imageSize / 1024),
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar/enviar imagem:', error.message);
    
    // Tratamento de erros específico da API do ImgBB
    if (error.response && error.response.data) {
       return NextResponse.json({ error: `Erro do ImgBB: ${error.response.data.error.message}` }, { status: 500 });
    }

    return NextResponse.json({ error: 'Ocorreu um erro interno ao processar a imagem.' }, { status: 500 });
  }
}