import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { inventoryReservations, orders } from "@/db/schema";
import { authorize } from "@/lib/access";
import { canTransitionOrder, isKnownOrderStatus } from "@/lib/order-policy";
import { mutationOriginAllowed, readJsonBody, RequestBodyError } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("order:update"); if (!auth.ok) return auth.response;
  try {
    const body = await readJsonBody<{ status?: unknown }>(request, 4_000);
    const status = typeof body.status === "string" ? body.status : "";
    if (!isKnownOrderStatus(status) || status === "paid") return Response.json({ error: "Status inválido. Pagamentos só podem ser confirmados pelo provedor." }, { status: 400 });
    const { id } = await params;
    const orderId = id.slice(0, 40);
    const db = getDb();
    const [current] = await db.select({ id: orders.id, status: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!current) return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
    if (!canTransitionOrder(auth.actor.role, current.status, status)) {
      const statusCode = auth.actor.role === "support" && status !== "cancelled" ? 403 : 409;
      return Response.json({ error: statusCode === 403 ? "Atendimento pode apenas registrar cancelamentos permitidos." : "Esta transição de pedido não é permitida." }, { status: statusCode });
    }

    const runtimeEnv = env as unknown as { DB?: D1Database };
    if (!runtimeEnv.DB) return Response.json({ error: "Banco indisponível." }, { status: 503 });
    const updatedAt = new Date().toISOString();
    const metadata = JSON.stringify({ from: current.status, to: status });
    const statements: D1PreparedStatement[] = [
      runtimeEnv.DB.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND status = ?").bind(status, updatedAt, orderId, current.status),
      runtimeEnv.DB.prepare("INSERT INTO audit_logs (actor_email, action, entity_type, entity_id, metadata_json) SELECT ?, 'order.status.update', 'order', id, ? FROM orders WHERE id = ? AND status = ? AND updated_at = ?")
        .bind(auth.actor.email.toLowerCase(), metadata, orderId, status, updatedAt),
    ];

    if (status === "cancelled") {
      const reservations = await db.select({ productId: inventoryReservations.productId }).from(inventoryReservations).where(eq(inventoryReservations.orderId, orderId));
      for (const reservation of reservations) {
        statements.push(
          runtimeEnv.DB.prepare("UPDATE products SET stock = stock + (SELECT quantity FROM order_inventory_reservations WHERE order_id = ? AND product_id = ? AND released_at IS NULL), updated_at = ? WHERE id = ? AND EXISTS (SELECT 1 FROM order_inventory_reservations WHERE order_id = ? AND product_id = ? AND released_at IS NULL) AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'cancelled' AND updated_at = ?)")
            .bind(orderId, reservation.productId, updatedAt, reservation.productId, orderId, reservation.productId, orderId, updatedAt),
          runtimeEnv.DB.prepare("UPDATE order_inventory_reservations SET released_at = ? WHERE order_id = ? AND product_id = ? AND released_at IS NULL AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'cancelled' AND updated_at = ?)")
            .bind(updatedAt, orderId, reservation.productId, orderId, updatedAt),
        );
      }
    }

    const results = await runtimeEnv.DB.batch(statements);
    if ((results[0].meta?.changes ?? 0) !== 1) return Response.json({ error: "O pedido mudou enquanto era atualizado. Recarregue a tela." }, { status: 409 });
    return Response.json({ order: { id: orderId, status } });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível atualizar o pedido." }, { status: 500 });
  }
}
