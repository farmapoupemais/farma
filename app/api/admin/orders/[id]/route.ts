import { authorize } from "@/lib/access";
import { canTransitionOrder, isKnownOrderStatus } from "@/lib/order-policy";
import { getSupabaseServerClient } from "@/lib/supabase";
import { mutationOriginAllowed, readJsonBody, RequestBodyError } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("order:update", request);
  if (!auth.ok) return auth.response;

  try {
    const body = await readJsonBody<{ status?: unknown }>(request, 4_000);
    const status = typeof body.status === "string" ? body.status : "";
    if (!isKnownOrderStatus(status)) {
      return Response.json(
        { error: "Status inválido." },
        { status: 400 }
      );
    }

    const { id } = await params;
    const orderId = id.slice(0, 40);
    const client = getSupabaseServerClient();

    // Check existing order in Supabase
    const { data: current, error: fetchError } = await client
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .maybeSingle();

    const currentStatus = current?.status ?? "awaiting_payment";

    if (!canTransitionOrder(auth.actor.role, currentStatus, status)) {
      const statusCode = auth.actor.role === "support" && status !== "cancelled" ? 403 : 409;
      return Response.json(
        {
          error:
            statusCode === 403
              ? "Atendimento pode apenas registrar cancelamentos permitidos."
              : "Esta transição de pedido não é permitida.",
        },
        { status: statusCode }
      );
    }

    const updatedAt = new Date().toISOString();

    // Update or upsert order status in Supabase
    const { error: updateError } = await client
      .from("orders")
      .update({ status, updated_at: updatedAt })
      .eq("id", orderId);

    // Audit log
    await client.from("audit_logs").insert({
      actor_email: auth.actor.email.toLowerCase(),
      action: "order.status.update",
      entity_type: "order",
      entity_id: orderId,
      metadata_json: { from: currentStatus, to: status },
      created_at: updatedAt,
    });

    return Response.json({ order: { id: orderId, status } });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível atualizar o pedido." }, { status: 500 });
  }
}
