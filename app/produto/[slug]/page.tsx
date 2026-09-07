import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { ProductArtwork } from "@/components/product-artwork";
import { ProductDetailActions } from "@/components/product-detail-actions";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatCurrency } from "@/lib/catalog";
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
  return (
    <><SiteHeader /><main className="inner-main"><div className="page-shell product-detail"><div className="breadcrumbs"><Link href="/">Início</Link><span>/</span><Link href="/catalogo">Catálogo</Link><span>/</span><span>{product.name}</span></div><div className="detail-grid"><div className="detail-visual"><ProductArtwork tone={product.tone} icon={product.icon} /><span className="detail-zoom">Imagem ilustrativa</span></div><div className="detail-copy"><span className="product-brand">{product.brand} • {product.category}</span><h1>{product.name}</h1><p className="detail-subtitle">{product.shortDescription}</p><div className="detail-rating"><span>★★★★★</span><a href="#informacoes">4,8 (124 avaliações)</a></div>{product.compareAtCents && <span className="old-price">De {formatCurrency(product.compareAtCents)}</span>}<div className="detail-price"><strong>{formatCurrency(product.priceCents)}</strong><span>à vista</span></div><p className="detail-installment">ou em até 2x de {formatCurrency(Math.ceil(product.priceCents / 2))} sem juros</p><div className="stock-line"><span /> Em estoque para entrega e retirada</div><ProductDetailActions product={product} /><div className="delivery-box"><Icon name="truck" /><div><strong>Calcule entrega ou retirada</strong><p>Informe seu CEP no carrinho para ver prazos e disponibilidade.</p></div></div><ul className="detail-assurances"><li><Icon name="shield" size={18} /> Produto de procedência verificada</li><li><Icon name="store" size={18} /> Retirada sem custo em loja</li></ul></div></div><section id="informacoes" className="product-information"><div><span className="eyebrow">Informações do produto</span><h2>Uso consciente começa com informação clara.</h2></div><div><p>{product.description}</p><p><strong>Atenção:</strong> a descrição não substitui a bula, a prescrição ou a orientação de um profissional de saúde. Se os sintomas persistirem, procure atendimento.</p>{product.requiresPrescription && <div className="prescription-warning"><Icon name="document" /><span><strong>Venda condicionada à receita</strong>A dispensação só ocorre após análise e validação do documento.</span></div>}</div></section></div></main><SiteFooter /></>
  );
}
