import { env } from "cloudflare:workers";
import { authorize } from "@/lib/access";
import { mutationOriginAllowed, readJsonBody, RequestBodyError } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("catalog:regulatory"); if (!auth.ok) return auth.response;

  try {
    const body = await readJsonBody<{ decision?: unknown; requiresPrescription?: unknown }>(request, 4_000);
    const decision = body.decision === "approved" || body.decision === "rejected" ? body.decision : null;
    if (!decision || (decision === "approved" && typeof body.requiresPrescription !== "boolean")) {
      return Response.json({ error: "Informe a decisão e a classificação de receita." }, { status: 400 });
    }

    const { id } = await params;
    const productId = id.slice(0, 80);
    const reviewedAt = new Date().toISOString();
    const runtimeEnv = env as unknown as { DB?: D1Database };
    if (!runtimeEnv.DB) return Response.json({ error: "Banco indisponível." }, { status: 503 });
    const reviewer = auth.actor.email.toLowerCase();
    const requiresPrescription = decision === "approved" ? body.requiresPrescription === true : true;
    const metadata = JSON.stringify({ decision, requiresPrescription });
    const results = await runtimeEnv.DB.batch([
      runtimeEnv.DB.prepare("UPDATE products SET regulatory_status = ?, regulatory_reviewer_email = ?, requires_prescription = ?, is_active = ?, updated_at = ? WHERE id = ? AND regulatory_status = 'pending_review'")
        .bind(decision, reviewer, requiresPrescription ? 1 : 0, decision === "approved" ? 1 : 0, reviewedAt, productId),
      runtimeEnv.DB.prepare("INSERT INTO audit_logs (actor_email, action, entity_type, entity_id, metadata_json) SELECT ?, 'product.regulatory.review', 'product', id, ? FROM products WHERE id = ? AND regulatory_status = ? AND regulatory_reviewer_email = ? AND updated_at = ?")
        .bind(reviewer, metadata, productId, decision, reviewer, reviewedAt),
    ]);
    if ((results[0].meta?.changes ?? 0) !== 1) return Response.json({ error: "Produto não encontrado ou já analisado." }, { status: 409 });
    return Response.json({ product: { id: productId, regulatoryStatus: decision, requiresPrescription, isActive: decision === "approved" } });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível concluir a análise regulatória." }, { status: 500 });
  }
}
