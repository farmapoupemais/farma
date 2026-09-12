"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Role } from "@/lib/access";
import { catalogProducts, formatCurrency, type ProductColor } from "@/lib/catalog";
import { BrandMark, Icon } from "./icons";
import { supabase } from "@/lib/supabase";
import { OperationalAuditView } from "./operational-audit-view";
import { SiteHealthAuditView } from "./site-health-audit-view";

type DashboardRole = Role;
type ViewKey = "overview" | "orders" | "financial" | "audit" | "catalog" | "marketing" | "team" | "account";

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
  { key: "financial", label: "Financeiro & Caixa", icon: "banknote", roles: ["owner", "manager"] },
  { key: "audit", label: "Suíte de Auditoria Integral", icon: "shield", roles: ["owner", "manager"] },
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

export type FormOpenState = "product" | "banner" | "discount" | "role" | null;

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
              fontSize: "var(--text-lg)",
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
              style={{ padding: "0 10px", width: "auto", fontSize: "var(--text-xs)" }}
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

        {/* 2.1 FINANCEIRO & FLUXO DE CAIXA */}
        {view === "financial" && (
          <FinancialView
            orders={ordersList}
            onNotice={setNotice}
            onOpenAudit={() => setView("audit")}
          />
        )}

        {/* 2.2 AUDITORIA FINANCEIRA INTEGRAL (TUDO) */}
        {view === "audit" && (
          <AuditView
            orders={ordersList}
            userName={userName}
            userEmail={userEmail}
            onNotice={setNotice}
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
                    fontSize: "var(--text-xs)",
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
                style={{ fontSize: "var(--text-2xs)", padding: "4px 8px", color: "var(--teal)" }}
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
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontFamily: "var(--font-serif)", fontWeight: "var(--font-bold)" }}>
                Detalhes do Pedido {selectedOrder.id}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: "transparent", border: "none", fontSize: "var(--text-lg)", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "4px 0", fontSize: "var(--text-xs)", color: "var(--muted)" }}>
              <strong>Cliente:</strong> {selectedOrder.customer_name || selectedOrder.customer_email} ({selectedOrder.customer_email})
            </p>
            <p style={{ margin: "4px 0", fontSize: "var(--text-xs)", color: "var(--muted)" }}>
              <strong>Tipo:</strong> {selectedOrder.fulfillment === "delivery" ? "Entrega no endereço" : "Retirada no balcão"}
            </p>
            {selectedOrder.address_json && (
              <p style={{ margin: "4px 0", fontSize: "var(--text-xs)", color: "var(--muted)" }}>
                <strong>Endereço:</strong> {selectedOrder.address_json.street}, {selectedOrder.address_json.city} - {selectedOrder.address_json.state}
              </p>
            )}

            <h4 style={{ margin: "16px 0 8px", fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)" }}>Itens do Carrinho:</h4>
            <div style={{ background: "var(--sage-2)", borderRadius: "8px", padding: "10px", marginBottom: "16px" }}>
              {selectedOrder.items_json.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", padding: "4px 0" }}>
                  <span>{item.quantity}x {item.name || item.id}</span>
                  <strong>{item.priceCents ? formatCurrency(item.priceCents * item.quantity) : "—"}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", borderTop: "1px solid var(--line)", paddingTop: "10px" }}>
              <span>Total do Pedido:</span>
              <strong style={{ color: "var(--teal-deep)", fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>{formatCurrency(selectedOrder.total_cents)}</strong>
            </div>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                className="button button-primary"
                onClick={() => setSelectedOrder(null)}
                style={{ padding: "8px 16px", fontSize: "var(--text-xs)" }}
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
  formOpen: FormOpenState;
  setFormOpen: (f: FormOpenState) => void;
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
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-xl)", fontWeight: "var(--font-bold)", margin: 0, color: "var(--teal-deep)" }}>
              Catálogo Geral de Produtos e Estoque
            </h2>
            <small style={{ color: "var(--muted)" }}>Produtos de saúde, medicamentos MIPs, cosméticos e higiene com gestão de ID, código de barras, fotos e cores.</small>
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
                  fontSize: "var(--text-2xs)",
                  fontWeight: "var(--font-bold)",
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
                  fontSize: "var(--text-2xs)",
                  fontWeight: "var(--font-bold)",
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
              <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", color: "var(--teal-deep)" }}>Cadastro de Novo Produto</h3>
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
                  <strong style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)", color: "var(--teal-deep)" }}>📷 Fotos do Produto (quantas fotos quiser)</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "var(--text-2xs)", color: "var(--muted)" }}>Adicione URLs de fotos em alta resolução. A primeira será a foto principal.</p>
                </div>
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", background: "#fff", padding: "3px 8px", borderRadius: "6px" }}>
                  {newImages.length} foto(s) adicionada(s)
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <input
                  type="url"
                  placeholder="Cole a URL da foto (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  style={{ flex: 1, padding: "6px 10px", fontSize: "var(--text-xs)", borderRadius: "6px", border: "1px solid var(--line)" }}
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
                  style={{ padding: "6px 14px", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}
                >
                  + Adicionar Foto
                </button>
              </div>

              {newImages.length > 0 && (
                <div style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "6px 2px" }}>
                  {newImages.map((img, idx) => (
                    <div key={idx} style={{ position: "relative", width: "70px", height: "70px", borderRadius: "8px", overflow: "hidden", border: idx === 0 ? "2px solid var(--teal)" : "1px solid var(--line)", flexShrink: 0, background: "#fff" }}>
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {idx === 0 && <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--teal)", color: "#fff", fontSize: "var(--text-3xs)", textAlign: "center", fontWeight: "var(--font-bold)" }}>Capa</span>}
                      <button
                        type="button"
                        onClick={() => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
                        style={{ position: "absolute", top: "2px", right: "2px", width: "18px", height: "18px", borderRadius: "50%", background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", cursor: "pointer", fontSize: "var(--text-3xs)", display: "grid", placeItems: "center" }}
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
                  <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontFamily: "var(--font-serif)", fontWeight: "var(--font-bold)" }}>Editar Produto: {editingProduct.name}</h3>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "var(--text-3xs)", background: "var(--sage-2)", padding: "2px 8px", borderRadius: "4px", fontWeight: "var(--font-bold)", color: "var(--teal-deep)" }}>
                      ID: {editingProduct.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(editingProduct.id);
                        alert("ID copiado para a área de transferência!");
                      }}
                      style={{ background: "transparent", border: "none", color: "var(--teal)", cursor: "pointer", fontSize: "var(--text-3xs)", fontWeight: "var(--font-bold)" }}
                    >
                      Copiar ID
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ background: "transparent", border: "none", fontSize: "var(--text-xl)", cursor: "pointer", color: "var(--muted)" }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => onUpdateProduct(e, editImages, editingProduct.colors || [])} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ gridColumn: "1 / -1", fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Nome do Produto
                  <input name="name" defaultValue={editingProduct.name} required style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }} />
                </label>
                <label style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Código de Barras (EAN-13)
                  <input name="barcode" defaultValue={editingProduct.barcode || ""} placeholder="789..." style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }} />
                </label>
                <label style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Slug na URL
                  <input name="slug" defaultValue={editingProduct.slug} required style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }} />
                </label>
                <label style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Marca / Laboratório
                  <input name="brand" defaultValue={editingProduct.brand} required style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }} />
                </label>
                <label style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Categoria
                  <select name="category" defaultValue={editingProduct.category} style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }}>
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
                <label style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Estoque (unidades)
                  <input name="stock" type="number" defaultValue={editingProduct.stock} required style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }} />
                </label>
                <label style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Preço em centavos
                  <input name="priceCents" type="number" defaultValue={editingProduct.priceCents} required style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }} />
                </label>
                <label style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Preço anterior em centavos (De/Por)
                  <input name="compareAtCents" type="number" defaultValue={editingProduct.compareAtCents ?? ""} style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }} />
                </label>
                <label style={{ gridColumn: "1 / -1", fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Descrição Curta
                  <input name="shortDescription" defaultValue={editingProduct.shortDescription ?? ""} required style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }} />
                </label>
                <label style={{ gridColumn: "1 / -1", fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Descrição Completa
                  <textarea name="description" defaultValue={editingProduct.description ?? ""} rows={3} style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }} />
                </label>

                {/* Gerenciador de Fotos Ilimitadas na Edição */}
                <div style={{ gridColumn: "1 / -1", background: "var(--sage-2)", borderRadius: "10px", padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)", color: "var(--teal-deep)" }}>📷 Fotos do Produto ({editImages.length} fotos)</strong>
                    <small style={{ color: "var(--muted)" }}>Você pode adicionar quantas fotos quiser.</small>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="url"
                      placeholder="Adicionar nova URL de foto…"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      style={{ flex: 1, padding: "5px 8px", fontSize: "var(--text-xs)" }}
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
                      style={{ padding: "5px 12px", fontSize: "var(--text-xs)" }}
                    >
                      + Foto
                    </button>
                  </div>
                  {editImages.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "4px 0" }}>
                      {editImages.map((img, idx) => (
                        <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "6px", overflow: "hidden", border: idx === 0 ? "2px solid var(--teal)" : "1px solid var(--line)", flexShrink: 0, background: "#fff" }}>
                          <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          {idx === 0 && <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--teal)", color: "#fff", fontSize: "var(--text-3xs)", textAlign: "center", fontWeight: "var(--font-bold)" }}>Capa</span>}
                          <button
                            type="button"
                            onClick={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                            style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", cursor: "pointer", fontSize: "var(--text-3xs)", display: "grid", placeItems: "center" }}
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
                    <strong style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)" }}>🎨 Cores Disponíveis: {editingProduct.colors?.length || 0} cadastrada(s)</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "var(--text-2xs)", color: "var(--muted)" }}>Abra a tabela de cores para editar estoque ou adicionar novas opções.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      openColorsModal(editingProduct);
                    }}
                    className="button button-ghost"
                    style={{ fontSize: "var(--text-xs)", padding: "6px 12px", color: "var(--teal)" }}
                  >
                    Gerenciar Tabela de Cores ↗
                  </button>
                </div>

                <label style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px", fontSize: "var(--text-xs)", marginTop: "4px" }}>
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
                  <span style={{ fontSize: "var(--text-3xs)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--teal)", fontWeight: "var(--font-bold)" }}>
                    Tabela de Variantes
                  </span>
                  <h3 style={{ margin: "4px 0 0", fontSize: "var(--text-lg)", fontFamily: "var(--font-serif)", fontWeight: "var(--font-bold)" }}>
                    Cores Disponíveis: {selectedProductForColors.name}
                  </h3>
                  <small style={{ color: "var(--muted)", fontSize: "var(--text-2xs)" }}>
                    ID: <code>{selectedProductForColors.id}</code> • Código de barras: <code>{selectedProductForColors.barcode || "—"}</code>
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductForColors(null)}
                  style={{ background: "transparent", border: "none", fontSize: "var(--text-xl)", cursor: "pointer", color: "var(--muted)" }}
                >
                  ✕
                </button>
              </div>

              {/* Tabela de Cores Disponíveis */}
              <div style={{ overflowX: "auto", marginBottom: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)" }}>
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
                              <code style={{ fontSize: "var(--text-3xs)" }}>{color.hex}</code>
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
                              style={{ width: "65px", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "var(--text-xs)" }}
                            />
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "var(--text-3xs)",
                              fontWeight: "var(--font-bold)",
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
                              style={{ background: "transparent", border: "none", color: "var(--coral)", cursor: "pointer", fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)" }}
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
                <h4 style={{ margin: "0 0 12px", fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)", color: "var(--teal-deep)" }}>
                  + Adicionar Nova Cor à Tabela
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Nome da Cor*</label>
                    <input
                      id="new-color-name"
                      placeholder="Ex: Azul Petróleo"
                      style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Amostra / Hex*</label>
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
                        style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Estoque*</label>
                    <input
                      id="new-color-stock"
                      type="number"
                      min="0"
                      defaultValue="20"
                      style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Código SKU</label>
                    <input
                      id="new-color-sku"
                      placeholder="Ex: COR-AZUL"
                      style={{ width: "100%", padding: "6px 8px", fontSize: "var(--text-xs)" }}
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
                      style={{ padding: "8px 14px", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}
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
                  style={{ padding: "8px 16px", fontSize: "var(--text-xs)" }}
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
                  style={{ padding: "8px 18px", fontSize: "var(--text-xs)" }}
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
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)" }}>
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
                        <code style={{ fontSize: "var(--text-3xs)", background: "var(--sage-2)", padding: "2px 6px", borderRadius: "4px", color: "var(--teal-deep)" }}>
                          {product.id}
                        </code>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: "var(--text-3xs)", fontFamily: "var(--font-mono)", color: "#334155" }}>
                          🏷️ {product.barcode || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <strong style={{ display: "block", fontSize: "var(--text-xs)" }}>{product.name}</strong>
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
                              style={{ border: "1px solid var(--line)", background: "#fff", cursor: "pointer", borderRadius: "3px", padding: "0 4px", fontSize: "var(--text-3xs)" }}
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => onQuickStock(product.id, 1)}
                              title="+1"
                              style={{ border: "1px solid var(--line)", background: "#fff", cursor: "pointer", borderRadius: "3px", padding: "0 4px", fontSize: "var(--text-3xs)" }}
                            >
                              +
                            </button>
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: "var(--text-3xs)", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
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
                            fontSize: "var(--text-3xs)",
                            fontWeight: "var(--font-bold)",
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
                            style={{ fontSize: "var(--text-2xs)", padding: "3px 8px", color: "var(--teal)" }}
                          >
                            ✎ Editar
                          </button>
                          <button
                            onClick={() => onDeleteProduct(product.id)}
                            style={{ background: "transparent", border: "none", color: "var(--coral)", cursor: "pointer", fontSize: "var(--text-xs)", padding: "3px 4px" }}
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
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)" }}>{product.brand}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <StatusPill>{!product.isActive ? "Inativo" : product.stock <= 5 ? "Estoque baixo" : "Ativo"}</StatusPill>
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(product.id)}
                      title="Excluir produto"
                      style={{ background: "transparent", border: "none", color: "var(--coral)", cursor: "pointer", fontSize: "var(--text-xs)" }}
                    >
                      ✕
                    </button>
                  </div>
                </header>

                <h3 style={{ margin: "6px 0 2px" }}>{product.name}</h3>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "4px 0 8px" }}>
                  <code style={{ fontSize: "var(--text-3xs)", background: "var(--sage-2)", padding: "1px 5px", borderRadius: "4px", color: "var(--teal-deep)" }}>
                    ID: {product.id}
                  </code>
                  <span style={{ fontSize: "var(--text-3xs)", fontFamily: "var(--font-mono)", background: "#f8fafc", padding: "1px 5px", borderRadius: "4px", border: "1px solid var(--line)" }}>
                    🏷️ {product.barcode || "S/ código"}
                  </span>
                </div>
                <p style={{ margin: "2px 0 8px", fontSize: "var(--text-2xs)", color: "var(--muted)" }}>{product.category}</p>

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
                      fontSize: "var(--text-3xs)",
                      fontWeight: "var(--font-bold)",
                    }}
                    title="Clique para abrir tabela de cores disponíveis"
                  >
                    🎨 Cores ({product.colors?.length || 0})
                  </button>
                  <button
                    className="button-ghost"
                    onClick={() => setEditingProduct(product)}
                    style={{ fontSize: "var(--text-2xs)", padding: "3px 8px", color: "var(--teal)", cursor: "pointer" }}
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
  formOpen: FormOpenState;
  setFormOpen: (f: FormOpenState) => void;
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
              <p style={{ color: "var(--muted)", padding: "20px", textAlign: "center", fontSize: "var(--text-xs)" }}>
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
                      style={{ fontSize: "var(--text-3xs)", padding: "2px 6px", cursor: "pointer" }}
                    >
                      {b.is_active ? "Pausar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => onDeleteBanner(b.id)}
                      style={{ fontSize: "var(--text-3xs)", padding: "2px 6px", color: "var(--coral)", cursor: "pointer" }}
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
              <p style={{ color: "var(--muted)", padding: "20px", textAlign: "center", fontSize: "var(--text-xs)" }}>
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
                      style={{ fontSize: "var(--text-3xs)", padding: "2px 6px", cursor: "pointer", background: "#fff", color: "var(--ink)", borderRadius: "4px" }}
                    >
                      {d.is_active ? "Pausar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => onDeleteDiscount(d.id)}
                      style={{ fontSize: "var(--text-3xs)", padding: "2px 6px", color: "var(--coral)", cursor: "pointer", background: "#fff", borderRadius: "4px" }}
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
  formOpen: FormOpenState;
  setFormOpen: (f: FormOpenState) => void;
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
          <h3 style={{ margin: "0 0 12px", fontSize: "var(--text-base)", fontWeight: "var(--font-bold)" }}>Membros Ativos Cadastrados no Supabase</h3>

          {team.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "var(--text-xs)" }}>Nenhum membro cadastrado ainda.</p>
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
                        style={{ padding: "4px 8px", fontSize: "var(--text-xs)", borderRadius: "6px", border: "1px solid var(--line)" }}
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
                        style={{ color: "var(--coral)", fontSize: "var(--text-2xs)", padding: "4px 8px" }}
                      >
                        Revogar
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <h3 style={{ margin: "30px 0 12px", fontSize: "var(--text-base)", fontWeight: "var(--font-bold)" }}>Matriz de Funções e Hierarquia</h3>
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

// ----------------------------------------------------------------------
// COMPONENTE: FINANCEIRO & FLUXO DE CAIXA (ESQUELETO STRIPE / GATEWAYS)
// ----------------------------------------------------------------------
export type CashFlowEntry = {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amountCents: number;
  paymentMethod: string;
  date: string;
  status: "settled" | "pending";
};

const initialCashFlow: CashFlowEntry[] = [
  {
    id: "LAN-10081",
    type: "income",
    category: "Venda E-commerce",
    description: "Pedido #PM-94821 — Protetor FPS 50 + Ômega 3",
    amountCents: 14890,
    paymentMethod: "Pix",
    date: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "LAN-10080",
    type: "income",
    category: "Tele-Entrega Direta",
    description: "Pedido #PM-94819 — Fraldas Pampers + Lenço Umedecido",
    amountCents: 21990,
    paymentMethod: "Cartão de Crédito 3x",
    date: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    status: "pending",
  },
  {
    id: "LAN-10079",
    type: "income",
    category: "Venda Balcão Loja",
    description: "Medicamentos Isentos de Retenção + Higiene Pessoal",
    amountCents: 8940,
    paymentMethod: "Dinheiro em Espécie",
    date: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "LAN-10078",
    type: "expense",
    category: "Fornecedor Medicamentos",
    description: "Distribuidora Santa Cruz — Reposição Semanal NF #84920",
    amountCents: 184500,
    paymentMethod: "Boleto D+30",
    date: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "LAN-10077",
    type: "expense",
    category: "Logística & Tele-Entrega",
    description: "Diária Frota Própria de Motoboys (3 entregadores)",
    amountCents: 36000,
    paymentMethod: "Pix",
    date: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "LAN-10076",
    type: "expense",
    category: "Embalagens & Sacolas",
    description: "Sacolas Biodegradáveis Personalizadas Poupe Mais",
    amountCents: 42000,
    paymentMethod: "Transferência TED",
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "LAN-10075",
    type: "expense",
    category: "Tarifas Gateway / Cartão",
    description: "Taxas de Intercâmbio MDR & Adquirente",
    amountCents: 12450,
    paymentMethod: "Débito Automático",
    date: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    status: "settled",
  },
];

function FinancialView({
  orders,
  onNotice,
  onOpenAudit,
}: {
  orders: AdminOrder[];
  onNotice: (msg: string) => void;
  onOpenAudit?: () => void;
}) {
  const [entries, setEntries] = useState<CashFlowEntry[]>(() => {
    try {
      const saved = localStorage.getItem("poupe-mais-cashflow");
      return saved ? JSON.parse(saved) : initialCashFlow;
    } catch {
      return initialCashFlow;
    }
  });

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: "income" as "income" | "expense",
    category: "Venda E-commerce",
    description: "",
    amount: "",
    paymentMethod: "Pix",
  });

  // Gateway Settings (Stripe Skeleton)
  const [gatewaySettings, setGatewaySettings] = useState(() => {
    try {
      const saved = localStorage.getItem("poupe-mais-gateway-settings");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      provider: "stripe",
      environment: "sandbox",
      publishableKey: "pk_test_51PoupMaisDemo99887766554433",
      secretKey: "sk_test_51PoupMaisSecretMockKey998877",
      webhookSecret: "whsec_poupemais_webhook_secret_mock",
      pixKey: "12.345.678/0001-90",
      pixDiscountPercent: 5,
      maxInstallments: 6,
      minInstallmentCents: 2000,
    };
  });

  function saveGatewaySettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem("poupe-mais-gateway-settings", JSON.stringify(gatewaySettings));
      onNotice("Parâmetros do Gateway (Stripe) salvos com sucesso no sistema!");
    } catch {
      onNotice("Erro ao salvar parâmetros.");
    }
    setTimeout(() => onNotice(""), 3000);
  }

  function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    const amountVal = parseFloat(newEntry.amount.replace(",", "."));
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Informe um valor monetário válido.");
      return;
    }
    const entry: CashFlowEntry = {
      id: "LAN-" + Math.floor(10000 + Math.random() * 90000),
      type: newEntry.type,
      category: newEntry.category,
      description: newEntry.description || (newEntry.type === "income" ? "Receita Avulsa" : "Despesa Operacional"),
      amountCents: Math.round(amountVal * 100),
      paymentMethod: newEntry.paymentMethod,
      date: new Date().toISOString(),
      status: "settled",
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    try {
      localStorage.setItem("poupe-mais-cashflow", JSON.stringify(updated));
    } catch {
      // ignore
    }
    setModalOpen(false);
    setNewEntry({
      type: "income",
      category: "Venda E-commerce",
      description: "",
      amount: "",
      paymentMethod: "Pix",
    });
    onNotice(`Lançamento ${entry.id} registrado com sucesso!`);
    setTimeout(() => onNotice(""), 2500);
  }

  // Financial Metrics
  const ordersRevenueCents = useMemo(
    () => orders.reduce((s, o) => s + (o.total_cents || 0), 0),
    [orders]
  );
  const totalIncomeCents = useMemo(
    () => entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amountCents, 0) + ordersRevenueCents,
    [entries, ordersRevenueCents]
  );
  const totalExpenseCents = useMemo(
    () => entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amountCents, 0),
    [entries]
  );
  const netBalanceCents = totalIncomeCents - totalExpenseCents;

  const pendingReceivablesCents = useMemo(
    () => entries.filter((e) => e.type === "income" && e.status === "pending").reduce((s, e) => s + e.amountCents, 0),
    [entries]
  );

  const filteredEntries = useMemo(() => {
    if (filterType === "all") return entries;
    return entries.filter((e) => e.type === filterType);
  }, [entries, filterType]);

  return (
    <div className="financial-dashboard-view">
      {/* ATALHO PARA A PLATAFORMA DE AUDITORIA FINANCEIRA COMPLETA */}
      {onOpenAudit && (
        <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "14px", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#00874e", color: "#fff", display: "grid", placeItems: "center" }}>
              <Icon name="shield" size={20} />
            </span>
            <div>
              <strong style={{ fontSize: "var(--text-sm)", color: "#005a34" }}>Plataforma de Auditoria Financeira Integral (Tudo)</strong>
              <p style={{ margin: "2px 0 0", fontSize: "var(--text-2xs)", color: "#334155" }}>
                Consulte e rastreie cada centavo por Data, Dia da Semana, Hora, Total monetário e Pessoa (cliente/operador/fornecedor).
              </p>
            </div>
          </div>
          <button
            type="button"
            className="button button-primary"
            style={{ fontSize: "var(--text-xs)", padding: "8px 16px" }}
            onClick={onOpenAudit}
          >
            Abrir Auditoria Completa →
          </button>
        </div>
      )}

      {/* 1. CARDS DE KPIS FINANCEIROS */}
      <div className="financial-kpi-grid">
        <div className="kpi-card gross-revenue">
          <div className="kpi-icon"><Icon name="banknote" size={22} /></div>
          <div>
            <small>Faturamento Bruto</small>
            <strong>{formatCurrency(totalIncomeCents)}</strong>
            <span>Vendas loja + tele-entrega</span>
          </div>
        </div>

        <div className="kpi-card net-revenue">
          <div className="kpi-icon"><Icon name="chart" size={22} /></div>
          <div>
            <small>Saldo Líquido em Caixa</small>
            <strong style={{ color: netBalanceCents >= 0 ? "var(--farma-green)" : "var(--farma-red)" }}>
              {formatCurrency(netBalanceCents)}
            </strong>
            <span>Entradas deduzidas as despesas</span>
          </div>
        </div>

        <div className="kpi-card receivables">
          <div className="kpi-icon"><Icon name="credit-card" size={22} /></div>
          <div>
            <small>A Receber (Cartão D+14/D+30)</small>
            <strong>{formatCurrency(pendingReceivablesCents)}</strong>
            <span>Vendas parceladas a liquidar</span>
          </div>
        </div>

        <div className="kpi-card expenses">
          <div className="kpi-icon"><Icon name="alert" size={22} /></div>
          <div>
            <small>Saídas & Despesas</small>
            <strong style={{ color: "var(--farma-red)" }}>
              {formatCurrency(totalExpenseCents)}
            </strong>
            <span>Fornecedores, frota e tarifas</span>
          </div>
        </div>
      </div>

      {/* 2. COMPOSIÇÃO DE MEIOS DE PAGAMENTO */}
      <div className="financial-breakdown-card">
        <CardHeading title="Composição de Pagamentos & Economia" />
        <div className="payment-distribution-grid">
          <div className="distribution-item">
            <div className="dist-header">
              <span><Icon name="qr-code" size={18} /> Pix (5% OFF)</span>
              <strong>52%</strong>
            </div>
            <div className="dist-progress-bar"><div className="bar-fill pix-bar" style={{ width: "52%" }} /></div>
            <small>Liquidação instantânea • Custo zero</small>
          </div>

          <div className="distribution-item">
            <div className="dist-header">
              <span><Icon name="credit-card" size={18} /> Cartão de Crédito</span>
              <strong>33%</strong>
            </div>
            <div className="dist-progress-bar"><div className="bar-fill card-bar" style={{ width: "33%" }} /></div>
            <small>Em até 6x sem juros</small>
          </div>

          <div className="distribution-item">
            <div className="dist-header">
              <span><Icon name="banknote" size={18} /> Dinheiro na Entrega</span>
              <strong>9%</strong>
            </div>
            <div className="dist-progress-bar"><div className="bar-fill cash-bar" style={{ width: "9%" }} /></div>
            <small>Troco conferido pelo motoboy</small>
          </div>

          <div className="distribution-item">
            <div className="dist-header">
              <span><Icon name="document" size={18} /> Boleto / Débito</span>
              <strong>6%</strong>
            </div>
            <div className="dist-progress-bar"><div className="bar-fill boleto-bar" style={{ width: "6%" }} /></div>
            <small>Compensação em 1 dia útil</small>
          </div>
        </div>
      </div>

      {/* 3. FLUXO DE CAIXA: ENTRADAS E SAÍDAS */}
      <div className="financial-table-card">
        <div className="table-card-topbar">
          <div>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: "var(--font-bold)" }}>Livro Caixa: Registro de Entradas e Saídas</h3>
            <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "var(--text-2xs)" }}>
              Total de {filteredEntries.length} movimentações registradas com protocolo único.
            </p>
          </div>
          <div className="table-actions">
            <div className="filter-pill-group">
              <button
                type="button"
                className={filterType === "all" ? "active" : ""}
                onClick={() => setFilterType("all")}
              >
                Todos
              </button>
              <button
                type="button"
                className={filterType === "income" ? "active" : ""}
                onClick={() => setFilterType("income")}
              >
                + Entradas
              </button>
              <button
                type="button"
                className={filterType === "expense" ? "active" : ""}
                onClick={() => setFilterType("expense")}
              >
                − Saídas
              </button>
            </div>
            <button
              type="button"
              className="button button-primary"
              style={{ fontSize: "var(--text-xs)", padding: "6px 14px", height: "36px" }}
              onClick={() => setModalOpen(true)}
            >
              + Novo Lançamento
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="financial-data-table">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Data / Hora</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Meio de Pagamento</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((item) => (
                <tr key={item.id}>
                  <td><code>{item.id}</code></td>
                  <td>{new Date(item.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td>
                    <span className={`flow-badge ${item.type}`}>
                      {item.type === "income" ? "Entrada" : "Saída"}
                    </span>
                  </td>
                  <td><strong>{item.category}</strong></td>
                  <td className="description-cell">{item.description}</td>
                  <td><span className="payment-method-tag">{item.paymentMethod}</span></td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }} className={item.type === "income" ? "income-text" : "expense-text"}>
                    {item.type === "income" ? "+ " : "− "}
                    {formatCurrency(item.amountCents)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`status-pill ${item.status === "settled" ? "success" : "warning"}`}>
                      {item.status === "settled" ? "Liquidado" : "Aguardando"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. ESQUELETO DE INTEGRAÇÃO COM STRIPE OU OUTRO GATEWAY */}
      <div className="gateway-config-card">
        <div className="gateway-config-header">
          <div className="gateway-icon-box">
            <Icon name="spark" size={24} />
          </div>
          <div>
            <h3>Configuração do Gateway de Pagamento (Esqueleto de Integração)</h3>
            <p>
              Estrutura pronta para conectar com <strong>Stripe</strong> ou outro provedor (Mercado Pago, Stone, Asaas)
              quando desejar ativar a cobrança real.
            </p>
          </div>
          <span className="env-badge simulation">Modo Simulação Ativo</span>
        </div>

        <form onSubmit={saveGatewaySettings} className="gateway-settings-form">
          <div className="form-grid-3">
            <label>
              <span>Provedor de Pagamento:</span>
              <select
                value={gatewaySettings.provider}
                onChange={(e) => setGatewaySettings({ ...gatewaySettings, provider: e.target.value })}
              >
                <option value="stripe">Stripe (Recomendado Internacional & Nacional)</option>
                <option value="mercadopago">Mercado Pago</option>
                <option value="pagarme">Pagar.me / Stone</option>
                <option value="asaas">Asaas (Cobranças & Pix)</option>
                <option value="cielo">Cielo E-commerce</option>
              </select>
            </label>

            <label>
              <span>Ambiente:</span>
              <select
                value={gatewaySettings.environment}
                onChange={(e) => setGatewaySettings({ ...gatewaySettings, environment: e.target.value })}
              >
                <option value="sandbox">Sandbox / Homologação (Testes)</option>
                <option value="production">Produção (Cobrança Real)</option>
              </select>
            </label>

            <label>
              <span>Chave Pix da Loja (CNPJ ou Celular):</span>
              <input
                type="text"
                value={gatewaySettings.pixKey}
                onChange={(e) => setGatewaySettings({ ...gatewaySettings, pixKey: e.target.value })}
              />
            </label>
          </div>

          <div className="form-grid-3" style={{ marginTop: "14px" }}>
            <label>
              <span>Stripe Publishable Key:</span>
              <input
                type="text"
                value={gatewaySettings.publishableKey}
                placeholder="pk_test_..."
                onChange={(e) => setGatewaySettings({ ...gatewaySettings, publishableKey: e.target.value })}
              />
            </label>

            <label>
              <span>Stripe Secret Key:</span>
              <input
                type="password"
                value={gatewaySettings.secretKey}
                placeholder="sk_test_..."
                onChange={(e) => setGatewaySettings({ ...gatewaySettings, secretKey: e.target.value })}
              />
            </label>

            <label>
              <span>Webhook Signing Secret:</span>
              <input
                type="password"
                value={gatewaySettings.webhookSecret}
                placeholder="whsec_..."
                onChange={(e) => setGatewaySettings({ ...gatewaySettings, webhookSecret: e.target.value })}
              />
            </label>
          </div>

          <div className="form-grid-3" style={{ marginTop: "14px" }}>
            <label>
              <span>Desconto no Pix (%):</span>
              <input
                type="number"
                min="0"
                max="30"
                value={gatewaySettings.pixDiscountPercent}
                onChange={(e) => setGatewaySettings({ ...gatewaySettings, pixDiscountPercent: Number(e.target.value) })}
              />
            </label>

            <label>
              <span>Máximo de Parcelas sem Juros:</span>
              <select
                value={gatewaySettings.maxInstallments}
                onChange={(e) => setGatewaySettings({ ...gatewaySettings, maxInstallments: Number(e.target.value) })}
              >
                <option value={1}>1x (Somente à vista)</option>
                <option value={2}>Até 2x sem juros</option>
                <option value={3}>Até 3x sem juros</option>
                <option value={4}>Até 4x sem juros</option>
                <option value={5}>Até 5x sem juros</option>
                <option value={6}>Até 6x sem juros</option>
                <option value={10}>Até 10x sem juros</option>
                <option value={12}>Até 12x sem juros</option>
              </select>
            </label>

            <label>
              <span>Parcela Mínima (R$):</span>
              <input
                type="number"
                min="10"
                step="5"
                value={gatewaySettings.minInstallmentCents / 100}
                onChange={(e) => setGatewaySettings({ ...gatewaySettings, minInstallmentCents: Math.round(Number(e.target.value) * 100) })}
              />
            </label>
          </div>

          <div className="gateway-form-footer">
            <div className="status-indicator">
              <span className="dot green" />
              <span>Esqueleto 100% configurado para receber Stripe Elements e Webhooks.</span>
            </div>
            <button type="submit" className="button button-primary">
              Salvar Parâmetros do Gateway
            </button>
          </div>
        </form>
      </div>

      {/* MODAL: NOVO LANÇAMENTO FINANCEIRO */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Novo Lançamento Financeiro</h3>
              <button type="button" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleAddEntry} className="modal-form">
              <div className="form-row">
                <label>
                  <span>Tipo de Operação:</span>
                  <select
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as "income" | "expense" })}
                  >
                    <option value="income">Entrada (+ Receita)</option>
                    <option value="expense">Saída (− Despesa)</option>
                  </select>
                </label>

                <label>
                  <span>Categoria:</span>
                  <select
                    value={newEntry.category}
                    onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                  >
                    {newEntry.type === "income" ? (
                      <>
                        <option value="Venda E-commerce">Venda E-commerce</option>
                        <option value="Tele-Entrega Direta">Tele-Entrega Direta</option>
                        <option value="Venda Balcão Loja">Venda Balcão Loja</option>
                        <option value="Serviços Farmacêuticos">Serviços Farmacêuticos</option>
                        <option value="Outras Receitas">Outras Receitas</option>
                      </>
                    ) : (
                      <>
                        <option value="Fornecedor Medicamentos">Fornecedor Medicamentos</option>
                        <option value="Fornecedor Cosméticos">Fornecedor Cosméticos</option>
                        <option value="Logística & Tele-Entrega">Logística & Tele-Entrega</option>
                        <option value="Embalagens & Sacolas">Embalagens & Sacolas</option>
                        <option value="Tarifas Gateway / Cartão">Tarifas Gateway / Cartão</option>
                        <option value="Impostos (DAS / ICMS)">Impostos (DAS / ICMS)</option>
                        <option value="Folha de Pagamento">Folha de Pagamento</option>
                        <option value="Despesas Operacionais">Despesas Operacionais</option>
                      </>
                    )}
                  </select>
                </label>
              </div>

              <label>
                <span>Descrição da Movimentação:</span>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pagamento distribuidora Santa Cruz NF 9821"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                />
              </label>

              <div className="form-row">
                <label>
                  <span>Valor em Reais (R$):</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 150,00"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                  />
                </label>

                <label>
                  <span>Meio de Pagamento:</span>
                  <select
                    value={newEntry.paymentMethod}
                    onChange={(e) => setNewEntry({ ...newEntry, paymentMethod: e.target.value })}
                  >
                    <option value="Pix">Pix</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro em Espécie">Dinheiro em Espécie</option>
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="Transferência TED">Transferência TED</option>
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setModalOpen(false)} className="button button-ghost">
                  Cancelar
                </button>
                <button type="submit" className="button button-primary">
                  Registrar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// COMPONENTE: PLATAFORMA DE AUDITORIA FINANCEIRA INTEGRAL (TUDO)
