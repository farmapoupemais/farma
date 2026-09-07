import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, products } from "@/db/schema";
import { authorize } from "@/lib/access";
import { auditEntry } from "@/lib/audit";
import { cleanSlug, cleanText, mutationOriginAllowed, readJsonBody, RequestBodyError, toSafeInteger } from "@/lib/validation";

export async function GET() {
  const auth = await authorize("catalog:write");
  if (!auth.ok) return auth.response;

  try {
    const rows = await getDb()
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        brand: products.brand,
        category: products.category,
        priceCents: products.priceCents,
        stock: products.stock,
        regulatoryStatus: products.regulatoryStatus,
        isActive: products.isActive,
      })
      .from(products)
      .orderBy(asc(products.name))
      .limit(250);

    return Response.json(
      { products: rows },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch {
    return Response.json({ error: "Não foi possível carregar o catálogo." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("catalog:write"); if (!auth.ok) return auth.response;
  try {
    const body = await readJsonBody<Record<string, unknown>>(request, 24_000);
    const name = cleanText(body.name, 120), slug = cleanSlug(body.slug), brand = cleanText(body.brand, 80), category = cleanText(body.category, 80), shortDescription = cleanText(body.shortDescription, 180), description = cleanText(body.description, 2000);
    const priceCents = toSafeInteger(body.priceCents, 1, 10_000_000), compareAtCents = body.compareAtCents ? toSafeInteger(body.compareAtCents, 1, 10_000_000) : null, stock = toSafeInteger(body.stock, 0, 1_000_000);
    if (!name || !slug || !brand || !category || !shortDescription || !description || priceCents === null || stock === null) return Response.json({ error: "Revise os campos obrigatórios." }, { status: 400 });
    const id = `prod_${crypto.randomUUID()}`;
    const db = getDb();
    const [created] = await db.batch([
      db.insert(products).values({ id, slug, name, brand, category, shortDescription, description, priceCents, compareAtCents, stock, requiresPrescription: true, regulatoryStatus: "pending_review", isActive: false }).returning({ id: products.id, slug: products.slug, regulatoryStatus: products.regulatoryStatus }),
      db.insert(auditLogs).values(auditEntry(auth.actor.email, "product.create.pending_regulatory_review", "product", id, { slug })),
    ]);
    return Response.json({ product: created[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    const conflict = error instanceof Error && /unique|constraint/i.test(error.message);
    return Response.json({ error: conflict ? "Já existe um produto com este slug." : "Não foi possível salvar o produto." }, { status: conflict ? 409 : 500 });
  }
}
