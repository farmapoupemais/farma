import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
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

function toCatalogProduct(row: typeof products.$inferSelect): CatalogProduct {
  const style = categoryStyle[row.category] ?? { tone: "teal" as const, icon: "care" as const };
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    description: row.description,
    category: row.category,
    brand: row.brand,
    priceCents: row.priceCents,
    compareAtCents: row.compareAtCents,
    stock: row.stock,
    requiresPrescription: row.requiresPrescription,
    badge: row.compareAtCents && row.compareAtCents > row.priceCents ? "Oferta" : undefined,
    ...style,
  };
}

export async function getVisibleProducts(): Promise<CatalogProduct[]> {
  try {
    const rows = await getDb().select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.name));
    return rows.length ? rows.map(toCatalogProduct) : catalogProducts;
  } catch {
    return catalogProducts;
  }
}

export async function getVisibleProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  try {
    const [row] = await getDb().select().from(products).where(eq(products.slug, slug)).limit(1);
    if (row?.isActive) return toCatalogProduct(row);
  } catch {
    // Build-time and migration-safe fallback below.
  }
  return catalogProducts.find((product) => product.slug === slug);
}

export async function getOrderableProducts(ids: string[]): Promise<CatalogProduct[]> {
  if (!ids.length) return [];
  const rows = await getDb()
    .select()
    .from(products)
    .where(and(inArray(products.id, ids), eq(products.isActive, true), eq(products.regulatoryStatus, "approved")));
  return rows.map(toCatalogProduct);
}