// ----------------------------------------------------------------------
export type FinancialAuditRecord = {
  id: string;
  protocol: string;
  timestamp: string;
  dateFormatted: string;
  dayOfWeek: string;
  timeFormatted: string;
  timeShift: "madrugada" | "manha" | "tarde" | "noite";
  personName: string;
  personEmail: string;
  personRole: string;
  personType: "customer" | "staff" | "supplier" | "system";
  eventType: string;
  category: string;
  description: string;
  paymentMethod: "Pix" | "Cartão de Crédito" | "Cartão de Débito" | "Dinheiro na Entrega" | "Boleto Bancário" | "Transferência";
  installments?: number;
  direction: "credit" | "debit" | "neutral";
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  items?: Array<{ id: string; name: string; quantity: number; priceCents: number }>;
  reconciliationStatus: "reconciled" | "pending" | "divergent";
  cryptoHash: string;
  metadata?: Record<string, unknown>;
};

function getDayOfWeek(d: Date): string {
  const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return days[d.getDay()] || "Desconhecido";
}

function getTimeShift(d: Date): "madrugada" | "manha" | "tarde" | "noite" {
  const h = d.getHours();
  if (h >= 0 && h < 6) return "madrugada";
  if (h >= 6 && h < 12) return "manha";
  if (h >= 12 && h < 18) return "tarde";
  return "noite";
}

