import { and, eq, inArray } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { prescriptions, products } from "@/db/schema";
import { authorize } from "@/lib/access";
import { audit } from "@/lib/audit";
import { cleanText, mutationOriginAllowed, readJsonBody, RequestBodyError, toSafeInteger } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize("prescription:review"); if (!auth.ok) return auth.response;
  const { id } = await params;
  const [record] = await getDb().select().from(prescriptions).where(eq(prescriptions.id, id.slice(0, 40))).limit(1);
  if (!record) return Response.json({ error: "Receita não encontrada." }, { status: 404 });
  if (record.retainUntil <= new Date().toISOString()) return Response.json({ error: "Este documento ultrapassou o período de retenção e não está mais disponível." }, { status: 410 });
  const runtimeEnv = env as unknown as { BUCKET?: R2Bucket };
  const object = await runtimeEnv.BUCKET?.get(record.objectKey);
  if (!object) return Response.json({ error: "Documento indisponível." }, { status: 404 });
  await audit(auth.actor.email, "prescription.view", "prescription", record.id);
  return new Response(object.body, { headers: { "content-type": record.contentType, "content-disposition": "attachment; filename=\"" + record.originalName.replace(/["\r\n]/g, "_") + "\"", "cache-control": "private, no-store", "content-security-policy": "sandbox; default-src 'none'", "x-content-type-options": "nosniff", "x-download-options": "noopen" } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("prescription:review"); if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const prescriptionId = id.slice(0, 40);
    const body = await readJsonBody<{ status?: unknown; expiresAt?: unknown; items?: { productId?: unknown; maxQuantity?: unknown }[] }>(request, 8_000);
    const status = body.status === "approved" || body.status === "rejected" ? body.status : null;
    if (!status) return Response.json({ error: "Status inválido." }, { status: 400 });

    const db = getDb();
    const [existing] = await db.select({ id: prescriptions.id, customerEmail: prescriptions.customerEmail, status: prescriptions.status }).from(prescriptions).where(eq(prescriptions.id, prescriptionId)).limit(1);
    if (!existing || existing.status !== "pending_review") return Response.json({ error: "Receita não encontrada ou já analisada." }, { status: 409 });
    const reviewer = auth.actor.email.toLowerCase();
    if (existing.customerEmail === reviewer) return Response.json({ error: "A própria receita deve ser analisada por outro farmacêutico." }, { status: 403 });

    let approvedItemsJson: string | null = null;
    let expiresAt: string | null = null;
    const reviewedAt = new Date().toISOString();
    let retainUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    if (status === "approved") {
      if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) return Response.json({ error: "Informe os produtos e quantidades autorizados." }, { status: 400 });
      const approvedItems = body.items.map((item) => ({ productId: cleanText(item.productId, 80), maxQuantity: toSafeInteger(item.maxQuantity, 1, 30) }));
      if (approvedItems.some((item) => !item.productId || item.maxQuantity === null) || new Set(approvedItems.map((item) => item.productId)).size !== approvedItems.length) return Response.json({ error: "Itens autorizados inválidos ou duplicados." }, { status: 400 });
      const requestedExpiry = typeof body.expiresAt === "string" ? new Date(body.expiresAt) : null;
      const maxExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      if (!requestedExpiry || !Number.isFinite(requestedExpiry.getTime()) || requestedExpiry.getTime() <= Date.now() || requestedExpiry.getTime() > maxExpiry) return Response.json({ error: "A validade deve estar entre agora e 30 dias." }, { status: 400 });
      const ids = approvedItems.map((item) => item.productId);
      const regulated = await db.select({ id: products.id }).from(products).where(and(inArray(products.id, ids), eq(products.isActive, true), eq(products.regulatoryStatus, "approved"), eq(products.requiresPrescription, true)));
      if (regulated.length !== ids.length) return Response.json({ error: "Todos os itens devem ser produtos ativos e classificados como sujeitos a receita." }, { status: 400 });
      approvedItemsJson = JSON.stringify(approvedItems);
      expiresAt = requestedExpiry.toISOString();
      retainUntil = expiresAt;
    }

    const runtimeEnv = env as unknown as { DB?: D1Database };
    if (!runtimeEnv.DB) return Response.json({ error: "Banco indisponível." }, { status: 503 });
    const metadata = JSON.stringify({ status, expiresAt, approvedItems: approvedItemsJson ? JSON.parse(approvedItemsJson) : [] });
    const results = await runtimeEnv.DB.batch([
      runtimeEnv.DB.prepare("UPDATE prescriptions SET status = ?, reviewer_email = ?, approved_items_json = ?, expires_at = ?, retain_until = ?, reviewed_at = ? WHERE id = ? AND status = 'pending_review' AND customer_email <> ?")
        .bind(status, reviewer, approvedItemsJson, expiresAt, retainUntil, reviewedAt, prescriptionId, reviewer),
      runtimeEnv.DB.prepare("INSERT INTO audit_logs (actor_email, action, entity_type, entity_id, metadata_json) SELECT ?, 'prescription.review', 'prescription', id, ? FROM prescriptions WHERE id = ? AND status = ? AND reviewer_email = ? AND reviewed_at = ?")
        .bind(reviewer, metadata, prescriptionId, status, reviewer, reviewedAt),
    ]);
    if ((results[0].meta?.changes ?? 0) !== 1) return Response.json({ error: "Receita já analisada ou conflito de revisão." }, { status: 409 });
    return Response.json({ prescription: { id: prescriptionId, status, expiresAt } });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível registrar a análise." }, { status: 500 });
  }
}
