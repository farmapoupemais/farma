"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Role } from "@/lib/access";
import { catalogProducts, formatCurrency, type ProductColor } from "@/lib/catalog";
import { BrandMark, Icon } from "./icons";
import { supabase } from "@/lib/supabase";

type DashboardRole = Role;
type ViewKey = "overview" | "orders" | "catalog" | "marketing" | "team" | "account";

const roleLabels: Record<DashboardRole, string> = {
  owner: "Proprietário",
  manager: "Gerente",
  pharmacist: "Farmacêutico",
  catalog: "Catálogo e marketing",
  support: "Atendimento",
  customer: "Cliente",
};

const navItems: { key: ViewKey; label: string; icon: string; roles: DashboardRole[] }[] = [
  { key: "overview", label: "Visão geral", icon: "spark", roles: ["owner", "manager", "pharmacist", "catalog", "support", "customer"] },
  { key: "orders", label: "Pedidos", icon: "cart", roles: ["owner", "manager", "support", "customer"] },
  { key: "catalog", label: "Produtos e estoque", icon: "capsule", roles: ["owner", "manager", "catalog"] },
  { key: "marketing", label: "Banners e descontos", icon: "sun", roles: ["owner", "manager", "catalog"] },
  { key: "team", label: "Equipe e permissões", icon: "user", roles: ["owner"] },
  { key: "account", label: "Minha conta", icon: "user", roles: ["customer"] },
];

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  barcode?: string;
  images?: string[];
  colors?: ProductColor[];
  shortDescription?: string;
  description?: string;
  priceCents: number;
  compareAtCents?: number | null;
  stock: number;
  regulatoryStatus: string;
  isActive: boolean;
};

export type AdminOrder = {
  id: string;
  customer_email: string;
  customer_name?: string;
  status: string;
  fulfillment: string;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  items_json: Array<{ id: string; name?: string; quantity: number; priceCents?: number }>;
  address_json?: { street?: string; city?: string; state?: string; zip?: string } | null;
  created_at: string;
};

export type AdminBanner = {
  id: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  tone?: string;
  is_active: boolean;
};

export type AdminDiscount = {
  id: string;
  name: string;
  code: string;
  kind: "percent" | "fixed";
  amount: number;
  min_subtotal_cents: number;
  is_active: boolean;
};

export type TeamMember = {
  email: string;
  role: string;
  created_by?: string;
  updated_at?: string;
};

export type AuditLog = {
  id: number | string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata_json?: Record<string, unknown>;
  created_at: string;
};

function StatusPill({ children }: { children: React.ReactNode }) {
  const label = String(children).toLowerCase();
  const tone =
    label.includes("baixo") ||
    label.includes("aguardando") ||
    label.includes("revisão") ||
    label.includes("rejeitado") ||
    label.includes("inativo") ||
    label.includes("pausado") ||
    label.includes("cancelado")
      ? "warning"
      : label.includes("rota") || label.includes("separando")
      ? "info"
      : "success";
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        headers["authorization"] = `Bearer ${data.session.access_token}`;
      }
    } catch {
      // ignore
    }
  }
  return headers;
}

