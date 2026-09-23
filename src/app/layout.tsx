import "./globals.css";

export const metadata = {
  title: "Sobradão 360",
  description: "Portal Comunitário dos Bairros",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}