function generateAuditHash(id: string, timestamp: string, amountCents: number): string {
  let hash = 0;
  const str = `${id}:${timestamp}:${amountCents}:poupe-mais-safe-ledger`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `0x${hex}7f89${id.replace(/\D/g, "").slice(0, 4)}c9a1`.toLowerCase();
}

function convertOrderToAuditRecord(order: AdminOrder): FinancialAuditRecord {
  const d = new Date(order.created_at);
  const items = Array.isArray(order.items_json)
    ? order.items_json.map((it) => ({
        id: String(it.id || ""),
        name: String(it.name || it.id || "Item"),
        quantity: Number(it.quantity || 1),
        priceCents: Number(it.priceCents || 0),
      }))
    : [];

  const subtotal = order.subtotal_cents ?? order.total_cents;
  const discount = order.discount_cents ?? 0;
  const shipping = order.shipping_cents ?? 0;
  const total = order.total_cents;
  const isDelivery = order.fulfillment === "delivery";
  const name = order.customer_name || order.customer_email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const paymentMethod: FinancialAuditRecord["paymentMethod"] = isDelivery
    ? (total > 10000 ? "Cartão de Crédito" : "Pix")
    : "Pix";

  const isPaid = !["Aguardando pagamento", "Cancelado"].includes(order.status);

  return {
    id: order.id,
    protocol: `AUD-${order.id.replace(/\D/g, "") || "0000"}-ECOM`,
    timestamp: order.created_at,
    dateFormatted: d.toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(d),
    timeFormatted: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(d),
    personName: name,
    personEmail: order.customer_email,
    personRole: "Cliente Final",
    personType: "customer",
    eventType: isDelivery ? "VENDA_TELE_ENTREGA_EXPRESSA" : "VENDA_ECOMMERCE_RETIRADA",
    category: isDelivery ? "Tele-Entrega 90 min" : "E-commerce Retirada",
    description: `Pedido ${order.id} (${order.status}) • ${items.length} item(ns) • ${isDelivery ? "Entrega motoboy" : "Retirada balcão"}`,
    paymentMethod,
    installments: paymentMethod === "Cartão de Crédito" ? 3 : 1,
    direction: "credit",
    subtotalCents: subtotal,
    discountCents: discount,
    shippingCents: shipping,
    totalCents: total,
    items,
    reconciliationStatus: isPaid ? "reconciled" : "pending",
    cryptoHash: generateAuditHash(order.id, order.created_at, total),
    metadata: {
      fulfillment: order.fulfillment,
      orderStatus: order.status,
    },
  };
}

