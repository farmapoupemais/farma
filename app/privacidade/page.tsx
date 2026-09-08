import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Política de Privacidade e Proteção de Dados (LGPD)",
  description:
    "Política de Privacidade e Proteção de Dados Pessoais e Sensíveis de Saúde da Farmácia Poupe Mais em estrita conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e normativas da ANVISA.",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Política de Privacidade, Proteção de Dados e LGPD"
      eyebrow="Transparência, Segurança Sanitária e Ética Digital"
      description="Como a Farmácia Poupe Mais coleta, trata, armazena e protege seus dados pessoais e dados sensíveis de saúde, assegurando sigilo absoluto, respeito à Lei nº 13.709/2018 (LGPD) e cumprimento dos deveres sanitários da ANVISA."
    >
      {/* 1. QUADRO INSTITUCIONAL DO CONTROLADOR E DPO */}
      <section className="legal-notice-box" aria-label="Identificação do Controlador e Encarregado">
        <div className="legal-badge-pill">Governança de Privacidade — Art. 41 da Lei nº 13.709/2018 (LGPD)</div>
        <h2 style={{ marginTop: "10px", fontSize: "1.25rem", color: "var(--teal-deep)" }}>
          Controlador de Dados e Canal do Encarregado (DPO)
        </h2>
        <p style={{ margin: "6px 0 16px", fontSize: "0.85rem", color: "var(--muted)" }}>
          A Farmácia Poupe Mais de Medicamentos e Perfumaria Ltda. atua como Controladora dos dados pessoais coletados nesta plataforma. Para exercer quaisquer direitos previstos no Art. 18 da LGPD ou tirar dúvidas sobre o tratamento de seus dados de saúde, entre em contato direto com o nosso Encarregado pelo Tratamento de Dados Pessoais.
        </p>

        <div className="legal-grid-data">
          <div className="legal-data-card">
            <span className="legal-data-label">Controlador dos Dados</span>
            <strong>Farmácia Poupe Mais de Medicamentos e Perfumaria Ltda.</strong>
            <small>CNPJ: 00.000.000/0001-00 • Porto Alegre / RS</small>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Encarregado pelo Tratamento de Dados (DPO)</span>
            <strong>Comitê de Governança Digital e Privacidade Poupe Mais</strong>
          </div>
          <div className="legal-data-card highlight-contact">
            <span className="legal-data-label">Canal Direto do Titular (E-mail do DPO)</span>
            <strong style={{ color: "var(--farma-green-dark)" }}>dpo@poupemais.com.br</strong>
            <small>Prazo regulatório de resposta: até 15 (quinze) dias corridos conforme determinação da ANPD</small>
          </div>
          <div className="legal-data-card highlight-contact">
            <span className="legal-data-label">Autoridade Fiscalizadora Nacional</span>
            <span>
              Autoridade Nacional de Proteção de Dados (ANPD):{" "}
              <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">
                www.gov.br/anpd
              </a>
            </span>
          </div>
        </div>
      </section>

      {/* 2. TEXTO ESTRUTURADO DA POLÍTICA */}
      <section className="legal-clauses-wrapper">
        <div className="legal-clause">
          <h3>1. Princípios e Compromisso com a Privacidade</h3>
          <p>
            1.1. Na Farmácia Poupe Mais, a privacidade é tratada como um direito fundamental inalienável, complementada pelo tradicional dever de sigilo farmacêutico. Nossas operações digitais e logísticas são orientadas pelos princípios da boa-fé, finalidade, necessidade, livre acesso, qualidade dos dados, transparência, segurança, prevenção, não discriminação e responsabilização (Art. 6º da LGPD).
          </p>
        </div>

        <div className="legal-clause">
          <h3>2. Categorias de Dados Coletados e Tratados</h3>
          <p>
            Coletamos apenas as informações estritamente necessárias para viabilizar o fornecimento seguro de medicamentos, produtos de saúde e serviços farmacêuticos:
          </p>
          <ul>
            <li>
              <strong>Dados Pessoais Cadastrais</strong>: Nome completo, Cadastro de Pessoa Física (CPF — exigido obrigatoriamente pela Secretaria da Fazenda para emissão da Nota Fiscal Eletrônica), endereço residencial completo para entrega, número de telefone WhatsApp e endereço de e-mail.
            </li>
            <li>
              <strong>Dados Pessoais Sensíveis de Saúde (Art. 5º, II da LGPD)</strong>:
              Prescrições médicas, receitas de controle especial, atestados, nome e CRM/UF do médico prescritor, dosagens, histórico de dispensação farmacêutica e registros de teleorientação. <em>Esses dados recebem a mais alta camada de proteção técnica e isolamento criptográfico do sistema.</em>
            </li>
            <li>
              <strong>Dados de Faturamento e Pagamento</strong>:
              Informações de cartão de crédito e débito são processadas de forma tokenizada em ambiente certificado PCI-DSS Nível 1. A Farmácia Poupe Mais <strong>não armazena o número integral nem o código de segurança (CVV)</strong> de seus cartões em seus servidores.
            </li>
            <li>
              <strong>Dados de Conexão e Navegação</strong>:
              Endereço IP, data e hora de cada transação, tipo de navegador e identificadores de sessão técnica necessários para auditoria antifraude e cumprimento do Marco Civil da Internet (Lei nº 12.965/2014, Art. 15).
            </li>
          </ul>
        </div>

        <div className="legal-clause">
          <h3>3. Bases Legais para o Tratamento de Dados (Artigos 7º e 11 da LGPD)</h3>
          <p>
            Todo e qualquer tratamento de dados pessoais e de saúde na Farmácia Poupe Mais fundamenta-se estritamente nas seguintes hipóteses legais:
          </p>
          <ul>
            <li>
              <strong>Tutela da Saúde (Art. 11, II, &quot;f&quot; da LGPD)</strong>:
              Aplicável à avaliação de receitas médicas, acompanhamento posológico, dispensação de medicamentos e prestação de assistência farmacêutica remota exclusivamente por farmacêuticos habilitados no CRF/RS.
            </li>
            <li>
              <strong>Cumprimento de Obrigação Legal e Regulatória (Art. 7º, II e Art. 11, II, &quot;a&quot; da LGPD)</strong>:
              Atendimento às normas obrigatórias da ANVISA (RDC nº 44/2009, RDC nº 20/2011, Portaria nº 344/1998), escrituração no SNGPC (Sistema Nacional de Gerenciamento de Produtos Controlados), guarda obrigatória de receituários e emissão de documentação fiscal junto à Receita Federal e Estadual.
            </li>
            <li>
              <strong>Execução de Contrato e Procedimentos Preliminares (Art. 7º, V da LGPD)</strong>:
              Necessário para o processamento de pedidos, liquidação de pagamentos e despacho da tele-entrega expressa no endereço informado.
            </li>
            <li>
              <strong>Legítimo Interesse e Proteção ao Crédito e Antifraude (Art. 7º, IX e X da LGPD)</strong>:
              Salvaguarda da segurança dos usuários, prevenção a invasões e monitoramento de atividades suspeitas em nossa plataforma.
            </li>
            <li>
              <strong>Consentimento do Titular (Art. 7º, I e Art. 11, I da LGPD)</strong>:
              Coletado de forma livre, expressa e destacada para o envio opcional de informativos semanais, cupons de desconto e para cookies analíticos e de marketing não essenciais.
            </li>
          </ul>
        </div>

        <div className="legal-clause">
          <div className="legal-callout danger" style={{ borderLeft: "4px solid #dc2626", background: "#fef2f2", padding: "18px", borderRadius: "12px" }}>
            <h4 style={{ margin: "0 0 8px", color: "#991b1b", fontSize: "1.05rem" }}>
              Compromisso Incondicional: Vedação à Comercialização de Dados de Saúde (Art. 11, § 4º da LGPD)
            </h4>
            <p style={{ margin: 0, color: "#7f1d1d", fontSize: "0.85rem", lineHeight: 1.6 }}>
              A Farmácia Poupe Mais <strong>NUNCA comercializa, aluga, cede ou compartilha dados pessoais sensíveis referentes à saúde com terceiros</strong> para obtenção de vantagem econômica. É terminantemente proibido o repasse de diagnósticos, receitas, histórico de compras ou prescrições médicas a operadoras de planos de saúde, companhias seguradoras, instituições financeiras ou empresas de publicidade direcionada.
            </p>
          </div>
        </div>

        <div className="legal-clause">
          <h3>4. Medidas de Segurança da Informação e Auditoria</h3>
          <p>
            4.1. <strong>Criptografia Forte</strong>: Todas as comunicações entre o seu navegador e nossos servidores são protegidas por protocolos modernos TLS 1.3 (HTTPS), com tráfego criptografado de ponta a ponta e certificados digitais de alta confiabilidade.
          </p>
          <p>
            4.2. <strong>Armazenamento Isolado</strong>: Prescrições e documentos médicos são gravados em repositório seguro privado (Cloudflare R2 Storage com chaves isoladas), sem URLs públicas indexáveis por motores de busca.
          </p>
          <p>
            4.3. <strong>Livro-Razão Imutável de Auditoria (Audit Trail)</strong>: Qualquer operação que acesse, consulte ou valide uma receita médica gera automaticamente um registro de log criptográfico no painel interno (`AUD-XXXXX-XF`), registrando o operador farmacêutico responsável, timestamp em milissegundos e IP de origem.
          </p>
          <p>
            4.4. <strong>Controle de Acesso RBAC</strong>: Funcionários e operadores do catálogo, marketing e atendimento não possuem autorização para visualizar documentos de saúde dos clientes, privilégio restrito estritamente a farmacêuticos com registro ativo.
          </p>
        </div>

        <div className="legal-clause">
          <h3>5. Prazos Sanitários de Retenção e Descarte Seguro</h3>
          <p>
            5.1. <strong>Receitas Aprovadas e Escrituradas</strong>: São mantidas em arquivo seguro pelo prazo legal obrigatório determinado pela legislação sanitária (variando de 30 dias a 2 anos, conforme a tipologia do medicamento, classe antimicrobiana ou exigência do SNGPC/ANVISA). Findo o prazo de custódia sanitária legal, os arquivos são submetidos a expurgo criptográfico definitivo.
          </p>
          <p>
            5.2. <strong>Receitas Recusadas ou com Pendências</strong>: Caso o pedido não seja concluído ou a receita apresente impedimento sanitário, os documentos associados são eliminados com segurança de nossos servidores ativos no prazo máximo de 7 (sete) dias corridos.
          </p>
          <p>
            5.3. <strong>Dados Cadastrais e Notas Fiscais</strong>: Permanecem armazenados pelo prazo decadencial e prescricional legal de 5 (cinco) anos estipulado pelo Código Tributário Nacional e Código Civil.
          </p>
        </div>

        <div className="legal-clause">
          <h3>6. Direitos do Titular de Dados Pessoais (Art. 18 da LGPD)</h3>
          <p>
            Você possui pleno controle sobre seus dados pessoais e, a qualquer momento, pode solicitar ao nosso DPO através do e-mail <strong>dpo@poupemais.com.br</strong>:
          </p>
          <ul>
            <li>A confirmação da existência de tratamento de seus dados;</li>
            <li>O acesso claro e gratuito aos seus dados pessoais arquivados;</li>
            <li>A correção de dados cadastrais incompletos, inexatos ou desatualizados;</li>
            <li>A anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
            <li>A portabilidade dos seus dados para outro fornecedor de serviços ou produtos;</li>
            <li>Informações sobre eventuais entidades públicas ou privadas com as quais realizamos uso compartilhado estritamente regulatório (ex: ANVISA / SEFAZ);</li>
            <li>A revogação do consentimento concedido para comunicações e cookies de navegação a qualquer momento.</li>
          </ul>
        </div>

        <div className="legal-clause">
          <h3>7. Política de Cookies e Botão Flutuante de Preferências</h3>
          <p>
            7.1. Cookies são pequenos arquivos de texto transferidos para o seu dispositivo que nos auxiliam a oferecer uma navegação rápida, estável e segura:
          </p>
          <ul>
            <li>
              <strong>Cookies Estritamente Necessários</strong>: Indispensáveis para autenticação de sessão, funcionamento do carrinho de compras, finalização de pedidos e defesas de segurança cibernética (CSRF). <em>Não podem ser desativados sem comprometer a integridade funcional do site.</em>
            </li>
            <li>
              <strong>Cookies Analíticos e de Desempenho (Opcionais)</strong>: Coletam métricas anônimas sobre páginas mais visitadas e velocidade de carregamento, permitindo aperfeiçoar a usabilidade do site.
            </li>
            <li>
              <strong>Cookies de Marketing e Personalização (Opcionais)</strong>: Utilizados para lembrar produtos visualizados e evitar a exibição repetida de mensagens promocionais de itens de perfumaria e conveniência.
            </li>
          </ul>
          <p>
            7.2. <strong>Gerenciador Permanente de Privacidade</strong>: A Farmácia Poupe Mais disponibiliza um <strong>botão flutuante permanente no canto inferior da tela</strong> (ícone de escudo/cookie), permitindo que você altere sua escolha entre &quot;Aceitar Todos os Cookies&quot; ou &quot;Apenas Cookies Necessários&quot; a qualquer momento durante a navegação.
          </p>
        </div>

        <div className="legal-clause-footer">
          <p>
            <strong>Última atualização:</strong> 08 de setembro de 2026.
            <br />
            Encarregado pelo Tratamento de Dados (DPO): <strong>dpo@poupemais.com.br</strong>
            <br />
            Farmácia Poupe Mais Ltda. — Compromisso com sua saúde e com a sua privacidade.
          </p>
        </div>
      </section>
    </ContentPage>
  );
}
