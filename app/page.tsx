import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { categories } from "@/lib/catalog";
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
          <Image
            src="/farmacia-hero.png"
            alt="Farmácia Poupe Mais"
            fill
            className="hero-image"
            priority
          />
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
              <Link href="/receita" className="button button-ghost">
                Enviar receita
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
        <section className="page-shell">
          <div className="benefits">
            <article>
              <span className="benefit-icon">
                <Icon name="truck" size={22} />
              </span>
              <div>
                <h2>Entrega rápida</h2>
                <p>Receba em casa com segurança e agilidade.</p>
              </div>
            </article>
            <article>
              <span className="benefit-icon">
                <Icon name="store" size={22} />
              </span>
              <div>
                <h2>Retirada grátis</h2>
                <p>Pronto em até 30 minutos em nossas lojas.</p>
              </div>
            </article>
            <article>
              <span className="benefit-icon">
                <Icon name="care" size={22} />
              </span>
              <div>
                <h2>Atenção farmacêutica</h2>
                <p>Equipe habilitada disponível todos os dias.</p>
              </div>
            </article>
            <article>
              <span className="benefit-icon">
                <Icon name="spark" size={22} />
              </span>
              <div>
                <h2>Economia de verdade</h2>
                <p>Ofertas exclusivas e descontos no carrinho.</p>
              </div>
            </article>
          </div>
        </section>

        {/* Categories Section */}
        <section className="page-shell home-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Categorias</span>
              <h2>O que você procura hoje?</h2>
            </div>
            <Link href="/catalogo">Ver todas as categorias →</Link>
          </div>
          <div className="category-grid">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/catalogo?categoria=${encodeURIComponent(cat.name)}`}
                className="category-card"
              >
                <span>
                  <Icon name={cat.icon as any} size={28} />
                </span>
                <div>
                  <h3>{cat.name}</h3>
                  <p>{cat.description}</p>
                </div>
                <b>→</b>
              </Link>
            ))}
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
              <span className="eyebrow">Canal protegido</span>
              <h2>Precisa de medicamento com receita?</h2>
              <p>
                Envie sua receita médica com total privacidade para conferência e
                orientação da nossa equipe farmacêutica.
              </p>
              <Link href="/receita" className="button button-light">
                Enviar receita agora
              </Link>
            </div>
            <span className="promo-icon">
              <Icon name="document" size={140} />
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