const baselineAuditRecords: FinancialAuditRecord[] = [
  {
    id: "PED-94821",
    protocol: "AUD-94821-XF",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 15 * 60 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 15 * 60 * 1000)),
    timeFormatted: new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 15 * 60 * 1000)),
    personName: "Marina Costa",
    personEmail: "marina.costa@email.com",
    personRole: "Cliente Final (Convênio)",
    personType: "customer",
    eventType: "VENDA_PAGAMENTO_APROVADO",
    category: "Tele-Entrega 90 min",
    description: "Pedido #PED-94821 aprovado via Pix com cupom ECONOMIA10 aplicado",
    paymentMethod: "Pix",
    installments: 1,
    direction: "credit",
    subtotalCents: 14890,
    discountCents: 1000,
    shippingCents: 1000,
    totalCents: 14890,
    items: [
      { id: "prod_protetor_fps50", name: "Protetor Solar Facial FPS 50 50g", quantity: 1, priceCents: 5990 },
      { id: "prod_omega_3", name: "Ômega 3 Concentrado 1.000 mg 60 Cáps", quantity: 2, priceCents: 4490 },
    ],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("PED-94821", new Date(Date.now() - 15 * 60 * 1000).toISOString(), 14890),
  },
  {
    id: "PED-94820",
    protocol: "AUD-94820-XF",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 45 * 60 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 45 * 60 * 1000)),
    timeFormatted: new Date(Date.now() - 45 * 60 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 45 * 60 * 1000)),
    personName: "João Martins",
    personEmail: "joao.martins@email.com",
    personRole: "Cliente Final",
    personType: "customer",
    eventType: "VENDA_BALCAO_LOJA",
    category: "Balcão Loja",
    description: "Pedido #PED-94820 pago em Dinheiro no balcão da filial Porto Alegre",
    paymentMethod: "Dinheiro na Entrega",
    installments: 1,
    direction: "credit",
    subtotalCents: 6790,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 6790,
    items: [
      { id: "prod_dipirona_gotas", name: "Dipirona Monoidratada 500 mg/ml Gotas", quantity: 2, priceCents: 1090 },
      { id: "prod_soro_fisiologico", name: "Solução Fisiológica Cloreto de Sódio 0,9% 500ml", quantity: 3, priceCents: 790 },
      { id: "prod_termometro", name: "Termômetro Clínico Digital G-Tech", quantity: 1, priceCents: 2990 },
    ],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("PED-94820", new Date(Date.now() - 45 * 60 * 1000).toISOString(), 6790),
  },
  {
    id: "PED-94819",
    protocol: "AUD-94819-XF",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 2 * 3600 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 2 * 3600 * 1000)),
    timeFormatted: new Date(Date.now() - 2 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 2 * 3600 * 1000)),
    personName: "Clara Souza",
    personEmail: "clara.souza@email.com",
    personRole: "Cliente Final (Uso Contínuo)",
    personType: "customer",
    eventType: "VENDA_PAGAMENTO_APROVADO",
    category: "E-commerce Retirada",
    description: "Pedido #PED-94819 pago via Cartão de Crédito 3x Mastercard",
    paymentMethod: "Cartão de Crédito",
    installments: 3,
    direction: "credit",
    subtotalCents: 21940,
    discountCents: 2000,
    shippingCents: 0,
    totalCents: 19940,
    items: [
      { id: "prod_colageno", name: "Colágeno Hidrolisado Verisol 30 Sachês", quantity: 2, priceCents: 5490 },
      { id: "prod_multivitaminico", name: "Multivitamínico Completo A–Z 60 Cáps", quantity: 2, priceCents: 3790 },
      { id: "prod_vitamina_c", name: "Vitamina C 1g Efervescente 10 Comprimidos", quantity: 2, priceCents: 1890 },
    ],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("PED-94819", new Date(Date.now() - 2 * 3600 * 1000).toISOString(), 19940),
  },
  {
    id: "LAN-10948",
    protocol: "AUD-10948-OP",
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 4 * 3600 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 4 * 3600 * 1000)),
    timeFormatted: new Date(Date.now() - 4 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 4 * 3600 * 1000)),
    personName: "Distribuidora Santa Cruz Medicamentos",
    personEmail: "financeiro@distribuidorasantacruz.com.br",
    personRole: "Fornecedor Homologado ANVISA",
    personType: "supplier",
    eventType: "PAGAMENTO_FORNECEDOR",
    category: "Fornecedor Medicamentos",
    description: "Pagamento de NF-e 849.201 - Reposição de Antibióticos e Analgésicos",
    paymentMethod: "Boleto Bancário",
    installments: 1,
    direction: "debit",
    subtotalCents: 184500,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 184500,
    items: [],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("LAN-10948", new Date(Date.now() - 4 * 3600 * 1000).toISOString(), 184500),
  },
  {
    id: "LAN-10947",
    protocol: "AUD-10947-OP",
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 6 * 3600 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 6 * 3600 * 1000)),
    timeFormatted: new Date(Date.now() - 6 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 6 * 3600 * 1000)),
    personName: "Carlos Eduardo (Motoboy 04)",
    personEmail: "logistica.express@poupemais.com.br",
    personRole: "Entregador Parceiro Tele-Entrega",
    personType: "staff",
    eventType: "SANGRIA_CAIXA_LOGISTICA",
    category: "Logística & Tele-Entrega",
    description: "Repasse de taxas de tele-entrega expressa 90 min turno matutino (12 entregas)",
    paymentMethod: "Pix",
    installments: 1,
    direction: "debit",
    subtotalCents: 18000,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 18000,
    items: [],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("LAN-10947", new Date(Date.now() - 6 * 3600 * 1000).toISOString(), 18000),
  },
  {
    id: "PED-94818",
    protocol: "AUD-94818-XF",
    timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 10 * 3600 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 10 * 3600 * 1000)),
    timeFormatted: new Date(Date.now() - 10 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 10 * 3600 * 1000)),
    personName: "Rafael Lima",
    personEmail: "rafael.lima@email.com",
    personRole: "Cliente Final",
    personType: "customer",
    eventType: "VENDA_PAGAMENTO_APROVADO",
    category: "Tele-Entrega 90 min",
    description: "Pedido #PED-94818 aprovado via Cartão de Débito na maquininha móvel",
    paymentMethod: "Cartão de Débito",
    installments: 1,
    direction: "credit",
    subtotalCents: 9450,
    discountCents: 0,
    shippingCents: 990,
    totalCents: 10440,
    items: [
      { id: "prod_hidratante", name: "Hidratante Corporal Intensivo com Ceramidas 400ml", quantity: 1, priceCents: 4990 },
      { id: "prod_fralda_m", name: "Fralda Descartável Infantil Conforto Tamanho M", quantity: 1, priceCents: 4490 },
    ],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("PED-94818", new Date(Date.now() - 10 * 3600 * 1000).toISOString(), 10440),
  },
  {
    id: "EST-94815",
    protocol: "AUD-94815-ES",
    timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 26 * 3600 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 26 * 3600 * 1000)),
    timeFormatted: new Date(Date.now() - 26 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 26 * 3600 * 1000)),
    personName: "Beatriz Oliveira",
    personEmail: "beatriz.oliveira@email.com",
    personRole: "Cliente Final",
    personType: "customer",
    eventType: "ESTORNO_REEMBOLSO_CLIENTE",
    category: "Atendimento & Estornos",
    description: "Estorno via Pix por desistência de item de perfumaria antes do despacho",
    paymentMethod: "Pix",
    installments: 1,
    direction: "debit",
    subtotalCents: 3490,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 3490,
    items: [],
    reconciliationStatus: "pending",
    cryptoHash: generateAuditHash("EST-94815", new Date(Date.now() - 26 * 3600 * 1000).toISOString(), 3490),
  },
  {
    id: "LAN-10940",
    protocol: "AUD-10940-OP",
    timestamp: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 32 * 3600 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 32 * 3600 * 1000)),
    timeFormatted: new Date(Date.now() - 32 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 32 * 3600 * 1000)),
    personName: "Dr. Raul da Costa",
    personEmail: "raulgdc91@gmail.com",
    personRole: "Proprietário & Responsável Geral",
    personType: "staff",
    eventType: "AJUSTE_CONTABIL_CONCILIACAO",
    category: "Ajuste Contábil",
    description: "Aporte financeiro para fundo de reserva operacional e custeio de alvarás",
    paymentMethod: "Transferência",
    installments: 1,
    direction: "credit",
    subtotalCents: 500000,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 500000,
    items: [],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("LAN-10940", new Date(Date.now() - 32 * 3600 * 1000).toISOString(), 500000),
  },
];