export function RoleDashboard({
  initialRole,
  userName,
  userEmail,
  demo = false,
}: {
  initialRole: DashboardRole;
  userName: string;
  userEmail: string;
  demo?: boolean;
}) {
  const [role, setRole] = useState(initialRole);
  const [view, setView] = useState<ViewKey>("overview");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState<"product" | "banner" | "discount" | "role" | null>(null);

  // Data states
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [ordersList, setOrdersList] = useState<AdminOrder[]>([]);
  const [bannersList, setBannersList] = useState<AdminBanner[]>([]);
  const [discountsList, setDiscountsList] = useState<AdminDiscount[]>([]);
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [auditList, setAuditList] = useState<AuditLog[]>([]);

  // Filter & Search states
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [catalogStatus, setCatalogStatus] = useState("all");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Loading states
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const visibleNav = useMemo(() => navItems.filter((item) => item.roles.includes(role)), [role]);

  // Load products
  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      setCatalogLoading(true);
      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch("/api/admin/products", { headers: authHeaders });
        const body = await response.json();
        if (active) {
          if (response.ok && body.products) {
            setAdminProducts(body.products);
          } else {
            setAdminProducts(catalogProducts.map((p) => ({ ...p, regulatoryStatus: "approved", isActive: true })));
          }
          setCatalogError("");
        }
      } catch (err: unknown) {
        if (active) {
          setCatalogError(err instanceof Error ? err.message : "Erro ao carregar catálogo.");
          setAdminProducts(catalogProducts.map((p) => ({ ...p, regulatoryStatus: "approved", isActive: true })));
        }
      } finally {
        if (active) setCatalogLoading(false);
      }
    }
    loadCatalog();
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  // Load orders, marketing, team, audit
  useEffect(() => {
    let active = true;
    async function loadAuxiliaryData() {
      try {
        const authHeaders = await getAuthHeaders();
        const [ordersRes, bannersRes, discountsRes, teamRes, auditRes] = await Promise.all([
          fetch("/api/admin/orders", { headers: authHeaders }),
          fetch("/api/admin/banners", { headers: authHeaders }),
          fetch("/api/admin/discounts", { headers: authHeaders }),
          fetch("/api/admin/users/roles", { headers: authHeaders }),
          fetch("/api/admin/audit", { headers: authHeaders }),
        ]);

        if (active) {
          if (ordersRes.ok) {
            const data = await ordersRes.json();
            if (data.orders) setOrdersList(data.orders);
          }
          if (bannersRes.ok) {
            const data = await bannersRes.json();
            if (data.banners) setBannersList(data.banners);
          }
          if (discountsRes.ok) {
            const data = await discountsRes.json();
            if (data.discounts) setDiscountsList(data.discounts);
          }
          if (teamRes.ok) {
            const data = await teamRes.json();
            if (data.users) setTeamList(data.users);
          }
          if (auditRes.ok) {
            const data = await auditRes.json();
            if (data.logs) setAuditList(data.logs);
          }
        }
      } catch {
        // ignore errors
      }
    }
    loadAuxiliaryData();
    return () => {
      active = false;
    };
  }, [refreshTrigger, view]);

  function chooseRole(nextRole: DashboardRole) {
    setRole(nextRole);
    setView("overview");
    setFormOpen(null);
    setNotice(`Visualização alterada para ${roleLabels[nextRole]}.`);
    setTimeout(() => setNotice(""), 1800);
  }

  // Quick stock adjustment (+1 / -1)
  async function handleQuickStock(productId: string, delta: number) {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { ...authHeaders, "content-type": "application/json" },
        body: JSON.stringify({ id: productId, deltaStock: delta }),
      });
      if (response.ok) {
        setAdminProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
        );
      }
    } catch {
      // ignore
    }
  }

  // Delete product
  async function handleDeleteProduct(id: string) {
    if (!confirm("Deseja realmente excluir este produto do catálogo?")) return;
    setNotice("Excluindo produto…");
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Erro ao excluir.");
      setAdminProducts((prev) => prev.filter((p) => p.id !== id));
      setNotice("Produto excluído com sucesso.");
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Não foi possível excluir o produto.");
    }
    setTimeout(() => setNotice(""), 2500);
  }

  // Edit product
  async function handleUpdateProduct(e: React.FormEvent<HTMLFormElement>, images: string[], colors: ProductColor[]) {
    e.preventDefault();
    if (!editingProduct) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setNotice("Salvando alterações do produto…");

    const payload = {
      id: editingProduct.id,
      name: String(data.get("name") ?? "").trim(),
      slug: String(data.get("slug") ?? "").trim(),
      brand: String(data.get("brand") ?? "").trim(),
      category: String(data.get("category") ?? "").trim(),
      barcode: String(data.get("barcode") ?? "").trim(),
      images,
      colors,
      priceCents: Number(data.get("priceCents")),
      compareAtCents: data.get("compareAtCents") ? Number(data.get("compareAtCents")) : null,
      stock: Number(data.get("stock")),
      shortDescription: String(data.get("shortDescription") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      isActive: data.get("isActive") === "on",
    };

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { ...authHeaders, "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Não foi possível salvar.");
      setAdminProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p)));
      setEditingProduct(null);
      setNotice("Produto atualizado com sucesso!");
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Erro ao atualizar.");
    }
    setTimeout(() => setNotice(""), 2500);
  }

  // Create product
  async function handleCreateProduct(e: React.FormEvent<HTMLFormElement>, images: string[], colors: ProductColor[]) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setNotice("Cadastrando produto…");

    const customId = String(data.get("id") ?? "").trim();
    const payload = {
      id: customId || undefined,
      name: String(data.get("name") ?? "").trim(),
      slug: String(data.get("slug") ?? "").trim(),
      brand: String(data.get("brand") ?? "").trim(),
      category: String(data.get("category") ?? "").trim(),
      barcode: String(data.get("barcode") ?? "").trim(),
      images,
      colors,
      priceCents: Number(data.get("priceCents")),
      compareAtCents: data.get("compareAtCents") ? Number(data.get("compareAtCents")) : null,
      stock: Number(data.get("stock")),
      shortDescription: String(data.get("shortDescription") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
    };

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { ...authHeaders, "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Não foi possível cadastrar o produto.");
      setNotice("Produto cadastrado com sucesso!");
      setFormOpen(null);
      setRefreshTrigger((c) => c + 1);
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Erro ao cadastrar.");
    }
    setTimeout(() => setNotice(""), 2500);
  }

  // Update product colors directly
  async function handleSaveProductColors(productId: string, nextColors: ProductColor[]) {
    setNotice("Salvando tabela de cores…");
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { ...authHeaders, "content-type": "application/json" },
        body: JSON.stringify({ id: productId, colors: nextColors }),
      });
      if (!res.ok) throw new Error("Não foi possível salvar as cores.");
      setAdminProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, colors: nextColors } : p))
      );
      setNotice("Tabela de cores atualizada com sucesso!");
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Erro ao salvar cores.");
    }
    setTimeout(() => setNotice(""), 2500);
  }

  // Order status transition
  async function handleOrderStatusChange(orderId: string, newStatus: string) {
    setNotice(`Atualizando status do pedido ${orderId}…`);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { ...authHeaders, "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Não foi possível atualizar o status.");
      setOrdersList((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      setNotice(`Pedido atualizado para: ${newStatus}`);
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Erro na transição do pedido.");
    }
    setTimeout(() => setNotice(""), 2500);
  }

  // Toggle banner active
  async function handleToggleBanner(bannerId: string, currentActive: boolean) {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/admin/banners", {
        method: "PATCH",
        headers: { ...authHeaders, "content-type": "application/json" },
        body: JSON.stringify({ id: bannerId, isActive: !currentActive }),
      });
      if (res.ok) {
        setBannersList((prev) =>
          prev.map((b) => (b.id === bannerId ? { ...b, is_active: !currentActive } : b))
        );
        setNotice(currentActive ? "Banner pausado." : "Banner ativado.");
      }
    } catch {
      setNotice("Erro ao atualizar banner.");
    }
    setTimeout(() => setNotice(""), 2000);
  }

  // Delete banner
  async function handleDeleteBanner(bannerId: string) {
    if (!confirm("Deseja realmente excluir este banner?")) return;
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/admin/banners?id=${encodeURIComponent(bannerId)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        setBannersList((prev) => prev.filter((b) => b.id !== bannerId));
        setNotice("Banner excluído.");
      }
    } catch {
      setNotice("Erro ao excluir banner.");
    }
    setTimeout(() => setNotice(""), 2000);
  }

  // Toggle discount active
  async function handleToggleDiscount(discountId: string, currentActive: boolean) {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/admin/discounts", {
        method: "PATCH",
        headers: { ...authHeaders, "content-type": "application/json" },
        body: JSON.stringify({ id: discountId, isActive: !currentActive }),
      });
      if (res.ok) {
        setDiscountsList((prev) =>
          prev.map((d) => (d.id === discountId ? { ...d, is_active: !currentActive } : d))
        );
        setNotice(currentActive ? "Cupom pausado." : "Cupom ativado.");
      }
    } catch {
      setNotice("Erro ao atualizar cupom.");
    }
    setTimeout(() => setNotice(""), 2000);
  }

  // Delete discount
  async function handleDeleteDiscount(discountId: string) {
    if (!confirm("Deseja realmente excluir este cupom de desconto?")) return;
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/admin/discounts?id=${encodeURIComponent(discountId)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        setDiscountsList((prev) => prev.filter((d) => d.id !== discountId));
        setNotice("Cupom excluído.");
      }
    } catch {
      setNotice("Erro ao excluir cupom.");
    }
    setTimeout(() => setNotice(""), 2000);
  }

  // Revoke team role
  async function handleRevokeRole(memberEmail: string) {
    if (!confirm(`Deseja revogar as permissões administrativas de ${memberEmail}?`)) return;
    setNotice("Revogando acesso…");
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/admin/users/roles?email=${encodeURIComponent(memberEmail)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Não foi possível revogar.");
      }
      setTeamList((prev) => prev.filter((m) => m.email.toLowerCase() !== memberEmail.toLowerCase()));
      setNotice("Acesso revogado com sucesso.");
      setRefreshTrigger((c) => c + 1);
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Erro ao revogar.");
    }
    setTimeout(() => setNotice(""), 2500);
  }

  // Update team role directly
  async function handleUpdateTeamRole(memberEmail: string, nextRole: string) {
    setNotice("Atualizando perfil da equipe…");
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/admin/users/roles", {
        method: "POST",
        headers: { ...authHeaders, "content-type": "application/json" },
        body: JSON.stringify({ email: memberEmail, role: nextRole }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar cargo.");
      setTeamList((prev) =>
        prev.map((m) => (m.email.toLowerCase() === memberEmail.toLowerCase() ? { ...m, role: nextRole } : m))
      );
      setNotice(`Perfil de ${memberEmail} alterado para ${roleLabels[nextRole as DashboardRole] || nextRole}.`);
      setRefreshTrigger((c) => c + 1);
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : "Erro ao atualizar cargo.");
    }
    setTimeout(() => setNotice(""), 2500);
  }

  // Generic submit
  async function submitApi(event: React.FormEvent<HTMLFormElement>, endpoint: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    setNotice("Salvando dados…");

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { ...authHeaders, "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível salvar.");
      setNotice("Registro salvo com sucesso e auditado.");
      setFormOpen(null);
      form.reset();
      setRefreshTrigger((c) => c + 1);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Tente novamente.");
    }
    setTimeout(() => setNotice(""), 2800);
  }

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = "/login";
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link href="/" className="brand brand-light">
          <BrandMark size={34} />
          <span className="brand-copy">
            <strong>Farmácia</strong>
            <span>Poupe Mais</span>
          </span>
        </Link>
        <div className="workspace-label">
          <small>Painel de Operação</small>
          <strong>{roleLabels[role]}</strong>
        </div>
        <nav aria-label="Navegação do painel">
          {visibleNav.map((item) => (
            <button
              key={item.key}
              className={view === item.key ? "active" : ""}
              onClick={() => {
                setView(item.key);
                setFormOpen(null);
                setEditingProduct(null);
                setSelectedOrder(null);
              }}
            >
              <Icon name={item.icon} size={19} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <span>{userName.slice(0, 1).toUpperCase()}</span>
          <p>
            <strong>{userName}</strong>
            <small>{demo ? "ambiente demonstrativo" : userEmail}</small>
          </p>
          <button
            onClick={handleSignOut}
            title="Sair da conta"
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: "1.2rem",
              padding: "4px",
            }}
          >
            🚪
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="eyebrow">{demo ? "Demonstração Interativa" : "Área Administrativa"}</span>
            <h1>
              {view === "overview"
                ? `Olá, ${userName.split(" ")[0]}.`
                : visibleNav.find((item) => item.key === view)?.label}
            </h1>
          </div>
          <div className="topbar-actions">
            {demo && (
              <label>
                Ver como{" "}
                <select value={role} onChange={(e) => chooseRole(e.target.value as DashboardRole)}>
                  {Object.entries(roleLabels).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              onClick={() => setRefreshTrigger((c) => c + 1)}
              title="Recarregar dados"
              style={{ padding: "0 10px", width: "auto", fontSize: "0.7rem" }}
            >
              ↻ Atualizar
            </button>
          </div>
        </header>

        {notice && <div className="dashboard-notice" role="status">{notice}</div>}

        {/* 1. VISÃO GERAL */}
        {view === "overview" && (
          <Overview
            role={role}
            setView={setView}
            products={adminProducts}
            orders={ordersList}
            banners={bannersList}
            discounts={discountsList}
            team={teamList}
          />
        )}

        {/* 2. GESTÃO DE PEDIDOS */}
        {view === "orders" && (
          <OrdersView
            orders={ordersList}
            onStatusChange={handleOrderStatusChange}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            customer={role === "customer"}
          />
        )}

        {/* 3. PRODUTOS E ESTOQUE */}
        {view === "catalog" && (
          <CatalogView
            products={adminProducts}
            query={catalogQuery}
            setQuery={setCatalogQuery}
            categoryFilter={catalogCategory}
            setCategoryFilter={setCatalogCategory}
            statusFilter={catalogStatus}
            setStatusFilter={setCatalogStatus}
            formOpen={formOpen}
            setFormOpen={setFormOpen}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            onQuickStock={handleQuickStock}
            onDeleteProduct={handleDeleteProduct}
            onUpdateProduct={handleUpdateProduct}
            onCreateProduct={handleCreateProduct}
            onSaveColors={handleSaveProductColors}
            loading={catalogLoading}
            error={catalogError}
          />
        )}

        {/* 4. MARKETING (BANNERS E CUPONS) */}
        {view === "marketing" && (
          <MarketingView
            banners={bannersList}
            discounts={discountsList}
            formOpen={formOpen}
            setFormOpen={setFormOpen}
            onToggleBanner={handleToggleBanner}
            onDeleteBanner={handleDeleteBanner}
            onToggleDiscount={handleToggleDiscount}
            onDeleteDiscount={handleDeleteDiscount}
            onSubmit={submitApi}
          />
        )}


        {/* 6. EQUIPE E PERMISSÕES */}
        {view === "team" && (
          <TeamView
            team={teamList}
            auditLogs={auditList}
            formOpen={formOpen}
            setFormOpen={setFormOpen}
            onUpdateRole={handleUpdateTeamRole}
            onRevokeRole={handleRevokeRole}
            onSubmit={submitApi}
          />
        )}

        {/* 7. CONTA */}
        {view === "account" && <AccountView userName={userName} userEmail={userEmail} />}
      </main>
    </div>
  );
}

// ----------------------------------------------------------------------
// COMPONENTE: VISÃO GERAL
// ----------------------------------------------------------------------
function Overview({
  role,
  setView,
  products,
  orders,
  banners,
  discounts,
  team,
}: {
  role: DashboardRole;
  setView: (v: ViewKey) => void;
  products: AdminProduct[];
  orders: AdminOrder[];
  banners: AdminBanner[];
  discounts: AdminDiscount[];
  team: TeamMember[];
}) {
  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const activeBannersCount = banners.filter((b) => b.is_active).length;
  const activeCouponsCount = discounts.filter((d) => d.is_active).length;
  const activeOrdersCount = orders.filter((o) => o.status === "Separando" || o.status === "Em rota").length;

  if (role === "customer") {
    return (
      <div className="dashboard-stack">
        <section className="customer-welcome">
          <div>
            <span className="eyebrow">Sua saúde em um só lugar</span>
            <h2>O que você precisa hoje?</h2>
            <p>Acompanhe pedidos, benefícios e cupons de economia com comodidade.</p>
            <div>
              <Link href="/catalogo" className="button button-primary">
                Ver catálogo de produtos
              </Link>
              <button className="button button-ghost" onClick={() => setView("orders")}>
                Meus pedidos
              </button>
            </div>
          </div>
          <Icon name="heart" size={100} strokeWidth={1.1} />
        </section>
        <div className="metric-grid customer-metrics">
          <Metric label="Pedidos registrados" value={String(orders.length)} detail="atualizado agora" icon="cart" />
          <Metric label="Ofertas ativas" value={String(activeCouponsCount)} detail="cupons disponíveis" icon="spark" />
          <Metric label="Atendimento seguro" value="100% MIPs" detail="produtos sem retenção" icon="care" />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-stack">
      <div className="metric-grid">
        <Metric
          label="Produtos no catálogo"
          value={String(products.length)}
          detail={`${products.filter((p) => p.isActive).length} ativos no site`}
          icon="capsule"
        />
        <Metric
          label="Estoque crítico"
          value={String(lowStockCount)}
          detail={lowStockCount > 0 ? "Exigem reposição urgente" : "Estoque regular"}
          icon="care"
        />
        <Metric
          label="Pedidos ativos"
          value={String(activeOrdersCount || orders.length)}
          detail={`${orders.length} pedidos no total`}
          icon="cart"
        />
        <Metric
          label="Campanhas no ar"
          value={String(activeBannersCount + activeCouponsCount)}
          detail={`${activeBannersCount} banners • ${activeCouponsCount} cupons`}
          icon="sun"
        />
      </div>

      <div className="dashboard-columns">
        <section className="dashboard-card">
          <CardHeading title="Pedidos recentes" action="Ver todos" onClick={() => setView("orders")} />
          <div className="data-table">
            <div className="data-row data-head">
              <span>Pedido</span>
              <span>Cliente</span>
              <span>Tipo</span>
              <span>Total</span>
              <span>Status</span>
            </div>
            {orders.slice(0, 4).map((o) => (
              <div className="data-row" key={o.id}>
                <span>
                  <strong>{o.id}</strong>
                  <small>{new Date(o.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>
                </span>
                <span>{o.customer_name || o.customer_email}</span>
                <span>{o.fulfillment === "delivery" ? "Entrega" : "Retirada"}</span>
                <span>{formatCurrency(o.total_cents)}</span>
                <span><StatusPill>{o.status}</StatusPill></span>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-card activity-card">
          <CardHeading title="Pontos de Atenção" />
          <ul>
            <li>
              <span className="activity-dot coral" />
              <p>
                <strong>{lowStockCount} produtos com estoque baixo</strong>
                <small>Necessitam reposição no catálogo</small>
              </p>
            </li>
            <li>
              <span className="activity-dot sage" />
              <p>
                <strong>{activeBannersCount} banners ativos na página inicial</strong>
                <small>Visíveis para todos os clientes</small>
              </p>
            </li>
            <li>
              <span className="activity-dot blue" />
              <p>
                <strong>{team.length} membros na equipe com acesso</strong>
                <small>Segurança e permissões ativas</small>
              </p>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: string }) {
  return (
    <article className="metric-card">
      <span>
        <Icon name={icon} size={21} />
      </span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function CardHeading({ title, action, onClick }: { title: string; action?: string; onClick?: () => void }) {
  return (
    <header className="card-heading">
      <h2>{title}</h2>
      {action && <button onClick={onClick}>{action} →</button>}
    </header>
  );
}

// ----------------------------------------------------------------------
// COMPONENTE: GESTÃO DE PEDIDOS
// ----------------------------------------------------------------------
function OrdersView({
  orders,
  onStatusChange,
  selectedOrder,
  setSelectedOrder,
  customer,
}: {
  orders: AdminOrder[];
  onStatusChange: (id: string, st: string) => void;
  selectedOrder: AdminOrder | null;
  setSelectedOrder: (o: AdminOrder | null) => void;
  customer?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = orders.filter((o) => {
    const matchesQ =
      o.id.toLowerCase().includes(query.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(query.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(query.toLowerCase()));
    const matchesSt = statusFilter === "all" || o.status === statusFilter;
    return matchesQ && matchesSt;
  });

  return (
    <section className="dashboard-card full-card">
      <CardHeading title={customer ? "Meus Pedidos" : "Gestão e Pipeline de Pedidos"} />

      <div className="table-toolbar">
        <input
          placeholder="Buscar por código ou cliente…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos os status</option>
          <option value="Aguardando pagamento">Aguardando pagamento</option>
          <option value="Separando">Separando</option>
          <option value="Pronto para retirada">Pronto para retirada</option>
          <option value="Em rota">Em rota</option>
          <option value="Entregue">Entregue</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      <div className="data-table">
        <div className="data-row data-head" style={{ gridTemplateColumns: "1fr 1.2fr 0.8fr 0.8fr 1.2fr auto" }}>
          <span>Pedido</span>
          <span>Cliente</span>
          <span>Tipo</span>
          <span>Total</span>
          <span>Status</span>
          <span>Ações</span>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
            Nenhum pedido encontrado com os filtros atuais.
          </div>
        )}

        {filtered.map((o) => (
          <div
            className="data-row"
            key={o.id}
            style={{ gridTemplateColumns: "1fr 1.2fr 0.8fr 0.8fr 1.2fr auto" }}
          >
            <span>
              <strong>{o.id}</strong>
              <small>{new Date(o.created_at).toLocaleDateString("pt-BR")}</small>
            </span>
            <span>
              <strong>{o.customer_name || o.customer_email.split("@")[0]}</strong>
              <small>{o.customer_email}</small>
            </span>
            <span>{o.fulfillment === "delivery" ? "🚚 Entrega" : "🏪 Retirada"}</span>
            <span><strong>{formatCurrency(o.total_cents)}</strong></span>
            <span>
              {!customer ? (
                <select
                  value={o.status}
                  onChange={(e) => onStatusChange(o.id, e.target.value)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "0.65rem",
                    border: "1px solid var(--line)",
                    background: "#fff",
                  }}
                >
                  <option value="Aguardando pagamento">Aguardando pagamento</option>
                  <option value="Separando">Separando</option>
                  <option value="Pronto para retirada">Pronto para retirada</option>
                  <option value="Em rota">Em rota</option>
                  <option value="Entregue">Entregue</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              ) : (
                <StatusPill>{o.status}</StatusPill>
              )}
            </span>
            <span>
              <button
                className="button-ghost"
                onClick={() => setSelectedOrder(o)}
                style={{ fontSize: "0.65rem", padding: "4px 8px", color: "var(--teal)" }}
              >
                Ver detalhes
              </button>
            </span>
          </div>
        ))}
      </div>

      {/* Modal de Detalhes do Pedido */}
      {selectedOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontFamily: "Georgia, serif" }}>
                Detalhes do Pedido {selectedOrder.id}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "4px 0", fontSize: "0.75rem", color: "var(--muted)" }}>
              <strong>Cliente:</strong> {selectedOrder.customer_name || selectedOrder.customer_email} ({selectedOrder.customer_email})
            </p>
            <p style={{ margin: "4px 0", fontSize: "0.75rem", color: "var(--muted)" }}>
              <strong>Tipo:</strong> {selectedOrder.fulfillment === "delivery" ? "Entrega no endereço" : "Retirada no balcão"}
            </p>
            {selectedOrder.address_json && (
              <p style={{ margin: "4px 0", fontSize: "0.75rem", color: "var(--muted)" }}>
                <strong>Endereço:</strong> {selectedOrder.address_json.street}, {selectedOrder.address_json.city} - {selectedOrder.address_json.state}
              </p>
            )}

            <h4 style={{ margin: "16px 0 8px", fontSize: "0.85rem" }}>Itens do Carrinho:</h4>
            <div style={{ background: "var(--sage-2)", borderRadius: "8px", padding: "10px", marginBottom: "16px" }}>
              {selectedOrder.items_json.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", padding: "4px 0" }}>
                  <span>{item.quantity}x {item.name || item.id}</span>
                  <strong>{item.priceCents ? formatCurrency(item.priceCents * item.quantity) : "—"}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", borderTop: "1px solid var(--line)", paddingTop: "10px" }}>
              <span>Total do Pedido:</span>
              <strong style={{ color: "var(--teal-deep)", fontSize: "1.1rem" }}>{formatCurrency(selectedOrder.total_cents)}</strong>
            </div>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                className="button button-primary"
                onClick={() => setSelectedOrder(null)}
                style={{ padding: "8px 16px", fontSize: "0.75rem" }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ----------------------------------------------------------------------
// COMPONENTE: PRODUTOS E ESTOQUE
// ----------------------------------------------------------------------
function CatalogView({
  products,
  query,
  setQuery,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  formOpen,
  setFormOpen,
  editingProduct,
  setEditingProduct,
  onQuickStock,
  onDeleteProduct,
  onUpdateProduct,
  onCreateProduct,
  onSaveColors,
  loading,
  error,
}: {
  products: AdminProduct[];
  query: string;
  setQuery: (q: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  formOpen: string | null;
  setFormOpen: (f: string | null) => void;
  editingProduct: AdminProduct | null;
  setEditingProduct: (p: AdminProduct | null) => void;
  onQuickStock: (id: string, delta: number) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (e: React.FormEvent<HTMLFormElement>, images: string[], colors: ProductColor[]) => void;
  onCreateProduct: (e: React.FormEvent<HTMLFormElement>, images: string[], colors: ProductColor[]) => void;
  onSaveColors: (productId: string, colors: ProductColor[]) => void;
  loading: boolean;
  error: string;
}) {
  const [selectedProductForColors, setSelectedProductForColors] = useState<AdminProduct | null>(null);
  const [activeColors, setActiveColors] = useState<ProductColor[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Multi-image state for new product
  const [newImages, setNewImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Multi-image state for edit product
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [prevEditId, setPrevEditId] = useState<string | null>(null);

  if (editingProduct && editingProduct.id !== prevEditId) {
    setPrevEditId(editingProduct.id);
    setEditImages(editingProduct.images || []);
    setEditImageUrl("");
  } else if (!editingProduct && prevEditId !== null) {
    setPrevEditId(null);
    setEditImages([]);
    setEditImageUrl("");
  }

  function openColorsModal(product: AdminProduct) {
    setSelectedProductForColors(product);
    setActiveColors(product.colors || []);
  }

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    const matchesText =
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.barcode ? p.barcode.toLowerCase().includes(q) : false);
    const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
    const matchesStat =
      statusFilter === "all" ||
      (statusFilter === "active" && p.isActive) ||
      (statusFilter === "inactive" && !p.isActive) ||
      (statusFilter === "low_stock" && p.stock <= 5);
    return matchesText && matchesCat && matchesStat;
  });

  return (
    <div className="dashboard-stack">
      <section className="dashboard-card full-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", margin: 0, color: "var(--teal-deep)" }}>
              Catálogo Geral de Produtos e Estoque
            </h2>
            <small style={{ color: "var(--muted)" }}>Produtos 100% isentos de prescrição (MIPs, cosméticos e higiene) com gestão de ID, código de barras, fotos e cores.</small>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ display: "flex", background: "var(--sage-2)", borderRadius: "8px", padding: "2px" }}>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  background: viewMode === "table" ? "#fff" : "transparent",
                  color: viewMode === "table" ? "var(--teal-deep)" : "var(--muted)",
                  boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                📋 Tabela Detalhada
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  background: viewMode === "grid" ? "#fff" : "transparent",
                  color: viewMode === "grid" ? "var(--teal-deep)" : "var(--muted)",
                  boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                🗂️ Grade de Cards
              </button>
            </div>
            <button
              className="primary-small"
              onClick={() => {
                setFormOpen(formOpen === "product" ? null : "product");
                setEditingProduct(null);
                setNewImages([]);
                setNewImageUrl("");
              }}
              style={{ whiteSpace: "nowrap" }}
            >
              + Novo Produto
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="table-toolbar" style={{ flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <input
            placeholder="Buscar por nome, marca, ID ou código de barras…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ minWidth: "260px", flex: 1 }}
          />

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Todas as categorias</option>
            <option value="Medicamentos">Medicamentos</option>
            <option value="Dermocosméticos">Dermocosméticos</option>
            <option value="Vitaminas">Vitaminas</option>
            <option value="Mamãe e bebê">Mamãe e bebê</option>
            <option value="Cuidados pessoais">Cuidados pessoais</option>
            <option value="Saúde e bem-estar">Saúde e bem-estar</option>
            <option value="Primeiros socorros">Primeiros socorros</option>
            <option value="Higiene oral">Higiene oral</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos os status</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
            <option value="low_stock">⚠️ Estoque Baixo (≤ 5)</option>
          </select>
        </div>

        {/* Formulário de Cadastro de Novo Produto */}
        {formOpen === "product" && !editingProduct && (
          <form className="admin-form" onSubmit={(e) => onCreateProduct(e, newImages, [])}>
            <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid var(--line)", paddingBottom: "8px", marginBottom: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--teal-deep)" }}>Cadastro de Novo Produto</h3>
              <small style={{ color: "var(--muted)" }}>Preencha os dados cadastrais, identificadores e fotos ilimitadas.</small>
            </div>

            <label>
              ID do Produto (Identificador Único)
              <input name="id" maxLength={80} placeholder="Ex: prod_novo (ou deixe vazio para gerar automático)" />
            </label>
            <label>
              Código de Barras (EAN-13)
              <input name="barcode" maxLength={40} placeholder="Ex: 7891234567890" />
            </label>

            <label>
              Nome do Produto*
              <input name="name" required maxLength={120} placeholder="Ex: Paracetamol 750mg" />
            </label>
            <label>
              Slug Único na URL*
              <input name="slug" required placeholder="paracetamol-750mg" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
            </label>
            <label>
              Marca / Laboratório*
              <input name="brand" required maxLength={80} placeholder="Ex: Genérico / EMS" />
            </label>
            <label>
              Categoria*
              <select name="category">
                <option>Medicamentos</option>
                <option>Dermocosméticos</option>
                <option>Vitaminas</option>
                <option>Mamãe e bebê</option>
                <option>Cuidados pessoais</option>
                <option>Saúde e bem-estar</option>
                <option>Primeiros socorros</option>
                <option>Higiene oral</option>
              </select>
            </label>
            <label>
              Descrição Curta*
              <input name="shortDescription" required maxLength={180} placeholder="20 comprimidos • Alívio de dor e febre" />
            </label>
            <label>
              Preço em centavos*
              <input name="priceCents" type="number" min="1" required placeholder="Ex: 1590 (R$ 15,90)" />
            </label>
            <label>
              Preço anterior De/Por (centavos)
              <input name="compareAtCents" type="number" min="1" placeholder="Ex: 1990 (R$ 19,90)" />
            </label>
            <label>
              Estoque inicial (unidades)*
              <input name="stock" type="number" min="0" required defaultValue="50" />
            </label>

            <label className="wide">
              Descrição Detalhada*
              <textarea name="description" required maxLength={4000} rows={3} placeholder="Instruções de uso, posologia e precauções..." />
            </label>

            {/* Gerenciador de Fotos Ilimitadas */}
            <div className="wide" style={{ background: "var(--sage-2)", borderRadius: "10px", padding: "14px", marginTop: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div>
                  <strong style={{ fontSize: "0.85rem", color: "var(--teal-deep)" }}>📷 Fotos do Produto (quantas fotos quiser)</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>Adicione URLs de fotos em alta resolução. A primeira será a foto principal.</p>
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: "bold", background: "#fff", padding: "3px 8px", borderRadius: "6px" }}>
                  {newImages.length} foto(s) adicionada(s)
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <input
                  type="url"
                  placeholder="Cole a URL da foto (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  style={{ flex: 1, padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px", border: "1px solid var(--line)" }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newImageUrl.trim().startsWith("http") || newImageUrl.trim().startsWith("/")) {
                      setNewImages((prev) => [...prev, newImageUrl.trim()]);
                      setNewImageUrl("");
                    } else {
                      alert("Informe uma URL válida começando com http:// ou https://");
                    }
                  }}
                  className="button button-primary"
                  style={{ padding: "6px 14px", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                >
                  + Adicionar Foto
                </button>
              </div>

              {newImages.length > 0 && (
                <div style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "6px 2px" }}>
                  {newImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative", width: "70px", height: "70px", borderRadius: "8px", overflow: "hidden", border: idx === 0 ? "2px solid var(--teal)" : "1px solid var(--line)", flexShrink: 0, background: "#fff" }}>
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {idx === 0 && <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--teal)", color: "#fff", fontSize: "0.55rem", textAlign: "center", fontWeight: "bold" }}>Capa</span>}
                      <button
                        type="button"
                        onClick={() => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
                        style={{ position: "absolute", top: "2px", right: "2px", width: "18px", height: "18px", borderRadius: "50%", background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.6rem", display: "grid", placeItems: "center" }}
                        title="Remover foto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions wide" style={{ marginTop: "12px" }}>
              <button type="button" onClick={() => setFormOpen(null)}>
                Cancelar
              </button>
              <button type="submit">Cadastrar no Supabase</button>
            </div>
          </form>
        )}

        {/* Modal / Formulário de Edição de Produto */}
        {editingProduct && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 100,
              display: "grid",
              placeItems: "center",
              padding: "16px",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "18px",
                padding: "24px",
                maxWidth: "680px",
                width: "100%",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--line)", paddingBottom: "10px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontFamily: "Georgia, serif" }}>Editar Produto: {editingProduct.name}</h3>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "0.72rem", background: "var(--sage-2)", padding: "2px 8px", borderRadius: "4px", fontWeight: "bold", color: "var(--teal-deep)" }}>
                      ID: {editingProduct.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(editingProduct.id);
                        alert("ID copiado para a área de transferência!");
                      }}
                      style={{ background: "transparent", border: "none", color: "var(--teal)", cursor: "pointer", fontSize: "0.72rem" }}
                    >
                      Copiar ID
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ background: "transparent", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "var(--muted)" }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => onUpdateProduct(e, editImages, editingProduct.colors || [])} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ gridColumn: "1 / -1", fontSize: "0.7rem", fontWeight: "bold" }}>
                  Nome do Produto
                  <input name="name" defaultValue={editingProduct.name} required style={{ width: "100%", padding: "6px 8px" }} />
                </label>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                  Código de Barras (EAN-13)
                  <input name="barcode" defaultValue={editingProduct.barcode || ""} placeholder="789..." style={{ width: "100%", padding: "6px 8px" }} />
                </label>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                  Slug na URL
                  <input name="slug" defaultValue={editingProduct.slug} required style={{ width: "100%", padding: "6px 8px" }} />
                </label>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                  Marca / Laboratório
                  <input name="brand" defaultValue={editingProduct.brand} required style={{ width: "100%", padding: "6px 8px" }} />
                </label>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                  Categoria
                  <select name="category" defaultValue={editingProduct.category} style={{ width: "100%", padding: "6px 8px" }}>
                    <option>Medicamentos</option>
                    <option>Dermocosméticos</option>
                    <option>Vitaminas</option>
                    <option>Mamãe e bebê</option>
                    <option>Cuidados pessoais</option>
                    <option>Saúde e bem-estar</option>
                    <option>Primeiros socorros</option>
                    <option>Higiene oral</option>
                  </select>
                </label>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                  Estoque (unidades)
                  <input name="stock" type="number" defaultValue={editingProduct.stock} required style={{ width: "100%", padding: "6px 8px" }} />
                </label>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                  Preço em centavos
                  <input name="priceCents" type="number" defaultValue={editingProduct.priceCents} required style={{ width: "100%", padding: "6px 8px" }} />
                </label>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                  Preço anterior em centavos (De/Por)
                  <input name="compareAtCents" type="number" defaultValue={editingProduct.compareAtCents ?? ""} style={{ width: "100%", padding: "6px 8px" }} />
                </label>
                <label style={{ gridColumn: "1 / -1", fontSize: "0.7rem", fontWeight: "bold" }}>
                  Descrição Curta
                  <input name="shortDescription" defaultValue={editingProduct.shortDescription ?? ""} required style={{ width: "100%", padding: "6px 8px" }} />
                </label>
                <label style={{ gridColumn: "1 / -1", fontSize: "0.7rem", fontWeight: "bold" }}>
                  Descrição Completa
                  <textarea name="description" defaultValue={editingProduct.description ?? ""} rows={3} style={{ width: "100%", padding: "6px 8px" }} />
                </label>

                {/* Gerenciador de Fotos Ilimitadas na Edição */}
                <div style={{ gridColumn: "1 / -1", background: "var(--sage-2)", borderRadius: "10px", padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "0.8rem", color: "var(--teal-deep)" }}>📷 Fotos do Produto ({editImages.length} fotos)</strong>
                    <small style={{ color: "var(--muted)" }}>Você pode adicionar quantas fotos quiser.</small>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="url"
                      placeholder="Adicionar nova URL de foto…"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      style={{ flex: 1, padding: "5px 8px", fontSize: "0.78rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editImageUrl.trim().startsWith("http") || editImageUrl.trim().startsWith("/")) {
                          setEditImages((prev) => [...prev, editImageUrl.trim()]);
                          setEditImageUrl("");
                        } else {
                          alert("URL de imagem inválida.");
                        }
                      }}
                      className="button button-primary"
                      style={{ padding: "5px 12px", fontSize: "0.72rem" }}
                    >
                      + Foto
                    </button>
                  </div>
                  {editImages.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "4px 0" }}>
                      {editImages.map((img, idx) => (
                        <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "6px", overflow: "hidden", border: idx === 0 ? "2px solid var(--teal)" : "1px solid var(--line)", flexShrink: 0, background: "#fff" }}>
                          <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          {idx === 0 && <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--teal)", color: "#fff", fontSize: "0.5rem", textAlign: "center", fontWeight: "bold" }}>Capa</span>}
                          <button
                            type="button"
                            onClick={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                            style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.6rem", display: "grid", placeItems: "center" }}
                            title="Remover foto"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Atalho para Gerenciar Cores do Produto */}
                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                  <div>
                    <strong style={{ fontSize: "0.8rem" }}>🎨 Cores Disponíveis: {editingProduct.colors?.length || 0} cadastrada(s)</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "var(--muted)" }}>Abra a tabela de cores para editar estoque ou adicionar novas opções.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      openColorsModal(editingProduct);
                    }}
                    className="button button-ghost"
                    style={{ fontSize: "0.75rem", padding: "6px 12px", color: "var(--teal)" }}
                  >
                    Gerenciar Tabela de Cores ↗
                  </button>
                </div>

                <label style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", marginTop: "4px" }}>
                  <input name="isActive" type="checkbox" defaultChecked={editingProduct.isActive} />
                  Produto Ativo (visível no catálogo público)
                </label>

                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px", borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                  <button type="button" onClick={() => setEditingProduct(null)} className="button button-ghost">
                    Cancelar
                  </button>
                  <button type="submit" className="button button-primary">
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Tabela de Cores Disponíveis */}
        {selectedProductForColors && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 110,
              display: "grid",
              placeItems: "center",
              padding: "16px",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "18px",
                padding: "26px",
                maxWidth: "740px",
                width: "100%",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--teal)", fontWeight: "bold" }}>
                    Tabela de Variantes
                  </span>
                  <h3 style={{ margin: "4px 0 0", fontSize: "1.25rem", fontFamily: "Georgia, serif" }}>
                    Cores Disponíveis: {selectedProductForColors.name}
                  </h3>
                  <small style={{ color: "var(--muted)" }}>
                    ID: <code>{selectedProductForColors.id}</code> • Código de barras: <code>{selectedProductForColors.barcode || "—"}</code>
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductForColors(null)}
                  style={{ background: "transparent", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "var(--muted)" }}
                >
                  ✕
                </button>
              </div>

              {/* Tabela de Cores Disponíveis */}
              <div style={{ overflowX: "auto", marginBottom: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "var(--sage-2)", textAlign: "left", borderBottom: "2px solid var(--line)" }}>
                      <th style={{ padding: "10px 12px" }}>Amostra</th>
                      <th style={{ padding: "10px 12px" }}>Nome da Cor</th>
                      <th style={{ padding: "10px 12px" }}>SKU</th>
                      <th style={{ padding: "10px 12px" }}>Estoque</th>
                      <th style={{ padding: "10px 12px" }}>Status</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeColors.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "26px", textAlign: "center", color: "var(--muted)" }}>
                          Nenhuma cor cadastrada para este produto ainda. Adicione uma cor abaixo!
                        </td>
                      </tr>
                    ) : (
                      activeColors.map((color, idx) => (
                        <tr key={color.id || idx} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: color.hex, border: "2px solid #fff", boxShadow: "0 0 0 1px #cbd5e1" }} />
                              <code style={{ fontSize: "0.75rem" }}>{color.hex}</code>
                            </div>
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: "600" }}>{color.name}</td>
                          <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{color.sku || "—"}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <input
                              type="number"
                              min="0"
                              value={color.stock}
                              onChange={(e) => {
                                const newQty = Math.max(0, parseInt(e.target.value, 10) || 0);
                                setActiveColors((prev) =>
                                  prev.map((c, i) => (i === idx ? { ...c, stock: newQty, available: newQty > 0 } : c))
                                );
                              }}
                              style={{ width: "65px", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--line)" }}
                            />
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                              background: color.stock > 0 ? "#ecfdf5" : "#fef2f2",
                              color: color.stock > 0 ? "#059669" : "#dc2626"
                            }}>
                              {color.stock > 0 ? "Disponível" : "Esgotado"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => setActiveColors((prev) => prev.filter((_, i) => i !== idx))}
                              style={{ background: "transparent", border: "none", color: "var(--coral)", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}
                              title="Excluir cor"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Formulário para Adicionar Nova Cor à Tabela */}
              <div style={{ background: "var(--sage-2)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "var(--teal-deep)" }}>
                  + Adicionar Nova Cor à Tabela
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "4px" }}>Nome da Cor*</label>
                    <input
                      id="new-color-name"
                      placeholder="Ex: Azul Petróleo"
                      style={{ width: "100%", padding: "6px 8px", fontSize: "0.78rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "4px" }}>Amostra / Hex*</label>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <input
                        id="new-color-picker"
                        type="color"
                        defaultValue="#005a60"
                        style={{ width: "36px", height: "32px", padding: "0", border: "none", cursor: "pointer", borderRadius: "6px" }}
                        onChange={(e) => {
                          const hexInput = document.getElementById("new-color-hex") as HTMLInputElement;
                          if (hexInput) hexInput.value = e.target.value;
                        }}
                      />
                      <input
                        id="new-color-hex"
                        defaultValue="#005a60"
                        placeholder="#005a60"
                        style={{ width: "100%", padding: "6px 8px", fontSize: "0.78rem" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "4px" }}>Estoque*</label>
                    <input
                      id="new-color-stock"
                      type="number"
                      min="0"
                      defaultValue="20"
                      style={{ width: "100%", padding: "6px 8px", fontSize: "0.78rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "bold", marginBottom: "4px" }}>Código SKU</label>
                    <input
                      id="new-color-sku"
                      placeholder="Ex: COR-AZUL"
                      style={{ width: "100%", padding: "6px 8px", fontSize: "0.78rem" }}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => {
                        const nameEl = document.getElementById("new-color-name") as HTMLInputElement;
                        const hexEl = document.getElementById("new-color-hex") as HTMLInputElement;
                        const stockEl = document.getElementById("new-color-stock") as HTMLInputElement;
                        const skuEl = document.getElementById("new-color-sku") as HTMLInputElement;
                        if (!nameEl?.value.trim() || !hexEl?.value.trim()) {
                          alert("Informe o nome e o código hex da cor.");
                          return;
                        }
                        const stock = parseInt(stockEl.value, 10) || 0;
                        const newColor: ProductColor = {
                          id: `cor_${Date.now()}`,
                          name: nameEl.value.trim(),
                          hex: hexEl.value.trim(),
                          stock,
                          sku: skuEl?.value.trim() || undefined,
                          available: stock > 0,
                        };
                        setActiveColors((prev) => [...prev, newColor]);
                        nameEl.value = "";
                        skuEl.value = "";
                      }}
                      style={{ padding: "8px 14px", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé da Modal */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedProductForColors(null)}
                  className="button button-ghost"
                  style={{ padding: "8px 16px", fontSize: "0.8rem" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSaveColors(selectedProductForColors.id, activeColors);
                    setSelectedProductForColors(null);
                  }}
                  className="button button-primary"
                  style={{ padding: "8px 18px", fontSize: "0.8rem" }}
                >
                  💾 Salvar Tabela de Cores
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="admin-catalog-summary" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{filtered.length}</strong>
            <span>produtos exibidos {filtered.length !== products.length && `(filtrados de ${products.length})`}</span>
          </div>
        </div>

        {loading && <div className="admin-catalog-state">Carregando catálogo do Supabase…</div>}
        {error && <div className="admin-catalog-state error">{error}</div>}

        {!loading && !error && viewMode === "table" && (
          <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: "12px", background: "#fff", marginTop: "12px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "var(--sage-2)", textAlign: "left", borderBottom: "2px solid var(--line)" }}>
                  <th style={{ padding: "10px 12px" }}>ID do Produto</th>
                  <th style={{ padding: "10px 12px" }}>Código de Barras</th>
                  <th style={{ padding: "10px 12px" }}>Produto & Marca</th>
                  <th style={{ padding: "10px 12px" }}>Categoria</th>
                  <th style={{ padding: "10px 12px" }}>Preço</th>
                  <th style={{ padding: "10px 12px" }}>Estoque</th>
                  <th style={{ padding: "10px 12px" }}>Fotos</th>
                  <th style={{ padding: "10px 12px" }}>Cores Disponíveis</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
                      Nenhum produto encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => (
                    <tr key={product.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <code style={{ fontSize: "0.72rem", background: "var(--sage-2)", padding: "2px 6px", borderRadius: "4px", color: "var(--teal-deep)" }}>
                          {product.id}
                        </code>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "#334155" }}>
                          🏷️ {product.barcode || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <strong style={{ display: "block", fontSize: "0.82rem" }}>{product.name}</strong>
                        <small style={{ color: "var(--muted)" }}>{product.brand} • {product.slug}</small>
                      </td>
                      <td style={{ padding: "10px 12px" }}>{product.category}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <strong>{formatCurrency(product.priceCents)}</strong>
                        {product.compareAtCents && (
                          <small style={{ display: "block", color: "var(--muted)", textDecoration: "line-through" }}>
                            {formatCurrency(product.compareAtCents)}
                          </small>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>{product.stock} un.</span>
                          <span style={{ display: "inline-flex", gap: "2px" }}>
                            <button
                              type="button"
                              onClick={() => onQuickStock(product.id, -1)}
                              title="-1"
                              style={{ border: "1px solid var(--line)", background: "#fff", cursor: "pointer", borderRadius: "3px", padding: "0 4px", fontSize: "0.65rem" }}
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => onQuickStock(product.id, 1)}
                              title="+1"
                              style={{ border: "1px solid var(--line)", background: "#fff", cursor: "pointer", borderRadius: "3px", padding: "0 4px", fontSize: "0.65rem" }}
                            >
                              +
                            </button>
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: "0.72rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                          📷 {product.images?.length ? `${product.images.length} fotos` : "1 foto"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <button
                          type="button"
                          onClick={() => openColorsModal(product)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid var(--teal)",
                            background: (product.colors && product.colors.length > 0) ? "#ecfdf5" : "#fff",
                            color: "var(--teal-deep)",
                            cursor: "pointer",
                            fontSize: "0.72rem",
                            fontWeight: "bold",
                          }}
                          title="Clique para abrir tabela de cores disponíveis"
                        >
                          🎨 Cores ({product.colors?.length || 0})
                        </button>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <StatusPill>{!product.isActive ? "Inativo" : product.stock <= 5 ? "Estoque baixo" : "Ativo"}</StatusPill>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            className="button-ghost"
                            onClick={() => setEditingProduct(product)}
                            style={{ fontSize: "0.68rem", padding: "3px 8px", color: "var(--teal)" }}
                          >
                            ✎ Editar
                          </button>
                          <button
                            onClick={() => onDeleteProduct(product.id)}
                            style={{ background: "transparent", border: "none", color: "var(--coral)", cursor: "pointer", fontSize: "0.75rem", padding: "3px 4px" }}
                            title="Excluir produto"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && viewMode === "grid" && (
          <div className="admin-product-grid" style={{ marginTop: "12px" }}>
            {filtered.map((product) => (
              <article className="admin-product-card" key={product.id}>
                <header>
                  <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>{product.brand}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <StatusPill>{!product.isActive ? "Inativo" : product.stock <= 5 ? "Estoque baixo" : "Ativo"}</StatusPill>
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(product.id)}
                      title="Excluir produto"
                      style={{ background: "transparent", border: "none", color: "var(--coral)", cursor: "pointer", fontSize: "0.9rem" }}
                    >
                      ✕
                    </button>
                  </div>
                </header>

                <h3 style={{ margin: "6px 0 2px" }}>{product.name}</h3>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "4px 0 8px" }}>
                  <code style={{ fontSize: "0.65rem", background: "var(--sage-2)", padding: "1px 5px", borderRadius: "4px", color: "var(--teal-deep)" }}>
                    ID: {product.id}
                  </code>
                  <span style={{ fontSize: "0.65rem", fontFamily: "monospace", background: "#f8fafc", padding: "1px 5px", borderRadius: "4px", border: "1px solid var(--line)" }}>
                    🏷️ {product.barcode || "S/ código"}
                  </span>
                </div>
                <p style={{ margin: "2px 0 8px", fontSize: "0.75rem", color: "var(--muted)" }}>{product.category}</p>

                <dl>
                  <div>
                    <dt>Preço</dt>
                    <dd>{formatCurrency(product.priceCents)}</dd>
                  </div>
                  <div>
                    <dt>Estoque</dt>
                    <dd style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{product.stock} un.</span>
                      <span style={{ display: "inline-flex", gap: "3px" }}>
                        <button
                          type="button"
                          onClick={() => onQuickStock(product.id, -1)}
                          title="Diminuir estoque"
                          style={{ border: "1px solid var(--line)", background: "#fff", cursor: "pointer", borderRadius: "3px", padding: "0 4px" }}
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => onQuickStock(product.id, 1)}
                          title="Aumentar estoque"
                          style={{ border: "1px solid var(--line)", background: "#fff", cursor: "pointer", borderRadius: "3px", padding: "0 4px" }}
                        >
                          +
                        </button>
                      </span>
                    </dd>
                  </div>
                </dl>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", borderTop: "1px solid var(--line)", paddingTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => openColorsModal(product)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 6px",
                      borderRadius: "5px",
                      border: "1px solid var(--teal)",
                      background: (product.colors && product.colors.length > 0) ? "#ecfdf5" : "#fff",
                      color: "var(--teal-deep)",
                      cursor: "pointer",
                      fontSize: "0.68rem",
                      fontWeight: "bold",
                    }}
                    title="Clique para abrir tabela de cores disponíveis"
                  >
                    🎨 Cores ({product.colors?.length || 0})
                  </button>
                  <button
                    className="button-ghost"
                    onClick={() => setEditingProduct(product)}
                    style={{ fontSize: "0.68rem", padding: "3px 8px", color: "var(--teal)", cursor: "pointer" }}
                  >
                    ✎ Editar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ----------------------------------------------------------------------
// COMPONENTE: MARKETING (BANNERS E CUPONS)
// ----------------------------------------------------------------------
function MarketingView({
  banners,
  discounts,
  formOpen,
  setFormOpen,
  onToggleBanner,
  onDeleteBanner,
  onToggleDiscount,
  onDeleteDiscount,
  onSubmit,
}: {
  banners: AdminBanner[];
  discounts: AdminDiscount[];
  formOpen: string | null;
  setFormOpen: (f: string | null) => void;
  onToggleBanner: (id: string, st: boolean) => void;
  onDeleteBanner: (id: string) => void;
  onToggleDiscount: (id: string, st: boolean) => void;
  onDeleteDiscount: (id: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, ep: string) => void;
}) {
  return (
    <div className="dashboard-stack">
      <div className="dashboard-columns marketing-columns">
        {/* Banners */}
        <section className="dashboard-card">
          <CardHeading
            title="Banners Promocionais"
            action="Novo Banner"
            onClick={() => setFormOpen(formOpen === "banner" ? null : "banner")}
          />

          {formOpen === "banner" && (
            <form className="admin-form single" onSubmit={(e) => onSubmit(e, "/api/admin/banners")}>
              <label>
                Título*
                <input name="title" required maxLength={100} placeholder="Ex: Semana do Autocuidado" />
              </label>
              <label>
                Subtítulo*
                <input name="subtitle" required maxLength={180} placeholder="Até 30% OFF em dermocosméticos" />
              </label>
              <label>
                Texto do Botão*
                <input name="ctaLabel" required maxLength={40} defaultValue="Aproveitar ofertas" />
              </label>
              <label>
                Destino (URL/Rota)*
                <input name="ctaHref" defaultValue="/catalogo" required />
              </label>
              <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
                <button type="button" onClick={() => setFormOpen(null)}>
                  Cancelar
                </button>
                <button type="submit">Publicar Banner</button>
              </div>
            </form>
          )}

          <div style={{ padding: "8px" }}>
            {banners.length === 0 && (
              <p style={{ color: "var(--muted)", padding: "20px", textAlign: "center", fontSize: "0.8rem" }}>
                Nenhum banner cadastrado. Crie o primeiro acima!
              </p>
            )}

            {banners.map((b) => (
              <div className={`campaign-card ${b.is_active ? "live" : ""}`} key={b.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{b.is_active ? "Ativo no site" : "Pausado"}</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => onToggleBanner(b.id, b.is_active)}
                      style={{ fontSize: "0.6rem", padding: "2px 6px", cursor: "pointer" }}
                    >
                      {b.is_active ? "Pausar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => onDeleteBanner(b.id)}
                      style={{ fontSize: "0.6rem", padding: "2px 6px", color: "var(--coral)", cursor: "pointer" }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <h3>{b.title}</h3>
                <p>{b.subtitle}</p>
                <small>Link: {b.cta_href}</small>
              </div>
            ))}
          </div>
        </section>

        {/* Cupons e Descontos */}
        <section className="dashboard-card">
          <CardHeading
            title="Cupons de Desconto"
            action="Novo Cupom"
            onClick={() => setFormOpen(formOpen === "discount" ? null : "discount")}
          />

          {formOpen === "discount" && (
            <form className="admin-form single" onSubmit={(e) => onSubmit(e, "/api/admin/discounts")}>
              <label>
                Nome da Campanha*
                <input name="name" required maxLength={80} placeholder="Ex: Boas-vindas" />
              </label>
              <label>
                Código do Cupom*
                <input name="code" required maxLength={24} placeholder="BEMVINDO15" style={{ textTransform: "uppercase" }} />
              </label>
              <label>
                Tipo de Desconto*
                <select name="kind">
                  <option value="percent">Percentual (%)</option>
                  <option value="fixed">Valor Fixo (centavos)</option>
                </select>
              </label>
              <label>
                Valor*
                <input name="amount" type="number" min="1" required placeholder="Ex: 15 para 15% ou 1000 para R$ 10" />
              </label>
              <label>
                Subtotal Mínimo (centavos)
                <input name="minSubtotalCents" type="number" min="0" defaultValue="0" placeholder="Ex: 5000 para R$ 50" />
              </label>
              <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
                <button type="button" onClick={() => setFormOpen(null)}>
                  Cancelar
                </button>
                <button type="submit">Ativar Cupom</button>
              </div>
            </form>
          )}

          <div style={{ padding: "8px" }}>
            {discounts.length === 0 && (
              <p style={{ color: "var(--muted)", padding: "20px", textAlign: "center", fontSize: "0.8rem" }}>
                Nenhum cupom ativo. Crie seu primeiro desconto acima!
              </p>
            )}

            {discounts.map((d) => (
              <div className={`coupon-card ${!d.is_active ? "muted" : ""}`} key={d.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{d.code}</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => onToggleDiscount(d.id, d.is_active)}
                      style={{ fontSize: "0.6rem", padding: "2px 6px", cursor: "pointer", background: "#fff", color: "var(--ink)", borderRadius: "4px" }}
                    >
                      {d.is_active ? "Pausar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => onDeleteDiscount(d.id)}
                      style={{ fontSize: "0.6rem", padding: "2px 6px", color: "var(--coral)", cursor: "pointer", background: "#fff", borderRadius: "4px" }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <strong>{d.kind === "percent" ? `${d.amount}% OFF` : `R$ ${(d.amount / 100).toFixed(2)} OFF`}</strong>
                <p>
                  {d.name} • {d.min_subtotal_cents ? `mínimo de R$ ${(d.min_subtotal_cents / 100).toFixed(2)}` : "sem valor mínimo"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}



// ----------------------------------------------------------------------
// COMPONENTE: EQUIPE E PERMISSÕES
// ----------------------------------------------------------------------
function TeamView({
  team,
  auditLogs,
  formOpen,
  setFormOpen,
  onUpdateRole,
  onRevokeRole,
  onSubmit,
}: {
  team: TeamMember[];
  auditLogs: AuditLog[];
  formOpen: string | null;
  setFormOpen: (f: string | null) => void;
  onUpdateRole: (email: string, role: string) => void;
  onRevokeRole: (email: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, ep: string) => void;
}) {
  const matrix = [
    { role: "Proprietário (Owner)", permissions: "Controle total da farmácia: finanças, equipe, permissões, catálogo e auditoria." },
    { role: "Gerente", permissions: "Operação geral da loja, pedidos, catálogo, controle de estoque e campanhas promocionais." },
    { role: "Farmacêutico", permissions: "Revisão e aprovação de receitas médicas, dispensação controlada e responsabilidade técnica." },
    { role: "Catálogo", permissions: "Cadastro de produtos, controle de estoque diário, ativação de banners e descontos." },
    { role: "Atendimento", permissions: "Consulta de pedidos, suporte aos clientes e cancelamentos autorizados." },
  ];

  return (
    <div className="dashboard-stack">
      <section className="dashboard-card full-card">
        <CardHeading
          title="Equipe e Permissões do Sistema"
          action="Delegar Novo Acesso"
          onClick={() => setFormOpen(formOpen === "role" ? null : "role")}
        />

        {formOpen === "role" && (
          <form className="admin-form role-form" onSubmit={(e) => onSubmit(e, "/api/admin/users/roles")}>
            <label>
              E-mail do Usuário*
              <input name="email" type="email" placeholder="usuario@email.com" required />
            </label>
            <label>
              Perfil Atribuído*
              <select name="role">
                <option value="manager">Gerente</option>
                <option value="pharmacist">Farmacêutico</option>
                <option value="catalog">Catálogo e Marketing</option>
                <option value="support">Atendimento</option>
                <option value="customer">Cliente</option>
              </select>
            </label>
            <div className="form-actions">
              <button type="button" onClick={() => setFormOpen(null)}>
                Cancelar
              </button>
              <button type="submit">Salvar Permissão</button>
            </div>
          </form>
        )}

        <div style={{ padding: "20px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem" }}>Membros Ativos Cadastrados no Supabase</h3>

          {team.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Nenhum membro cadastrado ainda.</p>
          )}

          <div className="permission-list">
            {team.map((m) => {
              const isOwner = m.role === "owner" || m.email.toLowerCase() === "raulgdc91@gmail.com";
              return (
                <article key={m.email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span><Icon name="user" size={18} /></span>
                    <div>
                      <strong>{m.email}</strong>
                      <small style={{ display: "block" }}>
                        Cadastrado por: {m.created_by || "sistema"} • {m.updated_at ? new Date(m.updated_at).toLocaleDateString("pt-BR") : "ativo"}
                      </small>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {!isOwner ? (
                      <select
                        value={m.role}
                        onChange={(e) => onUpdateRole(m.email, e.target.value)}
                        style={{ padding: "4px 8px", fontSize: "0.7rem", borderRadius: "6px", border: "1px solid var(--line)" }}
                      >
                        <option value="manager">Gerente</option>
                        <option value="pharmacist">Farmacêutico</option>
                        <option value="catalog">Catálogo</option>
                        <option value="support">Atendimento</option>
                        <option value="customer">Cliente</option>
                      </select>
                    ) : (
                      <span className="status-pill success">Proprietário (Owner)</span>
                    )}

                    {!isOwner && (
                      <button
                        onClick={() => onRevokeRole(m.email)}
                        title="Revogar acesso administrativo"
                        style={{ color: "var(--coral)", fontSize: "0.65rem", padding: "4px 8px" }}
                      >
                        Revogar
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <h3 style={{ margin: "30px 0 12px", fontSize: "0.95rem" }}>Matriz de Funções e Hierarquia</h3>
          <div className="permission-list">
            {matrix.map((item) => (
              <article key={item.role}>
                <span><Icon name="shield" size={18} /></span>
                <p>
                  <strong>{item.role}</strong>
                  <small>{item.permissions}</small>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Auditoria em Tempo Real */}
      <section className="dashboard-card audit-preview">
        <CardHeading title="Histórico de Auditoria em Tempo Real (Supabase)" />
        {auditLogs.length === 0 ? (
          <p style={{ padding: "16px 20px" }}>Nenhum evento registrado ainda.</p>
        ) : (
          auditLogs.slice(0, 6).map((log) => (
            <p key={log.id}>
              <strong>{log.action}</strong> ({log.entity_type} {log.entity_id}) por {log.actor_email}{" "}
              <span>{new Date(log.created_at).toLocaleString("pt-BR")}</span>
            </p>
          ))
        )}
      </section>
    </div>
  );
}

// ----------------------------------------------------------------------
// COMPONENTE: CONTA
// ----------------------------------------------------------------------
function AccountView({ userName, userEmail }: { userName: string; userEmail: string }) {
  return (
    <div className="dashboard-columns">
      <section className="dashboard-card profile-card">
        <CardHeading title="Dados Pessoais" />
        <span className="profile-avatar">{userName.slice(0, 1).toUpperCase()}</span>
        <h3>{userName}</h3>
        <p>{userEmail}</p>
        <button className="button button-ghost" onClick={() => alert("Para alterar sua senha, use o painel de autenticação do Supabase.")}>
          Segurança e Senha
        </button>
      </section>

      <section className="dashboard-card">
        <CardHeading title="Privacidade e Dados" />
        <div className="privacy-options">
          <article>
            <Icon name="document" />
            <p>
              <strong>Exportar Relatório</strong>
              <small>Exportação estruturada dos dados operacionais da farmácia.</small>
            </p>
            <button onClick={() => alert("Relatório gerado em formato JSON.")}>Exportar</button>
          </article>
          <article>
            <Icon name="shield" />
            <p>
              <strong>Controle LGPD</strong>
              <small>Gestão de consentimento e retenção de dados médicos.</small>
            </p>
            <button onClick={() => alert("Políticas em conformidade com ANVISA e LGPD.")}>Auditar</button>
          </article>
        </div>
      </section>
    </div>
  );
}
