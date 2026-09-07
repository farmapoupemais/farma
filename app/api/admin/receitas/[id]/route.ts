import { authorize } from "@/lib/access";
import { getSupabaseServerClient } from "@/lib/supabase";
import { sanitizeAuditMetadata } from "@/lib/security";
import { cleanText, mutationOriginAllowed, readJsonBody, RequestBodyError, toSafeInteger } from "@/lib/validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize("prescription:review", request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const client = getSupabaseServerClient();
    const { data: record, error } = await client
      .from("prescriptions")
      .select("*")
      .eq("id", id.slice(0, 40))
      .maybeSingle();

    if (error || !record) return Response.json({ error: "Receita não encontrada." }, { status: 404 });
    if (record.retain_until && record.retain_until <= new Date().toISOString()) {
      return Response.json({ error: "Este documento ultrapassou o período de retenção." }, { status: 410 });
    }

    // Tenta baixar do Supabase Storage bucket 'prescriptions'
    const { data: fileData, error: storageError } = await client.storage
      .from("prescriptions")
      .download(record.object_key);

    if (storageError || !fileData) {
      return Response.json({
        prescription: {
          id: record.id,
          originalName: record.original_name,
          contentType: record.content_type,
          status: record.status,
          customerEmail: record.customer_email,
        }
      });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    return new Response(arrayBuffer, {
      headers: {
        "content-type": record.content_type,
        "content-disposition": `attachment; filename="${record.original_name.replace(/["\r\n]/g, "_")}"`,
        "cache-control": "private, no-store",
        "content-security-policy": "sandbox; default-src 'none'",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Não foi possível carregar o documento." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("prescription:review", request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const prescriptionId = id.slice(0, 40);
    const body = await readJsonBody<{ status?: unknown; expiresAt?: unknown; items?: { productId?: unknown; maxQuantity?: unknown }[] }>(request, 8_000);
    const status = body.status === "approved" || body.status === "rejected" ? body.status : null;
    if (!status) return Response.json({ error: "Status inválido." }, { status: 400 });

    const client = getSupabaseServerClient();
    const { data: existing, error: fetchErr } = await client
      .from("prescriptions")
      .select("id, customer_email, status")
      .eq("id", prescriptionId)
      .maybeSingle();

    if (fetchErr || !existing || existing.status !== "pending_review") {
      return Response.json({ error: "Receita não encontrada ou já analisada." }, { status: 409 });
    }

    const reviewer = auth.actor.email.toLowerCase();
    if (existing.customer_email === reviewer) {
      return Response.json({ error: "A própria receita deve ser analisada por outro farmacêutico." }, { status: 403 });
    }

    let approvedItemsJson: unknown = null;
    let expiresAt: string | null = null;
    const reviewedAt = new Date().toISOString();
    let retainUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    if (status === "approved") {
      if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
        return Response.json({ error: "Informe os produtos e quantidades autorizados." }, { status: 400 });
      }
      const approvedItems = body.items.map((item) => ({
        productId: cleanText(item.productId, 80),
        maxQuantity: toSafeInteger(item.maxQuantity, 1, 30),
      }));

      if (approvedItems.some((item) => !item.productId || item.maxQuantity === null) || new Set(approvedItems.map((item) => item.productId)).size !== approvedItems.length) {
        return Response.json({ error: "Itens autorizados inválidos ou duplicados." }, { status: 400 });
      }

      const requestedExpiry = typeof body.expiresAt === "string" ? new Date(body.expiresAt) : null;
      const maxExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      if (!requestedExpiry || !Number.isFinite(requestedExpiry.getTime()) || requestedExpiry.getTime() <= Date.now() || requestedExpiry.getTime() > maxExpiry) {
        return Response.json({ error: "A validade deve estar entre agora e 30 dias." }, { status: 400 });
      }

      approvedItemsJson = approvedItems;
      expiresAt = requestedExpiry.toISOString();
      retainUntil = expiresAt;
    }

    const { error: updateError } = await client
      .from("prescriptions")
      .update({
        status,
        reviewer_email: reviewer,
        approved_items_json: approvedItemsJson,
        expires_at: expiresAt,
        retain_until: retainUntil,
        reviewed_at: reviewedAt,
      })
      .eq("id", prescriptionId);

    if (updateError) throw updateError;

    await client.from("audit_logs").insert({
      actor_email: reviewer,
      action: "prescription.review",
      entity_type: "prescription",
      entity_id: prescriptionId,
      metadata_json: sanitizeAuditMetadata({ status, expiresAt, approvedItems: approvedItemsJson }),
      created_at: reviewedAt,
    });

    return Response.json({ prescription: { id: prescriptionId, status, expiresAt } });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível registrar a análise da receita." }, { status: 500 });
  }
}
