import { authorize } from "@/lib/access";
import { canTransitionOrder, isKnownOrderStatus } from "@/lib/order-policy";
import { getSupabaseServerClient } from "@/lib/supabase";
import { recordAuditMutation } from "@/lib/audit-interceptor";
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
    const { data: current } = await client
      .from("orders")
      .select("id, status, total_cents, customer_email")
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
    const { error } = await client
      .from("orders")
      .update({ status, updated_at: updatedAt })
      .eq("id", orderId);

    if (error) throw error;

    // Audit log imutável de transição de status de pedido
    const actionName = status === "cancelled" ? "order.cancel" : status === "paid" ? "order.payment_confirmed" : "order.status_update";
    await recordAuditMutation({
      req: request,
      category: "orders",
      action: actionName,
      resource: "orders",
      resourceId: orderId,
      actorEmail: auth.actor.email,
      actorRole: auth.actor.role,
      oldValues: {
        id: orderId,
        status: currentStatus,
        totalCents: current?.total_cents,
        customerEmail: current?.customer_email,
      },
      newValues: {
        id: orderId,
        status,
        totalCents: current?.total_cents,
        customerEmail: current?.customer_email,
      },
      status: "success",
    });

    return Response.json({ order: { id: orderId, status } });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível atualizar o pedido." }, { status: 500 });
  }
}
