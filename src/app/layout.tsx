// src/app/layout.tsx

import { AuthProvider } from "@/context/AuthContext";
import Cabecalho from "@/components/Cabecalho";
import Rodape from "@/components/Rodape";
import PwaRegistrar from "@/components/PwaRegistrar";
import MenuInferior from "@/components/MenuInferior";
import "./globals.css";

export const metadata = {
  title: "Sobradão 360",
  description: "Portal Comunitário da Região do Sobradão",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "https://i.ibb.co/357pp0LQ/logo-sobradao-webp.webp",
    shortcut: "https://i.ibb.co/357pp0LQ/logo-sobradao-webp.webp",
    apple: "https://i.ibb.co/357pp0LQ/logo-sobradao-webp.webp",
  },
  openGraph: {
    title: "Sobradão 360",
    description: "Tudo da nossa região em um só lugar.",
    images: ["https://i.ibb.co/nM8R8VKy/banner-sobradao-webp.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sobradão 360",
    description: "Tudo da nossa região em um só lugar.",
    images: ["https://i.ibb.co/nM8R8VKy/banner-sobradao-webp.webp"],
  },
  appleWebApp: { capable: true, title: "Sobradão 360", statusBarStyle: "default" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="https://i.ibb.co/357pp0LQ/logo-sobradao-webp.webp" />
        <link rel="apple-touch-icon" href="https://i.ibb.co/357pp0LQ/logo-sobradao-webp.webp" />
      </head>
      <body className="bg-slate-100 text-slate-900 antialiased font-sans pb-[76px] md:pb-0">
        <AuthProvider>
          <PwaRegistrar />
          <Cabecalho />
          {children}
          <Rodape />
          <MenuInferior />
        </AuthProvider>
      </body>
    </html>
  );
}
