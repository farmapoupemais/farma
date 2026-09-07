import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { discountRedemptions, discounts, prescriptions, prescriptionUsages } from "@/db/schema";
import { aggregateOrderItems, prescriptionCovers, type ApprovedPrescriptionItem } from "@/lib/order-policy";
import { getOrderableProducts } from "@/lib/products-repository";
import { cleanText, mutationOriginAllowed, readJsonBody, RequestBodyError, toSafeInteger } from "@/lib/validation";

type OrderPayload = {
  items?: { id?: unknown; quantity?: unknown }[];
  fulfillment?: unknown;
  coupon?: unknown;
  prescriptionId?: unknown;
  address?: Record<string, unknown> | null;
};

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem da solicitação não permitida." }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Entre na sua conta para concluir o pedido." }, { status: 401 });

  try {
    const payload = await readJsonBody<OrderPayload>(request, 32_000);
    if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 30) return Response.json({ error: "Carrinho inválido." }, { status: 400 });
    const fulfillment = payload.fulfillment === "pickup" ? "pickup" : payload.fulfillment === "delivery" ? "delivery" : null;
    if (!fulfillment) return Response.json({ error: "Escolha entrega ou retirada." }, { status: 400 });

    const normalized: { id: string; quantity: number }[] = [];
    for (const raw of payload.items) {
      const id = cleanText(raw.id, 80);
      const quantity = toSafeInteger(raw.quantity, 1, 10);
      if (!id || quantity === null) return Response.json({ error: "Quantidade ou produto inválido." }, { status: 400 });
      normalized.push({ id, quantity });
    }
    const requested = aggregateOrderItems(normalized);
    if (!requested) return Response.json({ error: "A quantidade máxima por produto é 10." }, { status: 400 });
    const catalog = await getOrderableProducts(requested.map((item) => item.id));
    if (catalog.length !== requested.length) return Response.json({ error: "Um produto ficou indisponível. Atualize o carrinho." }, { status: 409 });
    const serverLines = requested.map((item) => {
      const product = catalog.find((entry) => entry.id === item.id);
      return product ? { product, quantity: item.quantity } : null;
    });
    if (serverLines.some((line) => !line)) return Response.json({ error: "Um produto ficou indisponível. Atualize o carrinho." }, { status: 409 });
    const typedLines = serverLines.filter((line): line is NonNullable<typeof line> => Boolean(line));

    const db = getDb();
    const email = user.email.toLowerCase();
    const now = new Date().toISOString();
    const regulatedLines = typedLines.filter((line) => line.product.requiresPrescription);
    let prescriptionId: string | null = null;
    if (regulatedLines.length) {
      prescriptionId = cleanText(payload.prescriptionId, 40);
      if (!prescriptionId) return Response.json({ error: "Selecione a receita aprovada para estes produtos." }, { status: 409 });
      const [record] = await db.select({
        id: prescriptions.id,
        approvedItemsJson: prescriptions.approvedItemsJson,
        expiresAt: prescriptions.expiresAt,
        retainUntil: prescriptions.retainUntil,
      }).from(prescriptions).where(and(
        eq(prescriptions.id, prescriptionId),
        eq(prescriptions.customerEmail, email),
        eq(prescriptions.status, "approved"),
      )).limit(1);
      if (!record?.expiresAt || record.expiresAt <= now || record.retainUntil <= now || !record.approvedItemsJson) return Response.json({ error: "A receita informada não está válida." }, { status: 409 });
      let approvedItems: ApprovedPrescriptionItem[];
      try {
        approvedItems = JSON.parse(record.approvedItemsJson) as ApprovedPrescriptionItem[];
      } catch {
        return Response.json({ error: "A autorização clínica está inconsistente. Solicite nova análise." }, { status: 409 });
      }
      if (!prescriptionCovers(regulatedLines.map((line) => ({ productId: line.product.id, quantity: line.quantity })), approvedItems)) return Response.json({ error: "A receita não cobre todos os produtos ou quantidades deste pedido." }, { status: 409 });
      const [used] = await db.select({ id: prescriptionUsages.prescriptionId }).from(prescriptionUsages).where(eq(prescriptionUsages.prescriptionId, prescriptionId)).limit(1);
      if (used) return Response.json({ error: "Esta receita já foi vinculada a outro pedido." }, { status: 409 });
    }

    const subtotalCents = typedLines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);
    const coupon = cleanText(payload.coupon, 24).toUpperCase();
    let discountCents = 0;
    let discountId: string | null = null;
    if (coupon) {
      const [discount] = await db.select().from(discounts).where(and(eq(discounts.code, coupon), eq(discounts.isActive, true))).limit(1);
      const activeNow = discount && (!discount.startsAt || discount.startsAt <= now) && (!discount.endsAt || discount.endsAt >= now);
      if (!activeNow || !discount || subtotalCents < discount.minSubtotalCents) return Response.json({ error: "Cupom inválido, expirado ou fora das condições." }, { status: 409 });
      const [redeemed] = await db.select({ orderId: discountRedemptions.orderId }).from(discountRedemptions).where(and(eq(discountRedemptions.discountId, discount.id), eq(discountRedemptions.customerEmail, email))).limit(1);
      if (redeemed) return Response.json({ error: "Este cupom já foi utilizado pela sua conta." }, { status: 409 });
      discountId = discount.id;
      discountCents = discount.kind === "percent" ? Math.floor(subtotalCents * discount.amount / 100) : discount.amount;
      discountCents = Math.min(discountCents, subtotalCents);
    }

    const shippingCents = fulfillment === "delivery" && subtotalCents < 14900 ? 990 : 0;
    const address = fulfillment === "delivery" ? {
      cep: cleanText(payload.address?.cep, 9),
      street: cleanText(payload.address?.street, 120),
      number: cleanText(payload.address?.number, 12),
      complement: cleanText(payload.address?.complement, 60),
    } : null;
    if (fulfillment === "delivery" && (!address?.cep.match(/^\d{5}-?\d{3}$/) || !address.street || !address.number)) return Response.json({ error: "Preencha um endereço de entrega válido." }, { status: 400 });

    const id = "ES-" + crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    const serializedItems = typedLines.map(({ product, quantity }) => ({ id: product.id, name: product.name, unitPriceCents: product.priceCents, quantity }));
    const totalCents = subtotalCents - discountCents + shippingCents;
    const runtimeEnv = env as unknown as { DB?: D1Database };
    if (!runtimeEnv.DB) return Response.json({ error: "Banco indisponível." }, { status: 503 });
    const statements: D1PreparedStatement[] = [];
    for (const line of typedLines) {
      statements.push(
        runtimeEnv.DB.prepare("UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND is_active = 1 AND regulatory_status = 'approved'")
          .bind(line.quantity, now, line.product.id),
        runtimeEnv.DB.prepare("INSERT INTO order_inventory_reservations (order_id, product_id, quantity) VALUES (?, ?, CASE WHEN changes() = 1 THEN ? ELSE 0 END)")
          .bind(id, line.product.id, line.quantity),
      );
    }
    if (prescriptionId) {
      statements.push(runtimeEnv.DB.prepare("INSERT INTO prescription_usages (prescription_id, customer_email, order_id) VALUES (?, ?, ?)").bind(prescriptionId, email, id));
    }
    if (discountId) {
      statements.push(runtimeEnv.DB.prepare("INSERT INTO discount_redemptions (discount_id, customer_email, order_id) VALUES (?, ?, ?)").bind(discountId, email, id));
    }
    statements.push(
      runtimeEnv.DB.prepare("INSERT INTO orders (id, customer_email, status, fulfillment, subtotal_cents, discount_cents, shipping_cents, total_cents, prescription_id, discount_id, items_json, address_json, created_at, updated_at) VALUES (?, ?, 'awaiting_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id, email, fulfillment, subtotalCents, discountCents, shippingCents, totalCents, prescriptionId, discountId, JSON.stringify(serializedItems), address ? JSON.stringify(address) : null, now, now),
      runtimeEnv.DB.prepare("INSERT INTO audit_logs (actor_email, action, entity_type, entity_id, metadata_json) VALUES (?, 'order.create', 'order', ?, ?)")
        .bind(email, id, JSON.stringify({ fulfillment, prescriptionId, discountId })),
    );
    try {
      await runtimeEnv.DB.batch(statements);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      if (/prescription_usages|discount_redemptions|unique/i.test(detail)) return Response.json({ error: "A receita ou o cupom já foi utilizado. Atualize o pedido." }, { status: 409 });
      if (/check|stock|inventory/i.test(detail)) return Response.json({ error: "O estoque mudou enquanto você concluía o pedido. Atualize o carrinho." }, { status: 409 });
      throw error;
    }

    return Response.json({ order: { id, status: "awaiting_payment", totalCents } }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error && error.message.includes("no such table") ? "O banco ainda está sendo preparado. Tente novamente em instantes." : "Não foi possível criar o pedido.";
    return Response.json({ error: message }, { status: 500 });
  }
}
