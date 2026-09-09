import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Produtos Isentos de Receita (MIPs) | Farmácia Poupe Mais",
  description: "A Farmácia Poupe Mais comercializa exclusivamente produtos e medicamentos isentos de prescrição médica, sem retenção de receitas.",
};

export default function PrescriptionInfoPage() {
  return (
    <>
      <SiteHeader />
      <main className="inner-main">
        <section className="page-hero">
          <div className="page-shell">
            <div className="breadcrumbs">
              <Link href="/">Início</Link>
              <span>/</span>
              <span>Informações de Receita</span>
            </div>
            <span className="eyebrow">Compra 100% Descomplicada</span>
            <h1>Sem burocracia: catálogo isento de receita.</h1>
            <p>
              A Farmácia Poupe Mais atua com medicamentos isentos de prescrição (MIPs),
              dermocosméticos, vitaminas, higiene e cuidados diários. Você não precisa
              enviar ou reter receitas para comprar.
            </p>
          </div>
        </section>

        <div className="page-shell inner-content" style={{ maxWidth: 840, margin: "0 auto", padding: "2.5rem 1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: 16, padding: "2.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "#ecfdf5", color: "#059669", padding: "0.75rem", borderRadius: 12 }}>
                <Icon name="shield" size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-bold)", margin: 0, color: "#0f172a" }}>
                  Dispensação Direta e Imediata
                </h2>
                <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "var(--text-sm)" }}>
                  Todos os itens da nossa loja são aprovados para compra sem retenção documental.
                </p>
              </div>
            </div>

            <p style={{ color: "#334155", lineHeight: 1.7, fontSize: "var(--text-base)" }}>
              Para proporcionar a máxima agilidade aos nossos clientes, nosso modelo comercial foca
              em saúde preventiva, alívio de sintomas leves, suplementação vitamínica e dermocuidados.
              Dessa forma, seu pedido é faturado e despachado imediatamente para entrega rápida ou retirada em loja em até 30 minutos.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "2rem", marginBottom: "2rem" }}>
              <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", color: "#0f172a", marginBottom: "0.5rem" }}>⚡ Despacho Imediato</h3>
                <p style={{ fontSize: "var(--text-sm)", color: "#64748b", margin: 0 }}>Sem filas ou tempo de espera para validação de receituário.</p>
              </div>
              <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", color: "#0f172a", marginBottom: "0.5rem" }}>🌿 Procedência Anvisa</h3>
                <p style={{ fontSize: "var(--text-sm)", color: "#64748b", margin: 0 }}>Lotes originais direto das maiores distribuidoras farmacêuticas do país.</p>
              </div>
              <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", color: "#0f172a", marginBottom: "0.5rem" }}>👩‍⚕️ Suporte Farmacêutico</h3>
                <p style={{ fontSize: "var(--text-sm)", color: "#64748b", margin: 0 }}>Nossa equipe de farmacêuticos está pronta para tirar dúvidas de posologia.</p>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center", marginTop: "2.5rem" }}>
              <Link href="/catalogo" className="button button-primary" style={{ padding: "0.85rem 2rem", fontSize: "var(--text-base)" }}>
                Explorar Catálogo Completo
              </Link>
              <Link href="/catalogo?ofertas=1" className="button button-ghost" style={{ padding: "0.85rem 2rem", fontSize: "var(--text-base)" }}>
                Ver Super Ofertas
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
