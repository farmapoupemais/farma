import type { Metadata } from "next";
import "./globals.css";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";

export const metadata: Metadata = {
  metadataBase: new URL("https://farmapoupemais.netlify.app"),
  title: {
    default: "Farmácia Poupe Mais | Cuidado de verdade e economia",
    template: "%s | Farmácia Poupe Mais",
  },
  description:
    "Medicamentos com desconto popular, dermocosméticos, cuidados diários e produtos isentos de receita médica com entrega rápida em 30 minutos.",
  openGraph: {
    title: "Farmácia Poupe Mais",
    description: "Cuidado de verdade. Economia todos os dias.",
    url: "https://farmapoupemais.netlify.app",
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

const pharmacySchema = {
  "@context": "https://schema.org",
  "@type": "Pharmacy",
  name: "Farmácia Poupe Mais",
  image: "https://farmapoupemais.netlify.app/og.png",
  url: "https://farmapoupemais.netlify.app",
  telephone: "+55-11-3000-0000",
  priceRange: "$$",
  currenciesAccepted: "BRL",
  paymentAccepted: "Cash, Credit Card, Pix, Boleto",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Av. Principal da Saúde, 1000",
    addressLocality: "São Paulo",
    addressRegion: "SP",
    postalCode: "01000-000",
    addressCountry: "BR",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "22:00",
    },
  ],
  medicalSpecialty: "Pharmacy",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Catálogo Farmacêutico Poupe Mais",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Core Web Vitals 2026: Preload de alta prioridade da animação LCP Hero */}
        <link rel="preload" as="image" href="/farmacia-hero.gif" fetchPriority="high" />
        {/* Machine Experience (MX): Schema.org Pharmacy para assistentes de IA (ChatGPT, Claude, Perplexity) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pharmacySchema) }}
        />
      </head>
      <body className="antialiased">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
