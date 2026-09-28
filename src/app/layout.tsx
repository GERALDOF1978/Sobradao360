// src/app/layout.tsx

import { AuthProvider } from "@/context/AuthContext";
import Cabecalho from "@/components/Cabecalho";
import "./globals.css";

export const metadata = {
  title: "Sobradão 360",
  description: "Portal Comunitário do Sobradão",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-100 text-slate-900 antialiased font-sans">
        <AuthProvider>
          <Cabecalho />

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}