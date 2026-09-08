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
    "Medicamentos isentos de prescrição, dermocosméticos, vitaminas e cuidados para toda a família com entrega ou retirada.",
};

export default async function HomePage() {
  const products = await getVisibleProducts();
  const offerProducts = products.filter((product) => product.compareAtCents);
  const featuredProducts = products.filter((product) => !product.compareAtCents);

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero Section */}
        <section className="page-shell hero">
          <div className="hero-media">
            <Image
              src="/farmacia-hero.gif"
              alt="Farmácia Poupe Mais - Atendimento farmacêutico e cuidados diários com entrega rápida"
              fill
              className="hero-image"
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 1440px"
            />
          </div>
          <div className="hero-overlay" />
          <div className="hero-copy">
            <span className="eyebrow">Cuidado de verdade e economia</span>
            <h1>Sua saúde, no seu ritmo.</h1>
            <p>
              Medicamentos, dermocosméticos, vitaminas e cuidados diários com
              entrega rápida ou retirada grátis em nossas lojas.
            </p>
            <div className="hero-actions">
              <Link href="/catalogo" className="button button-primary">
                Explorar catálogo
              </Link>
              <Link href="/catalogo?ofertas=1" className="button button-ghost">
                Ver ofertas
              </Link>
            </div>
            <div className="hero-proof">
              <span>
                <Icon name="truck" size={17} /> Entrega rápida
              </span>
              <span>
                <Icon name="store" size={17} /> Retirada em 30 min
              </span>
              <span>
                <Icon name="shield" size={17} /> Procedência garantida
              </span>
            </div>
          </div>
        </section>

        {/* Benefits Bar */}
        <section className="page-shell" aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className="sr-only">Diferenciais do Cuidado Poupe Mais</h2>
          <div className="benefits">
            <article>
              <span className="benefit-icon">
                <Icon name="truck" size={22} />
              </span>
              <div>
                <h3>Entrega rápida</h3>
                <p>Receba em casa com segurança e agilidade.</p>
              </div>
            </article>
            <article>
              <span className="benefit-icon">
                <Icon name="store" size={22} />
              </span>
              <div>
                <h3>Retirada grátis</h3>
                <p>Pronto em até 30 minutos em nossas lojas.</p>
              </div>
            </article>
            <article>
              <span className="benefit-icon">
                <Icon name="care" size={22} />
              </span>
              <div>
                <h3>Atenção farmacêutica</h3>
                <p>Equipe habilitada disponível todos os dias.</p>
              </div>
            </article>
            <article>
              <span className="benefit-icon">
                <Icon name="spark" size={22} />
              </span>
              <div>
                <h3>Economia de verdade</h3>
                <p>Ofertas exclusivas e descontos no carrinho.</p>
              </div>
            </article>
          </div>
        </section>

        {/* Categories Section - Modern Bento Grid 2026 */}
        <section className="page-shell home-section" aria-labelledby="categories-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Categorias em Destaque</span>
              <h2 id="categories-heading">O que você procura hoje?</h2>
            </div>
            <Link href="/catalogo">Ver todas as categorias →</Link>
          </div>

          <div className="bento-grid">
            {/* Bento Card 1: Medicamentos & Genéricos (Destaque Grande 2x2) */}
            <Link
              href="/catalogo?categoria=Medicamentos"
              className="bento-card bento-card-large"
            >
              <div>
                <span className="bento-badge bento-badge-accent">
                  ★ Mais Buscado • Desconto Popular
                </span>
              </div>
              <div className="bento-content">
                <div className="bento-icon-wrapper">
                  <Icon name="pill" size={32} />
                </div>
                <h3 className="bento-title">Medicamentos & Genéricos</h3>
                <p className="bento-description">
                  Economize até 70% em genéricos e medicamentos de uso contínuo.
                  Garantia de procedência com registro ativo na Anvisa e orientação de posologia.
                </p>
                <span className="bento-action">Explorar medicamentos com desconto →</span>
              </div>
            </Link>

            {/* Bento Card 2: Dermocosméticos */}
            <Link
              href="/catalogo?categoria=Dermocosméticos"
              className="bento-card"
            >
              <div>
                <span className="bento-badge">Dermatologia</span>
              </div>
              <div className="bento-content">
                <div className="bento-icon-wrapper">
                  <Icon name="spark" size={26} />
                </div>
                <h3 className="bento-title">Dermocosméticos</h3>
                <p className="bento-description">
                  Protetores solares, hidratação facial e tratamento antienvelhecimento com marcas de renome.
                </p>
                <span className="bento-action">Ver dermocosméticos →</span>
              </div>
            </Link>

            {/* Bento Card 3: Vitaminas & Suplementos */}
            <Link
              href="/catalogo?categoria=Vitaminas"
              className="bento-card"
            >
              <div>
                <span className="bento-badge">Longevidade</span>
              </div>
              <div className="bento-content">
                <div className="bento-icon-wrapper">
                  <Icon name="heart" size={26} />
                </div>
                <h3 className="bento-title">Vitaminas & Imunidade</h3>
                <p className="bento-description">
                  Suplementos de ômega 3, vitamina C, D3 e colágeno para energia, foco e vitalidade.
                </p>
                <span className="bento-action">Ver suplementos →</span>
              </div>
            </Link>

            {/* Bento Card 4: Farmácia Ágil e Sem Burocracia */}
            <Link
              href="/catalogo?ofertas=1"
              className="bento-card bento-card-wide"
            >
              <div>
                <span className="bento-badge bento-badge-accent">
                  ⚡ Descontos Exclusivos • Pronta Entrega
                </span>
              </div>
              <div className="bento-content">
                <div className="bento-icon-wrapper">
                  <Icon name="spark" size={28} />
                </div>
                <h3 className="bento-title">Produtos Isentos de Receita (MIPs)</h3>
                <p className="bento-description">
                  Compre com rapidez analgésicos, antialérgicos, dermocosméticos e vitaminas sem necessidade de retenção de receita médica. Entrega expressa ou retirada em até 30 min.
                </p>
                <span className="bento-action">Aproveitar ofertas imediatas →</span>
              </div>
            </Link>

            {/* Bento Card 5: Mamãe e Bebê */}
            <Link
              href={`/catalogo?categoria=${encodeURIComponent("Mamãe e bebê")}`}
              className="bento-card"
            >
              <div>
                <span className="bento-badge">Cuidados Suaves</span>
              </div>
              <div className="bento-content">
                <div className="bento-icon-wrapper">
                  <Icon name="care" size={26} />
                </div>
                <h3 className="bento-title">Mamãe & Bebê</h3>
                <p className="bento-description">
                  Fórmulas infantis, fraldas hipoalergênicas, lenços e dermocuidados para a primeira infância.
                </p>
                <span className="bento-action">Ver linha bebê →</span>
              </div>
            </Link>

            {/* Bento Card 6: Serviços Clínicos */}
            <Link
              href="/servicos"
              className="bento-card"
            >
              <div>
                <span className="bento-badge">Clínica Farmacêutica</span>
              </div>
              <div className="bento-content">
                <div className="bento-icon-wrapper">
                  <Icon name="store" size={26} />
                </div>
                <h3 className="bento-title">Serviços de Saúde</h3>
                <p className="bento-description">
                  Aferição de pressão, teste rápido de glicemia e acompanhamento farmacoterapêutico presencial.
                </p>
                <span className="bento-action">Conhecer serviços →</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Offers Section */}
        <section className="offer-section">
          <div className="page-shell">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Preço baixo de verdade</span>
                <h2>Ofertas para você</h2>
              </div>
              <Link href="/catalogo?ofertas=1">Ver todas as ofertas →</Link>
            </div>
            <div className="product-grid">
              {(offerProducts.length ? offerProducts : products).slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Split Promos Section */}
        <section className="page-shell split-promos">
          <article className="promo-card promo-prescription">
            <div>
              <span className="eyebrow">Compra 100% simplificada</span>
              <h2>Produtos sem burocracia</h2>
              <p>
                Compre medicamentos isentos de prescrição, vitaminas e itens de cuidado diário com entrega rápida e sem retenção de receita.
              </p>
              <Link href="/catalogo" className="button button-light">
                Ver catálogo completo
              </Link>
            </div>
            <span className="promo-icon">
              <Icon name="capsule" size={140} />
            </span>
          </article>
          <article className="promo-card promo-services">
            <div>
              <span className="eyebrow">Cuidado além do balcão</span>
              <h2>Serviços farmacêuticos</h2>
              <p>
                Aferição de pressão, teste de glicemia e revisão de medicação em
                ambiente reservado e acolhedor.
              </p>
              <Link href="/servicos" className="button button-dark">
                Conhecer serviços
              </Link>
            </div>
            <span className="promo-icon">
              <Icon name="heart" size={140} />
            </span>
          </article>
        </section>

        {/* Featured Products Section */}
        <section className="page-shell home-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Mais procurados</span>
              <h2>Destaques da farmácia</h2>
            </div>
            <Link href="/catalogo">Explorar todo o catálogo →</Link>
          </div>
          <div className="product-grid">
            {(featuredProducts.length ? featuredProducts : products).slice(0, 5).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Trust & Quality Section */}
        <section className="page-shell home-section trust-section">
          <div className="trust-copy">
            <span className="eyebrow">Compromisso Poupe Mais</span>
            <h2>Cuidar de você com transparência e responsabilidade.</h2>
            <p>
              Nossa missão é unir preços justos, atendimento acolhedor e garantia
              de procedência em cada medicamento e produto de cuidado diário.
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
                <p>
                  Produtos adquiridos exclusivamente de distribuidoras oficiais com
                  registro sanitário regular.
                </p>
              </div>
            </article>
            <article>
              <Icon name="care" size={26} />
              <div>
                <h3>Farmacêuticos sempre presentes</h3>
                <p>
                  Profissionais habilitados para orientar sobre posologia,
                  interações medicamentosas e uso seguro.
                </p>
              </div>
            </article>
            <article>
              <Icon name="store" size={26} />
              <div>
                <h3>Rede de lojas e conveniência digital</h3>
                <p>
                  Compre online e retire sem custo em até 30 minutos na unidade mais
                  próxima de você.
                </p>
              </div>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
