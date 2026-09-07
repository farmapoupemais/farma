import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { userRoles } from "@/db/schema";
import { can, isRole, type Permission, type Role } from "@/lib/permissions";
import { supabase } from "@/lib/supabase";

export { can, roles, type Permission, type Role } from "@/lib/permissions";

export async function resolveRole(email: string): Promise<Role> {
  const runtimeEnv = env as unknown as { PHARMACY_OWNER_EMAIL?: string };
  if (
    runtimeEnv.PHARMACY_OWNER_EMAIL &&
    runtimeEnv.PHARMACY_OWNER_EMAIL.toLowerCase() === email.toLowerCase()
  ) {
    return "owner";
  }

  if (supabase) {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("email", email.toLowerCase())
        .limit(1)
        .maybeSingle();

      if (data && isRole(data.role)) {
        return data.role;
      }
    } catch {
      // fallback to D1 or customer
    }
  }

  try {
    const [record] = await getDb()
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.email, email.toLowerCase()))
      .limit(1);
    return record && isRole(record.role) ? record.role : "customer";
  } catch {
    return "customer";
  }
}

export type AuthorizedActor = {
  email: string;
  displayName: string;
  role: Role;
};

export async function authorize(permission: Permission): Promise<
  | { ok: true; actor: AuthorizedActor }
  | { ok: false; response: Response }
> {
  const user = await getChatGPTUser();
  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: "Autenticação necessária." }, { status: 401 }),
    };
  }

  const role = await resolveRole(user.email);
  if (!can(role, permission)) {
    return {
      ok: false,
      response: Response.json({ error: "Você não tem permissão para esta ação." }, { status: 403 }),
    };
  }

  return {
    ok: true,
    actor: { email: user.email, displayName: user.displayName, role },
  };
}
