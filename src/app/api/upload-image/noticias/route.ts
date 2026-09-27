// src/app/api/upload-image/route.ts
import { NextResponse } from "next/server";
import sharp from "sharp";
import FormData from "form-data";
import axios from "axios";

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

export async function POST(request: Request) {
  try {
    if (!IMGBB_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "IMGBB_API_KEY não configurada no servidor.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "Nenhum arquivo enviado.",
        },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          success: false,
          error: "O arquivo enviado não é uma imagem válida.",
        },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "A imagem deve ter no máximo 10 MB.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Corrige a orientação das fotos de celular,
    // reduz imagens muito grandes sem aumentar imagens pequenas
    // e converte para WebP com boa qualidade.
    const compressedBuffer = await sharp(buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 85,
        lossless: false,
        effort: 4,
      })
      .toBuffer();

    const imgbbFormData = new FormData();

    imgbbFormData.append(
      "key",
      IMGBB_API_KEY
    );

    imgbbFormData.append(
      "image",
      compressedBuffer.toString("base64")
    );

    const nomeOriginal =
      file.name
        .split(".")
        .slice(0, -1)
        .join(".") || "imagem";

    imgbbFormData.append(
      "name",
      `${nomeOriginal}.webp`
    );

    const response = await axios.post(
      "https://api.imgbb.com/1/upload",
      imgbbFormData,
      {
        headers: imgbbFormData.getHeaders(),
      }
    );

    const imageUrl =
      response.data?.data?.url;

    const imageDeleteUrl =
      response.data?.data?.delete_url;

    const imageName =
      response.data?.data?.title;

    const imageSize =
      response.data?.data?.size;

    if (!imageUrl) {
      throw new Error(
        "ImgBB não retornou a URL da imagem."
      );
    }

    console.log(
      `✅ Imagem enviada: ${imageName} | ` +
        `${buffer.length} bytes -> ` +
        `${compressedBuffer.length} bytes`
    );

    return NextResponse.json({
      success: true,
      url: imageUrl,
      deleteUrl: imageDeleteUrl || null,
      name: imageName || nomeOriginal,
      sizeKb: imageSize
        ? Math.round(imageSize / 1024)
        : Math.round(compressedBuffer.length / 1024),
    });
  } catch (error: any) {
    console.error(
      "❌ Erro ao processar/enviar imagem:",
      error?.message || error
    );

    const mensagem =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Ocorreu um erro interno ao processar a imagem.";

    return NextResponse.json(
      {
        success: false,
        error: `Erro ao enviar imagem: ${mensagem}`,
      },
      { status: 500 }
    );
  }
}