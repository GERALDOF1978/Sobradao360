// src/app/layout.tsx

import { AuthProvider } from "@/context/AuthContext";
import Cabecalho from "@/components/Cabecalho";
import Rodape from "@/components/Rodape";
import PwaRegistrar from "@/components/PwaRegistrar";
import "./globals.css";

export const metadata = {
  title: "Sobradão 360",
  description: "Portal Comunitário da Região do Sobradão",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Sobradão 360",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="bg-slate-100 text-slate-900 antialiased font-sans">
        <AuthProvider>
          <PwaRegistrar />
          <Cabecalho />

          {children}
          <Rodape />
        </AuthProvider>
      </body>
    </html>
  );
}