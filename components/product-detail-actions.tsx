"use client";

import { useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";
import { addProductToCart } from "./product-card";
import { Icon } from "./icons";

export function ProductDetailActions({ product }: { product: CatalogProduct }) {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  return (
    <div className="detail-actions">
      <div className="quantity-control"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Diminuir quantidade">−</button><span>{quantity}</span><button onClick={() => setQuantity((value) => Math.min(10, value + 1))} aria-label="Aumentar quantidade">+</button></div>
      <button className="button button-primary detail-buy" onClick={() => { addProductToCart(product, quantity); setMessage("Adicionado ao carrinho"); setTimeout(() => setMessage(""), 1800); }}><Icon name="cart" size={20} /> {message || "Adicionar ao carrinho"}</button>
    </div>
  );
}
