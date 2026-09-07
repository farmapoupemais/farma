import Link from "next/link";
import { BrandMark, Icon } from "./icons";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="newsletter">
        <div className="page-shell newsletter-inner">
          <div><span className="eyebrow">Economia na sua caixa de entrada</span><h2>Receba cupons e ofertas da semana</h2></div>
          <form><label className="sr-only" htmlFor="newsletter-email">Seu e-mail</label><input id="newsletter-email" type="email" placeholder="seuemail@exemplo.com" /><button type="submit">Quero receber</button></form>
        </div>
      </div>
      <div className="page-shell footer-grid">
        <div className="footer-brand">
          <Link href="/" className="brand brand-light"><BrandMark /><span className="brand-copy"><strong>Farmácia</strong><span>Poupe Mais</span></span></Link>
          <p>Saúde, economia e conveniência para cuidar de você todos os dias.</p>
          <div className="pharmacist-line"><Icon name="shield" /><span><strong>Atendimento farmacêutico</strong>Todos os dias, das 8h às 22h</span></div>
        </div>
        <div><h3>Compre</h3><Link href="/catalogo">Todos os produtos</Link><Link href="/catalogo?categoria=Medicamentos">Medicamentos</Link><Link href="/catalogo?categoria=Dermocosméticos">Dermocosméticos</Link><Link href="/carrinho">Meu carrinho</Link></div>
        <div><h3>Serviços</h3><Link href="/receita">Enviar receita</Link><Link href="/servicos">Serviços farmacêuticos</Link><Link href="/lojas">Encontrar loja</Link><Link href="/painel">Meus pedidos</Link></div>
        <div><h3>Institucional</h3><Link href="/sobre">Sobre nós</Link><Link href="/privacidade">Privacidade e LGPD</Link><Link href="/termos">Termos de uso</Link><Link href="/painel/demo">Painel demonstrativo</Link></div>
      </div>
      <div className="footer-legal page-shell">
        <p><strong>Farmácia Poupe Mais — ambiente demonstrativo.</strong> Dados jurídicos, AFE, licença sanitária, farmacêutico responsável e CRF devem ser preenchidos antes da operação comercial.</p>
        <p>Medicamentos podem causar efeitos indesejados. Evite a automedicação; leia a bula e procure orientação profissional.</p>
        <span>© 2026 Farmácia Poupe Mais. Todos os direitos reservados.</span>
      </div>
    </footer>
  );
}
