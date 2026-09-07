import { getChatGPTUser } from "@/app/chatgpt-auth";
import { can, isRole, type Permission, type Role } from "@/lib/permissions";
import { getSupabaseServerClient, supabase } from "@/lib/supabase";

export { can, roles, type Permission, type Role } from "@/lib/permissions";

export async function resolveRole(email: string): Promise<Role> {
  const normalizedEmail = email.toLowerCase().trim();

  // Environment override or designated owner
  const ownerEnv = (
    process.env.PHARMACY_OWNER_EMAIL || "raulgdc91@gmail.com"
  ).toLowerCase().trim();
  if (normalizedEmail === ownerEnv) {
    return "owner";
  }


  const client = getSupabaseServerClient();
  if (client) {
    try {
      const { data } = await client
        .from("user_roles")
        .select("role")
        .eq("email", normalizedEmail)
        .limit(1)
        .maybeSingle();

      if (data && isRole(data.role)) {
        return data.role;
      }

      // Check if user_roles has any records. If completely empty, the very first user is the OWNER!
      const { count } = await client
        .from("user_roles")
        .select("*", { count: "exact", head: true });

      if (count === 0 || count === null) {
        // Automatically designate first user as Owner
        await client.from("user_roles").upsert({
          email: normalizedEmail,
          role: "owner",
          created_by: "system",
        });
        return "owner";
      }
    } catch {
      // Supabase query error fallback
    }
  }

  return "customer";
}

export type AuthorizedActor = {
  email: string;
  displayName: string;
  role: Role;
};

export async function authorize(
  permission: Permission,
  request?: Request
): Promise<
  | { ok: true; actor: AuthorizedActor }
  | { ok: false; response: Response }
> {
  let email: string | null = null;
  let displayName: string | null = null;

  // 1. Try Supabase Auth via Bearer token in Request Header
  if (request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token) {
        try {
          const client = getSupabaseServerClient(token);
          const { data, error } = await client.auth.getUser(token);
          if (data?.user && !error) {
            email = data.user.email ?? null;
            displayName =
              (data.user.user_metadata?.full_name as string) ||
              email?.split("@")[0] ||
              "Usuário";
          }
        } catch {
          // invalid token
        }
      }
    }
  }

  // 2. Fallback to ChatGPT Auth header if present
  if (!email) {
    const chatGPTUser = await getChatGPTUser();
    if (chatGPTUser) {
      email = chatGPTUser.email;
      displayName = chatGPTUser.displayName;
    }
  }

  if (!email) {
    return {
      ok: false,
      response: Response.json(
        { error: "Autenticação necessária. Faça login para continuar." },
        { status: 401 }
      ),
    };
  }

  const role = await resolveRole(email);
  if (!can(role, permission)) {
    return {
      ok: false,
      response: Response.json(
        { error: "Você não tem permissão para esta ação." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    actor: { email, displayName: displayName || email, role },
  };
}

