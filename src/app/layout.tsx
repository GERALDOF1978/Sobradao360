// src/app/layout.tsx
import { AuthProvider } from "@/context/AuthContext";
import './globals.css';


export const metadata = {
  title: 'Sobradão 360',
  description: 'Portal Comunitário',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-gray-100 antialiased font-sans">
        <AuthProvider> {/* Envolvemos toda a app aqui */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}