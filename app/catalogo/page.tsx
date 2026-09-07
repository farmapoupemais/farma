import type { Metadata } from "next";
import Link from "next/link";
import { CatalogBrowser } from "@/components/catalog-browser";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getVisibleProducts } from "@/lib/products-repository";

export const metadata: Metadata = { title: "Catálogo", description: "Medicamentos isentos de prescrição, dermocosméticos, vitaminas e cuidados para toda a família." };
export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ q?: string; categoria?: string; ofertas?: string }> }) {
  const params = await searchParams;
  const products = await getVisibleProducts();
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const category = typeof params.categoria === "string" ? params.categoria.slice(0, 80) : "";
  const offerProducts = params.ofertas === "1" ? products.filter((product) => product.compareAtCents) : products;
  return (
    <><SiteHeader /><main className="inner-main"><section className="page-hero"><div className="page-shell"><div className="breadcrumbs"><Link href="/">Início</Link><span>/</span><span>Catálogo</span></div><span className="eyebrow">Escolhas para o dia a dia</span><h1>{params.ofertas === "1" ? "Ofertas" : "Todos os produtos"}</h1><p>Compare, filtre e escolha com informação clara. Em caso de dúvida sobre medicamentos, fale com nossa equipe farmacêutica.</p></div></section><div className="page-shell inner-content"><CatalogBrowser products={offerProducts} initialQuery={query} initialCategory={category} /></div></main><SiteFooter /></>
  );
}
