"use client";

import { useState } from "react";
import type { CatalogProduct, ProductColor } from "@/lib/catalog";
import { generateEan } from "@/lib/catalog";
import { addProductToCart } from "./product-card";
import { ProductArtwork } from "./product-artwork";
import { Icon } from "./icons";

export function ProductGalleryVisual({ product }: { product: CatalogProduct }) {
  const images = product.images && product.images.length > 0 ? product.images : [];
  const barcode = product.barcode || generateEan(product.id);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedEan, setCopiedEan] = useState(false);

  function copyText(text: string, type: "id" | "ean") {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedEan(true);
      setTimeout(() => setCopiedEan(false), 2000);
    }
  }

  return (
    <div className="product-visual-wrapper">
      <div className="detail-visual-container">
        {images.length > 0 ? (
          <div className="detail-photo-frame">
            <img
              src={images[activeImageIdx]}
              alt={`${product.name} - Imagem ${activeImageIdx + 1}`}
              className="detail-photo-img"
            />
            <span className="detail-photo-badge">
              Foto {activeImageIdx + 1} de {images.length}
            </span>
          </div>
        ) : (
          <div className="detail-visual">
            <ProductArtwork
              tone={product.tone}
              icon={product.icon}
              productName={product.name}
              brand={product.brand}
              category={product.category}
            />
            <span className="detail-zoom">Procedência verificada</span>
          </div>
        )}
      </div>

      {/* Multiple Photos Thumbnails */}
      {images.length > 1 && (
        <div className="detail-thumbnails-row">
          {images.map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImageIdx(idx)}
              className={`detail-thumb-btn ${activeImageIdx === idx ? "active" : ""}`}
              aria-label={`Exibir foto ${idx + 1}`}
            >
              <img src={imgUrl} alt={`Miniatura ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}

      {/* Product ID & Barcode (EAN-13) */}
      <div className="product-identity-card">
        <div className="identity-row">
          <div className="identity-label">
            <span className="id-title">ID do Produto</span>
            <code className="id-code">#{product.id}</code>
          </div>
          <button
            type="button"
            className="identity-copy-btn"
            onClick={() => copyText(product.id, "id")}
          >
            {copiedId ? "✓ Copiado" : "Copiar ID"}
          </button>
        </div>

        <div className="identity-row">
          <div className="identity-label">
            <span className="id-title">Código de Barras (EAN-13)</span>
            <code className="id-code">{barcode}</code>
          </div>
          <button
            type="button"
            className="identity-copy-btn"
            onClick={() => copyText(barcode, "ean")}
          >
            {copiedEan ? "✓ Copiado" : "Copiar EAN"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductVariantsAndActions({ product }: { product: CatalogProduct }) {
  const colors = product.colors && product.colors.length > 0 ? product.colors : [];
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
    colors.length > 0 ? colors[0] : null
  );
  const [showColorTable, setShowColorTable] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  function handleAddToCart() {
    addProductToCart(product, quantity);
    const colorPart = selectedColor ? ` (Cor: ${selectedColor.name})` : "";
    setMessage(`Adicionado ao carrinho${colorPart}!`);
    setTimeout(() => setMessage(""), 2000);
  }

  return (
    <div className="product-variants-and-actions">
      {/* Colors Section */}
      {colors.length > 0 && (
        <div className="product-color-selector">
          <div className="color-selector-top">
            <div>
              <span className="color-selector-label">Cor Selecionada:</span>
              <strong className="color-selector-current">
                {selectedColor ? selectedColor.name : "Escolha uma cor"}
              </strong>
              {selectedColor?.sku && (
                <span className="color-sku-badge">SKU: {selectedColor.sku}</span>
              )}
            </div>
            <button
              type="button"
              className="btn-open-color-table"
              onClick={() => setShowColorTable((v) => !v)}
            >
              🎨 {showColorTable ? "Fechar tabela" : `Tabela de cores (${colors.length})`}
            </button>
          </div>

          {/* Color swatches */}
          <div className="color-chips-list">
            {colors.map((c) => {
              const active = selectedColor?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`color-chip-btn ${active ? "active" : ""}`}
                  title={`${c.name} - ${c.stock > 0 ? `${c.stock} unidades` : "Esgotado"}`}
                >
                  <span
                    className="color-dot"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                  {c.stock <= 0 && <small className="chip-out">Esgotado</small>}
                </button>
              );
            })}
          </div>

          {/* Interactive Modal / Collapsible Table */}
          {showColorTable && (
            <div className="color-table-container">
              <div className="color-table-intro">
                <strong>Variações de Cor & Disponibilidade</strong>
                <p>Confira os detalhes de acabamento e estoque em tempo real.</p>
              </div>
              <div className="table-wrapper">
                <table className="variant-color-table">
                  <thead>
                    <tr>
                      <th>Amostra</th>
                      <th>Cor</th>
                      <th>Hex</th>
                      <th>SKU</th>
                      <th>Estoque</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colors.map((c) => {
                      const isSelected = selectedColor?.id === c.id;
                      return (
                        <tr
                          key={c.id}
                          className={isSelected ? "selected-row" : ""}
                          onClick={() => setSelectedColor(c)}
                        >
                          <td>
                            <span
                              className="table-dot"
                              style={{ backgroundColor: c.hex }}
                            />
                          </td>
                          <td>
                            <strong>{c.name}</strong>
                          </td>
                          <td>
                            <code>{c.hex}</code>
                          </td>
                          <td>
                            <span className="sku-cell">{c.sku || `SKU-${c.id}`}</span>
                          </td>
                          <td>
                            <strong>{c.stock}</strong> un.
                          </td>
                          <td>
                            <span className={`stock-badge ${c.stock > 0 ? "in" : "out"}`}>
                              {c.stock > 0 ? "Disponível" : "Esgotado"}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`btn-choose-variant ${isSelected ? "chosen" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedColor(c);
                              }}
                            >
                              {isSelected ? "Selecionada" : "Escolher"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail actions: Quantity & Buy Button */}
      <div className="detail-actions">
        <div className="quantity-control">
          <button
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            aria-label="Diminuir quantidade"
          >
            −
          </button>
          <span>{quantity}</span>
          <button
            onClick={() => setQuantity((value) => Math.min(10, value + 1))}
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>
        <button
          className="button button-primary detail-buy"
          onClick={handleAddToCart}
        >
          <Icon name="cart" size={20} />
          {message || "Adicionar ao carrinho"}
        </button>
      </div>
    </div>
  );
}
