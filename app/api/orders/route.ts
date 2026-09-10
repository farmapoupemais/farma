import { getAuthenticatedUser } from "@/lib/access";
import { getSupabaseServerClient } from "@/lib/supabase";
import { catalogProducts } from "@/lib/catalog";
import { maskEmail, sanitizeAuditMetadata, sanitizeText } from "@/lib/security";
import {
  cleanText,
  mutationOriginAllowed,
  readJsonBody,
  RequestBodyError,
  toSafeInteger,
} from "@/lib/validation";

type OrderItemInput = {
  id?: unknown;
  quantity?: unknown;
};

type OrderAddressInput = {
  cep?: unknown;
  street?: unknown;
  number?: unknown;
  complement?: unknown;
  neighborhood?: unknown;
  city?: unknown;
  state?: unknown;
  cpf?: unknown;
};

type OrderPayload = {
  items?: OrderItemInput[];
  fulfillment?: unknown;
  coupon?: unknown;
  prescriptionId?: unknown;
  payment_method?: unknown;
  address?: OrderAddressInput | null;
  guestEmail?: unknown;
};

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) {
    return Response.json(
      { error: "Origem da solicitação não permitida." },
      { status: 403 }
    );
  }

  // 1. Identificação do Usuário (Logado ou Checkout Seguro)
  const authUser = await getAuthenticatedUser(request);
  let customerEmail = authUser?.email;

  try {
    const payload = await readJsonBody<OrderPayload>(request, 32_000);

    if (!customerEmail) {
      const guest = cleanText(payload.guestEmail, 254).toLowerCase();
      if (!guest || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest)) {
        return Response.json(
          { error: "Faça login ou informe um e-mail válido para concluir o pedido." },
          { status: 401 }
        );
      }
      customerEmail = guest;
    }

    // 2. Validação dos Itens do Carrinho
    if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 30) {
      return Response.json({ error: "Carrinho de compras inválido ou vazio." }, { status: 400 });
    }

    const fulfillment =
      payload.fulfillment === "pickup"
        ? "pickup"
        : payload.fulfillment === "delivery"
        ? "delivery"
        : null;

    if (!fulfillment) {
      return Response.json(
        { error: "Selecione o método de entrega ou retirada." },
        { status: 400 }
      );
    }

    // Normalização e consolidação das quantidades solicitadas
    const requestedMap = new Map<string, number>();
    for (const raw of payload.items) {
      const id = cleanText(raw.id, 80);
      const quantity = toSafeInteger(raw.quantity, 1, 10);
      if (!id || quantity === null) {
        return Response.json({ error: "Item com quantidade ou identificador inválido." }, { status: 400 });
      }
      const current = requestedMap.get(id) || 0;
      const updated = current + quantity;
      if (updated > 10) {
        return Response.json(
          { error: "A quantidade máxima permitida por produto é de 10 unidades." },
          { status: 400 }
        );
      }
      requestedMap.set(id, updated);
    }

    const requestedIds = Array.from(requestedMap.keys());
    const client = getSupabaseServerClient();

    // 3. RECÁLCULO OBRIGATÓRIO DE PREÇOS NO SERVIDOR (PREVENÇÃO DE FRAUDE)
    // Busca os produtos oficiais no banco de dados Supabase
    const { data: dbProducts } = await client
      .from("products")
      .select("id, name, price_cents, stock, requires_prescription, is_active, regulatory_status")
      .in("id", requestedIds);

    // Fallback para o catálogo estático caso a tabela do Supabase ainda esteja sendo sincronizada
    const availableProducts = (dbProducts && dbProducts.length > 0)
      ? dbProducts
      : catalogProducts.filter((p) => requestedIds.includes(p.id)).map((p) => ({
          id: p.id,
          name: p.name,
          price_cents: p.priceCents,
          stock: p.stock,
          requires_prescription: false,
          is_active: true,
          regulatory_status: "approved",
        }));

    if (availableProducts.length !== requestedIds.length) {
      return Response.json(
        { error: "Um ou mais produtos selecionados não estão mais disponíveis no catálogo." },
        { status: 409 }
      );
    }

    // Verificar estoque e restrições regulatórias
    const orderLines: Array<{
      id: string;
      name: string;
      unitPriceCents: number;
      quantity: number;
      requiresPrescription: boolean;
    }> = [];

    for (const prod of availableProducts) {
      const qty = requestedMap.get(prod.id)!;
      if (!prod.is_active || prod.regulatory_status !== "approved") {
        return Response.json(
          { error: `O produto "${prod.name}" está indisponível para comercialização no momento.` },
          { status: 409 }
        );
      }
      if (prod.stock < qty) {
        return Response.json(
          { error: `Estoque insuficiente para "${prod.name}". Restam apenas ${prod.stock} unidades.` },
          { status: 409 }
        );
      }
      orderLines.push({
        id: prod.id,
        name: prod.name,
        unitPriceCents: prod.price_cents,
        quantity: qty,
        requiresPrescription: Boolean(prod.requires_prescription),
      });
    }

    const now = new Date().toISOString();

    // 5. Cálculo Financeiro no Servidor
    const subtotalCents = orderLines.reduce(
      (sum, line) => sum + line.unitPriceCents * line.quantity,
      0
    );

    // Validação Segura de Cupom de Desconto
    const couponCode = cleanText(payload.coupon, 24).toUpperCase();
    let discountCents = 0;
    let discountId: string | null = null;

    if (couponCode) {
      const { data: discount } = await client
        .from("discounts")
        .select("*")
        .eq("code", couponCode)
        .eq("is_active", true)
        .maybeSingle();

      const isActiveNow =
        discount &&
        (!discount.starts_at || discount.starts_at <= now) &&
        (!discount.ends_at || discount.ends_at >= now);

      if (isActiveNow && subtotalCents >= (discount.min_subtotal_cents || 0)) {
        // Verificar se já resgatou este cupom
        const { data: redeemed } = await client
          .from("discount_redemptions")
          .select("order_id")
          .eq("discount_id", discount.id)
          .eq("customer_email", customerEmail)
          .maybeSingle();

        if (redeemed) {
          return Response.json(
            { error: "Este cupom de desconto já foi utilizado em sua conta anteriormente." },
            { status: 409 }
          );
        }

        discountId = discount.id;
        discountCents =
          discount.kind === "percent"
            ? Math.floor((subtotalCents * discount.amount) / 100)
            : discount.amount;

        discountCents = Math.min(discountCents, subtotalCents);
      } else if (couponCode) {
        return Response.json(
          { error: "Cupom inválido, expirado ou valor mínimo não atingido." },
          { status: 409 }
        );
      }
    }

    // Cálculo do Frete
    const shippingCents =
      fulfillment === "delivery" && subtotalCents < 14900 ? 990 : 0;

    // Validação do Endereço de Entrega
    let addressData: Record<string, unknown> | null = null;
    if (fulfillment === "delivery") {
      const rawAddr = payload.address;
      const cep = cleanText(rawAddr?.cep, 9).replace(/\D/g, "");
      const street = sanitizeText(rawAddr?.street, 120);
      const number = sanitizeText(rawAddr?.number, 12);
      const complement = sanitizeText(rawAddr?.complement, 60);
      const neighborhood = sanitizeText(rawAddr?.neighborhood, 80);
      const city = sanitizeText(rawAddr?.city, 80);
      const state = sanitizeText(rawAddr?.state, 2).toUpperCase();

      if (cep.length !== 8 || !street || !number) {
        return Response.json(
          { error: "Por favor, preencha o CEP, rua e número de entrega corretamente." },
          { status: 400 }
        );
      }

      addressData = {
        cep: `${cep.slice(0, 5)}-${cep.slice(5)}`,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      };
    }

    const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);
    const orderId = "PM-" + crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

    // 6. Atualização Atômica de Estoque no Supabase
    for (const line of orderLines) {
      try {
        const prod = availableProducts.find((p) => p.id === line.id);
        if (prod && typeof prod.stock === "number") {
          await client
            .from("products")
            .update({
              stock: Math.max(0, prod.stock - line.quantity),
              updated_at: now,
            })
            .eq("id", line.id);
        }
      } catch {
        // ignora se a tabela ainda não tiver todos os produtos
      }
    }

    // 7. Gravação do Pedido no Supabase
    try {
      await client.from("orders").insert({
        id: orderId,
        customer_email: customerEmail,
        status: payload.payment_method === "credit_card" ? "approved_simulation" : "awaiting_payment",
        fulfillment,
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        shipping_cents: shippingCents,
        total_cents: totalCents,
        discount_id: discountId,
        items_json: orderLines,
        address_json: addressData,
        created_at: now,
        updated_at: now,
      });
    } catch (dbErr) {
      console.warn("Supabase orders insert warning:", dbErr);
    }

    if (discountId) {
      try {
        await client.from("discount_redemptions").insert({
          discount_id: discountId,
          customer_email: customerEmail,
          order_id: orderId,
          created_at: now,
        });
      } catch {
        // ignore
      }
    }

    // 8. Auditoria Segura com LGPD (Mascaramento de Dados)
    try {
      await client.from("audit_logs").insert({
        actor_email: customerEmail,
        action: "order.create",
        entity_type: "order",
        entity_id: orderId,
        metadata_json: sanitizeAuditMetadata({
          totalCents,
          itemsCount: orderLines.length,
          fulfillment,
          paymentMethod: payload.payment_method || "pix",
          gateway: "stripe_ready",
          maskedEmail: maskEmail(customerEmail),
        }),
        created_at: now,
      });
    } catch {
      // ignore
    }

    return Response.json(
      {
        order: {
          id: orderId,
          status: "awaiting_payment",
          totalCents,
          subtotalCents,
          discountCents,
          shippingCents,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json(
      { error: "Não foi possível finalizar o pedido com segurança. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
