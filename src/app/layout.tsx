import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobradão 360',
  description: 'Portal Comunitário com foco em mobile e modo escuro',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}