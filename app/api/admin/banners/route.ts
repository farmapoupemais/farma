import { authorize } from "@/lib/access";
import { getSupabaseServerClient } from "@/lib/supabase";
import { cleanText, mutationOriginAllowed, readJsonBody, RequestBodyError, safeInternalPath } from "@/lib/validation";

export async function GET() {
  try {
    const client = getSupabaseServerClient();
    const { data: rows, error } = await client
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Response.json({ banners: rows ?? [] });
  } catch {
    return Response.json({ error: "Não foi possível carregar os banners." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("banner:write", request);
  if (!auth.ok) return auth.response;

  try {
    const body = await readJsonBody<Record<string, unknown>>(request, 12_000);
    const title = cleanText(body.title, 100);
    const subtitle = cleanText(body.subtitle, 180);
    const ctaLabel = cleanText(body.ctaLabel, 40);
    const ctaHref = safeInternalPath(body.ctaHref, "/catalogo");

    if (!title || !subtitle || !ctaLabel) {
      return Response.json({ error: "Preencha os campos do banner." }, { status: 400 });
    }

    const id = `banner_${crypto.randomUUID()}`;
    const client = getSupabaseServerClient();
    const now = new Date().toISOString();

    const { error: insertError } = await client.from("banners").insert({
      id,
      title,
      subtitle,
      cta_label: ctaLabel,
      cta_href: ctaHref,
      tone: "sage",
      is_active: true,
      created_at: now,
    });

    if (insertError) throw insertError;

    // Audit log
    await client.from("audit_logs").insert({
      actor_email: auth.actor.email.toLowerCase(),
      action: "banner.create",
      entity_type: "banner",
      entity_id: id,
      created_at: now,
    });

    return Response.json({ banner: { id, title } }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível salvar o banner." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("banner:write", request);
  if (!auth.ok) return auth.response;

  try {
    const body = await readJsonBody<{ id?: unknown; isActive?: unknown }>(request, 4_000);
    const id = cleanText(body.id, 80);
    if (!id) return Response.json({ error: "ID do banner é obrigatório." }, { status: 400 });

    const client = getSupabaseServerClient();
    const isActive = Boolean(body.isActive);

    const { error } = await client
      .from("banners")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) throw error;

    return Response.json({ ok: true, id, isActive });
  } catch {
    return Response.json({ error: "Erro ao atualizar banner." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("banner:write", request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "ID do banner não informado." }, { status: 400 });

    const client = getSupabaseServerClient();
    const { error } = await client.from("banners").delete().eq("id", id);
    if (error) throw error;

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Erro ao excluir banner." }, { status: 500 });
  }
}


