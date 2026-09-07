import { authorize } from "@/lib/access";
import { getSupabaseServerClient } from "@/lib/supabase";
import { mutationOriginAllowed, readJsonBody, RequestBodyError } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("catalog:regulatory", request);
  if (!auth.ok) return auth.response;

  try {
    const body = await readJsonBody<{ decision?: unknown; requiresPrescription?: unknown }>(request, 4_000);
    const decision = body.decision === "approved" || body.decision === "rejected" ? body.decision : null;
    if (!decision || (decision === "approved" && typeof body.requiresPrescription !== "boolean")) {
      return Response.json({ error: "Informe a decisão e a classificação de receita." }, { status: 400 });
    }

    const { id } = await params;
    const productId = id.slice(0, 80);
    const reviewedAt = new Date().toISOString();
    const reviewer = auth.actor.email.toLowerCase();
    const requiresPrescription = decision === "approved" ? body.requiresPrescription === true : true;
    const metadata = { decision, requiresPrescription };

    const client = getSupabaseServerClient();
    const { error: updateError } = await client
      .from("products")
      .update({
        regulatory_status: decision,
        regulatory_reviewer_email: reviewer,
        requires_prescription: requiresPrescription,
        is_active: decision === "approved",
        updated_at: reviewedAt,
      })
      .eq("id", productId);

    if (updateError) throw updateError;

    await client.from("audit_logs").insert({
      actor_email: reviewer,
      action: "product.regulatory.review",
      entity_type: "product",
      entity_id: productId,
      metadata_json: metadata,
      created_at: reviewedAt,
    });

    return Response.json({ product: { id: productId, regulatoryStatus: decision, requiresPrescription, isActive: decision === "approved" } });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível concluir a análise regulatória." }, { status: 500 });
  }
}
