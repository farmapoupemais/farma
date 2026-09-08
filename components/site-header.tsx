"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark, Icon } from "./icons";

type CartLine = { quantity?: number };

function getCartCount() {
  try {
    const lines = JSON.parse(localStorage.getItem("poupe-mais-cart") ?? "[]") as CartLine[];
    return lines.reduce((total, line) => total + (line.quantity ?? 0), 0);
  } catch {
    return 0;
  }
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCartCount(getCartCount());
    refresh();
    window.addEventListener("poupe-mais-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("poupe-mais-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <>
      <div className="announcement">
        <div className="page-shell announcement-inner">
          <span><Icon name="truck" size={15} /> <strong>TELE-ENTREGA:</strong> (51) 98183-4039 • (51) 99794-8494</span>
          <div>
            <Link href="/lojas">Nossas lojas</Link>
            <Link href="/servicos">Serviços de saúde</Link>
            <Link href="/sobre">Atendimento</Link>
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="header-main page-shell">
          <Link href="/" className="brand header-brand" aria-label="Farmácia Poupe Mais — página inicial">
            <BrandMark size={42} />
            <span className="brand-copy">
              <strong>Farmácia</strong>
              <span>Poupe Mais</span>
              <small className="brand-slogan">Aqui se faz economia</small>
            </span>
          </Link>

          <form action="/catalogo" className="site-search" role="search">
            <Icon name="search" size={21} />
            <label className="sr-only" htmlFor="global-search">Buscar produtos</label>
            <input id="global-search" name="q" placeholder="Busque por produtos, marcas ou categorias" autoComplete="off" />
            <button type="submit" aria-label="Buscar"><Icon name="search" size={20} /></button>
          </form>

          <nav className="header-actions" aria-label="Ações da conta">
            <Link href="/lojas" className="header-action location-action"><Icon name="store" /><span><small>Informe sua região</small>Entrega e retirada</span></Link>
            <Link href="/login" className="header-action"><Icon name="user" /><span><small>Olá! Entre ou</small>Cadastre-se</span></Link>
            <Link href="/carrinho" className="header-action cart-action" aria-label={`Carrinho com ${cartCount} itens`}>
              <Icon name="cart" />
              {cartCount > 0 && <b>{cartCount}</b>}
              <span><small>Minha</small>Cesta</span>
            </Link>
            <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Abrir menu">
              <Icon name={menuOpen ? "close" : "menu"} />
            </button>
          </nav>
        </div>
        <nav className={`category-nav ${menuOpen ? "is-open" : ""}`} aria-label="Navegação principal">
          <div className="page-shell">
            <Link href="/catalogo" className="nav-all"><Icon name="menu" size={18} /> Todas as categorias</Link>
            <Link href="/catalogo?ofertas=1" className="nav-offers">Ofertas</Link>
            <Link href="/catalogo?categoria=Medicamentos">Medicamentos</Link>
            <Link href="/catalogo?categoria=Dermocosméticos">Dermocosméticos</Link>
            <Link href="/catalogo?categoria=Vitaminas">Vitaminas</Link>
            <Link href="/catalogo?categoria=Mamãe%20e%20bebê">Mamãe e bebê</Link>
            <Link href="/catalogo?categoria=Cuidados%20pessoais">Higiene e beleza</Link>
            <Link href="/servicos">Serviços de saúde</Link>
            <Link href="/catalogo?ofertas=1" className="nav-offers-highlight"><Icon name="spark" size={17} /> Super Ofertas</Link>
          </div>
        </nav>
      </header>
      <nav className="mobile-bottom-nav" aria-label="Acesso rápido">
        <Link href="/"><Icon name="store" size={21} /><span>Início</span></Link>
        <Link href="/catalogo"><Icon name="search" size={21} /><span>Buscar</span></Link>
        <Link href="/catalogo?ofertas=1"><Icon name="spark" size={21} /><span>Ofertas</span></Link>
        <Link href="/painel"><Icon name="user" size={21} /><span>Conta</span></Link>
        <Link href="/carrinho" className="mobile-cart"><Icon name="cart" size={21} />{cartCount > 0 && <b>{cartCount}</b>}<span>Cesta</span></Link>
      </nav>
    </>
  );
}
