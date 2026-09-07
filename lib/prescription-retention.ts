import { and, eq, lte } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { auditLogs, prescriptions } from "@/db/schema";
import { auditEntry } from "@/lib/audit";

export async function cleanupExpiredPrescriptions(limit = 10) {
  const runtimeEnv = env as unknown as { BUCKET?: R2Bucket };
  if (!runtimeEnv.BUCKET) return 0;
  const db = getDb();
  const now = new Date().toISOString();
  const expired = await db.select({ id: prescriptions.id, objectKey: prescriptions.objectKey }).from(prescriptions).where(lte(prescriptions.retainUntil, now)).limit(limit);
  let removed = 0;
  for (const record of expired) {
    await runtimeEnv.BUCKET.delete(record.objectKey);
    await db.batch([
      db.delete(prescriptions).where(and(eq(prescriptions.id, record.id), lte(prescriptions.retainUntil, now))),
      db.insert(auditLogs).values(auditEntry("system@farmacia.local", "prescription.retention.delete", "prescription", record.id)),
    ]);
    removed += 1;
  }
  return removed;
}