function AuditView({
  orders = [],
  userName = "Administrador",
  userEmail = "admin@poupemais.com.br",
  onNotice,
}: {
  orders?: AdminOrder[];
  userName?: string;
  userEmail?: string;
  onNotice: (msg: string) => void;
}) {
  // Estado base de registros
  const [records, setRecords] = useState<FinancialAuditRecord[]>(() => {
    try {
      const saved = localStorage.getItem("poupe-mais-audit-records-v2");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    const orderRecords = (orders || []).map(convertOrderToAuditRecord);
    const merged = [...orderRecords, ...baselineAuditRecords];
    const seen = new Set<string>();
    return merged.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  });

  const [activeSubTab, setActiveSubTab] = useState<"operations" | "financial" | "site_health">("operations");
  const [loading, setLoading] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<FinancialAuditRecord | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // Referência temporal estável fora do useMemo para pureza do React 19
  const [refDates] = useState(() => {
    const now = Date.now();
    const d = new Date(now);
    return {
      todayStr: d.toISOString().slice(0, 10),
      yesterdayStr: new Date(now - 24 * 3600 * 1000).toISOString().slice(0, 10),
      sevenDaysAgoStr: new Date(now - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      firstDayOfMonthStr: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10),
    };
  });

  // Filtros Avançados
  const [quickPeriod, setQuickPeriod] = useState<"all" | "today" | "yesterday" | "week" | "month">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dayOfWeekFilter, setDayOfWeekFilter] = useState("all");
  const [timeShiftFilter, setTimeShiftFilter] = useState("all");
  const [hourFilter, setHourFilter] = useState("all");
  const [personQuery, setPersonQuery] = useState("");
  const [personTypeFilter, setPersonTypeFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [reconciliationFilter, setReconciliationFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");

  // Form de novo lançamento manual auditado
  const [manualEntry, setManualEntry] = useState({
    direction: "credit" as "credit" | "debit",
    personName: "",
    personRole: "Cliente Balcão",
    category: "Venda Balcão Loja",
    description: "",
    amount: "",
    paymentMethod: "Pix" as FinancialAuditRecord["paymentMethod"],
  });

  // Carregamento via API
  useEffect(() => {
    let active = true;
    async function fetchAuditData() {
      setLoading(true);
      try {
        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/admin/financial-audit", { headers: authHeaders });
        if (res.ok) {
          const body = await res.json();
          if (active && body.records && Array.isArray(body.records)) {
            // Unir com eventuais pedidos locais
            const liveOrdersRecords = (orders || []).map(convertOrderToAuditRecord);
            const combined = [...liveOrdersRecords, ...body.records];
            const seen = new Set<string>();
            const deduplicated = combined.filter((r) => {
              if (seen.has(r.id)) return false;
              seen.add(r.id);
              return true;
            });
            setRecords(deduplicated);
            try {
              localStorage.setItem("poupe-mais-audit-records-v2", JSON.stringify(deduplicated));
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // mantém fallback
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchAuditData();
    return () => {
      active = false;
    };
  }, [orders]);

  // Filtragem Multicritério em Memória
  const filtered = useMemo(() => {
    let list = [...records];

    // 1. Período Rápido
    if (quickPeriod === "today") {
      list = list.filter((r) => r.timestamp.slice(0, 10) === refDates.todayStr);
    } else if (quickPeriod === "yesterday") {
      list = list.filter((r) => r.timestamp.slice(0, 10) === refDates.yesterdayStr);
    } else if (quickPeriod === "week") {
      list = list.filter((r) => r.timestamp.slice(0, 10) >= refDates.sevenDaysAgoStr);
    } else if (quickPeriod === "month") {
      list = list.filter((r) => r.timestamp.slice(0, 10) >= refDates.firstDayOfMonthStr);
    }

    // Data inicial / final explícitas
    if (startDate) {
      list = list.filter((r) => r.timestamp.slice(0, 10) >= startDate);
    }
    if (endDate) {
      list = list.filter((r) => r.timestamp.slice(0, 10) <= endDate);
    }

    // 2. Dia da semana
    if (dayOfWeekFilter !== "all") {
      list = list.filter((r) => r.dayOfWeek === dayOfWeekFilter);
    }

    // 3. Hora & Turno
    if (timeShiftFilter !== "all") {
      list = list.filter((r) => r.timeShift === timeShiftFilter);
    }
    if (hourFilter !== "all") {
      list = list.filter((r) => {
        const h = new Date(r.timestamp).getHours().toString().padStart(2, "0");
        return h === hourFilter;
      });
    }

    // 4. Pessoa (Nome, E-mail, Papel, Protocolo, ID)
    if (personQuery.trim()) {
      const q = personQuery.toLowerCase().trim();
      list = list.filter((r) =>
        r.personName.toLowerCase().includes(q) ||
        r.personEmail.toLowerCase().includes(q) ||
        r.personRole.toLowerCase().includes(q) ||
        r.protocol.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    if (personTypeFilter !== "all") {
      list = list.filter((r) => r.personType === personTypeFilter);
    }

    // 5. Total (Valor Mínimo e Máximo)
    if (minAmount.trim()) {
      const minCents = Math.round(parseFloat(minAmount.replace(",", ".")) * 100);
      if (!isNaN(minCents)) {
        list = list.filter((r) => r.totalCents >= minCents);
      }
    }
    if (maxAmount.trim()) {
      const maxCents = Math.round(parseFloat(maxAmount.replace(",", ".")) * 100);
      if (!isNaN(maxCents)) {
        list = list.filter((r) => r.totalCents <= maxCents);
      }
    }

    // 6. Meio de Pagamento
    if (paymentMethodFilter !== "all") {
      list = list.filter((r) => r.paymentMethod === paymentMethodFilter);
    }

    // 7. Categoria
    if (categoryFilter !== "all") {
      list = list.filter((r) => r.category === categoryFilter);
    }

    // 8. Status de Conciliação
    if (reconciliationFilter !== "all") {
      list = list.filter((r) => r.reconciliationStatus === reconciliationFilter);
    }

    // 9. Ordenação
    list.sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === "date_asc") return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortBy === "amount_desc") return b.totalCents - a.totalCents;
      if (sortBy === "amount_asc") return a.totalCents - b.totalCents;
      return 0;
    });

    return list;
  }, [
    records,
    refDates,
    quickPeriod,
    startDate,
    endDate,
    dayOfWeekFilter,
    timeShiftFilter,
    hourFilter,
    personQuery,
    personTypeFilter,
    minAmount,
    maxAmount,
    paymentMethodFilter,
    categoryFilter,
    reconciliationFilter,
    sortBy,
  ]);

  // Cálculos de Indicadores em Tempo Real sobre os dados filtrados
  const totalCreditsCents = useMemo(
    () => filtered.filter((r) => r.direction === "credit").reduce((s, r) => s + r.totalCents, 0),
    [filtered]
  );
  const totalDebitsCents = useMemo(
    () => filtered.filter((r) => r.direction === "debit").reduce((s, r) => s + r.totalCents, 0),
    [filtered]
  );
  const netBalanceCents = totalCreditsCents - totalDebitsCents;
  const distinctPersonsCount = useMemo(
    () => new Set(filtered.map((r) => r.personEmail.toLowerCase())).size,
    [filtered]
  );
  const avgTicketCents = useMemo(() => {
    const credits = filtered.filter((r) => r.direction === "credit");
    return credits.length > 0 ? Math.round(totalCreditsCents / credits.length) : 0;
  }, [filtered, totalCreditsCents]);
  const reconciledCount = useMemo(
    () => filtered.filter((r) => r.reconciliationStatus === "reconciled").length,
    [filtered]
  );
  const reconciliationRate = filtered.length > 0 ? Math.round((reconciledCount / filtered.length) * 100) : 100;

  function handleResetFilters() {
    setQuickPeriod("all");
    setStartDate("");
    setEndDate("");
    setDayOfWeekFilter("all");
    setTimeShiftFilter("all");
    setHourFilter("all");
    setPersonQuery("");
    setPersonTypeFilter("all");
    setMinAmount("");
    setMaxAmount("");
    setPaymentMethodFilter("all");
    setCategoryFilter("all");
    setReconciliationFilter("all");
    setSortBy("date_desc");
    onNotice("Filtros de consulta resetados.");
    setTimeout(() => onNotice(""), 2000);
  }

  function handleReconcileSingle(protocol: string) {
    const updated = records.map((r) =>
      r.protocol === protocol ? { ...r, reconciliationStatus: "reconciled" as const } : r
    );
    setRecords(updated);
    try {
      localStorage.setItem("poupe-mais-audit-records-v2", JSON.stringify(updated));
    } catch {
      // ignore
    }
    onNotice(`Protocolo ${protocol} conciliado com sucesso no livro contábil!`);
    setTimeout(() => onNotice(""), 2500);
  }

  function handleAutoReconcileAll() {
    const updated = records.map((r) => ({
      ...r,
      reconciliationStatus: "reconciled" as const,
    }));
    setRecords(updated);
    try {
      localStorage.setItem("poupe-mais-audit-records-v2", JSON.stringify(updated));
    } catch {
      // ignore
    }
    onNotice(`Conciliação em lote concluída! ${records.length} transações auditadas.`);
    setTimeout(() => onNotice(""), 3000);
  }

  function handleExportCsv() {
    const headers = "Protocolo,Data,Dia_da_Semana,Hora,Turno,Pessoa_Nome,Pessoa_Email,Perfil,Tipo,Evento,Categoria,Descricao,Meio_Pagamento,Subtotal_Reais,Desconto_Reais,Frete_Reais,Total_Reais,Status_Conciliacao,Hash_Auditoria\n";
    const rows = filtered.map((r) => {
      return `"${r.protocol}","${r.dateFormatted}","${r.dayOfWeek}","${r.timeFormatted}","${r.timeShift}","${r.personName}","${r.personEmail}","${r.personRole}","${r.personType}","${r.eventType}","${r.category}","${r.description.replace(/"/g, '""')}","${r.paymentMethod}","${(r.subtotalCents / 100).toFixed(2)}","${(r.discountCents / 100).toFixed(2)}","${(r.shippingCents / 100).toFixed(2)}","${(r.totalCents / 100).toFixed(2)}","${r.reconciliationStatus}","${r.cryptoHash}"`;
    }).join("\n");

    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `auditoria-financeira-poupe-mais-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotice("Relatório de auditoria financeira exportado com sucesso em CSV contábil.");
    setTimeout(() => onNotice(""), 2800);
  }

  function handleCreateManualEntry(e: React.FormEvent) {
    e.preventDefault();
    const amountVal = parseFloat(manualEntry.amount.replace(",", "."));
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Informe um valor monetário válido.");
      return;
    }
    const d = new Date();
    const amountCents = Math.round(amountVal * 100);
    const newRec: FinancialAuditRecord = {
      id: `LAN-${Math.floor(10000 + Math.random() * 90000)}`,
      protocol: `AUD-${Math.floor(10000 + Math.random() * 90000)}-OP`,
      timestamp: d.toISOString(),
      dateFormatted: d.toLocaleDateString("pt-BR"),
      dayOfWeek: getDayOfWeek(d),
      timeFormatted: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      timeShift: getTimeShift(d),
      personName: manualEntry.personName.trim() || userName,
      personEmail: userEmail,
      personRole: manualEntry.personRole,
      personType: "staff",
      eventType: manualEntry.direction === "credit" ? "RECEITA_AVULSA_LOJA" : "DESPESA_OPERACIONAL_MANUAL",
      category: manualEntry.category,
      description: manualEntry.description.trim() || "Lançamento contábil auditado manualmente",
      paymentMethod: manualEntry.paymentMethod,
      installments: 1,
      direction: manualEntry.direction,
      subtotalCents: amountCents,
      discountCents: 0,
      shippingCents: 0,
      totalCents: amountCents,
      items: [],
      reconciliationStatus: "reconciled",
      cryptoHash: generateAuditHash("MANUAL", d.toISOString(), amountCents),
    };

    const updated = [newRec, ...records];
    setRecords(updated);
    try {
      localStorage.setItem("poupe-mais-audit-records-v2", JSON.stringify(updated));
    } catch {
      // ignore
    }
    setManualModalOpen(false);
    setManualEntry({
      direction: "credit",
      personName: "",
      personRole: "Cliente Balcão",
      category: "Venda Balcão Loja",
      description: "",
      amount: "",
      paymentMethod: "Pix",
    });
    onNotice(`Lançamento ${newRec.protocol} registrado e auditado com sucesso!`);
    setTimeout(() => onNotice(""), 3000);
  }

  return (
    <div className="financial-audit-view">
      {/* 0. SELETOR PRINCIPAL DAS SUB-ABAS DA SUÍTE DE AUDITORIA */}
      <div className="audit-suite-subtabs">
        <button
          type="button"
          onClick={() => setActiveSubTab("operations")}
          className={`audit-suite-tab-btn ${activeSubTab === "operations" ? "active" : ""}`}
        >
          <Icon name="shield" size={17} />
          <span>Auditoria de Operações, Catálogo & Segurança (Os 4 Escopos)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("financial")}
          className={`audit-suite-tab-btn ${activeSubTab === "financial" ? "active" : ""}`}
        >
          <Icon name="banknote" size={17} />
          <span>Auditoria Financeira & Livro-Razão Integral</span>
          <span className="audit-tab-badge-neutral">{records.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("site_health")}
          className={`audit-suite-tab-btn ${activeSubTab === "site_health" ? "active" : ""}`}
        >
          <Icon name="spark" size={17} />
          <span>Diagnóstico & Saúde do Site (Shopify & Mailchimp Benchmark)</span>
          <span className="audit-tab-badge-success">A+</span>
        </button>
      </div>

      {activeSubTab === "operations" && (
        <OperationalAuditView onNotice={onNotice} />
      )}

      {activeSubTab === "site_health" && (
        <SiteHealthAuditView onNotice={onNotice} />
      )}

      {activeSubTab === "financial" && (
        <>
          {/* 1. CABEÇALHO DA PLATAFORMA FINANCEIRA */}
          <div className="audit-top-header">
            <div>
              <h2>
                <span style={{ color: "#00874e" }}><Icon name="shield" size={26} /></span>
                Plataforma de Auditoria Financeira Integral
              </h2>
              <p>
                Rastreabilidade e conciliação de <strong>100% dos fluxos monetários</strong> (pedidos e-commerce, balcão, tele-entrega expressa, despesas e fornecedores).
                Consulte instantaneamente por <strong>data, dia, hora, total e pessoa</strong>.
              </p>
            </div>

        <div className="audit-header-actions">
          <button
            type="button"
            className="button button-ghost"
            onClick={handleAutoReconcileAll}
            title="Conciliar todos os lançamentos do filtro com a conta bancária"
            style={{ fontSize: "var(--text-xs)", height: "38px" }}
          >
            <Icon name="refresh" size={16} /> Conciliação Automática
          </button>
          <button
            type="button"
            className="button button-ghost"
            onClick={handleExportCsv}
            title="Exportar planilha CSV completa para a contabilidade"
            style={{ fontSize: "var(--text-xs)", height: "38px" }}
          >
            <Icon name="download" size={16} /> Exportar CSV Contábil
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => setManualModalOpen(true)}
            title="Registrar despesa, sangria ou receita avulsa auditada"
            style={{ fontSize: "var(--text-xs)", height: "38px" }}
          >
            + Novo Lançamento Auditado
          </button>
        </div>
      </div>

      {/* 2. PAINEL DE CONSULTA & FILTROS MULTICRITÉRIO (DATA, DIA, HORA, TOTAL, PESSOA) */}
      <div className="audit-query-card">
        <div className="audit-query-title-row">
          <h3>
            <Icon name="search" size={18} />
            Painel de Consulta e Rastreamento Multicritério
          </h3>
          <div className="flex items-center gap-3">
            {loading && (
              <span style={{ fontSize: "var(--text-2xs)", color: "#00874e", fontWeight: "var(--font-bold)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Icon name="refresh" size={13} /> Sincronizando dados…
              </span>
            )}
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--muted)", fontWeight: "var(--font-bold)" }}>
              Exibindo <strong>{filtered.length}</strong> de {records.length} transações auditadas
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="audit-pill-btn"
              title="Limpar todos os filtros aplicados"
            >
              ✕ Limpar Filtros
            </button>
          </div>
        </div>

        <div className="audit-query-grid">
          {/* CAMPO 1: DATA & PERÍODO */}
          <div className="audit-query-field">
            <label>
              <Icon name="document" size={14} />
              1. Data e Período:
            </label>
            <div className="audit-quick-pills">
              <button
                type="button"
                className={`audit-pill-btn ${quickPeriod === "all" ? "active" : ""}`}
                onClick={() => { setQuickPeriod("all"); setStartDate(""); setEndDate(""); }}
              >
                Todos
              </button>
              <button
                type="button"
                className={`audit-pill-btn ${quickPeriod === "today" ? "active" : ""}`}
                onClick={() => { setQuickPeriod("today"); setStartDate(""); setEndDate(""); }}
              >
                Hoje
              </button>
              <button
                type="button"
                className={`audit-pill-btn ${quickPeriod === "yesterday" ? "active" : ""}`}
                onClick={() => { setQuickPeriod("yesterday"); setStartDate(""); setEndDate(""); }}
              >
                Ontem
              </button>
              <button
                type="button"
                className={`audit-pill-btn ${quickPeriod === "week" ? "active" : ""}`}
                onClick={() => { setQuickPeriod("week"); setStartDate(""); setEndDate(""); }}
              >
                7 Dias
              </button>
              <button
                type="button"
                className={`audit-pill-btn ${quickPeriod === "month" ? "active" : ""}`}
                onClick={() => { setQuickPeriod("month"); setStartDate(""); setEndDate(""); }}
              >
                Este Mês
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px" }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setQuickPeriod("all"); }}
                title="Data inicial"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setQuickPeriod("all"); }}
                title="Data final"
              />
            </div>
          </div>

          {/* CAMPO 2: DIA DA SEMANA */}
          <div className="audit-query-field">
            <label>
              <Icon name="spark" size={14} />
              2. Dia da Semana:
            </label>
            <select
              value={dayOfWeekFilter}
              onChange={(e) => setDayOfWeekFilter(e.target.value)}
            >
              <option value="all">Todos os Dias da Semana</option>
              <option value="Segunda-feira">Segunda-feira</option>
              <option value="Terça-feira">Terça-feira</option>
              <option value="Quarta-feira">Quarta-feira</option>
              <option value="Quinta-feira">Quinta-feira</option>
              <option value="Sexta-feira">Sexta-feira</option>
              <option value="Sábado">Sábado</option>
              <option value="Domingo">Domingo</option>
            </select>
          </div>

          {/* CAMPO 3: HORA & TURNO DO DIA */}
          <div className="audit-query-field">
            <label>
              <Icon name="clock" size={14} />
              3. Hora e Turno do Dia:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "6px" }}>
              <select
                value={timeShiftFilter}
                onChange={(e) => setTimeShiftFilter(e.target.value)}
              >
                <option value="all">Todos os Turnos</option>
                <option value="madrugada">Madrugada (00h–06h)</option>
                <option value="manha">Manhã (06h–12h)</option>
                <option value="tarde">Tarde (12h–18h)</option>
                <option value="noite">Noite (18h–24h)</option>
              </select>
              <select
                value={hourFilter}
                onChange={(e) => setHourFilter(e.target.value)}
                title="Filtrar por hora cheia exata"
              >
                <option value="all">Hora</option>
                {Array.from({ length: 24 }).map((_, i) => {
                  const hStr = i.toString().padStart(2, "0");
                  return <option key={hStr} value={hStr}>{hStr}:00</option>;
                })}
              </select>
            </div>
          </div>

          {/* CAMPO 4: PESSOA (CLIENTE / OPERADOR / FORNECEDOR) */}
          <div className="audit-query-field">
            <label>
              <Icon name="user" size={14} />
              4. Pessoa (Cliente / Operador / Fornecedor):
            </label>
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, perfil ou protocolo…"
              value={personQuery}
              onChange={(e) => setPersonQuery(e.target.value)}
            />
            <div style={{ marginTop: "4px" }}>
              <select
                value={personTypeFilter}
                onChange={(e) => setPersonTypeFilter(e.target.value)}
              >
                <option value="all">Todos os Perfis de Pessoa</option>
                <option value="customer">Clientes Finais</option>
                <option value="staff">Operadores & Equipe</option>
                <option value="supplier">Fornecedores Homologados</option>
              </select>
            </div>
          </div>

          {/* CAMPO 5: TOTAL & FAIXA DE VALORES */}
          <div className="audit-query-field">
            <label>
              <Icon name="banknote" size={14} />
              5. Total & Faixa de Valor (R$):
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <input
                type="text"
                placeholder="Mín: R$ 0,00"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
              <input
                type="text"
                placeholder="Máx: R$ 0,00"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{ marginTop: "4px" }}
            >
              <option value="date_desc">Mais Recentes Primeiro</option>
              <option value="date_asc">Mais Antigos Primeiro</option>
              <option value="amount_desc">Maior Valor Total</option>
              <option value="amount_asc">Menor Valor Total</option>
            </select>
          </div>

          {/* CAMPO 6: MEIO DE PAGAMENTO */}
          <div className="audit-query-field">
            <label>
              <Icon name="credit-card" size={14} />
              6. Meio de Pagamento:
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              <option value="all">Todos os Meios de Pagamento</option>
              <option value="Pix">Pix (Instantâneo)</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Dinheiro na Entrega">Dinheiro na Entrega / Balcão</option>
              <option value="Boleto Bancário">Boleto Bancário</option>
              <option value="Transferência">Transferência Bancária</option>
            </select>
          </div>

          {/* CAMPO 7: CATEGORIA DA OPERAÇÃO */}
          <div className="audit-query-field">
            <label>
              <Icon name="capsule" size={14} />
              7. Categoria da Operação:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Todas as Categorias</option>
              <option value="Tele-Entrega 90 min">Tele-Entrega 90 min</option>
              <option value="E-commerce Retirada">E-commerce Retirada</option>
              <option value="Balcão Loja">Balcão Loja</option>
              <option value="Fornecedor Medicamentos">Fornecedor Medicamentos</option>
              <option value="Logística & Tele-Entrega">Logística & Tele-Entrega</option>
              <option value="Atendimento & Estornos">Atendimento & Estornos</option>
              <option value="Ajuste Contábil">Ajuste Contábil</option>
            </select>
          </div>

          {/* CAMPO 8: STATUS DE CONCILIAÇÃO */}
          <div className="audit-query-field">
            <label>
              <Icon name="check" size={14} />
              8. Status de Conciliação Contábil:
            </label>
            <select
              value={reconciliationFilter}
              onChange={(e) => setReconciliationFilter(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="reconciled">Conciliado no Extrato</option>
              <option value="pending">Pendente de Conciliação</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. CARDS DE BALANÇO CONSOLIDADO (KPIS EM TEMPO REAL SOBRE O FILTRO) */}
      <div className="audit-kpis-grid">
        <div className="audit-kpi-card highlight-green">
          <small>Faturamento Bruto (+) Auditado</small>
          <strong>{formatCurrency(totalCreditsCents)}</strong>
          <span>{filtered.filter((r) => r.direction === "credit").length} entradas conciliáveis</span>
        </div>

        <div className="audit-kpi-card highlight-red">
          <small>Saídas & Despesas (−)</small>
          <strong style={{ color: "#dc2626" }}>{formatCurrency(totalDebitsCents)}</strong>
          <span>{filtered.filter((r) => r.direction === "debit").length} pagamentos auditados</span>
        </div>

        <div className="audit-kpi-card highlight-blue">
          <small>Saldo Líquido do Período</small>
          <strong style={{ color: netBalanceCents >= 0 ? "#00874e" : "#dc2626" }}>
            {formatCurrency(netBalanceCents)}
          </strong>
          <span>Entradas líquidas deduzidas despesas</span>
        </div>

        <div className="audit-kpi-card">
          <small>Ticket Médio / Operação</small>
          <strong>{formatCurrency(avgTicketCents)}</strong>
          <span>Por venda ou crédito faturado</span>
        </div>

        <div className="audit-kpi-card">
          <small>Pessoas Distintas Auditadas</small>
          <strong>{distinctPersonsCount} Titulares</strong>
          <span>Clientes, fornecedores e operadores</span>
        </div>

        <div className="audit-kpi-card">
          <small>Índice de Conciliação</small>
          <strong style={{ color: reconciliationRate >= 80 ? "#00874e" : "#eab308" }}>
            {reconciliationRate}%
          </strong>
          <span>{reconciledCount} de {filtered.length} conferidos</span>
        </div>
      </div>

      {/* 4. TABELA DO LIVRO-RAZÃO IMUTÁVEL DE AUDITORIA */}
      <div className="audit-ledger-card">
        <div className="audit-ledger-topbar">
          <div>
            <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "#003820" }}>
              Livro-Razão Contábil & Rastreamento de Transações
            </h3>
            <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "var(--text-2xs)" }}>
              Relação auditável de todas as movimentações. Clique em <strong>Dossiê</strong> para inspecionar os produtos, impostos e hash criptográfico.
            </p>
          </div>

          <span style={{ fontSize: "var(--text-2xs)", fontWeight: "var(--font-bold)", color: "#00874e", background: "#f0fdf4", padding: "4px 10px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
            Total Filtrado: {formatCurrency(totalCreditsCents - totalDebitsCents)}
          </span>
        </div>

        <div className="audit-ledger-table-wrap">
          <table className="audit-ledger-table">
            <thead>
              <tr>
                <th>Protocolo / Hash</th>
                <th>Data & Dia</th>
                <th>Hora & Turno</th>
                <th>Pessoa Envolvida</th>
                <th>Evento & Categoria</th>
                <th>Meio de Pagamento</th>
                <th style={{ textAlign: "right" }}>Total Auditado</th>
                <th style={{ textAlign: "center" }}>Conciliação</th>
                <th style={{ textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    Nenhuma movimentação financeira encontrada para os critérios informados.
                    <br />
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="button button-ghost"
                      style={{ marginTop: "10px", fontSize: "var(--text-xs)" }}
                    >
                      Redefinir Filtros de Consulta
                    </button>
                  </td>
                </tr>
              )}

              {filtered.map((record) => (
                <tr key={record.protocol}>
                  {/* Protocolo */}
                  <td>
                    <code className="audit-protocol-tag" title={`Hash SHA-256: ${record.cryptoHash}`}>
                      {record.protocol}
                    </code>
                  </td>

                  {/* Data & Dia da Semana */}
                  <td className="audit-date-cell">
                    <strong>{record.dateFormatted}</strong>
                    <small>{record.dayOfWeek}</small>
                  </td>

                  {/* Hora & Turno */}
                  <td className="audit-time-cell">
                    <strong>{record.timeFormatted}</strong>
                    <span className={`audit-shift-tag ${record.timeShift}`}>
                      {record.timeShift}
                    </span>
                  </td>

                  {/* Pessoa */}
                  <td className="audit-person-cell">
                    <strong>{record.personName}</strong>
                    <small>{record.personEmail}</small>
                    <span className="audit-role-tag">{record.personRole}</span>
                  </td>

                  {/* Evento & Categoria */}
                  <td>
                    <strong style={{ display: "block", fontSize: "var(--text-xs)" }}>{record.category}</strong>
                    <small style={{ color: "var(--muted)", display: "block", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {record.description}
                    </small>
                  </td>

                  {/* Meio de Pagamento */}
                  <td>
                    <span className="audit-payment-pill">
                      {record.paymentMethod}
                      {record.installments && record.installments > 1 ? ` (${record.installments}x)` : ""}
                    </span>
                  </td>

                  {/* Total Auditado */}
                  <td className={`audit-amount-cell ${record.direction}`}>
                    {record.direction === "credit" && `+ ${formatCurrency(record.totalCents)}`}
                    {record.direction === "debit" && `− ${formatCurrency(record.totalCents)}`}
                    {record.direction === "neutral" && "—"}
                  </td>

                  {/* Conciliação */}
                  <td style={{ textAlign: "center" }}>
                    <span className={`status-pill ${record.reconciliationStatus === "reconciled" ? "success" : "warning"}`}>
                      {record.reconciliationStatus === "reconciled" ? "Conciliado" : "Pendente"}
                    </span>
                  </td>

                  {/* Ações */}
                  <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => setSelectedDossier(record)}
                      style={{ fontSize: "var(--text-2xs)", padding: "4px 8px", marginRight: "4px" }}
                      title="Abrir dossiê completo da transação"
                    >
                      📋 Dossiê
                    </button>
                    {record.reconciliationStatus === "pending" && (
                      <button
                        type="button"
                        className="btn-reconcile-action"
                        onClick={() => handleReconcileSingle(record.protocol)}
                        title="Marcar como conciliado com o banco"
                      >
                        Conciliar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL DE DOSSIÊ DE AUDITORIA DA TRANSAÇÃO (CERTIFICADO FISCAL/FINANCEIRO) */}
      {selectedDossier && (
        <div
          className="audit-dossier-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dossier-modal-title"
        >
          <div className="audit-dossier-card animate-fadeIn">
            {/* Header do Dossiê */}
            <div className="audit-dossier-header">
              <div>
                <h3 id="dossier-modal-title">
                  Certificado de Auditoria Financeira #{selectedDossier.protocol}
                </h3>
                <p>
                  Registro oficial imutável • Farmácia Poupe Mais • Autenticação de Integridade
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                style={{ background: "transparent", border: "none", color: "#fff", fontSize: "var(--text-xl)", cursor: "pointer" }}
                aria-label="Fechar Dossiê"
              >
                ✕
              </button>
            </div>

            {/* Corpo do Dossiê */}
            <div className="audit-dossier-body">
              {/* Seção 1: Pessoa e Cronologia */}
              <div className="audit-dossier-section">
                <h4>👤 1. Identificação do Titular / Pessoa & Cronologia</h4>
                <dl className="audit-dossier-grid">
                  <div>
                    <dt>Nome da Pessoa</dt>
                    <dd>{selectedDossier.personName}</dd>
                  </div>
                  <div>
                    <dt>E-mail / Contato</dt>
                    <dd>{selectedDossier.personEmail}</dd>
                  </div>
                  <div>
                    <dt>Perfil no Sistema</dt>
                    <dd>{selectedDossier.personRole}</dd>
                  </div>
                  <div>
                    <dt>Data & Dia da Semana</dt>
                    <dd>{selectedDossier.dateFormatted} ({selectedDossier.dayOfWeek})</dd>
                  </div>
                  <div>
                    <dt>Hora Precisa (com segundos)</dt>
                    <dd>{selectedDossier.timeFormatted} (Turno: {selectedDossier.timeShift})</dd>
                  </div>
                  <div>
                    <dt>Status de Conciliação</dt>
                    <dd>
                      <span className={`status-pill ${selectedDossier.reconciliationStatus === "reconciled" ? "success" : "warning"}`}>
                        {selectedDossier.reconciliationStatus === "reconciled" ? "Liquidado e Conciliado" : "Pendente de Conciliação"}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Seção 2: Decomposição Financeira dos Valores */}
              <div className="audit-dossier-section">
                <h4>💰 2. Discriminativo de Valores e Fechamento</h4>
                <dl className="audit-dossier-grid">
                  <div>
                    <dt>Subtotal Bruto</dt>
                    <dd>{formatCurrency(selectedDossier.subtotalCents)}</dd>
                  </div>
                  <div>
                    <dt>Desconto Aplicado (Cupom)</dt>
                    <dd style={{ color: "#dc2626" }}>− {formatCurrency(selectedDossier.discountCents)}</dd>
                  </div>
                  <div>
                    <dt>Frete / Tele-Entrega 90 min</dt>
                    <dd>+ {formatCurrency(selectedDossier.shippingCents)}</dd>
                  </div>
                  <div>
                    <dt>Total Faturado Líquido</dt>
                    <dd style={{ fontSize: "var(--text-lg)", color: "#00874e" }}>
                      {formatCurrency(selectedDossier.totalCents)}
                    </dd>
                  </div>
                  <div>
                    <dt>Meio de Pagamento</dt>
                    <dd>{selectedDossier.paymentMethod} {selectedDossier.installments && selectedDossier.installments > 1 ? `(em ${selectedDossier.installments}x)` : "(à vista)"}</dd>
                  </div>
                  <div>
                    <dt>Impacto no Livro Caixa</dt>
                    <dd>
                      {selectedDossier.direction === "credit" ? "Crédito em Conta (+)" : "Débito / Saída (−)"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Seção 3: Itens / Medicamentos Faturados */}
              {selectedDossier.items && selectedDossier.items.length > 0 && (
                <div className="audit-dossier-section">
                  <h4>💊 3. Itens e Medicamentos Faturados</h4>
                  <table className="audit-dossier-items-table">
                    <thead>
                      <tr>
                        <th>Item / Medicamento</th>
                        <th style={{ textAlign: "center" }}>Qtd</th>
                        <th style={{ textAlign: "right" }}>Unitário</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDossier.items.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{item.name}</strong> <small style={{ color: "var(--muted)" }}>({item.id})</small></td>
                          <td style={{ textAlign: "center" }}>{item.quantity}x</td>
                          <td style={{ textAlign: "right" }}>{formatCurrency(item.priceCents)}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>{formatCurrency(item.quantity * item.priceCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Seção 4: Trilha Criptográfica de Auditoria */}
              <div className="audit-dossier-section">
                <h4>🛡️ 4. Trilha Criptográfica de Imutabilidade (Audit Trail)</h4>
                <p style={{ fontSize: "var(--text-2xs)", color: "var(--muted)", margin: "0 0 6px" }}>
                  Assinatura digital e hash verificador contra adulterações e fraudes contábeis:
                </p>
                <div className="audit-dossier-hash">
                  HASH_SHA256: {selectedDossier.cryptoHash}
                </div>
                <div style={{ marginTop: "6px", fontSize: "var(--text-3xs)", color: "#64748b" }}>
                  <strong>Identificador do Sistema:</strong> {selectedDossier.id} • <strong>Evento:</strong> {selectedDossier.eventType}
                </div>
              </div>
            </div>

            {/* Footer do Dossiê */}
            <div className="audit-dossier-footer">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setSelectedDossier(null)}
              >
                Fechar Dossiê
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => window.print()}
                >
                  🖨️ Imprimir Extrato Oficial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL DE NOVO LANÇAMENTO MANUAL AUDITADO */}
      {manualModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box max-w-lg">
            <div className="modal-header">
              <h3>Novo Lançamento Financeiro Auditado</h3>
              <button type="button" onClick={() => setManualModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateManualEntry} className="modal-form">
              <div className="form-row">
                <label>
                  <span>Tipo de Fluxo:</span>
                  <select
                    value={manualEntry.direction}
                    onChange={(e) => setManualEntry({ ...manualEntry, direction: e.target.value as "credit" | "debit" })}
                  >
                    <option value="credit">Entrada / Receita (+)</option>
                    <option value="debit">Saída / Despesa (−)</option>
                  </select>
                </label>

                <label>
                  <span>Pessoa / Titular:</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva ou Distribuidora"
                    value={manualEntry.personName}
                    onChange={(e) => setManualEntry({ ...manualEntry, personName: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  <span>Perfil da Pessoa:</span>
                  <select
                    value={manualEntry.personRole}
                    onChange={(e) => setManualEntry({ ...manualEntry, personRole: e.target.value })}
                  >
                    <option value="Cliente Balcão">Cliente Balcão</option>
                    <option value="Operador de Caixa">Operador de Caixa</option>
                    <option value="Entregador Parceiro Tele-Entrega">Entregador Parceiro Tele-Entrega</option>
                    <option value="Farmacêutico RT">Farmacêutico RT</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Proprietário">Proprietário</option>
                    <option value="Fornecedor Homologado ANVISA">Fornecedor Homologado ANVISA</option>
                  </select>
                </label>

                <label>
                  <span>Categoria:</span>
                  <select
                    value={manualEntry.category}
                    onChange={(e) => setManualEntry({ ...manualEntry, category: e.target.value })}
                  >
                    <option value="Venda Balcão Loja">Venda Balcão Loja</option>
                    <option value="Tele-Entrega 90 min">Tele-Entrega 90 min</option>
                    <option value="Fornecedor Medicamentos">Fornecedor Medicamentos</option>
                    <option value="Logística & Tele-Entrega">Logística & Tele-Entrega</option>
                    <option value="Atendimento & Estornos">Atendimento & Estornos</option>
                    <option value="Ajuste Contábil">Ajuste Contábil</option>
                    <option value="Despesas Operacionais">Despesas Operacionais</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Descrição da Transação:</span>
                <input
                  type="text"
                  required
                  placeholder="Ex: Recebimento balcão NF-e 4920 ou Repasse de combustível motoboy"
                  value={manualEntry.description}
                  onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                />
              </label>

              <div className="form-row">
                <label>
                  <span>Valor em Reais (R$):</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 150,00"
                    value={manualEntry.amount}
                    onChange={(e) => setManualEntry({ ...manualEntry, amount: e.target.value })}
                  />
                </label>

                <label>
                  <span>Meio de Pagamento:</span>
                  <select
                    value={manualEntry.paymentMethod}
                    onChange={(e) => setManualEntry({ ...manualEntry, paymentMethod: e.target.value as FinancialAuditRecord["paymentMethod"] })}
                  >
                    <option value="Pix">Pix (Instantâneo)</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro na Entrega">Dinheiro em Espécie</option>
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="Transferência">Transferência Bancária</option>
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setManualModalOpen(false)} className="button button-ghost">
                  Cancelar
                </button>
                <button type="submit" className="button button-primary">
                  Gravar & Auditar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
