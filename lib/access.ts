import { getChatGPTUser } from "@/app/chatgpt-auth";
import { can, isRole, type Permission, type Role } from "@/lib/permissions";
import { getSupabaseServerClient, supabase } from "@/lib/supabase";

export { can, roles, type Permission, type Role } from "@/lib/permissions";

export async function resolveRole(email: string): Promise<Role> {
  const normalizedEmail = email.toLowerCase().trim();

  // Designated owners
  const owners = new Set([
    (process.env.PHARMACY_OWNER_EMAIL || "raulgdc91@gmail.com").toLowerCase().trim(),
    "raulgdc91@gmail.com",
    "farmapoupemais@proton.me",
    "farmapoupemais.admin349@gmail.com",
  ]);
  if (owners.has(normalizedEmail)) {
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

export async function getAuthenticatedUser(
  request?: Request
): Promise<{ email: string; displayName: string } | null> {
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

    // 1.1 Try Supabase Auth via Cookies if Authorization header not provided
    if (!email) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split(";").map((c) => {
            const [k, ...v] = c.trim().split("=");
            return [k, decodeURIComponent(v.join("="))];
          })
        );
        const tokenKey = Object.keys(cookies).find(
          (name) => (name.startsWith("sb-") && name.endsWith("-auth-token")) || name === "sb-access-token"
        );
        let rawToken = tokenKey ? cookies[tokenKey] : undefined;
        if (rawToken) {
          try {
            if (rawToken.startsWith("[") || rawToken.startsWith("{")) {
              const parsed = JSON.parse(rawToken);
              rawToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token || rawToken;
            }
            if (typeof rawToken === "string" && rawToken.length > 20) {
              const client = getSupabaseServerClient(rawToken);
              const { data, error } = await client.auth.getUser(rawToken);
              if (data?.user && !error) {
                email = data.user.email ?? null;
                displayName =
                  (data.user.user_metadata?.full_name as string) ||
                  email?.split("@")[0] ||
                  "Usuário";
              }
            }
          } catch {
            // ignore invalid token cookie
          }
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

  if (!email) return null;
  return { email: email.toLowerCase().trim(), displayName: displayName || email };
}

export async function authorize(
  permission: Permission,
  request?: Request
): Promise<
  | { ok: true; actor: AuthorizedActor }
  | { ok: false; response: Response }
> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return {
      ok: false,
      response: Response.json(
        { error: "Autenticação necessária. Faça login para continuar." },
        { status: 401 }
      ),
    };
  }

  const role = await resolveRole(user.email);
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
    actor: { email: user.email, displayName: user.displayName, role },
  };
}

