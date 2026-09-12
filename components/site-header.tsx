"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  User,
  ShoppingBasket,
  Menu,
  X,
  Sparkles,
  PhoneCall,
  ChevronDown,
  Clock,
  CheckCircle,
} from "lucide-react";
import { catalogProducts, formatCurrency } from "@/lib/catalog";

type CartLine = { quantity?: number };

function subscribeCart(callback: () => void) {
  window.addEventListener("poupe-mais-cart-updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("poupe-mais-cart-updated", callback);
    window.removeEventListener("storage", callback);
  };
}

function getCartSnapshot(): number {
  try {
    const lines = JSON.parse(localStorage.getItem("poupe-mais-cart") ?? "[]") as CartLine[];
    return lines.reduce((total, line) => total + (line.quantity ?? 0), 0);
  } catch {
    return 0;
  }
}

function getCartServerSnapshot(): number {
  return 0;
}

function subscribeCep(callback: () => void) {
  window.addEventListener("poupe-mais-cep-updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("poupe-mais-cep-updated", callback);
    window.removeEventListener("storage", callback);
  };
}

function getCepSnapshot(): string {
  try {
    return localStorage.getItem("poupe-mais-user-cep") || "90010-000";
  } catch {
    return "90010-000";
  }
}

function getCepServerSnapshot(): string {
  return "90010-000";
}

const POPULAR_SEARCHES = [
  { label: "Dor e Febre (Dipirona / Paracetamol)", query: "dor" },
  { label: "Gripe, Resfriado e Tosse", query: "gripe" },
  { label: "Genéricos com Desconto (Até 70% OFF)", query: "generico" },
  { label: "Protetor Solar Facial FPS 50", query: "protetor" },
  { label: "Ômega 3 & Imunidade", query: "omega" },
  { label: "Uso Contínuo (Pressão e Diabetes)", query: "continuo" },
  { label: "Fraldas & Cuidados Infantis", query: "fralda" },
];

