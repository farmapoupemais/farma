import { authorize, roles, type Role } from "@/lib/access";
import { getSupabaseServerClient } from "@/lib/supabase";
import { recordAuditMutation } from "@/lib/audit-interceptor";
import { cleanEmail, mutationOriginAllowed, readJsonBody, RequestBodyError } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await authorize("user:manage", request);
  if (!auth.ok) return auth.response;

  try {
    const client = getSupabaseServerClient();
    const { data: users, error } = await client
      .from("user_roles")
      .select("email, role, created_by, updated_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return Response.json({ users: users ?? [] });
  } catch {
    return Response.json({ error: "Não foi possível carregar a equipe." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("user:manage", request);
  if (!auth.ok) return auth.response;

  try {
    const body = await readJsonBody<{ email?: unknown; role?: unknown }>(request, 8_000);
    const email = cleanEmail(body.email);
    const role = typeof body.role === "string" && roles.includes(body.role as Role) ? (body.role as Role) : null;

    if (!email || !role) {
      return Response.json({ error: "Informe um e-mail e perfil válidos." }, { status: 400 });
    }

    if (email === auth.actor.email.toLowerCase() && role !== "owner") {
      return Response.json({ error: "Você não pode remover seu próprio acesso de proprietário." }, { status: 409 });
    }

    const client = getSupabaseServerClient();
    const now = new Date().toISOString();

    const { data: existingUser } = await client
      .from("user_roles")
      .select("role")
      .eq("email", email)
      .maybeSingle();
    const oldRole = existingUser?.role || "customer";

    const { error: roleError } = await client.from("user_roles").upsert({
      email,
      role,
      created_by: auth.actor.email.toLowerCase(),
      updated_at: now,
    });

    if (roleError) throw roleError;

    // Audit log imutável de alteração de perfil RBAC
    await recordAuditMutation({
      req: request,
      category: "auth",
      action: "user.role.assign",
      resource: "users",
      resourceId: email,
      actorEmail: auth.actor.email,
      actorRole: auth.actor.role,
      oldValues: { email, role: oldRole },
      newValues: { email, role },
      status: "success",
    });

    return Response.json({ user: { email, role } }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível atualizar o acesso." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("user:manage", request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const email = cleanEmail(searchParams.get("email"));
    if (!email) return Response.json({ error: "E-mail não informado." }, { status: 400 });

    if (email === auth.actor.email.toLowerCase() || email === "raulgdc91@gmail.com") {
      return Response.json({ error: "O acesso do Proprietário não pode ser revogado." }, { status: 403 });
    }

    const client = getSupabaseServerClient();
    const { data: existingUser } = await client
      .from("user_roles")
      .select("role")
      .eq("email", email)
      .maybeSingle();

    const { error } = await client.from("user_roles").delete().eq("email", email);
    if (error) throw error;

    // Audit log imutável de revogação de perfil
    await recordAuditMutation({
      req: request,
      category: "auth",
      action: "user.role.revoke",
      resource: "users",
      resourceId: email,
      actorEmail: auth.actor.email,
      actorRole: auth.actor.role,
      oldValues: { email, role: existingUser?.role || "staff" },
      newValues: { email, role: "customer" },
      status: "success",
    });

    return Response.json({ ok: true, email });
  } catch {
    return Response.json({ error: "Erro ao revogar acesso." }, { status: 500 });
  }
}


