import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { Icon } from "@/components/icons";
import { PrescriptionUpload } from "@/components/prescription-upload";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Enviar receita", description: "Canal protegido para envio e análise farmacêutica de receitas." };

export default async function PrescriptionPage() {
  const user = await requireChatGPTUser("/receita");
  return <><SiteHeader /><main className="inner-main"><section className="page-hero"><div className="page-shell"><div className="breadcrumbs"><Link href="/">Início</Link><span>/</span><span>Enviar receita</span></div><span className="eyebrow">Canal protegido</span><h1>Envie sua receita com segurança.</h1><p>O documento fica privado e só pode ser acessado por você e por profissionais autorizados durante a análise.</p></div></section><div className="page-shell inner-content prescription-layout"><section><div className="secure-user"><Icon name="user" /><p>Envio identificado como <strong>{user.displayName}</strong><span>{user.email}</span></p></div><PrescriptionUpload /></section><aside><h2>Como funciona</h2><ol><li><span>1</span><p><strong>Envie o documento</strong>Use uma foto nítida ou um PDF legível.</p></li><li><span>2</span><p><strong>Análise farmacêutica</strong>Conferimos validade, identificação e dados obrigatórios.</p></li><li><span>3</span><p><strong>Orientação e pedido</strong>Você recebe o retorno antes de qualquer dispensação.</p></li></ol><div className="privacy-card"><Icon name="shield" /><p><strong>Seus dados de saúde são sensíveis</strong>Não usamos a receita para publicidade. O arquivo não possui link público e segue uma política de retenção limitada.</p></div></aside></div></main><SiteFooter /></>;
}
