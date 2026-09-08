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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setLines(JSON.parse(localStorage.getItem("poupe-mais-cart") ?? "[]"));
      } catch {
        setLines([]);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0),
    [lines]
  );
  const discount = couponApplied ? Math.min(1000, subtotal) : 0;
  const shipping = fulfillment === "delivery" && subtotal > 0 && subtotal < 14900 ? 990 : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  function update(id: string, quantity: number) {
    const next =
      quantity <= 0
        ? lines.filter((line) => line.id !== id)
        : lines.map((line) =>
            line.id === id ? { ...line, quantity: Math.min(quantity, 10) } : line
          );
    setLines(next);
    saveCart(next);
  }

  if (!ready) return <div className="cart-loading">Carregando carrinho…</div>;

  if (!lines.length) {
    return (
      <div className="empty-state cart-empty">
        <span>
          <Icon name="cart" size={34} />
        </span>
        <h2>Seu carrinho está vazio</h2>
        <p>Que tal encontrar algo para cuidar de você hoje na Poupe Mais?</p>
        <Link href="/catalogo" className="button button-primary">
          Explorar produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <section className="cart-items">
        <div className="cart-section-title">
          <h2>Seus produtos selecionados</h2>
          <span>{lines.reduce((sum, line) => sum + line.quantity, 0)} itens</span>
        </div>

        {lines.map((line) => {
          const product = catalogProducts.find((item) => item.id === line.id);
          return (
            <article className="cart-line" key={line.id}>
              <Link href={`/produto/${line.slug}`} className="cart-art">
                <ProductArtwork tone={line.tone} icon={line.icon} compact />
              </Link>
              <div className="cart-line-copy">
                <Link href={`/produto/${line.slug}`}>
                  <h3>{line.name}</h3>
                </Link>
                <p>{product?.shortDescription ?? "Produto selecionado"}</p>
                <button onClick={() => update(line.id, 0)}>Remover</button>
              </div>
              <div className="quantity-control">
                <button onClick={() => update(line.id, line.quantity - 1)} aria-label="Diminuir">
                  −
                </button>
                <span>{line.quantity}</span>
                <button onClick={() => update(line.id, line.quantity + 1)} aria-label="Aumentar">
                  +
                </button>
              </div>
              <strong className="cart-line-price">
                {formatCurrency(line.priceCents * line.quantity)}
              </strong>
            </article>
          );
        })}

        <div className="cart-assurance">
          <Icon name="shield" />
          <p>
            <strong>Compra 100% segura e ágil</strong>
            Todos os produtos são isentos de retenção de receita, com despacho imediato e garantia de procedência.
          </p>
        </div>
      </section>

      <aside className="checkout-card">
        <h2>Resumo do pedido</h2>

        <div className="fulfillment-tabs">
          <button
            className={fulfillment === "delivery" ? "active" : ""}
            onClick={() => setFulfillment("delivery")}
          >
            <Icon name="truck" size={19} /> Tele-Entrega
          </button>
          <button
            className={fulfillment === "pickup" ? "active" : ""}
            onClick={() => setFulfillment("pickup")}
          >
            <Icon name="store" size={19} /> Retirada Loja
          </button>
        </div>

        <div className="coupon-row" style={{ marginTop: "16px" }}>
          <input
            value={coupon}
            onChange={(event) =>
              setCoupon(event.target.value.toUpperCase().slice(0, 24))
            }
            placeholder="Cupom de desconto"
          />
          <button
            type="button"
            onClick={() => setCouponApplied(coupon === "BEMVINDO10" || coupon === "POUPEMAIS")}
          >
            Aplicar
          </button>
        </div>
        {coupon && !couponApplied && (
          <small className="coupon-help">Dica demonstrativa: use BEMVINDO10 ou POUPEMAIS</small>
        )}

        <dl className="order-totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          {couponApplied && (
            <div>
              <dt>Desconto</dt>
              <dd className="discount">− {formatCurrency(discount)}</dd>
            </div>
          )}
          <div>
            <dt>{fulfillment === "delivery" ? "Tele-Entrega" : "Retirada"}</dt>
            <dd>{shipping ? formatCurrency(shipping) : "Grátis"}</dd>
          </div>
          <div className="total">
            <dt>Total</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
        </dl>

        <Link
          href="/checkout"
          className="button button-primary checkout-submit"
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "center",
            textDecoration: "none",
            marginTop: "16px",
          }}
        >
          Fechar Pedido / Ir para o Pagamento →
        </Link>

        <p className="checkout-disclaimer" style={{ marginTop: "14px" }}>
          Pix com 5% de desconto, Cartão de Crédito em até 6x sem juros ou Boleto Bancário.
        </p>
      </aside>
    </div>
  );
}
