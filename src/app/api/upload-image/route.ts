import { NextResponse } from 'next/server';
import sharp from 'sharp';
import FormData from 'form-data';
import axios from 'axios';

// Obtém a chave da API a partir da variável de ambiente configurada na Vercel
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

export async function POST(request: Request) {
  try {
    // 0. Validação de segurança: garante que a chave foi configurada no ambiente
    if (!IMGBB_API_KEY) {
      return NextResponse.json(
        { error: 'A variável de ambiente IMGBB_API_KEY não foi configurada no servidor.' },
        { status: 500 }
      );
    }

    // 1. Receber os dados do formulário
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // Validar se o arquivo enviado é realmente uma imagem
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'O arquivo enviado não é uma imagem válida.' }, { status: 400 });
    }

    // 2. Converter o arquivo recebido para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Compactar e converter para formato WebP otimizado via Sharp
    const compressedBuffer = await sharp(buffer)
      .webp({ quality: 80, lossless: false, effort: 4 })
      .toBuffer();

    // 4. Montar o formulário para envio ao servidor ImgBB
    const imgbbFormData = new FormData();
    imgbbFormData.append('key', IMGBB_API_KEY);
    imgbbFormData.append('image', compressedBuffer.toString('base64'));
    imgbbFormData.append('name', file.name.split('.').slice(0, -1).join('.') + '.webp');

    // 5. Realizar a requisição HTTP POST para a API do ImgBB
    const response = await axios.post('https://api.imgbb.com/1/upload', imgbbFormData, {
      headers: {
        ...imgbbFormData.getHeaders(),
      },
    });

    // 6. Tratar e retornar os dados da imagem carregada
    const imageUrl = response.data.data.url;
    const imageDeleteUrl = response.data.data.delete_url;
    const imageName = response.data.data.title;
    const imageSize = response.data.data.size;

    console.log(`✅ Imagem otimizada enviada: ${imageName} | Original: ${buffer.length} B -> WebP: ${imageSize} B`);

    return NextResponse.json({
      success: true,
      url: imageUrl,
      deleteUrl: imageDeleteUrl,
      name: imageName,
      sizeKb: Math.round(imageSize / 1024),
    });

  } catch (error: any) {
    console.error('❌ Erro ao processar/enviar imagem:', error.message);

    if (error.response && error.response.data) {
      return NextResponse.json(
        { error: `Erro do ImgBB: ${error.response.data.error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Ocorreu um erro interno ao processar a imagem.' },
      { status: 500 }
    );
  }
}