import { getDb } from "@/db";
import { auditLogs, userRoles } from "@/db/schema";
import { authorize, roles, type Role } from "@/lib/access";
import { auditEntry } from "@/lib/audit";
import { cleanEmail, mutationOriginAllowed, readJsonBody, RequestBodyError } from "@/lib/validation";

export async function POST(request: Request) {
  if (!mutationOriginAllowed(request)) return Response.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorize("user:manage"); if (!auth.ok) return auth.response;
  try {
    const body = await readJsonBody<{ email?: unknown; role?: unknown }>(request, 8_000);
    const email = cleanEmail(body.email), role = typeof body.role === "string" && roles.includes(body.role as Role) ? body.role as Role : null;
    if (!email || !role) return Response.json({ error: "Informe um e-mail e perfil válidos." }, { status: 400 });
    if (email === auth.actor.email.toLowerCase() && role !== "owner") return Response.json({ error: "Você não pode remover seu próprio acesso de proprietário." }, { status: 409 });
    const db = getDb();
    await db.batch([
      db.insert(userRoles).values({ email, role, createdBy: auth.actor.email.toLowerCase() }).onConflictDoUpdate({ target: userRoles.email, set: { role, createdBy: auth.actor.email.toLowerCase(), updatedAt: new Date().toISOString() } }),
      db.insert(auditLogs).values(auditEntry(auth.actor.email, "user.role.assign", "user", email, { role })),
    ]);
    return Response.json({ user: { email, role } }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Não foi possível atualizar o acesso." }, { status: 500 });
  }
}
