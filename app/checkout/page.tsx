import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutWizard } from "@/components/checkout-wizard";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Finalizar Compra — Farmácia Poupe Mais",
  description: "Checkout seguro com Pix, Cartão de Crédito ou Débito, Boleto e Tele-Entrega rápida.",
};

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="inner-main">
        <section className="page-hero compact-hero">
          <div className="page-shell">
            <div className="breadcrumbs">
              <Link href="/">Início</Link>
              <span>/</span>
              <Link href="/carrinho">Carrinho</Link>
              <span>/</span>
              <span>Finalizar Compra</span>
            </div>
            <h1>Finalização da Compra</h1>
            <p>Revise seus dados, escolha a forma de pagamento e receba com a agilidade da Poupe Mais.</p>
          </div>
        </section>
        <div className="page-shell inner-content">
          <CheckoutWizard />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
