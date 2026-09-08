import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Termos de Uso e Condições Gerais de Navegação e Compra",
  description:
    "Termos de Uso da Farmácia Poupe Mais em conformidade com a RDC ANVISA nº 44/2009, Lei nº 13.021/2014, Código de Defesa do Consumidor e Decreto nº 7.962/2013.",
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Termos de Uso e Regras de Dispensação Farmacêutica"
      eyebrow="Marco Regulatório ANVISA & Legislação Farmacêutica"
      description="Condições gerais de navegação, dispensação remota de medicamentos, tele-entrega e relacionamento de consumo digital da Farmácia Poupe Mais, em estrita conformidade com a RDC nº 44/2009 da ANVISA e a Lei nº 13.021/2014."
    >
      {/* 1. QUADRO OFICIAL DE IDENTIFICAÇÃO REGULATÓRIA (Art. 53 da RDC 44/2009) */}
      <section className="legal-notice-box" aria-label="Identificação Regulatória da Farmácia">
        <div className="legal-badge-pill">Informações Sanitárias Obrigatórias — Art. 53 da RDC ANVISA nº 44/2009</div>
        <h2 style={{ marginTop: "10px", fontSize: "1.25rem", color: "var(--teal-deep)" }}>
          Identificação do Estabelecimento e Responsabilidade Técnica
        </h2>
        <p style={{ margin: "6px 0 16px", fontSize: "0.85rem", color: "var(--muted)" }}>
          O comércio eletrônico da Farmácia Poupe Mais opera exclusivamente vinculado à farmácia física aberta ao público, sob supervisão contínua de profissional farmacêutico habilitado durante todo o período de atendimento.
        </p>

        <div className="legal-grid-data">
          <div className="legal-data-card">
            <span className="legal-data-label">Razão Social</span>
            <strong>Farmácia Poupe Mais de Medicamentos e Perfumaria Ltda.</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Nome Fantasia</span>
            <strong>Farmácia Poupe Mais</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">CNPJ</span>
            <strong>00.000.000/0001-00</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Inscrição Estadual</span>
            <strong>096/0000000</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Endereço Físico</span>
            <strong>Av. Principal da Saúde, nº 1.000 — Porto Alegre / RS — CEP 90010-000</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Horário de Funcionamento da Loja</span>
            <strong>Todos os dias, das 07:30 às 22:30</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">AFE — ANVISA</span>
            <strong>Autorização de Funcionamento nº 7.12345.6</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Alvará Sanitário Municipal</span>
            <strong>Licença Sanitária nº 2026/0481 (Vigilância Sanitária)</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Farmacêutico Responsável Técnico</span>
            <strong>Dr. Raul da Costa • CRF/RS nº 12.345</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Certidão de Regularidade (CRT)</span>
            <strong>CRT CRF/RS nº 98765/2026</strong>
          </div>
          <div className="legal-data-card highlight-contact">
            <span className="legal-data-label">Plantão da Assistência Farmacêutica</span>
            <strong style={{ color: "var(--farma-green-dark)" }}>Telefone / WhatsApp: (51) 98183-4039 • (51) 99794-8494</strong>
            <small>Atendimento farmacêutico direto e em tempo real para dúvidas sobre dosagem e posologia</small>
          </div>
          <div className="legal-data-card highlight-contact">
            <span className="legal-data-label">Órgãos de Fiscalização</span>
            <span>
              ANVISA: <a href="https://www.gov.br/anvisa" target="_blank" rel="noopener noreferrer">www.gov.br/anvisa</a> (0800 642 9782)
              <br />
              CRF/RS: <a href="https://www.crfrs.org.br" target="_blank" rel="noopener noreferrer">www.crfrs.org.br</a> (51 3320-1800)
            </span>
          </div>
        </div>
      </section>

      {/* 2. TEXTO FORMAL DOS TERMOS DE USO */}
      <section className="legal-clauses-wrapper">
        <div className="legal-clause">
          <h3>1. Objeto e Natureza dos Serviços Digitais</h3>
          <p>
            1.1. Os presentes Termos e Condições Gerais de Uso regem a navegação no sítio eletrônico, a consulta ao catálogo institucional, a realização de pedidos e a solicitação de tele-entrega de medicamentos e produtos de higiene, beleza e nutrição junto à <strong>Farmácia Poupe Mais</strong>.
          </p>
          <p>
            1.2. A farmácia constitui, nos termos da Lei Federal nº 13.021/2014, uma <em>unidade de prestação de serviços de assistência farmacêutica, assistência à saúde e orientação sanitária individual e coletiva</em>. Todas as operações eletrônicas são intermediadas pelo suporte do farmacêutico de plantão.
          </p>
          <p>
            1.3. O conteúdo educativo, bulas resumidas e artigos publicados no site possuem caráter exclusivamente informativo e preventivo. <strong>Nenhuma informação substitui a consulta médica, o diagnóstico presencial ou o acompanhamento profissional multiprofissional.</strong>
          </p>
        </div>

        <div className="legal-clause">
          <h3>2. Classificação de Produtos e Regras Sanitárias de Dispensação</h3>
          <p>
            A dispensação de produtos obedece com rigor à legislação sanitária vigente estabelecida pela ANVISA e pelo Conselho Federal de Farmácia:
          </p>
          <ul>
            <li>
              <strong>Medicamentos Isentos de Prescrição (MIPs)</strong>: A dispensação pode ser realizada por meio remoto mediante confirmação de pedido. A Farmácia Poupe Mais disponibiliza canal direto com o farmacêutico para esclarecimento sobre posologia, contraindicações e efeitos adversos antes da conclusão da compra.
            </li>
            <li>
              <strong>Medicamentos Sujeitos a Prescrição Médica (Tarja Vermelha sem retenção)</strong>: Exigem obrigatoriamente o envio e a validação de receita médica legítima, submetida via upload ou conferida no momento da entrega presencial pelo profissional farmacêutico.
            </li>
            <li>
              <strong>Medicamentos Sujeitos a Controle Especial (Portaria SVS/MS nº 344/98 e RDC ANVISA nº 20/2011)</strong>:
              Em estrita obediência ao <em>Artigo 54 da RDC ANVISA nº 44/2009</em>, medicamentos psicotrópicos, entorpecentes e retinoides controlados <strong>não podem ser dispensados de forma puramente remota sem a retenção prévia física da Notificação de Receita</strong> ou envio de Receita Digital certificada pelo padrão ICP-Brasil (assinatura digital válida conforme Portaria MS e CFM).
            </li>
            <li>
              <strong>Antimicrobianos (Antibióticos)</strong>: Conforme a RDC nº 20/2011, a dispensação é condicionada à retenção da 2ª via da receita médica dentro do prazo de validade legal de 10 (dez) dias a contar da emissão.
            </li>
          </ul>
          <div className="legal-callout warning">
            <strong>Autonomia Técnica Farmacêutica (Lei nº 13.021/2014)</strong>:
            O Farmacêutico Responsável Técnico reserva-se o direito e o dever sanitário de recusar o aviamento de qualquer pedido caso identifique rasuras na prescrição, dosagem tóxica ou supraterapêutica, incompatibilidade farmacológica manifesta, ou fundado receio de risco à saúde do paciente.
          </div>
        </div>

        <div className="legal-clause">
          <h3>3. Política Sanitária de Trocas e Devoluções de Medicamentos</h3>
          <p>
            3.1. <strong>Regra Geral Sanitária (Art. 90 da RDC ANVISA nº 44/2009)</strong>:
            Em razão da legislação sanitária brasileira de proteção à saúde coletiva, <em>medicamentos que tenham saído da guarda e controle do estabelecimento farmacêutico não podem ser devolvidos, trocados ou reinseridos em estoque</em>. Tal determinação decorre da impossibilidade biológica de garantir que o produto foi conservado sob condições adequadas de temperatura, luminosidade e umidade após sua entrega ao consumidor.
          </p>
          <p>
            3.2. <strong>Exceções Legítimas para Devolução ou Substituição</strong>:
            A substituição imediata ou o reembolso integral do valor pago será garantido nos seguintes casos, mediante conferência farmacêutica:
          </p>
          <ul>
            <li>Comprovação de vício de qualidade ou desvio de fabricação (problemas no lacre primário, coloração atípica ou odor);</li>
            <li>Recolhimento sanitário determinado pela ANVISA ou pelo laboratório fabricante (Recall);</li>
            <li>Divergência entre o produto entregue e a receita médica ou pedido aprovado;</li>
            <li>Avaria física provocada durante o transporte pela tele-entrega.</li>
          </ul>
          <p>
            3.3. Produtos de higiene pessoal, cosméticos e correlatos não medicamentosos sujeitam-se ao direito de arrependimento (Artigo 49 do Código de Defesa do Consumidor), desde que intactos, com lacres originais inviolados e acompanhados de sua respectiva nota fiscal no prazo de 7 (sete) dias corridos.
          </p>
        </div>

        <div className="legal-clause">
          <h3>4. Logística de Tele-Entrega e Cuidados no Transporte</h3>
          <p>
            4.1. As entregas remotas são operadas com rigorosa observância das normas de Boas Práticas de Transporte de Medicamentos (RDC nº 430/2020 e RDC nº 44/2009), assegurando a proteção contra intempéries, incidência solar direta e variações térmicas danosas.
          </p>
          <p>
            4.2. <strong>Produtos Termolábeis (ex: Insulinas e Vacinas)</strong>: São transportados exclusivamente em embalagens térmicas isolantes com monitoramento de temperatura entre 2°C e 8°C e tempo máximo de trânsito controlado.
          </p>
          <p>
            4.3. No ato da entrega, o destinatário ou responsável legal deverá assinar o canhoto de recebimento, conferir a integridade da embalagem, o lacre do medicamento e a correspondência com a Nota Fiscal Eletrônica.
          </p>
        </div>

        <div className="legal-clause">
          <h3>5. Preços, Pagamento e Publicidade Ética</h3>
          <p>
            5.1. Os preços praticados no sítio eletrônico respeitam rigorosamente a tabela de Preço Máximo ao Consumidor (PMC) estipulada pela Câmara de Regulação do Mercado de Medicamentos (CMED/ANVISA).
          </p>
          <p>
            5.2. As formas de pagamento incluem Pix com liquidação imediata, cartões de crédito e débito bandeirados, boleto bancário e pagamento no ato da entrega (dinheiro ou maquininha).
          </p>
          <p>
            5.3. Em consonância com o Art. 58 da RDC nº 44/2009, a divulgação de medicamentos sujeitos a prescrição médica é estritamente informativa, contendo nome comercial, princípio ativo, concentração, forma farmacêutica, número de registro na ANVISA e preço máximo, sendo vedado qualquer anúncio publicitário ostensivo que induza ao consumo irracional de fármacos.
          </p>
        </div>

        <div className="legal-clause">
          <h3>6. Proteção de Dados e Sigilo Farmacêutico</h3>
          <p>
            O tratamento de dados cadastrais e de prescrições médicas na plataforma obedece aos preceitos da Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018) e ao sigilo profissional farmacêutico. Para detalhes aprofundados sobre bases legais de tutela da saúde e descarte seguro de arquivos médicos, consulte nossa <Link href="/privacidade" className="text-link" style={{ textDecoration: "underline" }}>Política de Privacidade e LGPD</Link>.
          </p>
        </div>

        <div className="legal-clause">
          <h3>7. Foro de Eleição e Resolução de Conflitos</h3>
          <p>
            Os presentes termos são regidos pelas leis da República Federativa do Brasil. Para dirimir quaisquer litígios oriundos do presente termo, fica eleito o Foro da Comarca de Porto Alegre, Estado do Rio Grande do Sul, com renúncia expressa a qualquer outro, ressalvada a competência legal protetiva do domicílio do consumidor conforme o Código de Defesa do Consumidor.
          </p>
        </div>

        <div className="legal-clause-footer">
          <p>
            <strong>Última atualização:</strong> 08 de setembro de 2026.
            <br />
            Farmácia Poupe Mais — Cuidado de verdade, compromisso sanitário e economia para sua família.
          </p>
        </div>
      </section>
    </ContentPage>
  );
}
