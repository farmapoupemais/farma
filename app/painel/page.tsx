"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboard } from "@/components/role-dashboard";
import { BrandMark } from "@/components/icons";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Role } from "@/lib/access";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [role, setRole] = useState<Role>("customer");

  useEffect(() => {
    async function checkAuth() {
      if (!isSupabaseConfigured() || !supabase) {
        // In unconfigured dev environment, fallback to demo owner
        setUser({ email: "dono@farmaciapoupemais.com.br", name: "Proprietário" });
        setRole("owner");
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          router.replace("/login?return_to=/painel");
          return;
        }

        const email = session.user.email ?? "";
        const name = (session.user.user_metadata?.full_name as string) || email.split("@")[0] || "Administrador";

        // Check if designated owner or query user's role from Supabase
        const ownerEmail = (process.env.NEXT_PUBLIC_OWNER_EMAIL || "raulgdc91@gmail.com").toLowerCase().trim();
        if (email.toLowerCase().trim() === ownerEmail) {
          setRole("owner");
        } else {
          const { data: roleRecord } = await supabase
            .from("user_roles")
            .select("role")
            .eq("email", email.toLowerCase().trim())
            .maybeSingle();

          if (roleRecord?.role) {
            setRole(roleRecord.role as Role);
          } else {
            // If no role record exists yet, check if table is empty (first user is Owner)
            const { count } = await supabase
              .from("user_roles")
              .select("*", { count: "exact", head: true });

            if (count === 0 || count === null) {
              setRole("owner");
            } else {
              setRole("customer");
            }
          }
        }


        setUser({ email, name });
      } catch (err) {
        console.error("Erro ao verificar autenticação:", err);
        router.replace("/login?return_to=/painel");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--sand-50, #fcfbf9)",
          fontFamily: "var(--font-sans, system-ui)",
        }}
      >
        <BrandMark size={52} />
        <h2 style={{ fontFamily: "var(--font-serif)", margin: "20px 0 8px", fontSize: "var(--text-2xl)", fontWeight: "var(--font-bold)" }}>
          Farmácia Poupe Mais
        </h2>
        <p style={{ color: "var(--muted, #666)", fontSize: "var(--text-sm)" }}>
          Verificando credenciais e permissões no Supabase…
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <RoleDashboard
      initialRole={role}
      userName={user.name}
      userEmail={user.email}
    />
  );
}

