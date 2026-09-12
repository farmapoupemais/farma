import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getVisibleProducts } from "@/lib/products-repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Farmácia Poupe Mais | Cuidado de verdade e economia",
  description:
    "Medicamentos, dermocosméticos, vitaminas e cuidados diários com até 70% de economia e tele-entrega expressa em até 90 min.",
};

export default async function HomePage() {
  const products = await getVisibleProducts();
  const offerProducts = products.filter((product) => product.compareAtCents);
  const medicationProducts = products.filter((product) => product.category === "Medicamentos");
  const dermocosmeticProducts = products.filter(
    (product) => product.category === "Dermocosméticos" || product.category === "Cuidados pessoais"
  );
  const vitaminProducts = products.filter(
    (product) => product.category === "Vitaminas" || product.category === "Saúde e bem-estar"
  );

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero Section — Com o Vídeo GIF da Farmacêutica em Destaque */}
        <section className="page-shell hero" aria-label="Apresentação da Farmácia Poupe Mais">
          <div className="hero-media">
            <Image
              src="/farmacia-hero.gif"
              alt="Farmácia Poupe Mais — Atendimento humanizado, economia e tele-entrega expressa"
              fill
              className="hero-image"
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 1440px"
            />
          </div>
          <div className="hero-overlay" />
          <div className="hero-copy">
            <span className="eyebrow">Aqui se faz economia • Farmácia Poupe Mais</span>
            <h1>Sua saúde, no seu ritmo.</h1>
            <p>
              Medicamentos, dermocosméticos, vitaminas e cuidados para toda a família com até 70% de economia,
              tele-entrega expressa em até 90 minutos ou retirada grátis em nossas lojas em 30 min.
            </p>
            <div className="hero-actions">
              <Link href="/catalogo?ofertas=1" className="button-accent-yellow">
                <Icon name="spark" size={18} /> Ver Super Ofertas
              </Link>
              <Link href="/catalogo" className="button button-primary">
                Explorar Catálogo
              </Link>
            </div>
            <div className="hero-proof">
              <span>
                <Icon name="truck" size={17} /> Tele-Entrega em até 90 min
              </span>
              <span>
                <Icon name="store" size={17} /> Retirada grátis em 30 min
              </span>
              <span>
                <Icon name="shield" size={17} /> 100% Procedência ANVISA
              </span>
            </div>
          </div>
        </section>

        {/* Barra de Categorias Rápidas em Destaque (Padrão Panvel / Raia) */}
        <section className="page-shell" aria-label="Categorias Rápidas">
          <div className="category-quick-bar">
            <Link href="/catalogo?categoria=Medicamentos" className="category-quick-item">
              <div className="category-quick-icon" style={{ background: "#e6f7ef", color: "#00874e" }}>
                💊
              </div>
              <span className="category-quick-label">Medicamentos</span>
            </Link>

            <Link href="/catalogo?ofertas=1" className="category-quick-item">
              <div className="category-quick-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>
                🔥
              </div>
              <span className="category-quick-label">Super Ofertas</span>
            </Link>

            <Link href="/catalogo?categoria=Dermocosméticos" className="category-quick-item">
              <div className="category-quick-icon" style={{ background: "#fdf4ff", color: "#c026d3" }}>
                ✨
              </div>
              <span className="category-quick-label">Dermocosméticos</span>
            </Link>

            <Link href="/catalogo?categoria=Vitaminas" className="category-quick-item">
              <div className="category-quick-icon" style={{ background: "#fef9c3", color: "#ca8a04" }}>
                🌿
              </div>
              <span className="category-quick-label">Vitaminas</span>
            </Link>

            <Link href={`/catalogo?categoria=${encodeURIComponent("Mamãe e bebê")}`} className="category-quick-item">
              <div className="category-quick-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                👶
              </div>
              <span className="category-quick-label">Mamãe &amp; Bebê</span>
            </Link>

            <Link href={`/catalogo?categoria=${encodeURIComponent("Cuidados pessoais")}`} className="category-quick-item">
              <div className="category-quick-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                🧴
              </div>
              <span className="category-quick-label">Cuidados Pessoais</span>
            </Link>

            <Link href={`/catalogo?categoria=${encodeURIComponent("Primeiros socorros")}`} className="category-quick-item">
              <div className="category-quick-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
                🩹
              </div>
              <span className="category-quick-label">Primeiros Socorros</span>
            </Link>

            <Link href="/lojas" className="category-quick-item">
              <div className="category-quick-icon" style={{ background: "#f1f5f9", color: "#0f766e" }}>
                🏪
              </div>
              <span className="category-quick-label">Nossas Lojas</span>
            </Link>
          </div>
        </section>

        {/* Benefits Bar */}
        <section className="page-shell" aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className="sr-only">Diferenciais da Farmácia Poupe Mais</h2>
          <div className="benefits">
            <article>
              <span className="benefit-icon">
                <Icon name="truck" size={22} />
              </span>
              <div>
                <h3>Entrega expressa</h3>
                <p>Receba em casa em até 90 minutos.</p>
              </div>
            </article>
            <article>
              <span className="benefit-icon">
                <Icon name="store" size={22} />
              </span>
              <div>
                <h3>Retirada grátis</h3>
                <p>Pronto em 30 min sem frete em loja.</p>
              </div>
            </article>
            <article>
              <span className="benefit-icon">
                <Icon name="care" size={22} />
              </span>
              <div>
                <h3>Atenção farmacêutica</h3>
                <p>Farmacêutico RT presente todos os dias.</p>
              </div>
            </article>
            <article>
              <span className="benefit-icon">
                <Icon name="spark" size={22} />
              </span>
              <div>
                <h3>Economia de verdade</h3>
                <p>Descontos de até 70% e preços populares.</p>
              </div>
            </article>
          </div>
        </section>

        {/* Vitrine 1: Ofertas para você (Super Ofertas da Semana) */}
        <section className="offer-section">
          <div className="page-shell">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Preço baixo de verdade • Até 70% OFF</span>
                <h2>Ofertas para você</h2>
              </div>
              <Link href="/catalogo?ofertas=1">Ver todas as ofertas →</Link>
            </div>
            <div className="product-grid">
              {(offerProducts.length ? offerProducts : products).slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Vitrine 2: Medicamentos Mais Procurados */}
        <section className="page-shell home-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Alívio rápido e uso diário</span>
              <h2>Medicamentos essenciais</h2>
            </div>
            <Link href="/catalogo?categoria=Medicamentos">Ver todos os medicamentos →</Link>
          </div>
          <div className="product-grid">
            {(medicationProducts.length ? medicationProducts : products).slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Banners Comerciais de Ação Imediata (Padrão Panvel/Raia) */}
        <section className="page-shell home-action-banners">
          <div className="action-banner action-banner-pickup">
            <div className="action-banner-content">
              <span className="action-banner-badge">Frete Zero</span>
              <h2>Compre no Site e Retire na Loja</h2>
              <p>Seu pedido separado e higienizado pronto para retirada em até 30 minutos em nossas unidades físicas.</p>
              <Link href="/lojas" className="action-banner-link">
                Encontrar Lojas para Retirar →
              </Link>
            </div>
            <div className="action-banner-icon">
              <Icon name="store" size={48} />
            </div>
          </div>

          <div className="action-banner action-banner-delivery">
            <div className="action-banner-content">
              <span className="action-banner-badge-yellow">Tele-Entrega Expressa</span>
              <h2>Peça Direto no WhatsApp</h2>
              <p>Mande sua lista de remédios ou produtos e receba com agilidade no conforto da sua casa.</p>
              <a
                href="https://wa.me/5551981834039?text=Ol%C3%A1!%20Gostaria%20de%20fazer%20um%20pedido%20para%20tele-entrega%20na%20Farm%C3%A1cia%20Poupe%20Mais."
                target="_blank"
                rel="noopener noreferrer"
                className="action-banner-link-whatsapp"
              >
                Pedir pelo WhatsApp (51) 98183-4039 →
              </a>
            </div>
            <div className="action-banner-icon">
              <Icon name="truck" size={48} />
            </div>
          </div>
        </section>

        {/* Vitrine 3: Dermocosméticos & Cuidados Diários */}
        <section className="page-shell home-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Proteção solar, skincare e bem-estar</span>
              <h2>Dermocosméticos &amp; Cuidados</h2>
            </div>
            <Link href="/catalogo?categoria=Dermocosméticos">Ver linha completa →</Link>
          </div>
          <div className="product-grid">
            {(dermocosmeticProducts.length ? dermocosmeticProducts : products).slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Vitrine 4: Vitaminas & Imunidade */}
        <section className="page-shell home-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Vitalidade, foco e energia</span>
              <h2>Vitaminas &amp; Suplementos</h2>
            </div>
            <Link href="/catalogo?categoria=Vitaminas">Ver todas as vitaminas →</Link>
          </div>
          <div className="product-grid">
            {(vitaminProducts.length ? vitaminProducts : products).slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Compromisso e Segurança */}
        <section className="page-shell home-section trust-section">
          <div className="trust-copy">
            <span className="eyebrow">Compromisso Poupe Mais</span>
            <h2>Cuidar de você com transparência e responsabilidade.</h2>
            <p>
              Preços acessíveis, atendimento acolhedor e garantia de procedência em cada medicamento e produto.
            </p>
            <Link href="/sobre" className="button button-primary">
              Conheça nossa história
            </Link>
          </div>
          <div className="trust-list">
            <article>
              <Icon name="shield" size={26} />
              <div>
                <h3>Procedência verificada</h3>
                <p>Distribuidoras oficiais com registro sanitário ANVISA.</p>
              </div>
            </article>
            <article>
              <Icon name="care" size={26} />
              <div>
                <h3>Farmacêutico presente</h3>
                <p>Orientação ética de posologia e uso seguro todos os dias.</p>
              </div>
            </article>
            <article>
              <Icon name="store" size={26} />
              <div>
                <h3>Rede de lojas físicas</h3>
                <p>Retirada expressa em 30 min sem frete na unidade mais próxima.</p>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
