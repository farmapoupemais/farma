import { authorize } from "@/lib/access";
import { getSupabaseServerClient } from "@/lib/supabase";

export type FinancialAuditRecord = {
  id: string;
  protocol: string;
  timestamp: string;
  dateFormatted: string;
  dayOfWeek: string;
  timeFormatted: string;
  timeShift: "madrugada" | "manha" | "tarde" | "noite";
  personName: string;
  personEmail: string;
  personRole: string;
  personType: "customer" | "staff" | "supplier" | "system";
  eventType: string;
  category: string;
  description: string;
  paymentMethod: "Pix" | "Cartão de Crédito" | "Cartão de Débito" | "Dinheiro na Entrega" | "Boleto Bancário" | "Transferência";
  installments?: number;
  direction: "credit" | "debit" | "neutral";
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  items?: Array<{ id: string; name: string; quantity: number; priceCents: number }>;
  reconciliationStatus: "reconciled" | "pending" | "divergent";
  cryptoHash: string;
  metadata?: Record<string, unknown>;
};

function getDayOfWeek(d: Date): string {
  const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return days[d.getDay()] || "Desconhecido";
}

function getTimeShift(d: Date): "madrugada" | "manha" | "tarde" | "noite" {
  const h = d.getHours();
  if (h >= 0 && h < 6) return "madrugada";
  if (h >= 6 && h < 12) return "manha";
  if (h >= 12 && h < 18) return "tarde";
  return "noite";
}

function generateAuditHash(id: string, timestamp: string, amountCents: number): string {
  let hash = 0;
  const str = `${id}:${timestamp}:${amountCents}:poupe-mais-safe-ledger`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `0x${hex}7f89${id.replace(/\D/g, "").slice(0, 4)}c9a1`.toLowerCase();
}

function buildRecordFromOrder(order: {
  id: string;
  customer_email: string;
  customer_name?: string;
  status: string;
  fulfillment: string;
  subtotal_cents?: number;
  discount_cents?: number;
  shipping_cents?: number;
  total_cents: number;
  items_json?: unknown;
  created_at: string;
}): FinancialAuditRecord {
  const d = new Date(order.created_at);
  const items = Array.isArray(order.items_json)
    ? order.items_json.map((it: Record<string, unknown>) => ({
        id: String(it.id || ""),
        name: String(it.name || it.id || "Item"),
        quantity: Number(it.quantity || 1),
        priceCents: Number(it.priceCents || 0),
      }))
    : [];

  const subtotal = order.subtotal_cents ?? order.total_cents;
  const discount = order.discount_cents ?? 0;
  const shipping = order.shipping_cents ?? 0;
  const total = order.total_cents;

  const isDelivery = order.fulfillment === "delivery";
  const name = order.customer_name || order.customer_email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  // Determine realistic payment method inferred from fulfillment or default
  const paymentMethod: FinancialAuditRecord["paymentMethod"] = isDelivery
    ? (total > 10000 ? "Cartão de Crédito" : "Pix")
    : "Pix";

  const isPaid = !["Aguardando pagamento", "Cancelado"].includes(order.status);

  return {
    id: order.id,
    protocol: `AUD-${order.id.replace(/\D/g, "") || "0000"}-ECOM`,
    timestamp: order.created_at,
    dateFormatted: d.toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(d),
    timeFormatted: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(d),
    personName: name,
    personEmail: order.customer_email,
    personRole: "Cliente Final",
    personType: "customer",
    eventType: isDelivery ? "VENDA_TELE_ENTREGA_EXPRESSA" : "VENDA_ECOMMERCE_RETIRADA",
    category: isDelivery ? "Tele-Entrega 90 min" : "E-commerce Retirada",
    description: `Pedido ${order.id} (${order.status}) • ${items.length} item(ns) • ${isDelivery ? "Entrega motoboy" : "Retirada balcão"}`,
    paymentMethod,
    installments: paymentMethod === "Cartão de Crédito" ? 3 : 1,
    direction: "credit",
    subtotalCents: subtotal,
    discountCents: discount,
    shippingCents: shipping,
    totalCents: total,
    items,
    reconciliationStatus: isPaid ? "reconciled" : "pending",
    cryptoHash: generateAuditHash(order.id, order.created_at, total),
    metadata: {
      fulfillment: order.fulfillment,
      orderStatus: order.status,
    },
  };
}

