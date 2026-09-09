import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";
import { getSupabaseServerClient } from "@/lib/supabase";

export type AuditCategory = "auth" | "catalog" | "orders" | "admin";
export type AuditStatus = "success" | "failed";

export type EnrichedAuditLog = {
  id: number | string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  category: AuditCategory;
  user_role: string;
  ip_address: string;
  user_agent: string;
  resource: string;
  resource_id: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  status: AuditStatus;
  metadata_json: Record<string, unknown>;
  created_at: string;
  anomaly_warning?: string | null;
};

export function extractClientInfo(req?: Request): { ip: string; userAgent: string } {
  if (!req) {
    return { ip: "127.0.0.1", userAgent: "API Interna / Cron" };
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  const xRealIp = req.headers.get("x-real-ip");
  
  let ip = "127.0.0.1";
  if (cfConnectingIp) {
    ip = cfConnectingIp.trim();
  } else if (forwarded) {
    ip = forwarded.split(",")[0].trim();
  } else if (xRealIp) {
    ip = xRealIp.trim();
  }

  const rawUserAgent = req.headers.get("user-agent") || "Navegador Desconhecido";
  const userAgent = rawUserAgent.length > 180 ? rawUserAgent.slice(0, 180) + "..." : rawUserAgent;

  return { ip, userAgent };
}

export function detectAuditAnomaly(params: {
  category: AuditCategory;
  action: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  status?: AuditStatus;
}): string | null {
  const { action, oldValues, newValues, status } = params;

  if (status === "failed") {
    return "Ação operacional falhou ou foi bloqueada pelas políticas de segurança.";
  }

  // Preço alterado em mais de 50%
  if (oldValues && newValues) {
    const oldPrice = Number(oldValues.priceCents || oldValues.price_cents || 0);
    const newPrice = Number(newValues.priceCents || newValues.price_cents || 0);
    if (oldPrice > 0 && newPrice > 0) {
      const dropRatio = (oldPrice - newPrice) / oldPrice;
      const hikeRatio = (newPrice - oldPrice) / oldPrice;
      if (dropRatio >= 0.5) {
        return `Redução crítica de preço (${Math.round(dropRatio * 100)}% de desconto). Risco de defasagem de margem.`;
      }
      if (hikeRatio >= 1.0) {
        return `Aumento expressivo de preço (+${Math.round(hikeRatio * 100)}%). Verifique tabelamento ANVISA/CMED.`;
      }
    }

    // Variação de estoque em massa (> 500 unidades)
    const oldStock = Number(oldValues.stock || 0);
    const newStock = Number(newValues.stock || 0);
    if (Math.abs(newStock - oldStock) >= 500) {
      return `Movimentação expressiva de estoque (${newStock - oldStock > 0 ? "+" : ""}${newStock - oldStock} un).`;
    }
  }

  // Exclusão de produto
  if (action.includes("delete") && (action.includes("product") || params.category === "catalog")) {
    return "Exclusão permanente de item do catálogo farmacêutico.";
  }

  // Elevação para Owner ou Gerente
  if (action.includes("role") && newValues) {
    const assignedRole = String(newValues.role || "");
    if (assignedRole === "owner" || assignedRole === "manager") {
      return `Concessão de privilégio elevado (${assignedRole.toUpperCase()}) com acesso irrestrito.`;
    }
  }

  // Falha de login
  if (action === "auth.login_failed" || action === "user.login_failed") {
    return "Tentativa de login mal-sucedida ou credenciais incorretas.";
  }

  // Exportação LGPD
  if (action.includes("export") || action.includes("lgpd")) {
    return "Exportação de dados sensíveis para conformidade com a LGPD (Art. 18).";
  }

  return null;
}

export type RecordAuditMutationOptions = {
  req?: Request;
  category: AuditCategory;
  action: string;
  resource: string;
  resourceId: string;
  actorEmail: string;
  actorRole?: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  status?: AuditStatus;
  metadata?: Record<string, unknown>;
};

export async function recordAuditMutation(options: RecordAuditMutationOptions): Promise<EnrichedAuditLog> {
  const {
    req,
    category,
    action,
    resource,
    resourceId,
    actorEmail,
    actorRole = "system",
    oldValues = {},
    newValues = {},
    status = "success",
    metadata = {},
  } = options;

  const { ip, userAgent } = extractClientInfo(req);
  const now = new Date().toISOString();
  const anomaly = detectAuditAnomaly({ category, action, oldValues: oldValues || {}, newValues: newValues || {}, status });

  const oldJson = JSON.stringify(oldValues || {});
  const newJson = JSON.stringify(newValues || {});
  const metaJson = JSON.stringify({ ...metadata, anomalyWarning: anomaly });

  // 1. Gravação no D1 / SQLite local
  try {
    const db = getDb();
    await db.insert(auditLogs).values({
      actorEmail: actorEmail.toLowerCase().trim(),
      action,
      entityType: resource,
      entityId: resourceId,
      category,
      userRole: actorRole,
      ipAddress: ip,
      userAgent: userAgent,
      resource,
      resourceId,
      oldValuesJson: oldJson,
      newValuesJson: newJson,
      status,
      metadataJson: metaJson,
      createdAt: now,
    });
  } catch (err) {
    console.error("[AuditInterceptor] Erro ao gravar no SQLite local:", err);
  }

  // 2. Gravação no Supabase (se configurado)
  try {
    const client = getSupabaseServerClient();
    if (client) {
      await client.from("audit_logs").insert({
        actor_email: actorEmail.toLowerCase().trim(),
        action,
        entity_type: resource,
        entity_id: resourceId,
        category,
        user_role: actorRole,
        ip_address: ip,
        user_agent: userAgent,
        resource,
        resource_id: resourceId,
        old_values: oldValues || {},
        new_values: newValues || {},
        status,
        metadata_json: { ...metadata, anomalyWarning: anomaly },
        created_at: now,
      });
    }
  } catch (err) {
    console.error("[AuditInterceptor] Erro ao gravar no Supabase:", err);
  }

  return {
    id: Date.now(),
    actor_email: actorEmail.toLowerCase().trim(),
    action,
    entity_type: resource,
    entity_id: resourceId,
    category,
    user_role: actorRole,
    ip_address: ip,
    user_agent: userAgent,
    resource,
    resource_id: resourceId,
    old_values: oldValues || {},
    new_values: newValues || {},
    status,
    metadata_json: { ...metadata, anomalyWarning: anomaly },
    created_at: now,
    anomaly_warning: anomaly,
  };
}
