import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://farmacia-essencial.raul202691.chatgpt.site"),
  title: {
    default: "Farmácia Poupe Mais | Cuidado de verdade e economia",
    template: "%s | Farmácia Poupe Mais",
  },
  description:
    "Medicamentos isentos de prescrição, cuidados pessoais e serviços farmacêuticos com entrega ou retirada.",
  openGraph: {
    title: "Farmácia Poupe Mais",
    description: "Cuidado de verdade. Economia todos os dias.",
    type: "website",
    locale: "pt_BR",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Farmácia Poupe Mais" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Farmácia Poupe Mais",
    description: "Cuidado de verdade. Economia todos os dias.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
