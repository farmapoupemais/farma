"use client";

import Link from "next/link";
import { Icon } from "./icons";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="newsletter">
        <div className="page-shell newsletter-inner">
          <div>
            <span className="eyebrow">Economia na sua caixa de entrada</span>
            <h2>Receba cupons e ofertas da semana</h2>
          </div>
          <div className="newsletter-form-container">
            <form onSubmit={(e) => { e.preventDefault(); alert("Obrigado por se inscrever! Você receberá nossos cupons em breve."); }}>
              <label className="sr-only" htmlFor="newsletter-email">Seu e-mail para receber ofertas e cupons exclusivos</label>
              <input id="newsletter-email" type="email" required placeholder="seuemail@exemplo.com" autoComplete="email" />
              <button type="submit">Quero receber</button>
            </form>
            <p className="newsletter-privacy">
              Enviamos apenas ofertas exclusivas e cupons semanais. Cancele sua inscrição quando quiser.
            </p>
          </div>
        </div>
      </div>
      <div className="page-shell footer-grid">
        <div className="footer-brand">
          <Link href="/" className="brand footer-brand-link" aria-label="Farmácia Poupe Mais — Aqui se faz economia">
            <div className="footer-logo-wrap">
              <img
                src="/logo-poupe-mais.png"
                alt="Farmácia Poupe Mais — Aqui se faz economia"
                className="footer-logo-img"
                width={190}
                height={83}
                style={{ height: "46px", width: "auto", objectFit: "contain", display: "block" }}
              />
            </div>
          </Link>
          <p>Saúde, economia e conveniência para cuidar de você todos os dias.</p>
          <div className="tele-line" style={{ display: "flex", alignItems: "center", gap: "10px", margin: "14px 0", color: "#ffcb05" }}>
            <Icon name="truck" size={20} />
            <span style={{ fontSize: "var(--text-xs)" }}><strong>Tele-Entrega:</strong> (51) 98183-4039 • (51) 99794-8494</span>
          </div>
          <div className="pharmacist-line"><Icon name="shield" /><span><strong>Atendimento farmacêutico</strong>Todos os dias, das 8h às 22h</span></div>
        </div>
        <div><h3>Compre</h3><Link href="/catalogo">Todos os produtos</Link><Link href="/catalogo?categoria=Medicamentos">Medicamentos</Link><Link href="/catalogo?categoria=Dermocosméticos">Dermocosméticos</Link><Link href="/carrinho">Meu carrinho</Link></div>
        <div><h3>Serviços</h3><Link href="/catalogo?ofertas=1">Ofertas da semana</Link><Link href="/servicos">Serviços farmacêuticos</Link><Link href="/lojas">Encontrar loja</Link><Link href="/painel">Meus pedidos</Link></div>
        <div><h3>Institucional</h3><Link href="/sobre">Sobre nós</Link><Link href="/privacidade">Privacidade e LGPD</Link><Link href="/termos">Termos de uso</Link><Link href="/lojas">Nossas lojas</Link></div>
      </div>
      <div className="footer-legal page-shell">
        <p><strong>Farmácia Poupe Mais Ltda.</strong> • CNPJ: 42.189.304/0001-85 • AFE ANVISA: 7.39482.1 • Farmacêutico Responsável Técnico: Dr. Raul da Costa — CRF/RS 14.892 • Av. Paraguassú, 2200 - Imbé/RS - CEP 95625-000</p>
        <p>Medicamentos podem causar efeitos indesejados. Evite a automedicação: leia a bula e procure orientação profissional.</p>
        <div className="footer-bottom-row">
          <span>© 2026 Farmácia Poupe Mais. Todos os direitos reservados.</span>
          <span className="footer-dev-credit">Desenvolvimento: <strong>Raul Grings</strong></span>
        </div>
      </div>
    </footer>
  );
}
