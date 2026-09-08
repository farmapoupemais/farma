import { getSupabaseServerClient } from "@/lib/supabase";
import { catalogProducts, generateEan, type CatalogProduct, type ProductColor } from "./catalog";

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

export function extractProductMetadata(description: string = ""): {
  cleanDescription: string;
  barcode?: string;
  images: string[];
  colors: ProductColor[];
} {
  const metaRegex = /<!--FPM_META:([\s\S]*?)-->/;
  const match = description.match(metaRegex);
  let barcode: string | undefined;
  let images: string[] = [];
  let colors: ProductColor[] = [];
  let cleanDescription = description;

  if (match) {
    cleanDescription = description.replace(metaRegex, "").trim();
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.barcode) barcode = String(parsed.barcode);
      if (Array.isArray(parsed.images)) images = parsed.images;
      if (Array.isArray(parsed.colors)) colors = parsed.colors;
    } catch {
      // ignore JSON parse error
    }
  }

  return { cleanDescription, barcode, images, colors };
}

export function injectProductMetadata(
  cleanDescription: string,
  meta: { barcode?: string; images?: string[]; colors?: ProductColor[] }
): string {
  const clean = cleanDescription.replace(/<!--FPM_META:[\s\S]*?-->/g, "").trim();
  const metaPayload = JSON.stringify({
    barcode: meta.barcode || "",
    images: meta.images || [],
    colors: meta.colors || [],
  });
  return `${clean}\n\n<!--FPM_META:${metaPayload}-->`;
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  short_description?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  category: string;
  brand: string;
  barcode?: string | null;
  images?: string[] | null;
  colors?: ProductColor[] | null;
  price_cents?: number;
  priceCents?: number;
  compare_at_cents?: number | null;
  compareAtCents?: number | null;
  stock?: number;
  requires_prescription?: boolean;
  requiresPrescription?: boolean;
}

function toCatalogProductFromSupabase(row: ProductRow): CatalogProduct {
  const style = categoryStyle[row.category] ?? { tone: "teal" as const, icon: "care" as const };
  const rawDesc = row.description || "";
  const meta = extractProductMetadata(rawDesc);
  const staticFallback = catalogProducts.find((p) => p.id === row.id || p.slug === row.slug);

  const barcode = row.barcode || meta.barcode || staticFallback?.barcode || generateEan(row.id);
  const images = (Array.isArray(row.images) && row.images.length > 0)
    ? row.images
    : (meta.images.length > 0 ? meta.images : (staticFallback?.images || []));
  const colors = (Array.isArray(row.colors) && row.colors.length > 0)
    ? row.colors
    : (meta.colors.length > 0 ? meta.colors : (staticFallback?.colors || []));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description || row.shortDescription || staticFallback?.shortDescription || "",
    description: meta.cleanDescription || staticFallback?.description || "",
    category: row.category,
    brand: row.brand,
    barcode,
    images,
    colors,
    priceCents: row.price_cents ?? row.priceCents ?? staticFallback?.priceCents ?? 1000,
    compareAtCents: row.compare_at_cents ?? row.compareAtCents ?? null,
    stock: row.stock ?? staticFallback?.stock ?? 0,
    requiresPrescription: false,
    badge: (row.compare_at_cents && row.compare_at_cents > (row.price_cents ?? 0)) ? "Oferta" : staticFallback?.badge,
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

