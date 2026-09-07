import { getSupabaseServerClient } from "@/lib/supabase";
import { catalogProducts, type CatalogProduct } from "./catalog";

const categoryStyle: Record<string, Pick<CatalogProduct, "tone" | "icon">> = {
  Medicamentos: { tone: "teal", icon: "capsule" },
  Dermocosméticos: { tone: "sand", icon: "sun" },
  Vitaminas: { tone: "coral", icon: "spark" },
  "Mamãe e bebê": { tone: "blue", icon: "baby" },
  "Cuidados pessoais": { tone: "mint", icon: "heart" },
  "Saúde e bem-estar": { tone: "plum", icon: "thermo" },
  "Primeiros socorros": { tone: "teal", icon: "care" },
  "Higiene oral": { tone: "blue", icon: "spark" },
};

function toCatalogProductFromSupabase(row: any): CatalogProduct {
  const style = categoryStyle[row.category] ?? { tone: "teal" as const, icon: "care" as const };
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description || row.shortDescription || "",
    description: row.description || "",
    category: row.category,
    brand: row.brand,
    priceCents: row.price_cents ?? row.priceCents,
    compareAtCents: row.compare_at_cents ?? row.compareAtCents ?? null,
    stock: row.stock ?? 0,
    requiresPrescription: Boolean(row.requires_prescription ?? row.requiresPrescription),
    badge: (row.compare_at_cents && row.compare_at_cents > row.price_cents) ? "Oferta" : undefined,
    ...style,
  };
}

export async function getVisibleProducts(): Promise<CatalogProduct[]> {
  try {
    const client = getSupabaseServerClient();
    const { data: rows, error } = await client
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (!error && rows && rows.length > 0) {
      return rows.map(toCatalogProductFromSupabase);
    }
  } catch {
    // Fallback to static catalog below
  }
  return catalogProducts;
}

export async function getVisibleProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  try {
    const client = getSupabaseServerClient();
    const { data: row, error } = await client
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && row) {
      return toCatalogProductFromSupabase(row);
    }
  } catch {
    // Fallback below
  }
  return catalogProducts.find((product) => product.slug === slug);
}

export async function getOrderableProducts(ids: string[]): Promise<CatalogProduct[]> {
  if (!ids.length) return [];
  try {
    const client = getSupabaseServerClient();
    const { data: rows, error } = await client
      .from("products")
      .select("*")
      .in("id", ids)
      .eq("is_active", true)
      .eq("regulatory_status", "approved");

    if (!error && rows && rows.length > 0) {
      return rows.map(toCatalogProductFromSupabase);
    }
  } catch {
    // Fallback below
  }
  return catalogProducts.filter((p) => ids.includes(p.id));
}

