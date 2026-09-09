import { authorize } from "@/lib/access";
import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";
import { getSupabaseServerClient } from "@/lib/supabase";
import { desc } from "drizzle-orm";
import { detectAuditAnomaly, type AuditCategory, type AuditStatus } from "@/lib/audit-interceptor";

export type AuditLogItem = {
  id: string | number;
  created_at: string;
  category: AuditCategory;
  action: string;
  actor_email: string;
  user_role: string;
  ip_address: string;
  user_agent: string;
  resource: string;
  resource_id: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  status: AuditStatus;
  metadata_json: Record<string, unknown>;
  anomaly_warning?: string | null;
};

// Baseline com registros demonstrativos consistentes dos 4 escopos para pronta visualização
const baselineOperationalLogs: AuditLogItem[] = [
  {
    id: "audit-demo-101",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    category: "catalog",
    action: "product.price_change",
    actor_email: "raulgdc91@gmail.com",
    user_role: "owner",
    ip_address: "177.136.241.88",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/134.0.0.0",
    resource: "products",
    resource_id: "paracetamol-750mg-20cp",
    old_values: {
      name: "Paracetamol 750mg 20 Comprimidos - Medley",
      priceCents: 1990,
      compareAtCents: 2490,
      stock: 140,
      isActive: true,
    },
    new_values: {
      name: "Paracetamol 750mg 20 Comprimidos - Medley",
      priceCents: 990,
      compareAtCents: 1990,
      stock: 140,
      isActive: true,
    },
    status: "success",
    metadata_json: { promotion: "Queima de Estoque Poupe Mais" },
    anomaly_warning: "Redução crítica de preço (50% de desconto). Risco de defasagem de margem.",
  },
  {
    id: "audit-demo-102",
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    category: "orders",
    action: "order.payment_confirmed",
    actor_email: "system@poupemais.com.br",
    user_role: "system",
    ip_address: "127.0.0.1",
    user_agent: "Webhook Banco Central Pix Gateway v2.4",
    resource: "orders",
    resource_id: "order_9841",
    old_values: {
      id: "order_9841",
      status: "awaiting_payment",
      totalCents: 7850,
      customerEmail: "marina.santos@gmail.com",
    },
    new_values: {
      id: "order_9841",
      status: "paid",
      totalCents: 7850,
      customerEmail: "marina.santos@gmail.com",
    },
    status: "success",
    metadata_json: { gateway: "Pix Banco Central", endToEndId: "E182361202609090123s098" },
    anomaly_warning: null,
  },
  {
    id: "audit-demo-103",
    created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    category: "auth",
    action: "user.role.assign",
    actor_email: "raulgdc91@gmail.com",
    user_role: "owner",
    ip_address: "177.136.241.88",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/134.0.0.0",
    resource: "users",
    resource_id: "farmapoupemais@proton.me",
    old_values: { email: "farmapoupemais@proton.me", role: "customer" },
    new_values: { email: "farmapoupemais@proton.me", role: "pharmacist" },
    status: "success",
    metadata_json: { crf: "CRF/RS 14892", reason: "Atribuição de Responsável Técnico Farmacêutico" },
    anomaly_warning: null,
  },
  {
    id: "audit-demo-104",
    created_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    category: "catalog",
    action: "product.stock_change",
    actor_email: "estoque@poupemais.com.br",
    user_role: "manager",
    ip_address: "189.4.92.115",
    user_agent: "Coletor Zebra Android 13 Enterprise",
    resource: "products",
    resource_id: "dipirona-500mg-drops",
    old_values: { name: "Dipirona Monoidratada 500mg/ml Gotas 20ml", stock: 120 },
    new_values: { name: "Dipirona Monoidratada 500mg/ml Gotas 20ml", stock: 105, deltaStock: -15 },
    status: "success",
    metadata_json: { motivo: "Saída para dispensação balcão loja física" },
    anomaly_warning: null,
  },
  {
    id: "audit-demo-105",
    created_at: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
    category: "admin",
    action: "admin.lgpd_export",
    actor_email: "raulgdc91@gmail.com",
    user_role: "owner",
    ip_address: "177.136.241.88",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/128.0",
    resource: "customers",
    resource_id: "marina.santos@gmail.com",
    old_values: { titular: "Marina Santos", requestedScope: "historico_completo" },
    new_values: { exportedAt: new Date(Date.now() - 1000 * 60 * 160).toISOString(), format: "ZIP_JSON" },
    status: "success",
    metadata_json: { protocoloLGPD: "LGPD-2026-0909-087", baseLegal: "Art. 18, II da Lei 13.709/2018" },
    anomaly_warning: "Exportação de dados sensíveis para conformidade com a LGPD (Art. 18).",
  },
  {
    id: "audit-demo-106",
    created_at: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
    category: "auth",
    action: "auth.login_failed",
    actor_email: "desconhecido@ataque.net",
    user_role: "anonymous",
    ip_address: "45.154.255.91",
    user_agent: "python-requests/2.31.0",
    resource: "auth",
    resource_id: "admin-login-endpoint",
    old_values: {},
    new_values: { attemptCount: 5, targetEmail: "admin@poupemais.com.br" },
    status: "failed",
    metadata_json: { blockDurationSeconds: 900, rateLimitTriggered: true },
    anomaly_warning: "Tentativa de login mal-sucedida ou credenciais incorretas.",
  },
  {
    id: "audit-demo-107",
    created_at: new Date(Date.now() - 1000 * 60 * 310).toISOString(),
    category: "admin",
    action: "discount.create",
    actor_email: "raulgdc91@gmail.com",
    user_role: "owner",
    ip_address: "177.136.241.88",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/134.0.0.0",
    resource: "discounts",
    resource_id: "cupom_economiainaugural",
    old_values: {},
    new_values: {
      code: "POUPE10",
      kind: "percent",
      amount: 10,
      minSubtotalCents: 5000,
      isActive: true,
    },
    status: "success",
    metadata_json: { campaign: "Inauguração Digital Panvel-Raia Benchmark" },
    anomaly_warning: null,
  },
];

