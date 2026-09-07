"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, catalogProducts } from "@/lib/catalog";
import type { CartItem } from "./product-card";
import { Icon } from "./icons";
import { ProductArtwork } from "./product-artwork";

function saveCart(lines: CartItem[]) {
  localStorage.setItem("poupe-mais-cart", JSON.stringify(lines));
  window.dispatchEvent(new Event("poupe-mais-cart-updated"));
}

export function CartView() {
  const [lines, setLines] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error" | "auth"; message?: string }>({ type: "idle" });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setLines(JSON.parse(localStorage.getItem("poupe-mais-cart") ?? "[]")); } catch { setLines([]); }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0), [lines]);
  const discount = couponApplied ? Math.min(1000, subtotal) : 0;
  const shipping = fulfillment === "delivery" && subtotal > 0 && subtotal < 14900 ? 990 : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  function update(id: string, quantity: number) {
    const next = quantity <= 0 ? lines.filter((line) => line.id !== id) : lines.map((line) => line.id === id ? { ...line, quantity: Math.min(quantity, 10) } : line);
    setLines(next); saveCart(next);
  }

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ type: "loading", message: "Criando seu pedido…" });
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: lines.map(({ id, quantity }) => ({ id, quantity })), fulfillment, coupon: couponApplied ? coupon : "", prescriptionId: data.get("prescriptionId"), address: fulfillment === "delivery" ? { cep: data.get("cep"), street: data.get("street"), number: data.get("number"), complement: data.get("complement") } : null }) });
      const payload = await response.json() as { order?: { id: string }; error?: string };
      if (response.status === 401) { setStatus({ type: "auth", message: "Entre na sua conta para concluir." }); return; }
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível criar o pedido.");
      saveCart([]); setLines([]); setStatus({ type: "success", message: `Pedido ${payload.order?.id ?? ""} criado. O pagamento será confirmado na próxima etapa.` });
    } catch (error) { setStatus({ type: "error", message: error instanceof Error ? error.message : "Tente novamente." }); }
  }

  if (!ready) return <div className="cart-loading">Carregando carrinho…</div>;
  if (!lines.length && status.type !== "success") return <div className="empty-state cart-empty"><span><Icon name="cart" size={34} /></span><h2>Seu carrinho está vazio</h2><p>Que tal encontrar algo para cuidar de você hoje?</p><Link href="/catalogo" className="button button-primary">Explorar produtos</Link></div>;

  return (
    <div className="cart-layout">
      <section className="cart-items"><div className="cart-section-title"><h2>Seus produtos</h2><span>{lines.reduce((sum, line) => sum + line.quantity, 0)} itens</span></div>{lines.map((line) => { const product = catalogProducts.find((item) => item.id === line.id); return <article className="cart-line" key={line.id}><Link href={`/produto/${line.slug}`} className="cart-art"><ProductArtwork tone={line.tone} icon={line.icon} compact /></Link><div className="cart-line-copy"><Link href={`/produto/${line.slug}`}><h3>{line.name}</h3></Link><p>{product?.shortDescription ?? "Produto selecionado"}</p><button onClick={() => update(line.id, 0)}>Remover</button></div><div className="quantity-control"><button onClick={() => update(line.id, line.quantity - 1)} aria-label="Diminuir">−</button><span>{line.quantity}</span><button onClick={() => update(line.id, line.quantity + 1)} aria-label="Aumentar">+</button></div><strong className="cart-line-price">{formatCurrency(line.priceCents * line.quantity)}</strong></article>; })}<div className="cart-assurance"><Icon name="shield" /><p><strong>Compra segura e responsável</strong>Produtos sujeitos a receita só avançam após análise farmacêutica.</p></div></section>
      <aside className="checkout-card"><h2>Resumo do pedido</h2><div className="fulfillment-tabs"><button className={fulfillment === "delivery" ? "active" : ""} onClick={() => setFulfillment("delivery")}><Icon name="truck" size={19} /> Entrega</button><button className={fulfillment === "pickup" ? "active" : ""} onClick={() => setFulfillment("pickup")}><Icon name="store" size={19} /> Retirada</button></div><form onSubmit={placeOrder}>{fulfillment === "delivery" ? <div className="checkout-fields"><label>CEP<input name="cep" inputMode="numeric" placeholder="00000-000" required maxLength={9} /></label><label>Endereço<input name="street" required maxLength={120} /></label><div><label>Número<input name="number" required maxLength={12} /></label><label>Complemento<input name="complement" maxLength={60} /></label></div></div> : <div className="pickup-summary"><Icon name="store" /><p><strong>Farmácia Poupe Mais — Centro</strong>Rua das Flores, 120 • Retire após confirmação</p></div>}{lines.some((line) => line.requiresPrescription) && <div className="checkout-fields"><label>Código da receita aprovada<input name="prescriptionId" placeholder="REC-..." required maxLength={40} /></label><small>Use o código exibido após a análise farmacêutica.</small></div>}<div className="coupon-row"><input value={coupon} onChange={(event) => setCoupon(event.target.value.toUpperCase().slice(0, 24))} placeholder="Cupom de desconto" /><button type="button" onClick={() => setCouponApplied(coupon === "BEMVINDO10")}>Aplicar</button></div>{coupon && !couponApplied && <small className="coupon-help">Dica demonstrativa: use BEMVINDO10</small>}<dl className="order-totals"><div><dt>Subtotal</dt><dd>{formatCurrency(subtotal)}</dd></div><div><dt>Desconto</dt><dd className="discount">− {formatCurrency(discount)}</dd></div><div><dt>{fulfillment === "delivery" ? "Entrega" : "Retirada"}</dt><dd>{shipping ? formatCurrency(shipping) : "Grátis"}</dd></div><div className="total"><dt>Total</dt><dd>{formatCurrency(total)}</dd></div></dl><button className="button button-primary checkout-submit" disabled={status.type === "loading"}>{status.type === "loading" ? "Processando…" : "Continuar para pagamento"}</button>{status.type !== "idle" && <div className={`checkout-status status-${status.type}`}>{status.message}{status.type === "auth" && <Link href="/signin-with-chatgpt?return_to=%2Fcarrinho"> Entrar com segurança</Link>}</div>}<p className="checkout-disclaimer">Nenhuma cobrança é feita nesta demonstração. Em produção, o pagamento deve usar um provedor certificado.</p></form></aside>
    </div>
  );
}
