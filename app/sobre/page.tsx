import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Sobre Nós | Farmácia Poupe Mais",
  description: "Conheça a história e os compromissos da Farmácia Poupe Mais com a sua saúde e economia.",
};

export default function AboutPage() {
  return (
    <ContentPage
      title="Sobre a Poupe Mais"
      eyebrow="Nossa forma de cuidar"
      description="Uma proposta de farmácia digital e de bairro baseada em proximidade, economia, informação clara e operação responsável."
    >
      <h2>Saúde é relação de confiança.</h2>
      <p>
        A Farmácia Poupe Mais nasce como uma experiência de comércio e serviços farmacêuticos
        que une preços acessíveis, orientação e acolhimento. A loja combina catálogo amplo,
        retirada rápida, entrega local e atendimento farmacêutico todos os dias.
      </p>

      <h2>Compromissos do projeto</h2>
      <ul>
        <li>
          <strong>Assistência Farmacêutica Presente:</strong> Farmacêuticos responsáveis técnicos
          sempre à disposição para orientar com ética sobre posologia, contraindicações e cuidados diários.
        </li>
        <li>
          <strong>Agilidade e Conveniência:</strong> Entregas rápidas na região e
          retirada expressa em até 30 minutos em nossas unidades físicas.
        </li>
        <li>
          <strong>Privacidade e Segurança:</strong> Rigorosa conformidade com a LGPD (Lei Geral de Proteção
          de Dados), garantindo sigilo absoluto e proteção em todas as etapas da sua compra.
        </li>
      </ul>

      <h2>Identificação do Estabelecimento</h2>
      <p>
        <strong>Razão Social:</strong> Farmácia Poupe Mais Ltda. • <strong>CNPJ:</strong> 42.189.304/0001-85<br />
        <strong>AFE ANVISA:</strong> 7.39482.1 • <strong>CRF/RS:</strong> 14.892<br />
        <strong>Farmacêutico Responsável Técnico:</strong> Dr. Raul da Costa (CRF/RS 14.892)<br />
        <strong>Matriz:</strong> Av. Paraguassú, 2200 - Imbé/RS - CEP 95625-000<br />
        <strong>Tele-Entrega Expressa:</strong> (51) 98183-4039 • (51) 99794-8494
      </p>
    </ContentPage>
  );
}
