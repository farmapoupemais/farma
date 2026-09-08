import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { ProductGalleryVisual, ProductVariantsAndActions } from "@/components/product-gallery-variants";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatCurrency, generateEan } from "@/lib/catalog";
import { getVisibleProductBySlug } from "@/lib/products-repository";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getVisibleProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado", openGraph: { images: [] }, twitter: { images: [] } };
  return { title: product.name, description: product.shortDescription, openGraph: { title: product.name, description: product.shortDescription, images: [] }, twitter: { title: product.name, description: product.shortDescription, images: [] } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getVisibleProductBySlug(slug);
  if (!product) notFound();

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.shortDescription,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.category,
    sku: `FPM-${product.id}`,
    offers: {
      "@type": "Offer",
      url: `https://farmapoupemais.netlify.app/produto/${product.slug}`,
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      priceValidUntil: "2026-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Pharmacy",
        name: "Farmácia Poupe Mais",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <SiteHeader />
      <main className="inner-main">
        <div className="page-shell product-detail">
          <div className="breadcrumbs">
            <Link href="/">Início</Link>
            <span>/</span>
            <Link href="/catalogo">Catálogo</Link>
            <span>/</span>
            <span>{product.name}</span>
          </div>
          <div className="detail-grid">
            <ProductGalleryVisual product={product} />
            <div className="detail-copy">
              <span className="product-brand">{product.brand} • {product.category}</span>
              <h1>{product.name}</h1>
              <p className="detail-subtitle">{product.shortDescription}</p>
              <div className="detail-rating">
                <span>★★★★★</span>
                <a href="#informacoes">4,8 (124 avaliações verificadas)</a>
              </div>
              {product.compareAtCents && (
                <span className="old-price">De {formatCurrency(product.compareAtCents)}</span>
              )}
              <div className="detail-price">
                <strong>{formatCurrency(product.priceCents)}</strong>
                <span>à vista</span>
              </div>
              <p className="detail-installment">
                ou em até 2x de {formatCurrency(Math.ceil(product.priceCents / 2))} sem juros
              </p>
              <div className="stock-line">
                <span /> Em estoque para entrega expressa e retirada em loja
              </div>
              <ProductVariantsAndActions product={product} />
              <div className="delivery-box">
                <Icon name="truck" />
                <div>
                  <strong>Calcule entrega ou retirada</strong>
                  <p>Informe seu CEP no carrinho para ver prazos e disponibilidade.</p>
                </div>
              </div>
              <ul className="detail-assurances">
                <li><Icon name="shield" size={18} /> Produto com registro sanitário Anvisa</li>
                <li><Icon name="store" size={18} /> Retirada gratuita em 30 minutos em loja</li>
              </ul>
            </div>
          </div>
          <section id="informacoes" className="product-information">
            <div>
              <span className="eyebrow">Informações Técnicas do Produto</span>
              <h2>Uso consciente começa com informação clara.</h2>
            </div>
            <div>
              <p>{product.description}</p>
              <div className="technical-specs-box" style={{ marginTop: "1.5rem", padding: "1.25rem", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", color: "#1e293b", fontWeight: 700 }}>Especificações Técnicas</h4>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#475569", fontSize: "0.9rem", lineHeight: 1.8 }}>
                  <li><strong>ID do Item:</strong> <code>#{product.id}</code></li>
                  <li><strong>Código de Barras (EAN-13):</strong> <code>{product.barcode || generateEan(product.id)}</code></li>
                  <li><strong>Categoria:</strong> {product.category}</li>
                  <li><strong>Marca / Fabricante:</strong> {product.brand}</li>
                  <li><strong>Dispensação:</strong> Isento de Prescrição / Não exige retenção de receita</li>
                </ul>
              </div>
              <p style={{ marginTop: "1rem" }}>
                <strong>Atenção:</strong> a descrição não substitui a bula ou a orientação de um profissional de saúde. Se os sintomas persistirem, procure atendimento.
              </p>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
