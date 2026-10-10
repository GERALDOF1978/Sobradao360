import type { Metadata } from "next";

const url = "https://sobradao360.com.br/utilidades/upas";

export const metadata: Metadata = {
  title: "UPAs Agora | Sobradão 360",
  description:
    "Consulte as filas de atendimento e os médicos de plantão nas UPAs de Rio Claro. Acesse o painel UPAs Agora no Sobradão 360.",
  alternates: { canonical: url },
  openGraph: {
    type: "website",
    url,
    siteName: "Sobradão 360",
    title: "UPAs Agora | Sobradão 360",
    description:
      "Acompanhe as filas e confira os médicos de plantão nas UPAs de Rio Claro.",
    locale: "pt_BR",
    images: [
      {
        url: "/utilidades/upas/opengraph-image",
        width: 1200,
        height: 630,
        alt: "UPAs Agora — Acompanhe as filas e os médicos de plantão no Sobradão 360",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UPAs Agora | Sobradão 360",
    description: "Filas e médicos de plantão nas UPAs de Rio Claro.",
    images: ["/utilidades/upas/opengraph-image"],
  },
};

export default function UpasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
