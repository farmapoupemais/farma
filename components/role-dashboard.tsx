"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Role } from "@/lib/access";
import { catalogProducts, formatCurrency } from "@/lib/catalog";
import { BrandMark, Icon } from "./icons";
import { supabase } from "@/lib/supabase";

type DashboardRole = Role;
type ViewKey = "overview" | "orders" | "catalog" | "marketing" | "prescriptions" | "team" | "account";

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
  { key: "prescriptions", label: "Receitas", icon: "document", roles: ["pharmacist", "customer"] },
  { key: "team", label: "Equipe e permissões", icon: "user", roles: ["owner"] },
  { key: "account", label: "Minha conta", icon: "user", roles: ["customer"] },
];

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
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
  metadata_json?: Record<string, any>;
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
      } catch (err: any) {
        if (active) {
          setCatalogError(err?.message || "Erro ao carregar catálogo.");
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
    } catch (err: any) {
      setNotice(err?.message || "Não foi possível excluir o produto.");
    }
    setTimeout(() => setNotice(""), 2500);
  }

  // Edit product
  async function handleUpdateProduct(e: React.FormEvent<HTMLFormElement>) {
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
    } catch (err: any) {
      setNotice(err?.message || "Erro ao atualizar.");
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
    } catch (err: any) {
      setNotice(err?.message || "Erro na transição do pedido.");
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
    } catch (err: any) {
      setNotice(err?.message || "Erro ao revogar.");
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
    } catch (err: any) {
      setNotice(err?.message || "Erro ao atualizar cargo.");
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
            onSubmit={submitApi}
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

        {/* 5. RECEITAS */}
        {view === "prescriptions" && <PrescriptionsView customer={role === "customer"} />}

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

  const totalSalesCents = orders.reduce((sum, o) => sum + (o.status !== "Cancelado" ? o.total_cents : 0), 0);

  if (role === "customer") {
    return (
      <div className="dashboard-stack">
        <section className="customer-welcome">
          <div>
            <span className="eyebrow">Sua saúde em um só lugar</span>
            <h2>O que você precisa hoje?</h2>
            <p>Acompanhe pedidos, receitas e benefícios com privacidade.</p>
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
          <Metric label="Receitas seguras" value="1" detail="acesso protegido" icon="document" />
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
  onSubmit,
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
  setFormOpen: (f: any) => void;
  editingProduct: AdminProduct | null;
  setEditingProduct: (p: AdminProduct | null) => void;
  onQuickStock: (id: string, delta: number) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (e: React.FormEvent<HTMLFormElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, ep: string) => void;
  loading: boolean;
  error: string;
}) {
  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    const matchesText =
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q);
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
        <CardHeading title="Catálogo de Medicamentos e Produtos" />

        {/* Barra de Filtros */}
        <div className="table-toolbar" style={{ flexWrap: "wrap", gap: "10px" }}>
          <input
            placeholder="Buscar nome, marca, código…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ minWidth: "220px" }}
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

          <button
            className="primary-small"
            onClick={() => {
              setFormOpen(formOpen === "product" ? null : "product");
              setEditingProduct(null);
            }}
          >
            + Novo Produto
          </button>
        </div>

        {/* Formulário de Cadastro de Novo Produto */}
        {formOpen === "product" && !editingProduct && (
          <form className="admin-form" onSubmit={(e) => onSubmit(e, "/api/admin/products")}>
            <label>
              Nome do Produto*
              <input name="name" required maxLength={120} placeholder="Ex: Dipirona 500mg" />
            </label>
            <label>
              Slug Único*
              <input name="slug" required placeholder="dipirona-500mg" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
            </label>
            <label>
              Marca/Laboratório*
              <input name="brand" required maxLength={80} placeholder="Ex: EMS" />
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
              <input name="shortDescription" required maxLength={180} placeholder="20 comprimidos • Alívio de dor" />
            </label>
            <label>
              Preço em centavos*
              <input name="priceCents" type="number" min="1" required placeholder="Ex: 1590 (R$ 15,90)" />
            </label>
            <label>
              Preço anterior (De / Por)
              <input name="compareAtCents" type="number" min="1" placeholder="Ex: 1990 (R$ 19,90)" />
            </label>
            <label>
              Estoque inicial*
              <input name="stock" type="number" min="0" required defaultValue="50" />
            </label>
            <label className="wide">
              Descrição Detalhada*
              <textarea name="description" required maxLength={2000} placeholder="Instruções de uso, posologia e precauções..." />
            </label>
            <div className="form-actions wide">
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
              background: "rgba(0,0,0,0.5)",
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
                maxWidth: "600px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Editar Produto: {editingProduct.name}</h3>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={onUpdateProduct} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ gridColumn: "1 / -1", fontSize: "0.7rem", fontWeight: "bold" }}>
                  Nome
                  <input name="name" defaultValue={editingProduct.name} required style={{ width: "100%", padding: "6px" }} />
                </label>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                  Slug
                  <input name="slug" defaultValue={editingProduct.slug} required style={{ width: "100%", padding: "6px" }} />
                </label>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                  Marca
                  <input name="brand" defaultValue={editingProduct.brand} required style={{ width: "100%", padding: "6px" }} />
                </label>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                  Categoria
                  <select name="category" defaultValue={editingProduct.category} style={{ width: "100%", padding: "6px" }}>
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
                  <input name="stock" type="number" defaultValue={editingProduct.stock} required style={{ width: "100%", padding: "6px" }} />
                </label>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                  Preço em centavos
                  <input name="priceCents" type="number" defaultValue={editingProduct.priceCents} required style={{ width: "100%", padding: "6px" }} />
                </label>
                <label style={{ fontSize: "0.7rem", fontWeight: "bold" }}>
                  Preço anterior em centavos
                  <input name="compareAtCents" type="number" defaultValue={editingProduct.compareAtCents ?? ""} style={{ width: "100%", padding: "6px" }} />
                </label>
                <label style={{ gridColumn: "1 / -1", fontSize: "0.7rem", fontWeight: "bold" }}>
                  Descrição Curta
                  <input name="shortDescription" defaultValue={editingProduct.shortDescription ?? ""} required style={{ width: "100%", padding: "6px" }} />
                </label>
                <label style={{ gridColumn: "1 / -1", fontSize: "0.7rem", fontWeight: "bold" }}>
                  Descrição Completa
                  <textarea name="description" defaultValue={editingProduct.description ?? ""} rows={3} style={{ width: "100%", padding: "6px" }} />
                </label>
                <label style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem" }}>
                  <input name="isActive" type="checkbox" defaultChecked={editingProduct.isActive} />
                  Produto Ativo (visível no catálogo público)
                </label>

                <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
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

        <div className="admin-catalog-summary">
          <strong>{filtered.length}</strong>
          <span>produtos exibidos {filtered.length !== products.length && `(filtrados de ${products.length})`}</span>
        </div>

        {loading && <div className="admin-catalog-state">Carregando catálogo do Supabase…</div>}
        {error && <div className="admin-catalog-state error">{error}</div>}

        {!loading && !error && (
          <div className="admin-product-grid">
            {filtered.map((product) => (
              <article className="admin-product-card" key={product.id}>
                <header>
                  <span>{product.brand}</span>
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

                <h3>{product.name}</h3>
                <p>{product.category}</p>

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
                          title="Diminuir estoque em 1"
                          style={{ border: "1px solid var(--line)", background: "#fff", cursor: "pointer", borderRadius: "3px", padding: "0 4px" }}
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => onQuickStock(product.id, 1)}
                          title="Aumentar estoque em 1"
                          style={{ border: "1px solid var(--line)", background: "#fff", cursor: "pointer", borderRadius: "3px", padding: "0 4px" }}
                        >
                          +
                        </button>
                      </span>
                    </dd>
                  </div>
                </dl>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  <small>{product.slug}</small>
                  <button
                    className="button-ghost"
                    onClick={() => setEditingProduct(product)}
                    style={{ fontSize: "0.65rem", padding: "3px 8px", color: "var(--teal)", cursor: "pointer" }}
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
  setFormOpen: (f: any) => void;
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
// COMPONENTE: RECEITAS MÉDICAS
// ----------------------------------------------------------------------
function PrescriptionsView({ customer }: { customer: boolean }) {
  const rows = customer
    ? [{ id: "REC-0291", name: "Receita digital", time: "Enviada em 22 ago.", status: "Aprovada" }]
    : [
        { id: "REC-0314", name: "Marina Costa", time: "há 4 min", status: "Prioritária" },
        { id: "REC-0313", name: "João Martins", time: "há 12 min", status: "Pendente" },
        { id: "REC-0312", name: "Clara Souza", time: "há 19 min", status: "Em análise" },
      ];

  return (
    <div className="dashboard-stack">
      <section className="dashboard-card full-card">
        <CardHeading title={customer ? "Minhas Receitas Médicas" : "Fila de Revisão de Receitas"} />
        <div className="prescription-privacy">
          <Icon name="shield" />
          <p>
            <strong>Conformidade Regulatória ANVISA e Privacidade</strong>
            {customer
              ? "Somente você e farmacêuticos autorizados têm acesso às suas prescrições."
              : "Todas as aprovações e visualizações de receitas são auditadas e registradas com data e CRF do profissional."}
          </p>
        </div>

        <div className="prescription-rows">
          {rows.map((row) => (
            <article key={row.id}>
              <span><Icon name="document" /></span>
              <p>
                <strong>{row.name}</strong>
                <small>{row.id} • {row.time}</small>
              </p>
              <StatusPill>{row.status}</StatusPill>
              {!customer && (
                <button
                  className="button-ghost"
                  onClick={() => alert(`Receita ${row.id} aprovada pelo Farmacêutico.`)}
                  style={{ fontSize: "0.7rem", padding: "4px 8px" }}
                >
                  Liberar Receita
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
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
  setFormOpen: (f: any) => void;
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
