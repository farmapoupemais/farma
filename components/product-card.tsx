"use client";

import Link from "next/link";
import { useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";
import { formatCurrency } from "@/lib/catalog";
import { Icon } from "./icons";
import { ProductArtwork } from "./product-artwork";

export type CartItem = Pick<CatalogProduct, "id" | "slug" | "name" | "priceCents" | "tone" | "icon" | "requiresPrescription"> & { quantity: number };

export function addProductToCart(product: CatalogProduct, quantity = 1) {
  const stored = localStorage.getItem("poupe-mais-cart");
  const cart = stored ? (JSON.parse(stored) as CartItem[]) : [];
  const current = cart.find((item) => item.id === product.id);
  if (current) current.quantity = Math.min(10, current.quantity + quantity);
  else cart.push({ id: product.id, slug: product.slug, name: product.name, priceCents: product.priceCents, tone: product.tone, icon: product.icon, requiresPrescription: product.requiresPrescription, quantity });
  localStorage.setItem("poupe-mais-cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("poupe-mais-cart-updated"));
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  const [added, setAdded] = useState(false);
  const discount = product.compareAtCents
    ? Math.round((1 - product.priceCents / product.compareAtCents) * 100)
    : 0;

  function handleAddToCart() {
    // INP (Core Web Vitals 2026): feedback visual imediato antes da sincronização
    setAdded(true);
    setTimeout(() => {
      addProductToCart(product);
    }, 0);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <article className="product-card">
      <Link
        href={`/produto/${product.slug}`}
        className="product-visual"
        aria-label={`Ver detalhes do medicamento ou produto ${product.name} da marca ${product.brand}`}
      >
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <ProductArtwork
          tone={product.tone}
          icon={product.icon}
          productName={product.name}
          brand={product.brand}
          category={product.category}
        />
      </Link>
      <div className="product-info">
        <span className="product-brand">{product.brand}</span>
        <Link href={`/produto/${product.slug}`}>
          <h3>{product.name}</h3>
        </Link>
        <p>{product.shortDescription}</p>
        <div className="product-pricing">
          {product.compareAtCents && <span className="old-price">{formatCurrency(product.compareAtCents)}</span>}
          <div>
            <strong>{formatCurrency(product.priceCents)}</strong>
            {discount > 0 && <em>-{discount}%</em>}
          </div>
          <small>ou 2x de {formatCurrency(Math.ceil(product.priceCents / 2))} sem juros</small>
        </div>
        <button
          className={`add-button ${added ? "is-added" : ""}`}
          onClick={handleAddToCart}
          aria-label={`Adicionar ${product.name} à cesta de compras`}
        >
          <Icon name={added ? "care" : "cart"} size={19} /> {added ? "Adicionado" : "Adicionar"}
        </button>
      </div>
    </article>
  );
}
