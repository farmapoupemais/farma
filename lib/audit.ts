import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";

export function auditEntry(actorEmail: string, action: string, entityType: string, entityId: string, metadata: Record<string, string | number | boolean> = {}) {
  return {
    actorEmail: actorEmail.toLowerCase(),
    action,
    entityType,
    entityId,
    metadataJson: JSON.stringify(metadata),
  };
}

export async function audit(actorEmail: string, action: string, entityType: string, entityId: string, metadata: Record<string, string | number | boolean> = {}) {
  await getDb().insert(auditLogs).values(auditEntry(actorEmail, action, entityType, entityId, metadata));
}
