import { authorize } from "@/lib/access";
import { getSupabaseServerClient } from "@/lib/supabase";

export type AdminOrder = {
  id: string;
  customer_email: string;
  customer_name?: string;
  status: string;
  fulfillment: string;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  items_json: Array<{ id: string; name?: string; quantity: number; priceCents?: number }>;
  address_json?: { street?: string; city?: string; state?: string; zip?: string } | null;
  created_at: string;
};

const demoSeedOrders: AdminOrder[] = [
  {
    id: "PED-94821",
    customer_email: "marina.costa@email.com",
    customer_name: "Marina Costa",
    status: "Separando",
    fulfillment: "delivery",
    subtotal_cents: 14890,
    discount_cents: 1000,
    shipping_cents: 1000,
    total_cents: 14890,
    items_json: [
      { id: "prod_protetor_fps50", name: "Protetor Solar FPS 50", quantity: 1, priceCents: 5990 },
      { id: "prod_omega_3", name: "Ômega 3 1.000 mg", quantity: 2, priceCents: 4490 },
    ],
    address_json: { street: "Rua das Flores, 120, Apto 32", city: "São Paulo", state: "SP", zip: "01310-100" },
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "PED-94820",
    customer_email: "joao.martins@email.com",
    customer_name: "João Martins",
    status: "Aguardando receita",
    fulfillment: "pickup",
    subtotal_cents: 6790,
    discount_cents: 0,
    shipping_cents: 0,
    total_cents: 6790,
    items_json: [
      { id: "prod_dipirona_gotas", name: "Dipirona 500 mg/ml", quantity: 2, priceCents: 1090 },
      { id: "prod_soro_fisiologico", name: "Solução Fisiológica 0,9%", quantity: 3, priceCents: 790 },
      { id: "prod_termometro", name: "Termômetro Digital", quantity: 1, priceCents: 2990 },
    ],
    address_json: null,
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "PED-94819",
    customer_email: "clara.souza@email.com",
    customer_name: "Clara Souza",
    status: "Pronto para retirada",
    fulfillment: "pickup",
    subtotal_cents: 21940,
    discount_cents: 2000,
    shipping_cents: 0,
    total_cents: 19940,
    items_json: [
      { id: "prod_colageno", name: "Colágeno Hidrolisado", quantity: 2, priceCents: 5490 },
      { id: "prod_multivitaminico", name: "Multivitamínico A–Z", quantity: 2, priceCents: 3790 },
      { id: "prod_vitamina_c", name: "Vitamina C 1 g", quantity: 2, priceCents: 1890 },
    ],
    address_json: null,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "PED-94818",
    customer_email: "rafael.lima@email.com",
    customer_name: "Rafael Lima",
    status: "Em rota",
    fulfillment: "delivery",
    subtotal_cents: 9450,
    discount_cents: 0,
    shipping_cents: 990,
    total_cents: 10440,
    items_json: [
      { id: "prod_hidratante", name: "Hidratante com Ceramidas", quantity: 1, priceCents: 4990 },
      { id: "prod_fralda_m", name: "Fralda Conforto M", quantity: 1, priceCents: 4490 },
    ],
    address_json: { street: "Av. Paulista, 1500, Bloco B", city: "São Paulo", state: "SP", zip: "01311-200" },
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
];

export async function GET(request: Request) {
  const auth = await authorize("order:update", request);
  if (!auth.ok) return auth.response;

  try {
    const client = getSupabaseServerClient();
    const { data: rows, error } = await client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    if (rows && rows.length > 0) {
      return Response.json({ orders: rows });
    }

    return Response.json({ orders: demoSeedOrders });
  } catch {
    return Response.json({ orders: demoSeedOrders });
  }
}
