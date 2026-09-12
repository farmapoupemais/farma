"use client";

import { useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "./product-card";
import { Icon } from "./icons";

export function CatalogBrowser({ products, initialQuery = "", initialCategory = "" }: { products: CatalogProduct[]; initialQuery?: string; initialCategory?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("relevance");
  const categoryOptions = Array.from(new Set(products.map((product) => product.category))).sort();

  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = products.filter((product) => {
    const matchesCategory = !category || product.category === category;
    const haystack = `${product.name} ${product.brand} ${product.shortDescription} ${product.category}`.toLocaleLowerCase("pt-BR");
    return matchesCategory && (!normalized || haystack.includes(normalized));
  });
  const visible = [...filtered].sort((a, b) => {
    if (sort === "price-asc") return a.priceCents - b.priceCents;
    if (sort === "price-desc") return b.priceCents - a.priceCents;
    if (sort === "name") return a.name.localeCompare(b.name, "pt-BR");
    return Number(Boolean(b.badge)) - Number(Boolean(a.badge));
  });

  return (
    <div className="catalog-layout">
      <aside className="catalog-filters" aria-label="Filtros do catálogo">
        <div className="filter-heading"><strong>Filtrar por</strong>{(category || query) && <button onClick={() => { setCategory(""); setQuery(""); }}>Limpar</button>}</div>
        <label className="catalog-search"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar no catálogo" /></label>
        <fieldset><legend>Categoria</legend><label className={!category ? "selected" : ""}><input type="radio" name="category" checked={!category} onChange={() => setCategory("")} /> Todas <span>{products.length}</span></label>{categoryOptions.map((option) => <label key={option} className={category === option ? "selected" : ""}><input type="radio" name="category" checked={category === option} onChange={() => setCategory(option)} /> {option}<span>{products.filter((product) => product.category === option).length}</span></label>)}</fieldset>
        <div className="filter-note"><Icon name="shield" /><p><strong>Compra 100% segura</strong>Medicamentos e produtos originais com procedência garantida, entrega expressa e orientação farmacêutica.</p></div>
      </aside>
      <section className="catalog-results">
        <div className="results-toolbar"><p><strong>{visible.length}</strong> {visible.length === 1 ? "produto encontrado" : "produtos encontrados"}</p><label>Ordenar por <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="relevance">Relevância</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option><option value="name">Nome A–Z</option></select></label></div>
        {visible.length ? <div className="product-grid catalog-product-grid">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><span><Icon name="search" size={34} /></span><h2>Nenhum produto encontrado</h2><p>Tente outro termo ou remova alguns filtros.</p><button className="button button-primary" onClick={() => { setCategory(""); setQuery(""); }}>Ver todos os produtos</button></div>}
      </section>
    </div>
  );
}
