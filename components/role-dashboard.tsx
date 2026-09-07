"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Role } from "@/lib/access";
import { catalogProducts, formatCurrency } from "@/lib/catalog";
import { BrandMark, Icon } from "./icons";

type DashboardRole = Role;
type ViewKey = "overview" | "orders" | "catalog" | "marketing" | "prescriptions" | "team" | "account";

const roleLabels: Record<DashboardRole, string> = { owner: "Proprietário", manager: "Gerente", pharmacist: "Farmacêutico", catalog: "Catálogo e marketing", support: "Atendimento", customer: "Cliente" };
const navItems: { key: ViewKey; label: string; icon: string; roles: DashboardRole[] }[] = [
  { key: "overview", label: "Visão geral", icon: "spark", roles: ["owner", "manager", "pharmacist", "catalog", "support", "customer"] },
  { key: "orders", label: "Pedidos", icon: "cart", roles: ["owner", "manager", "support", "customer"] },
  { key: "catalog", label: "Produtos e estoque", icon: "capsule", roles: ["owner", "manager", "catalog"] },
  { key: "marketing", label: "Banners e descontos", icon: "sun", roles: ["owner", "manager", "catalog"] },
  { key: "prescriptions", label: "Receitas", icon: "document", roles: ["pharmacist", "customer"] },
  { key: "team", label: "Equipe e permissões", icon: "user", roles: ["owner"] },
  { key: "account", label: "Minha conta", icon: "user", roles: ["customer"] },
];

const orders = [
  { id: "ES-84291", customer: "Marina Costa", total: 14890, status: "Separando", time: "há 8 min", type: "Entrega" },
  { id: "ES-84290", customer: "João Martins", total: 6790, status: "Aguardando receita", time: "há 14 min", type: "Retirada" },
  { id: "ES-84289", customer: "Clara Souza", total: 21940, status: "Pronto para retirada", time: "há 23 min", type: "Retirada" },
  { id: "ES-84288", customer: "Rafael Lima", total: 9450, status: "Em rota", time: "há 31 min", type: "Entrega" },
];

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  priceCents: number;
  stock: number;
  regulatoryStatus: string;
  isActive: boolean;
};

const demoProducts: AdminProduct[] = catalogProducts.map((product) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  brand: product.brand,
  category: product.category,
  priceCents: product.priceCents,
  stock: product.stock,
  regulatoryStatus: "approved",
  isActive: true,
}));

