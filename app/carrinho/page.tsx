import type { Metadata } from "next";
import Link from "next/link";
import { CartView } from "@/components/cart-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Carrinho", description: "Revise seus produtos, escolha entrega ou retirada e finalize seu pedido." };

export default function CartPage() {
  return <><SiteHeader /><main className="inner-main"><section className="page-hero compact-hero"><div className="page-shell"><div className="breadcrumbs"><Link href="/">Início</Link><span>/</span><span>Carrinho</span></div><h1>Seu carrinho</h1><p>Revise os itens e escolha como prefere receber.</p></div></section><div className="page-shell inner-content"><CartView /></div></main><SiteFooter /></>;
}