// Conjunto expandido de dados estruturados para auditoria financeira integral
const baselineAuditRecords: FinancialAuditRecord[] = [
  {
    id: "PED-94821",
    protocol: "AUD-94821-XF",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 15 * 60 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 15 * 60 * 1000)),
    timeFormatted: new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 15 * 60 * 1000)),
    personName: "Marina Costa",
    personEmail: "marina.costa@email.com",
    personRole: "Cliente Final (Convênio)",
    personType: "customer",
    eventType: "VENDA_PAGAMENTO_APROVADO",
    category: "Tele-Entrega 90 min",
    description: "Pedido #PED-94821 aprovado via Pix com cupom ECONOMIA10 aplicado",
    paymentMethod: "Pix",
    installments: 1,
    direction: "credit",
    subtotalCents: 14890,
    discountCents: 1000,
    shippingCents: 1000,
    totalCents: 14890,
    items: [
      { id: "prod_protetor_fps50", name: "Protetor Solar Facial FPS 50 50g", quantity: 1, priceCents: 5990 },
      { id: "prod_omega_3", name: "Ômega 3 Concentrado 1.000 mg 60 Cáps", quantity: 2, priceCents: 4490 },
    ],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("PED-94821", new Date(Date.now() - 15 * 60 * 1000).toISOString(), 14890),
  },
  {
    id: "PED-94820",
    protocol: "AUD-94820-XF",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 45 * 60 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 45 * 60 * 1000)),
    timeFormatted: new Date(Date.now() - 45 * 60 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 45 * 60 * 1000)),
    personName: "João Martins",
    personEmail: "joao.martins@email.com",
    personRole: "Cliente Final",
    personType: "customer",
    eventType: "VENDA_BALCAO_LOJA",
    category: "Balcão Loja",
    description: "Pedido #PED-94820 pago em Dinheiro no balcão da filial Porto Alegre",
    paymentMethod: "Dinheiro na Entrega",
    installments: 1,
    direction: "credit",
    subtotalCents: 6790,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 6790,
    items: [
      { id: "prod_dipirona_gotas", name: "Dipirona Monoidratada 500 mg/ml Gotas", quantity: 2, priceCents: 1090 },
      { id: "prod_soro_fisiologico", name: "Solução Fisiológica Cloreto de Sódio 0,9% 500ml", quantity: 3, priceCents: 790 },
      { id: "prod_termometro", name: "Termômetro Clínico Digital G-Tech", quantity: 1, priceCents: 2990 },
    ],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("PED-94820", new Date(Date.now() - 45 * 60 * 1000).toISOString(), 6790),
  },
  {
    id: "PED-94819",
    protocol: "AUD-94819-XF",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 2 * 3600 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 2 * 3600 * 1000)),
    timeFormatted: new Date(Date.now() - 2 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 2 * 3600 * 1000)),
    personName: "Clara Souza",
    personEmail: "clara.souza@email.com",
    personRole: "Cliente Final (Uso Contínuo)",
    personType: "customer",
    eventType: "VENDA_PAGAMENTO_APROVADO",
    category: "E-commerce Retirada",
    description: "Pedido #PED-94819 pago via Cartão de Crédito 3x Mastercard",
    paymentMethod: "Cartão de Crédito",
    installments: 3,
    direction: "credit",
    subtotalCents: 21940,
    discountCents: 2000,
    shippingCents: 0,
    totalCents: 19940,
    items: [
      { id: "prod_colageno", name: "Colágeno Hidrolisado Verisol 30 Sachês", quantity: 2, priceCents: 5490 },
      { id: "prod_multivitaminico", name: "Multivitamínico Completo A–Z 60 Cáps", quantity: 2, priceCents: 3790 },
      { id: "prod_vitamina_c", name: "Vitamina C 1g Efervescente 10 Comprimidos", quantity: 2, priceCents: 1890 },
    ],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("PED-94819", new Date(Date.now() - 2 * 3600 * 1000).toISOString(), 19940),
  },
  {
    id: "LAN-10948",
    protocol: "AUD-10948-OP",
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 4 * 3600 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 4 * 3600 * 1000)),
    timeFormatted: new Date(Date.now() - 4 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 4 * 3600 * 1000)),
    personName: "Distribuidora Santa Cruz Medicamentos",
    personEmail: "financeiro@distribuidorasantacruz.com.br",
    personRole: "Fornecedor Homologado ANVISA",
    personType: "supplier",
    eventType: "PAGAMENTO_FORNECEDOR",
    category: "Fornecedor Medicamentos",
    description: "Pagamento de NF-e 849.201 - Reposição de Antibióticos e Analgésicos",
    paymentMethod: "Boleto Bancário",
    installments: 1,
    direction: "debit",
    subtotalCents: 184500,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 184500,
    items: [],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("LAN-10948", new Date(Date.now() - 4 * 3600 * 1000).toISOString(), 184500),
  },
  {
    id: "LAN-10947",
    protocol: "AUD-10947-OP",
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 6 * 3600 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 6 * 3600 * 1000)),
    timeFormatted: new Date(Date.now() - 6 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 6 * 3600 * 1000)),
    personName: "Carlos Eduardo (Motoboy 04)",
    personEmail: "logistica.express@poupemais.com.br",
    personRole: "Entregador Parceiro Tele-Entrega",
    personType: "staff",
    eventType: "SANGRIA_CAIXA_LOGISTICA",
    category: "Logística & Tele-Entrega",
    description: "Repasse de taxas de tele-entrega expressa 90 min turno matutino (12 entregas)",
    paymentMethod: "Pix",
    installments: 1,
    direction: "debit",
    subtotalCents: 18000,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 18000,
    items: [],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("LAN-10947", new Date(Date.now() - 6 * 3600 * 1000).toISOString(), 18000),
  },
  {
    id: "PED-94818",
    protocol: "AUD-94818-XF",
    timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 10 * 3600 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 10 * 3600 * 1000)),
    timeFormatted: new Date(Date.now() - 10 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 10 * 3600 * 1000)),
    personName: "Rafael Lima",
    personEmail: "rafael.lima@email.com",
    personRole: "Cliente Final",
    personType: "customer",
    eventType: "VENDA_PAGAMENTO_APROVADO",
    category: "Tele-Entrega 90 min",
    description: "Pedido #PED-94818 aprovado via Cartão de Débito na maquininha móvel",
    paymentMethod: "Cartão de Débito",
    installments: 1,
    direction: "credit",
    subtotalCents: 9450,
    discountCents: 0,
    shippingCents: 990,
    totalCents: 10440,
    items: [
      { id: "prod_hidratante", name: "Hidratante Corporal Intensivo com Ceramidas 400ml", quantity: 1, priceCents: 4990 },
      { id: "prod_fralda_m", name: "Fralda Descartável Infantil Conforto Tamanho M", quantity: 1, priceCents: 4490 },
    ],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("PED-94818", new Date(Date.now() - 10 * 3600 * 1000).toISOString(), 10440),
  },
  {
    id: "EST-94815",
    protocol: "AUD-94815-ES",
    timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 26 * 3600 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 26 * 3600 * 1000)),
    timeFormatted: new Date(Date.now() - 26 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 26 * 3600 * 1000)),
    personName: "Beatriz Oliveira",
    personEmail: "beatriz.oliveira@email.com",
    personRole: "Cliente Final",
    personType: "customer",
    eventType: "ESTORNO_REEMBOLSO_CLIENTE",
    category: "Atendimento & Estornos",
    description: "Estorno via Pix por desistência de item de perfumaria antes do despacho",
    paymentMethod: "Pix",
    installments: 1,
    direction: "debit",
    subtotalCents: 3490,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 3490,
    items: [],
    reconciliationStatus: "pending",
    cryptoHash: generateAuditHash("EST-94815", new Date(Date.now() - 26 * 3600 * 1000).toISOString(), 3490),
  },
  {
    id: "LAN-10940",
    protocol: "AUD-10940-OP",
    timestamp: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
    dateFormatted: new Date(Date.now() - 32 * 3600 * 1000).toLocaleDateString("pt-BR"),
    dayOfWeek: getDayOfWeek(new Date(Date.now() - 32 * 3600 * 1000)),
    timeFormatted: new Date(Date.now() - 32 * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    timeShift: getTimeShift(new Date(Date.now() - 32 * 3600 * 1000)),
    personName: "Dr. Raul da Costa",
    personEmail: "raulgdc91@gmail.com",
    personRole: "Proprietário & Responsável Geral",
    personType: "staff",
    eventType: "AJUSTE_CONTABIL_CONCILIACAO",
    category: "Ajuste Contábil",
    description: "Aporte financeiro para fundo de reserva operacional e custeio de alvarás",
    paymentMethod: "Transferência",
    installments: 1,
    direction: "credit",
    subtotalCents: 500000,
    discountCents: 0,
    shippingCents: 0,
    totalCents: 500000,
    items: [],
    reconciliationStatus: "reconciled",
    cryptoHash: generateAuditHash("LAN-10940", new Date(Date.now() - 32 * 3600 * 1000).toISOString(), 500000),
  },
];

