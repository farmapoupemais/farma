import { authorize } from "@/lib/access";
import { getSupabaseServerClient } from "@/lib/supabase";
import { catalogProducts, generateEan, type ProductColor } from "@/lib/catalog";
import { extractProductMetadata, injectProductMetadata } from "@/lib/products-repository";
import {
  cleanSlug,
  cleanText,
  mutationOriginAllowed,
  readJsonBody,
  RequestBodyError,
  toSafeInteger,
} from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await authorize("catalog:write", request);
  if (!auth.ok) return auth.response;

  try {
    const client = getSupabaseServerClient();
    const { data: rows, error } = await client
      .from("products")
      .select("id, slug, name, brand, category, description, short_description, price_cents, compare_at_cents, stock, regulatory_status, is_active")
      .order("name", { ascending: true })
      .limit(250);

    if (error) throw error;

    const formatted = (rows && rows.length > 0)
      ? rows.map((p) => {
          const meta = extractProductMetadata(p.description || "");
          const staticFallback = catalogProducts.find((item) => item.id === p.id || item.slug === p.slug);
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            brand: p.brand,
            category: p.category,
            barcode: meta.barcode || staticFallback?.barcode || generateEan(p.id),
            images: meta.images.length > 0 ? meta.images : (staticFallback?.images || []),
            colors: meta.colors.length > 0 ? meta.colors : (staticFallback?.colors || []),
            shortDescription: p.short_description || staticFallback?.shortDescription || "",
            description: meta.cleanDescription || p.description || "",
            priceCents: p.price_cents,
            compareAtCents: p.compare_at_cents,
            stock: p.stock,
            regulatoryStatus: "approved",
            isActive: p.is_active,
          };
        })
      : catalogProducts.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          brand: p.brand,
          category: p.category,
          barcode: p.barcode || generateEan(p.id),
          images: p.images || [],
          colors: p.colors || [],
          shortDescription: p.shortDescription,
          description: p.description,
          priceCents: p.priceCents,
          compareAtCents: p.compareAtCents ?? null,
          stock: p.stock,
          regulatoryStatus: "approved",
          isActive: true,
        }));

    return Response.json(
      { products: formatted },
      { headers: { "cache-control": "private, no-store" } }
    );
  } catch {
    return Response.json({ error: "Não foi possível carregar o catálogo." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("catalog:write", request);
  if (!auth.ok) return auth.response;

  try {
    const body = await readJsonBody<Record<string, unknown>>(request, 32_000);
    const customId = cleanText(body.id, 80);
    const name = cleanText(body.name, 120);
    const slug = cleanSlug(body.slug);
    const brand = cleanText(body.brand, 80);
    const category = cleanText(body.category, 80);
    const shortDescription = cleanText(body.shortDescription, 180);
    const description = cleanText(body.description, 4000);
    const priceCents = toSafeInteger(body.priceCents, 1, 10_000_000);
    const compareAtCents = body.compareAtCents ? toSafeInteger(body.compareAtCents, 1, 10_000_000) : null;
    const stock = toSafeInteger(body.stock, 0, 1_000_000);
    const barcode = cleanText(body.barcode, 40) || generateEan(customId || slug);

    // Múltiplas fotos ("quantas fotos quiser")
    const rawImages = Array.isArray(body.images) ? body.images : [];
    const images = rawImages
      .map((img) => String(img).trim())
      .filter((img) => img.length > 5 && (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/")));

    // Cores disponíveis
    const rawColors = Array.isArray(body.colors) ? (body.colors as ProductColor[]) : [];
    const colors = rawColors.filter((c) => c && typeof c.name === "string" && typeof c.hex === "string");

    if (!name || !slug || !brand || !category || !shortDescription || !description || priceCents === null || stock === null) {
      return Response.json({ error: "Revise os campos obrigatórios." }, { status: 400 });
    }

    const id = customId || `prod_${crypto.randomUUID()}`;
    const client = getSupabaseServerClient();
    const now = new Date().toISOString();

    const descriptionWithMeta = injectProductMetadata(description, { barcode, images, colors });

    const { error: insertError } = await client.from("products").insert({
      id,
      slug,
      name,
      brand,
      category,
      short_description: shortDescription,
      description: descriptionWithMeta,
      price_cents: priceCents,
      compare_at_cents: compareAtCents,
      stock,
      requires_prescription: false,
      regulatory_status: "approved",
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    if (insertError) throw insertError;

    // Audit log
    await client.from("audit_logs").insert({
      actor_email: auth.actor.email.toLowerCase(),
      action: "product.create",
      entity_type: "product",
      entity_id: id,
      metadata_json: { slug, name, barcode, imagesCount: images.length, colorsCount: colors.length },
      created_at: now,
    });

    return Response.json(
      {
        product: {
          id,
          slug,
          name,
          brand,
          category,
          barcode,
          images,
          colors,
          shortDescription,
          description,
          priceCents,
          compareAtCents,
          stock,
          regulatoryStatus: "approved",
          isActive: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    const conflict = error instanceof Error && /unique|constraint/i.test(error.message);
    return Response.json({ error: conflict ? "Já existe um produto com este slug ou ID." : "Não foi possível salvar o produto." }, { status: conflict ? 409 : 500 });
  }
}

export async function PATCH(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("catalog:write", request);
  if (!auth.ok) return auth.response;

  try {
    const body = await readJsonBody<Record<string, unknown>>(request, 32_000);
    const id = cleanText(body.id, 80);
    if (!id) return Response.json({ error: "ID do produto é obrigatório." }, { status: 400 });

    const client = getSupabaseServerClient();

    // Check if it's a quick stock delta
    if (typeof body.deltaStock === "number") {
      const delta = Number(body.deltaStock);
      const { data: current, error: fetchErr } = await client
        .from("products")
        .select("stock, name")
        .eq("id", id)
        .single();

      if (fetchErr || !current) {
        return Response.json({ error: "Produto não encontrado." }, { status: 404 });
      }

      const newStock = Math.max(0, (current.stock ?? 0) + delta);
      const { error: updateErr } = await client
        .from("products")
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateErr) throw updateErr;

      return Response.json({ id, stock: newStock });
    }

    // Full edit
    const { data: currentProduct } = await client
      .from("products")
      .select("description, short_description, brand, category")
      .eq("id", id)
      .maybeSingle();

    const currentMeta = extractProductMetadata(currentProduct?.description || "");

    const barcode = body.barcode !== undefined ? cleanText(body.barcode, 40) : currentMeta.barcode;
    const rawImages = Array.isArray(body.images) ? body.images : currentMeta.images;
    const images = rawImages
      .map((img) => String(img).trim())
      .filter((img) => img.length > 5 && (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/")));
    const colors = Array.isArray(body.colors) ? (body.colors as ProductColor[]) : currentMeta.colors;

    const baseDescription = body.description !== undefined
      ? cleanText(body.description, 4000)
      : currentMeta.cleanDescription;

    const finalDescription = injectProductMetadata(baseDescription, {
      barcode: barcode || undefined,
      images,
      colors,
    });

    const updates: Record<string, unknown> = {
      description: finalDescription,
      requires_prescription: false,
      regulatory_status: "approved",
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = cleanText(body.name, 120);
    if (body.slug !== undefined) updates.slug = cleanSlug(body.slug);
    if (body.brand !== undefined) updates.brand = cleanText(body.brand, 80);
    if (body.category !== undefined) updates.category = cleanText(body.category, 80);
    if (body.shortDescription !== undefined) updates.short_description = cleanText(body.shortDescription, 180);
    if (body.priceCents !== undefined) updates.price_cents = toSafeInteger(body.priceCents, 1, 10_000_000);
    if (body.compareAtCents !== undefined) updates.compare_at_cents = body.compareAtCents ? toSafeInteger(body.compareAtCents, 1, 10_000_000) : null;
    if (body.stock !== undefined) updates.stock = toSafeInteger(body.stock, 0, 1_000_000);
    if (body.isActive !== undefined) updates.is_active = Boolean(body.isActive);

    const { error: updateError } = await client
      .from("products")
      .update(updates)
      .eq("id", id);

    if (updateError) throw updateError;

    // Audit log
    await client.from("audit_logs").insert({
      actor_email: auth.actor.email.toLowerCase(),
      action: "product.update",
      entity_type: "product",
      entity_id: id,
      metadata_json: { ...updates, barcode, imagesCount: images.length, colorsCount: colors.length },
      created_at: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      product: {
        id,
        ...updates,
        barcode,
        images,
        colors,
        description: baseDescription,
      },
    });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Erro ao atualizar produto." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("catalog:write", request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "ID do produto não informado." }, { status: 400 });

    const client = getSupabaseServerClient();
    const { error } = await client.from("products").delete().eq("id", id);
    if (error) throw error;

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Erro ao excluir o produto." }, { status: 500 });
  }
}