export function SiteHeader() {
  const cartCount = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
  const currentCep = useSyncExternalStore(subscribeCep, getCepSnapshot, getCepServerSnapshot);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cepModalOpen, setCepModalOpen] = useState(false);
  const [cepInput, setCepInput] = useState("");

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown de busca ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Resultados filtrados da busca em tempo real
  const searchResults = searchTerm.trim().length >= 2
    ? catalogProducts
        .filter((p) => {
          const q = searchTerm.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.shortDescription.toLowerCase().includes(q)
          );
        })
        .slice(0, 5)
    : [];

  function handleSaveCep(e: React.FormEvent) {
    e.preventDefault();
    if (cepInput.trim().length >= 8) {
      const formatted = cepInput.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2");
      try {
        localStorage.setItem("poupe-mais-user-cep", formatted);
        window.dispatchEvent(new Event("poupe-mais-cep-updated"));
      } catch {
        // ignore
      }
      setCepModalOpen(false);
      setCepInput("");
    }
  }

  return (
    <>
      {/* 1. TOP BAR — Plantão de Tele-Entrega & Links Institucionais */}
      <div className="bg-[#005a34] text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-yellow-300 font-semibold tracking-wide">
            <PhoneCall size={14} className="animate-pulse text-yellow-400" />
            <span>TELE-ENTREGA EXPRESSA: (51) 98183-4039 • (51) 99794-8494</span>
            <span className="hidden lg:inline text-white/80 font-normal text-[11px] ml-2">
              (Entrega em até 90 min em Porto Alegre e região)
            </span>
          </div>

          <div className="hidden md:flex items-center gap-5 text-white/90 text-[11.5px]">
            <Link href="/lojas" className="hover:text-yellow-300 transition-colors">
              Nossas Lojas
            </Link>
            <span>•</span>
            <Link href="/servicos" className="hover:text-yellow-300 transition-colors">
              Serviços Farmacêuticos
            </Link>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-200">
              <Clock size={12} /> Plantão até 22h30
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER — Barra de Busca Dominante (50%+), Logo e Ações */}
      <header className="site-header-raia-style bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 lg:gap-6">
          {/* Logo Oficial com Slogan */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2" aria-label="Farmácia Poupe Mais — Início">
            <img
              src="/logo-poupe-mais.png"
              alt="Farmácia Poupe Mais — Aqui se faz economia"
              className="brand-logo-img h-11 sm:h-12 w-auto object-contain"
              width={200}
              height={87}
              style={{ height: "48px", width: "auto", maxWidth: "200px", objectFit: "contain", display: "block" }}
            />
          </Link>

          {/* BARRA DE BUSCA CENTRALIZADA E DOMINANTE (O Centro do Mundo) */}
          <div
            ref={searchContainerRef}
            className="flex-grow max-w-2xl relative order-3 md:order-none w-full md:w-auto"
          >
            <form action="/catalogo" method="GET" className="relative flex w-full">
              <input
                id="search-input-header"
                type="text"
                name="q"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Digite o medicamento, sintoma (dor, gripe), princípio ativo ou marca..."
                className="w-full bg-[#f8faf9] border-2 border-[#00874e]/30 hover:border-[#00874e]/60 focus:border-[#00874e] focus:bg-white rounded-full py-2.5 pl-5 pr-12 text-sm text-gray-800 placeholder-gray-500 transition-all outline-none shadow-inner"
                autoComplete="off"
                aria-label="Buscar produtos, medicamentos e sintomas"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#00874e] hover:bg-[#005a34] text-white flex items-center justify-center transition-colors shadow-sm"
                aria-label="Buscar"
              >
                <Search size={18} />
              </button>
            </form>

            {/* DROPDOWN INTELIGENTE DE AUTOCOMPLETE EM TEMPO REAL */}
            {searchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fadeIn">
                {/* Caso 1: Termo de busca em digitação */}
                {searchTerm.trim().length >= 2 ? (
                  <div className="p-3">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
                      Medicamentos e Produtos Correspondentes
                    </div>

                    {searchResults.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            href={`/produto/${product.slug}`}
                            onClick={() => setSearchFocused(false)}
                            className="flex items-center justify-between p-2.5 hover:bg-[#f0fdf4] rounded-xl transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#00874e] font-bold text-xs">
                                💊
                              </div>
                              <div>
                                <h5 className="text-xs font-semibold text-gray-900 group-hover:text-[#00874e] leading-snug">
                                  {product.name}
                                </h5>
                                <span className="text-[11px] text-gray-500">{product.category} • {product.brand}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <strong className="text-sm font-bold text-[#005a34]">
                                {formatCurrency(product.priceCents)}
                              </strong>
                              {product.compareAtCents && (
                                <span className="block text-[10px] text-red-500 line-through">
                                  {formatCurrency(product.compareAtCents)}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-gray-500">
                        Nenhum produto encontrado diretamente para &quot;<strong>{searchTerm}</strong>&quot;.
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-100 mt-2">
                      <Link
                        href={`/catalogo?q=${encodeURIComponent(searchTerm)}`}
                        onClick={() => setSearchFocused(false)}
                        className="block w-full text-center py-2 text-xs font-bold text-[#00874e] hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        Ver todos os resultados no catálogo completo →
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Caso 2: Campo focado, buscas populares e sintomas frequentes */
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      <Sparkles size={14} className="text-yellow-500" /> Sintomas e Buscas Mais Frequentes
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {POPULAR_SEARCHES.map((item) => (
                        <Link
                          key={item.label}
                          href={`/catalogo?q=${encodeURIComponent(item.query)}`}
                          onClick={() => {
                            setSearchTerm(item.query);
                            setSearchFocused(false);
                          }}
                          className="text-xs py-1.5 px-3 rounded-full bg-gray-100 hover:bg-[#e6f4ed] hover:text-[#005a34] font-medium text-gray-700 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-gray-100 mt-2 text-[11px] text-gray-500">
                      <span>Dica: busque pelo sintoma (ex: febre, dor, azia)</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AÇÕES DA CONTA E CESTA */}
          <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">

            {/* Minha Conta */}
            <Link
              href="/login"
              className="flex items-center gap-2 text-gray-700 hover:text-[#005a34] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <User size={18} />
              </div>
              <div className="hidden lg:block text-left text-xs leading-tight">
                <span className="text-gray-500">Olá! Entre ou</span>
                <strong className="block font-bold text-gray-900">Cadastre-se</strong>
              </div>
            </Link>

            {/* Minha Cesta */}
            <Link
              href="/carrinho"
              className="flex items-center gap-2 text-gray-700 hover:text-[#005a34] transition-colors relative"
              aria-label={`Minha Cesta com ${cartCount} itens`}
            >
              <div className="w-9 h-9 rounded-full bg-[#e6f4ed] text-[#00874e] flex items-center justify-center relative">
                <ShoppingBasket size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:block text-left text-xs leading-tight">
                <span className="text-gray-500">Minha</span>
                <strong className="block font-bold text-gray-900">Cesta</strong>
              </div>
            </Link>

            {/* Botão Hambúrguer Mobile */}
            <button
              type="button"
              className="md:hidden p-2 text-gray-700 hover:text-[#00874e] rounded-lg border border-gray-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir Menu de Navegação"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* 3. CATEGORY BAR & MEGA MENU — Compre por Categoria & Geolocalização CEP */}
        <nav className="bg-[#f8faf9] border-t border-gray-200 relative">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-1">
              {/* Seletor Rápido de Região / CEP */}
              <button
                type="button"
                onClick={() => setCepModalOpen(true)}
                className="flex items-center gap-1.5 py-2.5 px-3 text-gray-700 hover:bg-emerald-50 hover:text-[#005a34] rounded-lg transition-colors font-semibold"
                title="Alterar CEP de entrega e estoque"
              >
                <MapPin size={15} className="text-[#00874e]" />
                <span className="hidden sm:inline">Entregar em:</span>
                <span className="font-bold underline text-[#005a34]">{currentCep}</span>
              </button>

              <span className="text-gray-300 mx-1 hidden sm:inline">|</span>

              {/* Botão Gatilho do MEGA MENU (Apenas Desktop) */}
              <div
                className="relative hidden md:block"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <button
                  id="mega-menu-trigger"
                  type="button"
                  onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-lg font-bold transition-colors ${
                    megaMenuOpen
                      ? "bg-[#00874e] text-white"
                      : "text-[#005a34] hover:bg-emerald-50"
                  }`}
                  aria-expanded={megaMenuOpen}
                >
                  <Menu size={16} />
                  <span>Compre por Categoria</span>
                  <ChevronDown size={14} className={`transition-transform ${megaMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* MEGA MENU INTERATIVO POR SINTOMA E URGÊNCIA CLÍNICA */}
                {megaMenuOpen && (
                  <div className="absolute top-full left-0 w-[840px] max-w-[95vw] bg-white rounded-b-2xl shadow-2xl border border-gray-200 p-6 z-50 animate-fadeIn">
                    <div className="grid grid-cols-4 gap-6">
                      {/* Coluna 1: Medicamentos por Sintoma */}
                      <div>
                        <div className="text-xs font-black text-[#005a34] uppercase tracking-wider pb-2 border-b border-emerald-100 mb-3 flex items-center gap-1.5">
                          <span>💊</span> Sintomas Imediatos
                        </div>
                        <ul className="space-y-2 text-xs text-gray-600">
                          <li>
                            <Link href="/catalogo?categoria=Medicamentos&q=dor" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Dor, Febre & Inflamação
                            </Link>
                          </li>
                          <li>
                            <Link href="/catalogo?categoria=Medicamentos&q=gripe" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Gripe, Tosse & Coriza
                            </Link>
                          </li>
                          <li>
                            <Link href="/catalogo?categoria=Medicamentos&q=digestivo" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Estômago, Fígado & Azia
                            </Link>
                          </li>
                          <li>
                            <Link href="/catalogo?categoria=Medicamentos&q=alergia" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Antialérgicos & Rinite
                            </Link>
                          </li>
                          <li>
                            <Link href="/catalogo?categoria=Medicamentos&q=sono" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Calmantes & Sono
                            </Link>
                          </li>
                        </ul>
                      </div>

                      {/* Coluna 2: Medicamentos & Cuidados */}
                      <div>
                        <div className="text-xs font-black text-[#005a34] uppercase tracking-wider pb-2 border-b border-emerald-100 mb-3 flex items-center gap-1.5">
                          <span>💊</span> Medicamentos & Cuidados
                        </div>
                        <ul className="space-y-2 text-xs text-gray-600">
                          <li>
                            <Link href="/catalogo?categoria=Medicamentos&q=continuo" className="hover:text-[#00874e] hover:font-bold transition-all block font-semibold text-gray-800">
                              Uso Contínuo (Pressão / Diabetes)
                            </Link>
                          </li>
                          <li>
                            <Link href="/catalogo?categoria=Medicamentos&ofertas=1" className="hover:text-[#00874e] hover:font-bold transition-all block text-red-600 font-bold">
                              Genéricos (Até 70% OFF)
                            </Link>
                          </li>
                          <li>
                            <Link href={`/catalogo?categoria=${encodeURIComponent("Primeiros socorros")}`} className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Primeiros Socorros & Curativos
                            </Link>
                          </li>
                          <li>
                            <Link href="/catalogo?categoria=Medicamentos" className="hover:text-[#00874e] text-[#005a34] font-bold block pt-1">
                              Ver Todos os Medicamentos →
                            </Link>
                          </li>
                        </ul>
                      </div>

                      {/* Coluna 3: Dermocosméticos & Beleza */}
                      <div>
                        <div className="text-xs font-black text-[#005a34] uppercase tracking-wider pb-2 border-b border-emerald-100 mb-3 flex items-center gap-1.5">
                          <span>✨</span> Dermocosméticos
                        </div>
                        <ul className="space-y-2 text-xs text-gray-600">
                          <li>
                            <Link href="/catalogo?categoria=Dermocosméticos&q=protetor" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Protetor Solar FPS 50 / 70
                            </Link>
                          </li>
                          <li>
                            <Link href="/catalogo?categoria=Dermocosméticos&q=hidratante" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Hidratantes Faciais & Corporais
                            </Link>
                          </li>
                          <li>
                            <Link href="/catalogo?categoria=Dermocosméticos" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Tratamento Anti-idade e Séruns
                            </Link>
                          </li>
                          <li>
                            <Link href="/catalogo?categoria=Cuidados%20pessoais" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Cabelos, Shampoos e Higiene
                            </Link>
                          </li>
                        </ul>
                      </div>

                      {/* Coluna 4: Mamãe, Bebê & Vitaminas */}
                      <div>
                        <div className="text-xs font-black text-[#005a34] uppercase tracking-wider pb-2 border-b border-emerald-100 mb-3 flex items-center gap-1.5">
                          <span>👶</span> Infantil & Vitaminas
                        </div>
                        <ul className="space-y-2 text-xs text-gray-600">
                          <li>
                            <Link href="/catalogo?categoria=Mamãe%20e%20bebê&q=fralda" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Fraldas & Lenços Umedecidos
                            </Link>
                          </li>
                          <li>
                            <Link href="/catalogo?categoria=Mamãe%20e%20bebê" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Fórmulas e Mamadeiras
                            </Link>
                          </li>
                          <li>
                            <Link href="/catalogo?categoria=Vitaminas" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Ômega 3, Vitamina D e C
                            </Link>
                          </li>
                          <li>
                            <Link href="/catalogo?categoria=Cuidados%20pessoais&q=curativo" className="hover:text-[#00874e] hover:font-bold transition-all block">
                              Primeiros Socorros & Curativos
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Rodapé do Mega Menu com Plantão */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs bg-emerald-50/60 p-3 rounded-xl">
                      <div className="flex items-center gap-2 text-[#005a34] font-bold">
                        <CheckCircle size={16} className="text-[#00874e]" />
                        <span>Farmacêutico Responsável de Plantão: Dr. Raul da Costa • CRF/RS 12.345</span>
                      </div>
                      <Link href="/servicos" className="text-xs font-bold text-[#00874e] hover:underline">
                        Ver todos os serviços farmacêuticos →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Links Rápidos de Categorias no Topo */}
            <div className="hidden md:flex items-center gap-5">
              <Link
                href="/catalogo?ofertas=1"
                className="flex items-center gap-1 py-2.5 text-red-600 font-extrabold hover:text-red-700 transition-colors"
              >
                <Sparkles size={14} /> Super Ofertas
              </Link>
              <Link
                href="/catalogo?categoria=Medicamentos"
                className="py-2.5 text-gray-700 hover:text-[#00874e] transition-colors font-medium"
              >
                Medicamentos
              </Link>
              <Link
                href="/catalogo?categoria=Medicamentos&ofertas=1"
                className="py-2.5 text-emerald-800 hover:text-emerald-950 transition-colors font-bold"
              >
                Genéricos 70% OFF
              </Link>
              <Link
                href="/catalogo?categoria=Dermocosméticos"
                className="py-2.5 text-gray-700 hover:text-[#00874e] transition-colors font-medium"
              >
                Dermocosméticos
              </Link>
              <Link
                href="/catalogo?categoria=Mamãe%20e%20bebê"
                className="py-2.5 text-gray-700 hover:text-[#00874e] transition-colors font-medium"
              >
                Mamãe e Bebê
              </Link>
              <Link
                href="/catalogo?categoria=Vitaminas"
                className="py-2.5 text-gray-700 hover:text-[#00874e] transition-colors font-medium"
              >
                Vitaminas
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* MENU DRAWER MOBILE */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex md:hidden">
          <div className="bg-white w-4/5 max-w-sm h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl animate-fadeIn">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <img
                  src="/logo-poupe-mais.png"
                  alt="Farmácia Poupe Mais"
                  className="brand-logo-img"
                  style={{ height: "40px", width: "auto" }}
                />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-900 rounded-lg"
                  aria-label="Fechar menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navegação por Categorias e Sintomas */}
              <div className="space-y-4">
                <div className="text-xs font-black text-gray-400 uppercase tracking-wider">
                  Categorias Principais
                </div>
                <div className="flex flex-col space-y-2 text-sm font-semibold text-gray-800">
                  <Link
                    href="/catalogo?ofertas=1"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-red-600 font-bold"
                  >
                    <Sparkles size={16} /> Super Ofertas
                  </Link>
                  <Link
                    href="/catalogo?categoria=Medicamentos"
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-[#00874e] py-1"
                  >
                    💊 Medicamentos
                  </Link>
                  <Link
                    href="/catalogo?categoria=Medicamentos&ofertas=1"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-emerald-700 font-bold py-1"
                  >
                    ⚡ Genéricos com até 70% OFF
                  </Link>
                  <Link
                    href="/catalogo?categoria=Dermocosméticos"
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-[#00874e] py-1"
                  >
                    ✨ Dermocosméticos
                  </Link>
                  <Link
                    href="/catalogo?categoria=Mamãe%20e%20bebê"
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-[#00874e] py-1"
                  >
                    👶 Mamãe e Bebê
                  </Link>
                  <Link
                    href="/catalogo?categoria=Vitaminas"
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-[#00874e] py-1"
                  >
                    🌿 Vitaminas & Imunidade
                  </Link>
                </div>
              </div>

              {/* Serviços e Lojas */}
              <div className="mt-6 pt-4 border-t border-gray-100 space-y-2.5 text-xs text-gray-600">
                <Link
                  href="/lojas"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 hover:text-[#00874e]"
                >
                  <MapPin size={14} className="text-[#00874e]" /> Nossas Lojas e Horários
                </Link>
                <Link
                  href="/servicos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 hover:text-[#00874e]"
                >
                  <CheckCircle size={14} className="text-[#00874e]" /> Serviços Farmacêuticos
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 hover:text-[#00874e]"
                >
                  <User size={14} className="text-[#00874e]" /> Minha Conta / Entrar
                </Link>
              </div>
            </div>

            {/* Rodapé do Menu Móvel */}
            <div className="pt-4 border-t border-gray-100 mt-6">
              <a
                href="https://wa.me/5551981834039?text=Ol%C3%A1!%20Gostaria%20de%20fazer%20um%20pedido%20para%20tele-entrega%20na%20Farm%C3%A1cia%20Poupe%20Mais."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#25D366] text-white font-bold text-xs rounded-xl shadow-sm"
              >
                <PhoneCall size={14} /> Tele-Entrega WhatsApp (51) 98183-4039
              </a>
              <div className="text-[10px] text-gray-500 text-center mt-2">
                Plantão Farmacêutico: Dr. Raul da Costa • CRF/RS 12.345
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* MODAL DE INFORMAR CEP */}
      {cepModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-[#005a34] font-black text-base">
                <MapPin size={20} className="text-[#00874e]" />
                <h3>Onde você quer receber seu pedido?</h3>
              </div>
              <button
                type="button"
                onClick={() => setCepModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Informe seu CEP para consultar estoque em tempo real na loja mais próxima e calcular o prazo da nossa tele-entrega expressa (até 90 minutos).
            </p>

            <form onSubmit={handleSaveCep} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="cep-input-header">
                  Digite seu CEP:
                </label>
                <input
                  id="cep-input-header"
                  type="text"
                  maxLength={9}
                  value={cepInput}
                  onChange={(e) => setCepInput(e.target.value)}
                  placeholder="Ex: 90010-000"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:border-[#00874e] outline-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCepModalOpen(false)}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl text-xs font-bold bg-[#00874e] hover:bg-[#005a34] text-white shadow-md transition-colors"
                >
                  Confirmar Região
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NAVEGAÇÃO MÓVEL INFERIOR */}
      <nav className="mobile-bottom-nav md:hidden" aria-label="Acesso rápido móvel">
        <Link href="/">
          <span className="text-lg">🏠</span>
          <span>Início</span>
        </Link>
        <Link href="/catalogo">
          <Search size={20} />
          <span>Buscar</span>
        </Link>
        <Link href="/lojas">
          <MapPin size={20} />
          <span>Lojas</span>
        </Link>
        <Link href="/catalogo?ofertas=1">
          <Sparkles size={20} className="text-red-500" />
          <span>Ofertas</span>
        </Link>
        <Link href="/carrinho" className="mobile-cart relative">
          <ShoppingBasket size={20} />
          {cartCount > 0 && <b>{cartCount}</b>}
          <span>Cesta</span>
        </Link>
      </nav>
    </>
  );
}
