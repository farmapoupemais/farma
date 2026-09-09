import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";
import { recordAuditMutation, type AuditCategory, type AuditStatus } from "@/lib/audit-interceptor";

export function auditEntry(
  actorEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) {
  let category: AuditCategory = "admin";
  if (action.startsWith("auth.") || action.startsWith("user.login") || action.startsWith("user.role")) {
    category = "auth";
  } else if (action.startsWith("product.") || action.startsWith("catalog.") || entityType === "product") {
    category = "catalog";
  } else if (action.startsWith("order.") || entityType === "order") {
    category = "orders";
  }

  return {
    actorEmail: actorEmail.toLowerCase(),
    action,
    entityType,
    entityId,
    category,
    userRole: "system",
    ipAddress: "127.0.0.1",
    userAgent: "internal",
    resource: entityType,
    resourceId: entityId,
    oldValuesJson: "{}",
    newValuesJson: "{}",
    status: "success",
    metadataJson: JSON.stringify(metadata),
  };
}

export async function audit(
  actorEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) {
  await getDb().insert(auditLogs).values(auditEntry(actorEmail, action, entityType, entityId, metadata));
}

export { recordAuditMutation };
export type { AuditCategory, AuditStatus };
