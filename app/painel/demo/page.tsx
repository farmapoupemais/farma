import type { Metadata } from "next";
import { RoleDashboard } from "@/components/role-dashboard";

export const metadata: Metadata = { title: "Demonstração do painel", description: "Conheça os painéis e permissões da Farmácia Poupe Mais." };
export default function DemoDashboardPage() { return <RoleDashboard initialRole="owner" userName="Raul" userEmail="demo@farmaciapoupemais.com.br" demo />; }
