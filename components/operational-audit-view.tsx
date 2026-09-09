"use client";

import { useEffect, useState, useTransition } from "react";
import { formatCurrency } from "@/lib/catalog";
import { Icon } from "./icons";
import { supabase } from "@/lib/supabase";

export type OperationalAuditItem = {
  id: string | number;
  created_at: string;
  category: "auth" | "catalog" | "orders" | "admin";
  action: string;
  actor_email: string;
  user_role: string;
  ip_address: string;
  user_agent: string;
  resource: string;
  resource_id: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  status: "success" | "failed";
  metadata_json: Record<string, unknown>;
  anomaly_warning?: string | null;
};

export type OperationalStats = {
  total: number;
  filteredTotal: number;
  countsByCategory: {
    auth: number;
    catalog: number;
    orders: number;
    admin: number;
  };
  anomaliesCount: number;
  anomalies: OperationalAuditItem[];
  uniqueActors: number;
};

const categoryLabels: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  auth: { label: "Autenticação & RBAC", icon: "user", color: "#6366f1", bg: "#eef2ff" },
  catalog: { label: "Gestão de Catálogo", icon: "capsule", color: "#0284c7", bg: "#e0f2fe" },
  orders: { label: "Pedidos & Pagamentos", icon: "cart", color: "#00874e", bg: "#e6f7ef" },
  admin: { label: "Ações de Administradores", icon: "shield", color: "#e11d48", bg: "#ffe4e6" },
};

function formatAuditValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return "— (Vazio)";
  if (typeof val === "boolean") return val ? "Verdadeiro (Ativo)" : "Falso (Inativo)";
  if (typeof val === "number") {
    if (key.toLowerCase().includes("cents") || key.toLowerCase().includes("price")) {
      return formatCurrency(val);
    }
    return String(val);
  }
  if (typeof val === "object") {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

export function OperationalAuditView({
  onNotice,
}: {
  onNotice: (msg: string) => void;
}) {
  const [logs, setLogs] = useState<OperationalAuditItem[]>([]);
  const [stats, setStats] = useState<OperationalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  // Filtros
  const [categoryFilter, setCategoryFilter] = useState<"all" | "auth" | "catalog" | "orders" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [search, setSearch] = useState("");

  // Modal de Diff
  const [selectedDiff, setSelectedDiff] = useState<OperationalAuditItem | null>(null);
  const [rawJsonMode, setRawJsonMode] = useState(false);

  async function fetchLogs() {
    setLoading(true);
    try {
      let token = "";
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token || "";
      }

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/audit?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        startTransition(() => {
          setLogs(data.logs || []);
          setStats(data.stats || null);
        });
      }
    } catch (err) {
      console.error("[OperationalAuditView] Erro ao buscar logs:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        let token = "";
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          token = data?.session?.access_token || "";
        }

        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const params = new URLSearchParams();
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/admin/audit?${params.toString()}`, { headers });
        if (res.ok && active) {
          const data = await res.json();
          startTransition(() => {
            setLogs(data.logs || []);
            setStats(data.stats || null);
          });
        }
      } catch (err) {
        console.error("[OperationalAuditView] Erro ao buscar logs:", err);
      }
    }
    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, statusFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchLogs();
  }

  function handleResetFilters() {
    setCategoryFilter("all");
    setStatusFilter("all");
    setSearch("");
  }

  // Exportar CSV
  function handleExportCsv() {
    const csvHeader = "ID,Data_Hora_UTC,Categoria,Acao,Ator_Email,Perfil,IP,Recurso,Recurso_ID,Status,Alerta_Anomalia\n";
    const csvRows = logs.map((l) => {
      return `"${l.id}","${l.created_at}","${l.category}","${l.action}","${l.actor_email}","${l.user_role}","${l.ip_address}","${l.resource}","${l.resource_id}","${l.status}","${(l.anomaly_warning || "").replace(/"/g, '""')}"`;
    });
    const blob = new Blob([csvHeader + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `auditoria-operacoes-poupe-mais-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotice("Relatório de auditoria de operações exportado com sucesso em CSV!");
  }

  // Exportar JSON
  function handleExportJson() {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `auditoria-operacoes-poupe-mais-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotice("Trilha completa de auditoria exportada em JSON forense imutável!");
  }

  return (
    <div className="operational-audit-wrapper">
      {/* 1. CABEÇALHO DA AUDITORIA OPERACIONAL */}
      <div className="audit-top-header">
        <div>
          <h2>
            <span style={{ color: "#00874e" }}><Icon name="shield" size={26} /></span>
            Auditoria de Operações, Catálogo & Segurança (Os 4 Escopos)
          </h2>
          <p>
            Trilha de auditoria perpétua e imutável (append-only) com <strong>captura de IP, User-Agent e visualizador de diff (old vs new)</strong>.
            Monitoramento dos 4 eixos essenciais: <strong>Autenticação & RBAC, Gestão de Catálogo/Preços, Pedidos & Pagamentos e Ações Administrativas/LGPD</strong>.
          </p>
        </div>

        <div className="audit-header-actions">
          <button
            type="button"
            className="button button-ghost"
            onClick={fetchLogs}
            disabled={loading}
            style={{ fontSize: "0.74rem", height: "38px" }}
          >
            <Icon name="refresh" size={16} /> {loading ? "Atualizando…" : "Recarregar Logs"}
          </button>
          <button
            type="button"
            className="button button-ghost"
            onClick={handleExportCsv}
            style={{ fontSize: "0.74rem", height: "38px" }}
          >
            <Icon name="download" size={16} /> Exportar CSV Forense
          </button>
          <button
            type="button"
            className="button button-ghost"
            onClick={handleExportJson}
            style={{ fontSize: "0.74rem", height: "38px" }}
          >
            <Icon name="document" size={16} /> Exportar JSON
          </button>
        </div>
      </div>

      {/* 2. ALERTA DE ANOMALIAS EM TEMPO REAL */}
      {stats && stats.anomaliesCount > 0 && (
        <div className="anomaly-alert-container">
          <div className="anomaly-alert-header">
            <span className="anomaly-alert-icon"><Icon name="alert" size={20} /></span>
            <div>
              <strong>Central de Alertas em Tempo Real & Detecção de Anomalias ({stats.anomaliesCount})</strong>
              <p>Eventos operacionais críticos detectados automaticamente pelo motor de conformidade e segurança:</p>
            </div>
          </div>

          <div className="anomaly-alert-list">
            {stats.anomalies.map((ano) => (
              <div key={ano.id} className="anomaly-alert-item">
                <span className="anomaly-alert-badge">ANOMALIA</span>
                <div className="anomaly-alert-details">
                  <div className="anomaly-alert-title">
                    <strong>{ano.action}</strong> • Recurso: <code>{ano.resource}/{ano.resource_id}</code>
                  </div>
                  <div className="anomaly-alert-msg">{ano.anomaly_warning}</div>
                  <div className="anomaly-alert-meta">
                    Por: <strong>{ano.actor_email}</strong> ({ano.user_role}) • IP: <code>{ano.ip_address}</code> • {new Date(ano.created_at).toLocaleString("pt-BR")}
                  </div>
                </div>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => { setSelectedDiff(ano); setRawJsonMode(false); }}
                  style={{ fontSize: "0.72rem", height: "30px", whiteSpace: "nowrap" }}
                >
                  🔍 Inspecionar Diff
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CARDS DE INDICADORES / KPIS OPERACIONAIS */}
      <div className="financial-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "1rem" }}>
        <div className="kpi-card" style={{ borderLeft: "4px solid #00874e" }}>
          <div className="kpi-label">Mutações Registradas</div>
          <div className="kpi-value" style={{ color: "#00874e" }}>{stats?.total ?? logs.length}</div>
          <div className="kpi-sub">Trilha 100% imutável no banco</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: "4px solid #6366f1" }}>
          <div className="kpi-label">Autenticação & RBAC</div>
          <div className="kpi-value" style={{ color: "#6366f1" }}>{stats?.countsByCategory.auth ?? 0}</div>
          <div className="kpi-sub">Logins e permissões auditadas</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: "4px solid #0284c7" }}>
          <div className="kpi-label">Catálogo & Estoque</div>
          <div className="kpi-value" style={{ color: "#0284c7" }}>{stats?.countsByCategory.catalog ?? 0}</div>
          <div className="kpi-sub">Preços e estoques com diff</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div className="kpi-label">Pedidos & Pagamentos</div>
          <div className="kpi-value" style={{ color: "#f59e0b" }}>{stats?.countsByCategory.orders ?? 0}</div>
          <div className="kpi-sub">Transições de status e Pix</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: "4px solid #e11d48" }}>
          <div className="kpi-label">Ações Admin & LGPD</div>
          <div className="kpi-value" style={{ color: "#e11d48" }}>{stats?.countsByCategory.admin ?? 0}</div>
          <div className="kpi-sub">Exportações e configurações</div>
        </div>
      </div>

      {/* 4. SELETOR DE ESCOPOS & FILTROS AVANÇADOS */}
      <div className="audit-query-card">
        <div className="audit-scope-selector-row">
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--foreground)" }}>Escopo do Evento:</span>
          <div className="audit-scope-pills">
            <button
              type="button"
              className={`audit-scope-pill ${categoryFilter === "all" ? "active" : ""}`}
              onClick={() => setCategoryFilter("all")}
            >
              Todos os Escopos ({stats?.total ?? logs.length})
            </button>
            <button
              type="button"
              className={`audit-scope-pill auth ${categoryFilter === "auth" ? "active" : ""}`}
              onClick={() => setCategoryFilter("auth")}
            >
              🔐 Autenticação & RBAC ({stats?.countsByCategory.auth ?? 0})
            </button>
            <button
              type="button"
              className={`audit-scope-pill catalog ${categoryFilter === "catalog" ? "active" : ""}`}
              onClick={() => setCategoryFilter("catalog")}
            >
              📦 Gestão de Catálogo ({stats?.countsByCategory.catalog ?? 0})
            </button>
            <button
              type="button"
              className={`audit-scope-pill orders ${categoryFilter === "orders" ? "active" : ""}`}
              onClick={() => setCategoryFilter("orders")}
            >
              🛍️ Pedidos & Pagamentos ({stats?.countsByCategory.orders ?? 0})
            </button>
            <button
              type="button"
              className={`audit-scope-pill admin ${categoryFilter === "admin" ? "active" : ""}`}
              onClick={() => setCategoryFilter("admin")}
            >
              🛡️ Ações Admin & LGPD ({stats?.countsByCategory.admin ?? 0})
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="audit-query-filter-bar" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.75rem", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <input
              type="text"
              placeholder="Buscar por ação, ator, e-mail, IP, ID do recurso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ width: "100%", height: "36px", fontSize: "0.82rem" }}
            />
          </div>

          <div style={{ width: "170px" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "success" | "failed")}
              className="input"
              style={{ width: "100%", height: "36px", fontSize: "0.82rem" }}
            >
              <option value="all">Todos os Status</option>
              <option value="success">Apenas Sucesso</option>
              <option value="failed">Apenas Falhas / Bloqueios</option>
            </select>
          </div>

          <button type="submit" className="button button-primary" style={{ height: "36px", fontSize: "0.8rem" }}>
            <Icon name="search" size={15} /> Filtrar
          </button>

          {(categoryFilter !== "all" || statusFilter !== "all" || search) && (
            <button type="button" onClick={handleResetFilters} className="button button-ghost" style={{ height: "36px", fontSize: "0.8rem" }}>
              ✕ Limpar
            </button>
          )}

          <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>
            Exibindo <strong>{logs.length}</strong> eventos auditados
          </div>
        </form>
      </div>

      {/* 5. TABELA DE AUDITORIA OPERACIONAL COM INSPEÇÃO DE DIFF */}
      <div className="financial-table-card">
        <div className="table-responsive">
          <table className="financial-data-table">
            <thead>
              <tr>
                <th style={{ width: "150px" }}>Data & Hora (UTC)</th>
                <th style={{ width: "140px" }}>Escopo</th>
                <th>Ação Executada</th>
                <th>Ator & Perfil</th>
                <th>IP de Origem</th>
                <th>Recurso & ID</th>
                <th style={{ textAlign: "center", width: "90px" }}>Status</th>
                <th style={{ textAlign: "center", width: "130px" }}>Auditoria Forense</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)" }}>
                    Nenhum registro de auditoria encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const catCfg = categoryLabels[log.category] || categoryLabels.admin;
                  const isAnomaly = Boolean(log.anomaly_warning);
                  return (
                    <tr key={log.id} style={{ background: isAnomaly ? "#fffbeb" : undefined }}>
                      <td style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--muted)" }}>
                        {new Date(log.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" })}
                      </td>

                      <td>
                        <span
                          className="scope-tag-badge"
                          style={{ color: catCfg.color, background: catCfg.bg, borderColor: catCfg.color }}
                        >
                          <Icon name={catCfg.icon} size={11} /> {catCfg.label}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--foreground)" }}>
                          <code>{log.action}</code>
                        </div>
                        {isAnomaly && (
                          <div style={{ fontSize: "0.7rem", color: "#b45309", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px", marginTop: "2px" }}>
                            <Icon name="alert" size={11} /> {log.anomaly_warning}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>{log.actor_email}</div>
                        <span className="user-role-badge" style={{ fontSize: "0.68rem" }}>
                          {log.user_role}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{log.ip_address}</div>
                        <div style={{ fontSize: "0.65rem", color: "var(--muted)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.user_agent}>
                          {log.user_agent}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: "0.78rem" }}>
                          <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>{log.resource}:</span>{" "}
                          <strong>{log.resource_id}</strong>
                        </div>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        {log.status === "success" ? (
                          <span className="status-badge status-approved" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                            Sucesso
                          </span>
                        ) : (
                          <span className="status-badge status-rejected" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                            Falha
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="button button-ghost"
                          onClick={() => { setSelectedDiff(log); setRawJsonMode(false); }}
                          style={{
                            fontSize: "0.74rem",
                            height: "30px",
                            padding: "0 10px",
                            borderColor: isAnomaly ? "#d97706" : "#00874e",
                            color: isAnomaly ? "#b45309" : "#00874e",
                            fontWeight: 700,
                          }}
                        >
                          🔍 Inspecionar Diff
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MODAL DO VISUALIZADOR DE DIFF (DIFF INSPECTOR) */}
      {selectedDiff && (
        <div className="dossier-modal-backdrop" onClick={() => setSelectedDiff(null)}>
          <div className="dossier-modal-card diff-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "850px" }}>
            <div className="dossier-header" style={{ borderBottom: "2px solid #00874e" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="scope-tag-badge" style={{ background: categoryLabels[selectedDiff.category]?.bg, color: categoryLabels[selectedDiff.category]?.color }}>
                    {categoryLabels[selectedDiff.category]?.label}
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--muted)" }}>
                    {new Date(selectedDiff.created_at).toISOString()}
                  </span>
                </div>
                <h3 style={{ margin: "6px 0 2px", fontSize: "1.2rem", color: "var(--foreground)" }}>
                  Inspeção de Mutação: <code>{selectedDiff.action}</code>
                </h3>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>
                  Recurso: <strong>{selectedDiff.resource}</strong> • ID: <code>{selectedDiff.resource_id}</code>
                </p>
              </div>

              <button
                type="button"
                className="dossier-close-btn"
                onClick={() => setSelectedDiff(null)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* AVISO DE ANOMALIA NO MODAL */}
            {selectedDiff.anomaly_warning && (
              <div className="anomaly-alert-container" style={{ margin: "1rem 0 0", padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#d97706" }}><Icon name="alert" size={18} /></span>
                  <div>
                    <strong style={{ color: "#92400e", fontSize: "0.85rem" }}>Alerta de Auditoria:</strong>
                    <div style={{ color: "#78350f", fontSize: "0.78rem" }}>{selectedDiff.anomaly_warning}</div>
                  </div>
                </div>
              </div>
            )}

            {/* METADADOS FORENSES: ATOR, IP E DISPOSITIVO */}
            <div className="diff-meta-strip" style={{ marginTop: "1rem" }}>
              <div className="diff-meta-col">
                <span className="diff-meta-title">Ator Responsável:</span>
                <span className="diff-meta-val"><strong>{selectedDiff.actor_email}</strong></span>
                <span className="user-role-badge" style={{ fontSize: "0.68rem" }}>{selectedDiff.user_role}</span>
              </div>
              <div className="diff-meta-col">
                <span className="diff-meta-title">Endereço IP:</span>
                <span className="diff-meta-val" style={{ fontFamily: "monospace" }}>{selectedDiff.ip_address}</span>
              </div>
              <div className="diff-meta-col" style={{ flex: 2 }}>
                <span className="diff-meta-title">Dispositivo / User-Agent:</span>
                <span className="diff-meta-val" style={{ fontSize: "0.7rem" }} title={selectedDiff.user_agent}>
                  {selectedDiff.user_agent}
                </span>
              </div>
              <div className="diff-meta-col">
                <span className="diff-meta-title">Status da Ação:</span>
                <span className={`status-badge ${selectedDiff.status === "success" ? "status-approved" : "status-rejected"}`}>
                  {selectedDiff.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* SELETOR DE MODO: VISUAL DIFF OU JSON BRUTO */}
            <div style={{ display: "flex", gap: "8px", margin: "1.25rem 0 0.75rem", borderBottom: "1px solid var(--border)" }}>
              <button
                type="button"
                className={`audit-pill-btn ${!rawJsonMode ? "active" : ""}`}
                onClick={() => setRawJsonMode(false)}
                style={{ borderRadius: "6px 6px 0 0", borderBottom: !rawJsonMode ? "2px solid #00874e" : "none" }}
              >
                Visualizador Comparativo de Diff (Old vs New)
              </button>
              <button
                type="button"
                className={`audit-pill-btn ${rawJsonMode ? "active" : ""}`}
                onClick={() => setRawJsonMode(true)}
                style={{ borderRadius: "6px 6px 0 0", borderBottom: rawJsonMode ? "2px solid #00874e" : "none" }}
              >
                JSON Forense Bruto
              </button>
            </div>

            {/* TABELA DE DIFF VISUAL */}
            {!rawJsonMode ? (
              <div className="diff-comparison-table-wrapper">
                {(() => {
                  const oldObj = selectedDiff.old_values || {};
                  const newObj = selectedDiff.new_values || {};
                  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

                  if (allKeys.length === 0) {
                    return (
                      <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                        Nenhum detalhe de estado capturado para este evento.
                      </div>
                    );
                  }

                  return (
                    <table className="diff-table">
                      <thead>
                        <tr>
                          <th style={{ width: "220px" }}>Propriedade / Campo</th>
                          <th>Estado Anterior (Old Value)</th>
                          <th style={{ width: "30px", textAlign: "center" }}>→</th>
                          <th>Novo Estado (New Value)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allKeys.map((key) => {
                          const hasOld = key in oldObj;
                          const hasNew = key in newObj;
                          const oldVal = oldObj[key];
                          const newVal = newObj[key];
                          const isDiff = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                          return (
                            <tr key={key} className={isDiff ? "diff-row-changed" : "diff-row-same"}>
                              <td className="diff-key-cell">
                                <code>{key}</code>
                              </td>

                              <td className="diff-val-cell old">
                                {hasOld ? (
                                  <div className="diff-pill diff-removed">
                                    <span className="diff-sign">-</span>
                                    <span>{formatAuditValue(key, oldVal)}</span>
                                  </div>
                                ) : (
                                  <span className="diff-empty">Não existia</span>
                                )}
                              </td>

                              <td style={{ textAlign: "center", color: isDiff ? "#00874e" : "var(--muted)", fontWeight: 700 }}>
                                {isDiff ? "→" : "="}
                              </td>

                              <td className="diff-val-cell new">
                                {hasNew ? (
                                  <div className={`diff-pill ${isDiff ? "diff-added" : "diff-unchanged"}`}>
                                    {isDiff && <span className="diff-sign">+</span>}
                                    <span>{formatAuditValue(key, newVal)}</span>
                                  </div>
                                ) : (
                                  <span className="diff-empty">Removido</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            ) : (
              <div className="diff-raw-json-grid">
                <div className="diff-json-pane">
                  <div className="diff-json-label old">- old_values (Estado Anterior):</div>
                  <pre className="diff-json-code old">{JSON.stringify(selectedDiff.old_values, null, 2)}</pre>
                </div>
                <div className="diff-json-pane">
                  <div className="diff-json-label new">+ new_values (Novo Estado):</div>
                  <pre className="diff-json-code new">{JSON.stringify(selectedDiff.new_values, null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: "1.25rem" }}>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setSelectedDiff(null)}
              >
                Concluir Inspeção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