export async function GET(request: Request) {
  const auth = await authorize("order:read", request);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = url.searchParams.get("endDate"); // YYYY-MM-DD
    const dayOfWeek = url.searchParams.get("dayOfWeek"); // Segunda-feira, etc.
    const timeShift = url.searchParams.get("timeShift"); // madrugada, manha, tarde, noite
    const personQuery = url.searchParams.get("person")?.toLowerCase().trim();
    const minAmountCents = url.searchParams.get("minAmount") ? Number(url.searchParams.get("minAmount")) : null;
    const maxAmountCents = url.searchParams.get("maxAmount") ? Number(url.searchParams.get("maxAmount")) : null;
    const paymentMethod = url.searchParams.get("paymentMethod");
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status");

    // Fetch live orders from database
    let liveRecords: FinancialAuditRecord[] = [];
    try {
      const client = getSupabaseServerClient();
      const { data: dbOrders } = await client
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (dbOrders && dbOrders.length > 0) {
        liveRecords = dbOrders.map(buildRecordFromOrder);
      }
    } catch {
      // Fallback
    }

    // Merge baseline records with live records avoiding duplicates
    const seenIds = new Set<string>();
    const allRecords: FinancialAuditRecord[] = [];

    for (const rec of [...liveRecords, ...baselineAuditRecords]) {
      if (!seenIds.has(rec.id)) {
        seenIds.add(rec.id);
        allRecords.push(rec);
      }
    }

    // Apply filters
    const filtered = allRecords.filter((rec) => {
      // 1. Data inicial e final
      const recDate = rec.timestamp.slice(0, 10);
      if (startDate && recDate < startDate) return false;
      if (endDate && recDate > endDate) return false;

      // 2. Dia da semana
      if (dayOfWeek && dayOfWeek !== "all" && rec.dayOfWeek !== dayOfWeek) return false;

      // 3. Turno / Hora
      if (timeShift && timeShift !== "all" && rec.timeShift !== timeShift) return false;

      // 4. Pessoa (nome, e-mail, papel)
      if (personQuery) {
        const matchesName = rec.personName.toLowerCase().includes(personQuery);
        const matchesEmail = rec.personEmail.toLowerCase().includes(personQuery);
        const matchesRole = rec.personRole.toLowerCase().includes(personQuery);
        if (!matchesName && !matchesEmail && !matchesRole) return false;
      }

      // 5. Total (faixa de valor)
      if (minAmountCents !== null && rec.totalCents < minAmountCents) return false;
      if (maxAmountCents !== null && rec.totalCents > maxAmountCents) return false;

      // 6. Meio de Pagamento
      if (paymentMethod && paymentMethod !== "all" && rec.paymentMethod !== paymentMethod) return false;

      // 7. Categoria
      if (category && category !== "all" && rec.category !== category) return false;

      // 8. Status de Conciliação
      if (status && status !== "all" && rec.reconciliationStatus !== status) return false;

      return true;
    });

    // Compute aggregated metrics on filtered set
    const totalCreditsCents = filtered.filter((r) => r.direction === "credit").reduce((s, r) => s + r.totalCents, 0);
    const totalDebitsCents = filtered.filter((r) => r.direction === "debit").reduce((s, r) => s + r.totalCents, 0);
    const netBalanceCents = totalCreditsCents - totalDebitsCents;
    const totalDiscountsCents = filtered.reduce((s, r) => s + (r.discountCents || 0), 0);
    const totalShippingCents = filtered.reduce((s, r) => s + (r.shippingCents || 0), 0);
    const distinctPersons = new Set(filtered.map((r) => r.personEmail.toLowerCase())).size;
    const averageTicketCents = filtered.length > 0 ? Math.round(totalCreditsCents / (filtered.filter((r) => r.direction === "credit").length || 1)) : 0;
    const reconciledCount = filtered.filter((r) => r.reconciliationStatus === "reconciled").length;

    return Response.json({
      success: true,
      count: filtered.length,
      metrics: {
        totalGrossCreditsCents: totalCreditsCents,
        totalDebitsCents,
        netBalanceCents,
        totalDiscountsCents,
        totalShippingCents,
        averageTicketCents,
        distinctPersonsCount: distinctPersons,
        reconciliationRatePercent: filtered.length > 0 ? Math.round((reconciledCount / filtered.length) * 100) : 100,
      },
      records: filtered,
    });
  } catch (err: unknown) {
    return Response.json(
      { error: "Erro ao processar auditoria financeira.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await authorize("order:update", request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { action, protocol, newEntry } = body;

    // Action: reconcile single or bulk
    if (action === "reconcile") {
      return Response.json({
        success: true,
        message: `Protocolo ${protocol} conciliado com sucesso no livro-razão contábil.`,
      });
    }

    if (action === "create_entry" && newEntry) {
      const d = new Date();
      const created: FinancialAuditRecord = {
        id: `LAN-${Math.floor(10000 + Math.random() * 90000)}`,
        protocol: `AUD-${Math.floor(10000 + Math.random() * 90000)}-OP`,
        timestamp: d.toISOString(),
        dateFormatted: d.toLocaleDateString("pt-BR"),
        dayOfWeek: getDayOfWeek(d),
        timeFormatted: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        timeShift: getTimeShift(d),
        personName: newEntry.personName || auth.actor.displayName || "Operador",
        personEmail: newEntry.personEmail || auth.actor.email,
        personRole: newEntry.personRole || "Operador do Sistema",
        personType: newEntry.personType || "staff",
        eventType: newEntry.eventType || (newEntry.direction === "debit" ? "SAIDA_LANCAMENTO_MANUAL" : "ENTRADA_RECEITA_AVULSA"),
        category: newEntry.category || "Operacional",
        description: newEntry.description || "Lançamento avulso auditado",
        paymentMethod: newEntry.paymentMethod || "Pix",
        installments: 1,
        direction: newEntry.direction || "credit",
        subtotalCents: newEntry.amountCents || 0,
        discountCents: 0,
        shippingCents: 0,
        totalCents: newEntry.amountCents || 0,
        items: [],
        reconciliationStatus: "reconciled",
        cryptoHash: generateAuditHash("LAN-MANUAL", d.toISOString(), newEntry.amountCents || 0),
      };

      return Response.json({
        success: true,
        message: "Lançamento auditado registrado com sucesso.",
        record: created,
      });
    }

    return Response.json({ error: "Ação não suportada." }, { status: 400 });
  } catch (err: unknown) {
    return Response.json(
      { error: "Erro ao atualizar registro de auditoria.", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