export async function GET(request: Request) {
  const auth = await authorize("user:manage", request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get("category"); // auth | catalog | orders | admin | all
    const actionFilter = searchParams.get("action");
    const statusFilter = searchParams.get("status"); // success | failed | all
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const format = searchParams.get("format"); // json | csv

    const collectedLogs: AuditLogItem[] = [...baselineOperationalLogs];

    // 1. Tentar buscar registros reais do Supabase
    try {
      const client = getSupabaseServerClient();
      if (client) {
        const { data: supaRows } = await client
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (supaRows && supaRows.length > 0) {
          for (const row of supaRows) {
            let oldVal = {};
            let newVal = {};
            try {
              oldVal = typeof row.old_values === "object" ? row.old_values : JSON.parse(row.old_values || "{}");
            } catch {}
            try {
              newVal = typeof row.new_values === "object" ? row.new_values : JSON.parse(row.new_values || "{}");
            } catch {}

            let meta = {};
            try {
              meta = typeof row.metadata_json === "object" ? row.metadata_json : JSON.parse(row.metadata_json || "{}");
            } catch {}

            const category: AuditCategory =
              row.category === "auth" || row.category === "catalog" || row.category === "orders" || row.category === "admin"
                ? row.category
                : row.action?.startsWith("product.") ? "catalog"
                : row.action?.startsWith("order.") ? "orders"
                : row.action?.startsWith("user.") || row.action?.startsWith("auth.") ? "auth"
                : "admin";

            const anomaly = detectAuditAnomaly({
              category,
              action: row.action,
              oldValues: oldVal,
              newValues: newVal,
              status: row.status as AuditStatus,
            });

            collectedLogs.push({
              id: row.id,
              created_at: row.created_at || new Date().toISOString(),
              category,
              action: row.action,
              actor_email: row.actor_email,
              user_role: row.user_role || "system",
              ip_address: row.ip_address || "127.0.0.1",
              user_agent: row.user_agent || "Desconhecido",
              resource: row.resource || row.entity_type || "",
              resource_id: row.resource_id || row.entity_id || "",
              old_values: oldVal,
              new_values: newVal,
              status: (row.status as AuditStatus) || "success",
              metadata_json: meta,
              anomaly_warning: anomaly,
            });
          }
        }
      }
    } catch (err) {
      console.error("[AuditAPI] Erro ao carregar Supabase:", err);
    }

    // 2. Tentar buscar registros reais do SQLite Local (D1)
    try {
      const db = getDb();
      const localRows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
      if (localRows && localRows.length > 0) {
        for (const row of localRows) {
          let oldVal = {};
          let newVal = {};
          try {
            oldVal = JSON.parse(row.oldValuesJson || "{}");
          } catch {}
          try {
            newVal = JSON.parse(row.newValuesJson || "{}");
          } catch {}

          let meta = {};
          try {
            meta = JSON.parse(row.metadataJson || "{}");
          } catch {}

          const category: AuditCategory =
            row.category === "auth" || row.category === "catalog" || row.category === "orders" || row.category === "admin"
              ? (row.category as AuditCategory)
              : "admin";

          const anomaly = detectAuditAnomaly({
            category,
            action: row.action,
            oldValues: oldVal,
            newValues: newVal,
            status: (row.status as AuditStatus) || "success",
          });

          collectedLogs.push({
            id: `d1-${row.id}`,
            created_at: row.createdAt || new Date().toISOString(),
            category,
            action: row.action,
            actor_email: row.actorEmail,
            user_role: row.userRole || "system",
            ip_address: row.ipAddress || "127.0.0.1",
            user_agent: row.userAgent || "Desconhecido",
            resource: row.resource || row.entityType || "",
            resource_id: row.resourceId || row.entityId || "",
            old_values: oldVal,
            new_values: newVal,
            status: (row.status as AuditStatus) || "success",
            metadata_json: meta,
            anomaly_warning: anomaly,
          });
        }
      }
    } catch (err) {
      console.error("[AuditAPI] Erro ao carregar SQLite:", err);
    }

    // Deduplicação por id / chave
    const seen = new Set<string>();
    const uniqueLogs: AuditLogItem[] = [];
    for (const item of collectedLogs) {
      const key = `${item.id}-${item.action}-${item.created_at}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLogs.push(item);
      }
    }

    // Ordenação decrescente de data
    uniqueLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Filtragem
    let filtered = uniqueLogs;

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((l) => l.category === categoryFilter);
    }
    if (actionFilter) {
      filtered = filtered.filter((l) => l.action.toLowerCase().includes(actionFilter.toLowerCase()));
    }
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }
    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.action.toLowerCase().includes(search) ||
          l.actor_email.toLowerCase().includes(search) ||
          l.resource.toLowerCase().includes(search) ||
          l.resource_id.toLowerCase().includes(search) ||
          l.ip_address.toLowerCase().includes(search) ||
          l.user_role.toLowerCase().includes(search) ||
          JSON.stringify(l.old_values).toLowerCase().includes(search) ||
          JSON.stringify(l.new_values).toLowerCase().includes(search)
      );
    }

    // Exportação em formato CSV
    if (format === "csv") {
      const csvHeader = "ID,Data_Hora_UTC,Categoria,Acao,Ator_Email,Perfil,IP,Recurso,Recurso_ID,Status,Alerta_Anomalia\n";
      const csvRows = filtered.map((l) => {
        return `"${l.id}","${l.created_at}","${l.category}","${l.action}","${l.actor_email}","${l.user_role}","${l.ip_address}","${l.resource}","${l.resource_id}","${l.status}","${(l.anomaly_warning || "").replace(/"/g, '""')}"`;
      });
      const csvContent = csvHeader + csvRows.join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="auditoria-operacoes-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Métricas e Alertas
    const anomalies = uniqueLogs.filter((l) => Boolean(l.anomaly_warning));
    const countsByCategory = {
      auth: uniqueLogs.filter((l) => l.category === "auth").length,
      catalog: uniqueLogs.filter((l) => l.category === "catalog").length,
      orders: uniqueLogs.filter((l) => l.category === "orders").length,
      admin: uniqueLogs.filter((l) => l.category === "admin").length,
    };

    return Response.json({
      logs: filtered,
      stats: {
        total: uniqueLogs.length,
        filteredTotal: filtered.length,
        countsByCategory,
        anomaliesCount: anomalies.length,
        anomalies: anomalies.slice(0, 5),
        uniqueActors: new Set(uniqueLogs.map((l) => l.actor_email)).size,
      },
    });
  } catch (error) {
    console.error("[AuditAPI] Falha:", error);
    return Response.json({ error: "Erro ao buscar registros de auditoria operacional." }, { status: 500 });
  }
}
