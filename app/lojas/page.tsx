import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Nossas Lojas | Farmácia Poupe Mais",
  description: "Encontre a unidade Farmácia Poupe Mais mais próxima para atendimento e retirada rápida.",
};

const stores = [
  {
    name: "Imbé Matriz (Norte)",
    address: "Av. Paraguassú, 2200 - Centro, Imbé/RS",
    hours: "Todos os dias • 8h às 22h30",
    features: "Retirada em 30 min • Farmacêutico presente • Estacionamento próprio",
  },
  {
    name: "Centro",
    address: "Rua das Flores, 120 - Centro",
    hours: "Todos os dias • 8h às 22h",
    features: "Retirada em 30 min • Serviços farmacêuticos • Tele-entrega",
  },
  {
    name: "Mariluz",
    address: "Av. Beira-Mar, 845 - Mariluz",
    hours: "Segunda a sábado • 8h às 21h",
    features: "Retirada rápida • Tele-entrega local",
  },
];

export default function StoresPage() {
  return (
    <>
      <SiteHeader />
      <main className="inner-main">
        <section className="page-hero">
          <div className="page-shell">
            <div className="breadcrumbs">
              <Link href="/">Início</Link>
              <span>/</span>
              <span>Lojas</span>
            </div>
            <span className="eyebrow">Onde você estiver</span>
            <h1>Uma Poupe Mais por perto.</h1>
            <p>
              Confira horários de atendimento, serviços farmacêuticos e opções de retirada rápida em até 30 minutos.
            </p>
          </div>
        </section>
        <div className="page-shell inner-content stores-layout">
          <div className="store-search">
            <Icon name="search" />
            <div>
              <strong>Qual loja fica mais perto?</strong>
              <p>Busque por cidade, bairro ou CEP.</p>
            </div>
            <input aria-label="Cidade, bairro ou CEP" placeholder="Ex.: Imbé ou 95625-000" />
            <button className="button button-primary">Buscar</button>
          </div>
          <div className="store-grid">
            {stores.map((store) => (
              <article key={store.name}>
                <span className="store-pin">
                  <Icon name="store" size={27} />
                </span>
                <div>
                  <small>Farmácia Poupe Mais</small>
                  <h2>{store.name}</h2>
                  <p>{store.address}</p>
                  <dl>
                    <div>
                      <dt>
                        <Icon name="clock" size={16} /> Horário
                      </dt>
                      <dd>{store.hours}</dd>
                    </div>
                    <div>
                      <dt>
                        <Icon name="care" size={16} /> Serviços
                      </dt>
                      <dd>{store.features}</dd>
                    </div>
                  </dl>
                  <div className="store-actions">
                    <a
                      href="https://wa.me/5551981834039?text=Ol%C3%A1!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20a%20loja."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button-ghost"
                    >
                      Falar com a loja
                    </a>
                    <Link href="/catalogo" className="button button-primary">
                      Comprar para retirar
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