function StatusPill({ children }: { children: React.ReactNode }) {
  const label = String(children).toLowerCase();
  const tone = label.includes("baixo") || label.includes("aguardando") || label.includes("revisão") || label.includes("rejeitado") || label.includes("inativo") ? "warning" : label.includes("rota") || label.includes("separando") ? "info" : "success";
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

export function RoleDashboard({ initialRole, userName, userEmail, demo = false }: { initialRole: DashboardRole; userName: string; userEmail: string; demo?: boolean }) {
  const [role, setRole] = useState(initialRole);
  const [view, setView] = useState<ViewKey>("overview");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState<"product" | "banner" | "discount" | "role" | null>(null);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>(demo ? demoProducts : []);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(!demo);
  const [catalogError, setCatalogError] = useState("");
  const [catalogRefresh, setCatalogRefresh] = useState(0);
  const visibleNav = useMemo(() => navItems.filter((item) => item.roles.includes(role)), [role]);

  useEffect(() => {
    if (view !== "catalog") return;
    if (demo) return;

    const controller = new AbortController();
    let active = true;
    fetch("/api/admin/products", { signal: controller.signal, headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = await response.json() as { products?: AdminProduct[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Não foi possível carregar o catálogo.");
        if (active) {
          setAdminProducts(body.products ?? []);
          setCatalogError("");
        }
      })
      .catch((error) => {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setCatalogError(error instanceof Error ? error.message : "Não foi possível carregar o catálogo.");
      })
      .finally(() => { if (active) setCatalogLoading(false); });

    return () => { active = false; controller.abort(); };
  }, [view, demo, catalogRefresh]);

  function chooseRole(nextRole: DashboardRole) {
    setRole(nextRole); setView("overview"); setFormOpen(null); setNotice(`Visualização alterada para ${roleLabels[nextRole]}.`); setTimeout(() => setNotice(""), 1800);
  }

  async function submitDemoOrApi(event: React.FormEvent<HTMLFormElement>, endpoint: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    if (demo) {
      if (endpoint === "/api/admin/products") {
        const name = String(payload.name ?? "Produto fictício").trim();
        const slug = String(payload.slug ?? `produto-${Date.now()}`).trim();
        setAdminProducts((current) => [{
          id: `demo_${Date.now()}`,
          slug,
          name,
          brand: String(payload.brand ?? "Marca fictícia"),
          category: String(payload.category ?? "Cuidados pessoais"),
          priceCents: Number(payload.priceCents) || 1,
          stock: Number(payload.stock) || 0,
          regulatoryStatus: "pending_review",
          isActive: false,
        }, ...current]);
        setNotice("Produto fictício incluído no painel demonstrativo como rascunho.");
      } else {
        setNotice("Modo demonstrativo: a alteração foi simulada.");
      }
      form.reset();
      setFormOpen(null);
      setTimeout(() => setNotice(""), 2400);
      return;
    }
    setNotice("Salvando com sua permissão…");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Não foi possível salvar.");
      if (endpoint === "/api/admin/products") setCatalogRefresh((current) => current + 1);
      setNotice("Alteração salva e registrada no histórico."); setFormOpen(null); form.reset();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Tente novamente."); }
    setTimeout(() => setNotice(""), 2800);
  }

  async function submitRegulatoryReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demo) { setNotice("Modo demonstrativo: a classificação foi simulada."); setTimeout(() => setNotice(""), 2400); return; }
    const form = event.currentTarget;
    const data = new FormData(form);
    const productId = String(data.get("productId") ?? "").trim();
    setNotice("Registrando análise regulatória…");
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/regulatory`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision: data.get("decision"), requiresPrescription: data.get("requiresPrescription") === "on" }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Não foi possível analisar o produto.");
      setNotice("Classificação farmacêutica registrada e auditada."); form.reset();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Tente novamente."); }
    setTimeout(() => setNotice(""), 2800);
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link href="/" className="brand brand-light"><BrandMark size={34} /><span className="brand-copy"><strong>Farmácia</strong><span>Poupe Mais</span></span></Link>
        <div className="workspace-label"><small>Painel de operação</small><strong>{roleLabels[role]}</strong></div>
        <nav aria-label="Navegação do painel">{visibleNav.map((item) => <button key={item.key} className={view === item.key ? "active" : ""} onClick={() => { setView(item.key); setFormOpen(null); }}><Icon name={item.icon} size={19} />{item.label}</button>)}</nav>
        <div className="sidebar-user"><span>{userName.slice(0, 1).toUpperCase()}</span><p><strong>{userName}</strong><small>{demo ? "ambiente demonstrativo" : userEmail}</small></p><Link href={demo ? "/" : "/signout-with-chatgpt?return_to=%2F"}>↗</Link></div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar"><div><span className="eyebrow">{demo ? "Demonstração interativa" : "Área protegida"}</span><h1>{view === "overview" ? `Olá, ${userName.split(" ")[0]}.` : visibleNav.find((item) => item.key === view)?.label}</h1></div><div className="topbar-actions">{demo && <label>Ver como <select value={role} onChange={(event) => chooseRole(event.target.value as DashboardRole)}>{Object.entries(roleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}<button aria-label="Notificações">3</button></div></header>
        {notice && <div className="dashboard-notice" role="status">{notice}</div>}

        {view === "overview" && <Overview role={role} setView={setView} productCount={adminProducts.length || demoProducts.length} />}
        {view === "orders" && <OrdersView customer={role === "customer"} />}
        {view === "catalog" && <CatalogView formOpen={formOpen} setFormOpen={setFormOpen} onSubmit={submitDemoOrApi} products={adminProducts} query={catalogQuery} setQuery={setCatalogQuery} loading={catalogLoading} error={catalogError} />}
        {view === "marketing" && <MarketingView formOpen={formOpen} setFormOpen={setFormOpen} onSubmit={submitDemoOrApi} />}
        {view === "prescriptions" && <PrescriptionsView customer={role === "customer"} onRegulatoryReview={submitRegulatoryReview} />}
        {view === "team" && <TeamView formOpen={formOpen} setFormOpen={setFormOpen} onSubmit={submitDemoOrApi} />}
        {view === "account" && <AccountView userName={userName} userEmail={userEmail} />}
      </main>
    </div>
  );
}

function Overview({ role, setView, productCount }: { role: DashboardRole; setView: (view: ViewKey) => void; productCount: number }) {
  if (role === "customer") return <div className="dashboard-stack"><section className="customer-welcome"><div><span className="eyebrow">Sua saúde em um só lugar</span><h2>O que você precisa hoje?</h2><p>Acompanhe pedidos, receitas e benefícios com privacidade.</p><div><Link href="/catalogo" className="button button-primary">Comprar novamente</Link><button className="button button-ghost" onClick={() => setView("prescriptions")}>Minhas receitas</button></div></div><Icon name="heart" size={100} strokeWidth={1.1} /></section><div className="metric-grid customer-metrics"><Metric label="Pedidos em andamento" value="1" detail="chega hoje" icon="truck" /><Metric label="Economia no mês" value="R$ 32,40" detail="em ofertas e cupons" icon="spark" /><Metric label="Receitas válidas" value="1" detail="acesso protegido" icon="document" /></div><section className="dashboard-card"><CardHeading title="Último pedido" action="Ver todos" onClick={() => setView("orders")} /><OrdersTable rows={orders.slice(0, 1)} customer /></section></div>;
  const roleMetrics = role === "pharmacist" ? [{ label: "Receitas pendentes", value: "7", detail: "2 prioritárias", icon: "document" }, { label: "Analisadas hoje", value: "24", detail: "+12% vs. ontem", icon: "care" }, { label: "Tempo médio", value: "08 min", detail: "meta: 10 min", icon: "clock" }, { label: "Orientações", value: "16", detail: "registradas hoje", icon: "heart" }] : role === "catalog" ? [{ label: "Produtos no catálogo", value: String(productCount), detail: "catálogo demonstrativo", icon: "capsule" }, { label: "Estoque baixo", value: "4", detail: "precisam de ação", icon: "care" }, { label: "Campanhas ativas", value: "6", detail: "2 terminam hoje", icon: "sun" }, { label: "Conversão", value: "4,8%", detail: "+0,6 p.p.", icon: "spark" }] : [{ label: "Vendas hoje", value: "R$ 18.742", detail: "+14,2% vs. ontem", icon: "spark" }, { label: "Pedidos", value: "127", detail: "18 em separação", icon: "cart" }, { label: "Ticket médio", value: "R$ 147,57", detail: "+R$ 8,20", icon: "care" }, { label: "Receitas pendentes", value: "7", detail: "2 prioritárias", icon: "document" }];
  return <div className="dashboard-stack"><div className="metric-grid">{roleMetrics.map((metric) => <Metric key={metric.label} {...metric} />)}</div><div className="dashboard-columns"><section className="dashboard-card"><CardHeading title={role === "pharmacist" ? "Fila de análise" : "Pedidos recentes"} action="Ver todos" onClick={() => setView(role === "pharmacist" ? "prescriptions" : "orders")} />{role === "pharmacist" ? <PrescriptionRows compact /> : <OrdersTable rows={orders.slice(0, 3)} />}</section><section className="dashboard-card activity-card"><CardHeading title="Pontos de atenção" /><ul><li><span className="activity-dot coral" /><p><strong>4 produtos com estoque crítico</strong><small>Atualizado há 5 min</small></p></li><li><span className="activity-dot sage" /><p><strong>Campanha “Cuidado no inverno”</strong><small>Termina hoje às 23h59</small></p></li><li><span className="activity-dot blue" /><p><strong>2 pedidos aguardam contato</strong><small>Atendimento responsável</small></p></li></ul></section></div></div>;
}

function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: string }) { return <article className="metric-card"><span><Icon name={icon} size={21} /></span><p>{label}</p><strong>{value}</strong><small>{detail}</small></article>; }
function CardHeading({ title, action, onClick }: { title: string; action?: string; onClick?: () => void }) { return <header className="card-heading"><h2>{title}</h2>{action && <button onClick={onClick}>{action} →</button>}</header>; }
function OrdersTable({ rows, customer = false }: { rows: typeof orders; customer?: boolean }) { return <div className="data-table"><div className="data-row data-head"><span>Pedido</span>{!customer && <span>Cliente</span>}<span>Tipo</span><span>Total</span><span>Status</span></div>{rows.map((order) => <div className="data-row" key={order.id}><span><strong>{order.id}</strong><small>{order.time}</small></span>{!customer && <span>{order.customer}</span>}<span>{order.type}</span><span>{formatCurrency(order.total)}</span><span><StatusPill>{order.status}</StatusPill></span></div>)}</div>; }
function OrdersView({ customer }: { customer: boolean }) { return <section className="dashboard-card full-card"><CardHeading title={customer ? "Meus pedidos" : "Gestão de pedidos"} action={!customer ? "Exportar" : undefined} /><div className="table-toolbar"><input placeholder="Buscar pedido ou cliente" /><select><option>Todos os status</option><option>Aguardando</option><option>Separando</option><option>Em rota</option></select></div><OrdersTable rows={customer ? orders.slice(0, 2) : orders} customer={customer} /></section>; }

type CatalogViewProps = FormProps & {
  products: AdminProduct[];
  query: string;
  setQuery: (value: string) => void;
  loading: boolean;
  error: string;
};

function productState(product: AdminProduct) {
  if (product.regulatoryStatus === "pending_review") return "Em revisão";
  if (product.regulatoryStatus === "rejected") return "Rejeitado";
  if (!product.isActive) return "Inativo";
  if (product.stock <= 5) return "Estoque baixo";
  return "Ativo";
}

function CatalogView({ formOpen, setFormOpen, onSubmit, products, query, setQuery, loading, error }: CatalogViewProps) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const visible = products.filter((product) => `${product.name} ${product.slug} ${product.brand} ${product.category}`.toLocaleLowerCase("pt-BR").includes(normalized));

  return (
    <div className="dashboard-stack">
      <section className="dashboard-card full-card">
        <CardHeading title="Catálogo de produtos" />
        <div className="table-toolbar">
          <input aria-label="Buscar no catálogo administrativo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome, marca, slug ou categoria" />
          <button className="primary-small" onClick={() => setFormOpen(formOpen === "product" ? null : "product")}>+ Novo produto</button>
        </div>

        {formOpen === "product" && (
          <form className="admin-form" onSubmit={(event) => onSubmit(event, "/api/admin/products")}>
            <label>Nome<input name="name" required maxLength={120} /></label>
            <label>Slug<input name="slug" placeholder="nome-do-produto" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
            <label>Marca<input name="brand" required maxLength={80} /></label>
            <label>Categoria<select name="category"><option>Medicamentos</option><option>Dermocosméticos</option><option>Vitaminas</option><option>Mamãe e bebê</option><option>Cuidados pessoais</option><option>Saúde e bem-estar</option><option>Primeiros socorros</option><option>Higiene oral</option></select></label>
            <label>Descrição curta<input name="shortDescription" required maxLength={180} /></label>
            <label>Preço em centavos<input name="priceCents" type="number" min="1" max="10000000" required /></label>
            <label>Preço anterior<input name="compareAtCents" type="number" min="1" max="10000000" /></label>
            <label>Estoque<input name="stock" type="number" min="0" max="1000000" required /></label>
            <label className="wide">Descrição<textarea name="description" required maxLength={2000} /></label>
            <p className="admin-form-note wide">Novos produtos ficam como rascunho até a classificação regulatória do farmacêutico.</p>
            <div className="form-actions wide"><button type="button" onClick={() => setFormOpen(null)}>Cancelar</button><button type="submit">Salvar rascunho</button></div>
          </form>
        )}

        <div className="admin-catalog-summary"><strong>{visible.length}</strong><span>{visible.length === 1 ? "produto exibido" : "produtos exibidos"} • catálogo fictício demonstrativo</span></div>
        {loading && <div className="admin-catalog-state">Carregando produtos…</div>}
        {error && <div className="admin-catalog-state error" role="alert">{error}</div>}
        {!loading && !error && visible.length === 0 && <div className="admin-catalog-state">Nenhum produto encontrado.</div>}
        {!loading && !error && visible.length > 0 && (
          <div className="admin-product-grid">
            {visible.map((product) => (
              <article className="admin-product-card" key={product.id}>
                <header><span>{product.brand}</span><StatusPill>{productState(product)}</StatusPill></header>
                <h3>{product.name}</h3>
                <p>{product.category}</p>
                <dl><div><dt>Preço</dt><dd>{formatCurrency(product.priceCents)}</dd></div><div><dt>Estoque</dt><dd>{product.stock} un.</dd></div></dl>
                <small>{product.slug}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MarketingView({ formOpen, setFormOpen, onSubmit }: FormProps) { return <div className="dashboard-stack"><div className="dashboard-columns marketing-columns"><section className="dashboard-card"><CardHeading title="Banners" action="Novo banner" onClick={() => setFormOpen(formOpen === "banner" ? null : "banner")} />{formOpen === "banner" && <form className="admin-form single" onSubmit={(event) => onSubmit(event, "/api/admin/banners")}><label>Título<input name="title" required maxLength={100} /></label><label>Subtítulo<input name="subtitle" required maxLength={180} /></label><label>Texto do botão<input name="ctaLabel" required maxLength={40} /></label><label>Destino<input name="ctaHref" defaultValue="/catalogo" required /></label><div className="form-actions"><button type="button" onClick={() => setFormOpen(null)}>Cancelar</button><button type="submit">Publicar banner</button></div></form>}<div className="campaign-card live"><span>Ativo</span><h3>Cuidar do dia a dia pode ser mais simples.</h3><p>Banner principal • Página inicial</p><small>Sem data de término</small></div><div className="campaign-card"><span>Agendado</span><h3>Semana do autocuidado</h3><p>Banner secundário • Dermocosméticos</p><small>Inicia em 28 ago.</small></div></section><section className="dashboard-card"><CardHeading title="Cupons e descontos" action="Novo desconto" onClick={() => setFormOpen(formOpen === "discount" ? null : "discount")} />{formOpen === "discount" && <form className="admin-form single" onSubmit={(event) => onSubmit(event, "/api/admin/discounts")}><label>Nome<input name="name" required maxLength={80} /></label><label>Código<input name="code" required maxLength={24} /></label><label>Tipo<select name="kind"><option value="percent">Percentual</option><option value="fixed">Valor fixo</option></select></label><label>Valor<input name="amount" type="number" min="1" required /></label><label>Mínimo em centavos<input name="minSubtotalCents" type="number" min="0" defaultValue="0" /></label><div className="form-actions"><button type="button" onClick={() => setFormOpen(null)}>Cancelar</button><button type="submit">Ativar desconto</button></div></form>}<div className="coupon-card"><span>BEMVINDO10</span><strong>R$ 10 OFF</strong><p>Primeiro pedido • mínimo de R$ 50</p></div><div className="coupon-card muted"><span>DERMA20</span><strong>20% OFF</strong><p>Categoria dermocosméticos</p></div></section></div></div>; }

function PrescriptionRows({ compact = false, customer = false }: { compact?: boolean; customer?: boolean }) { const rows = customer ? [{ id: "REC-0291", name: "Receita digital", time: "Enviada em 22 ago.", status: "Aprovada" }] : [{ id: "REC-0314", name: "Marina Costa", time: "há 4 min", status: "Prioritária" }, { id: "REC-0313", name: "João Martins", time: "há 12 min", status: "Pendente" }, { id: "REC-0312", name: "Clara Souza", time: "há 19 min", status: "Em análise" }]; return <div className={`prescription-rows ${compact ? "compact" : ""}`}>{rows.map((row) => <article key={row.id}><span><Icon name="document" /></span><p><strong>{row.name}</strong><small>{row.id} • {row.time}</small></p><StatusPill>{row.status}</StatusPill>{!customer && <button>Analisar</button>}</article>)}</div>; }
function PrescriptionsView({ customer, onRegulatoryReview }: { customer: boolean; onRegulatoryReview: (event: React.FormEvent<HTMLFormElement>) => void }) { return <div className="dashboard-stack"><section className="dashboard-card full-card"><CardHeading title={customer ? "Minhas receitas" : "Fila de receitas"} action={customer ? "Enviar nova" : "Atualizar fila"} /><div className="prescription-privacy"><Icon name="shield" /><p><strong>Acesso restrito e auditado</strong>{customer ? "Somente você e profissionais autorizados acessam seus documentos." : "Cada visualização e alteração fica registrada no histórico de segurança."}</p></div><PrescriptionRows customer={customer} /></section>{!customer && <section className="dashboard-card full-card"><CardHeading title="Classificação regulatória de produtos" /><p>Rascunhos criados pela equipe de catálogo só são publicados após esta análise farmacêutica.</p><form className="admin-form role-form" onSubmit={onRegulatoryReview}><label>ID do produto<input name="productId" placeholder="prod_..." required maxLength={80} /></label><label>Decisão<select name="decision"><option value="approved">Aprovar e publicar</option><option value="rejected">Rejeitar</option></select></label><label><input name="requiresPrescription" type="checkbox" /> Exige receita</label><div className="form-actions"><button type="submit">Registrar análise</button></div></form></section>}</div>; }

function TeamView({ formOpen, setFormOpen, onSubmit }: FormProps) { const matrix = [{ role: "Proprietário", permissions: "Negócio, equipe, pedidos e auditoria; sem acesso clínico" }, { role: "Gerente", permissions: "Operação, catálogo, campanhas e pedidos; sem documentos de saúde" }, { role: "Farmacêutico", permissions: "Receitas, classificação regulatória e dispensação" }, { role: "Catálogo", permissions: "Rascunhos de produtos, estoque, banners e descontos" }, { role: "Atendimento", permissions: "Leitura de pedidos e cancelamentos permitidos" }]; return <div className="dashboard-stack"><section className="dashboard-card full-card"><CardHeading title="Equipe e permissões" action="Conceder acesso" onClick={() => setFormOpen(formOpen === "role" ? null : "role")} />{formOpen === "role" && <form className="admin-form role-form" onSubmit={(event) => onSubmit(event, "/api/admin/users/roles")}><label>E-mail corporativo<input name="email" type="email" required /></label><label>Perfil<select name="role"><option value="manager">Gerente</option><option value="pharmacist">Farmacêutico</option><option value="catalog">Catálogo e marketing</option><option value="support">Atendimento</option><option value="customer">Cliente</option></select></label><div className="form-actions"><button type="button" onClick={() => setFormOpen(null)}>Cancelar</button><button type="submit">Salvar acesso</button></div></form>}<div className="permission-list">{matrix.map((item) => <article key={item.role}><span><Icon name="user" size={18} /></span><p><strong>{item.role}</strong><small>{item.permissions}</small></p><button>Detalhes</button></article>)}</div></section><section className="dashboard-card audit-preview"><CardHeading title="Auditoria recente" /><p><strong>banner.home.update</strong> por ana@farmacia.com.br <span>hoje, 09:42</span></p><p><strong>user.role.assign</strong> por dono@farmacia.com.br <span>ontem, 18:15</span></p><p><strong>prescription.review</strong> por farmacêutico@farmacia.com.br <span>ontem, 17:58</span></p></section></div>; }
function AccountView({ userName, userEmail }: { userName: string; userEmail: string }) { return <div className="dashboard-columns"><section className="dashboard-card profile-card"><CardHeading title="Dados pessoais" /><span className="profile-avatar">{userName.slice(0, 1)}</span><h3>{userName}</h3><p>{userEmail}</p><button className="button button-ghost">Editar dados</button></section><section className="dashboard-card"><CardHeading title="Privacidade" /><div className="privacy-options"><article><Icon name="document" /><p><strong>Baixar meus dados</strong><small>Receba uma cópia dos dados associados à conta.</small></p><button>Solicitar</button></article><article><Icon name="shield" /><p><strong>Preferências de comunicação</strong><small>Escolha quais avisos e ofertas deseja receber.</small></p><button>Gerenciar</button></article></div></section></div>; }

type FormProps = { formOpen: "product" | "banner" | "discount" | "role" | null; setFormOpen: (value: "product" | "banner" | "discount" | "role" | null) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>, endpoint: string) => void };
