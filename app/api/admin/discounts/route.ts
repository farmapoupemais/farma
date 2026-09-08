import { authorize } from "@/lib/access";
import { getSupabaseServerClient } from "@/lib/supabase";
import { cleanText, mutationOriginAllowed, readJsonBody, RequestBodyError, toSafeInteger } from "@/lib/validation";

export async function GET() {
  try {
    const client = getSupabaseServerClient();
    const { data: rows, error } = await client
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Response.json({ discounts: rows ?? [] });
  } catch {
    return Response.json({ error: "Não foi possível carregar os descontos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("discount:write", request);
  if (!auth.ok) return auth.response;

  try {
    const body = await readJsonBody<Record<string, unknown>>(request, 12_000);
    const name = cleanText(body.name, 80);
    const code = cleanText(body.code, 24).toUpperCase();
    const kind = body.kind === "fixed" ? "fixed" : body.kind === "percent" ? "percent" : "";
    const amount = toSafeInteger(body.amount, 1, kind === "percent" ? 100 : 1_000_000);
    const minSubtotalCents = toSafeInteger(body.minSubtotalCents ?? 0, 0, 10_000_000);

    if (!name || !/^[A-Z0-9_-]{3,24}$/.test(code) || !kind || amount === null || minSubtotalCents === null) {
      return Response.json({ error: "Revise os dados do desconto." }, { status: 400 });
    }

    const id = `discount_${crypto.randomUUID()}`;
    const client = getSupabaseServerClient();
    const now = new Date().toISOString();

    const { error: insertError } = await client.from("discounts").insert({
      id,
      name,
      code,
      kind,
      amount,
      min_subtotal_cents: minSubtotalCents,
      is_active: true,
      created_at: now,
    });

    if (insertError) throw insertError;

    // Audit log
    await client.from("audit_logs").insert({
      actor_email: auth.actor.email.toLowerCase(),
      action: "discount.create",
      entity_type: "discount",
      entity_id: id,
      metadata_json: { code, kind },
      created_at: now,
    });

    return Response.json({ discount: { id, code } }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    const conflict = error instanceof Error && /unique|constraint/i.test(error.message);
    return Response.json({ error: conflict ? "Este código já existe." : "Não foi possível salvar o desconto." }, { status: conflict ? 409 : 500 });
  }
}

export async function PATCH(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("discount:write", request);
  if (!auth.ok) return auth.response;

  try {
    const body = await readJsonBody<{ id?: unknown; isActive?: unknown }>(request, 4_000);
    const id = cleanText(body.id, 80);
    if (!id) return Response.json({ error: "ID do desconto é obrigatório." }, { status: 400 });

    const client = getSupabaseServerClient();
    const isActive = Boolean(body.isActive);

    const { error } = await client
      .from("discounts")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) throw error;

    return Response.json({ ok: true, id, isActive });
  } catch {
    return Response.json({ error: "Erro ao atualizar desconto." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("discount:write", request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "ID do desconto não informado." }, { status: 400 });

    const client = getSupabaseServerClient();
    const { error } = await client.from("discounts").delete().eq("id", id);
    if (error) throw error;

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Erro ao excluir desconto." }, { status: 500 });
  }
}


