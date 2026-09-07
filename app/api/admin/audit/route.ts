import { authorize } from "@/lib/access";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const auth = await authorize("user:manage", request);
  if (!auth.ok) return auth.response;

  try {
    const client = getSupabaseServerClient();
    const { data: logs, error } = await client
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return Response.json({ logs: logs ?? [] });
  } catch {
    return Response.json({ error: "Erro ao buscar registros de auditoria." }, { status: 500 });
  }
}
