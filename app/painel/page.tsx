import type { Metadata } from "next";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { RoleDashboard } from "@/components/role-dashboard";
import { resolveRole } from "@/lib/access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel", description: "Área protegida da Farmácia Poupe Mais." };

export default async function DashboardPage() {
  const user = await requireChatGPTUser("/painel");
  const role = await resolveRole(user.email);
  return <RoleDashboard initialRole={role} userName={user.displayName} userEmail={user.email} />;
}
