import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Política de Privacidade, Proteção de Dados e Governança LGPD",
  description:
    "Política de Privacidade e Proteção de Dados Pessoais e Sensíveis de Saúde da Farmácia Poupe Mais em estrita conformidade com a Lei Federal nº 13.709/2018 (LGPD), Marco Civil da Internet (Lei nº 12.965/2014) e resoluções da ANVISA e da ANPD.",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Política de Privacidade, Proteção de Dados e Governança LGPD"
      eyebrow="Privacidade, Tutela da Saúde & Rigor Jurídico"
      description="Diretrizes formais de coleta, tratamento, armazenamento, sigilo farmacêutico e proteção de dados pessoais comuns e dados pessoais sensíveis de saúde tratados pela Farmácia Poupe Mais, em estrita conformidade com a Lei nº 13.709/2018 (LGPD), Marco Civil da Internet e normativas da ANVISA e da Autoridade Nacional de Proteção de Dados (ANPD)."
    >
      {/* 1. QUADRO INSTITUCIONAL DO CONTROLADOR E DO ENCARREGADO DE DADOS (DPO) */}
      <section className="legal-notice-box" aria-label="Identificação do Controlador e Encarregado LGPD">
        <div className="legal-badge-pill">Governança Institucional — Art. 41 da Lei nº 13.709/2018 (LGPD)</div>
        <h2 style={{ marginTop: "10px", fontSize: "1.3rem", color: "var(--teal-deep)" }}>
          Qualificação do Controlador e Canal Oficial do Encarregado (DPO)
        </h2>
        <p style={{ margin: "6px 0 16px", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6 }}>
          A Farmácia Poupe Mais de Medicamentos e Perfumaria Ltda. atua como Controladora de Dados Pessoais. Em cumprimento ao Artigo 41 da LGPD e regulamentações da ANPD, mantemos canal de comunicação permanente e direto para o exercício dos direitos dos titulares de dados.
        </p>

        <div className="legal-grid-data">
          <div className="legal-data-card">
            <span className="legal-data-label">Controlador dos Dados Pessoais</span>
            <strong>Farmácia Poupe Mais de Medicamentos e Perfumaria Ltda.</strong>
            <small>CNPJ: 00.000.000/0001-00 • Sede: Av. Principal da Saúde, nº 1.000 — Porto Alegre / RS</small>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Encarregado pelo Tratamento de Dados (DPO)</span>
            <strong>Comitê de Governança Digital, Privacidade e Compliance Farmacêutico</strong>
          </div>
          <div className="legal-data-card highlight-contact">
            <span className="legal-data-label">Canal Oficial de Atendimento ao Titular (E-mail do DPO)</span>
            <strong style={{ color: "var(--farma-green-dark)" }}>dpo@poupemais.com.br</strong>
            <small>Canal exclusivo para requerimentos de confirmação de tratamento, acesso, correção, eliminação, portabilidade e revogação de consentimento. Prazo de resposta: até 15 (quinze) dias corridos (Art. 19, II da LGPD).</small>
          </div>
          <div className="legal-data-card highlight-contact">
            <span className="legal-data-label">Autoridade Reguladora Nacional</span>
            <span>
              <strong>Autoridade Nacional de Proteção de Dados (ANPD):</strong>{" "}
              <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">
                www.gov.br/anpd
              </a>{" "}
              | Edifício Venâncio 2000, Bloco B60, Brasília / DF
            </span>
          </div>
        </div>
      </section>

      {/* 2. TEXTO INTEGRAL DA POLÍTICA COM RIGOR JURÍDICO */}
      <section className="legal-clauses-wrapper">
        <div className="legal-clause">
          <h3>Capítulo I — Do Glossário Jurídico e Definições Legais (Art. 5º da LGPD)</h3>
          <p>
            Para os fins desta Política e fiel aplicação da Lei nº 13.709/2018, consideram-se:
          </p>
          <ul>
            <li><strong>Dado Pessoal (Art. 5º, I):</strong> Informação relacionada a pessoa natural identificada ou identificável (ex: nome, CPF, RG, endereço residencial, telefone, e-mail).</li>
            <li><strong>Dado Pessoal Sensível (Art. 5º, II):</strong> Dado pessoal sobre origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou a organização de caráter religioso, filosófico ou político, <em>dado referente à saúde ou à vida sexual</em>, dado genético ou biométrico, quando vinculado a uma pessoa natural. No contexto desta farmácia, abrangem receitas médicas, laudos, posologias, medicamentos em uso e atendimentos farmacêuticos.</li>
            <li><strong>Titular (Art. 5º, V):</strong> Pessoa natural a quem se referem os dados pessoais que são objeto de tratamento (o cliente, paciente ou usuário do site).</li>
            <li><strong>Controlador (Art. 5º, VI):</strong> Pessoa natural ou jurídica a quem competem as decisões referentes ao tratamento de dados pessoais (a Farmácia Poupe Mais).</li>
            <li><strong>Operador (Art. 5º, VII):</strong> Pessoa natural ou jurídica que realiza o tratamento de dados pessoais em nome do controlador (ex: gateways de pagamento e operadoras de entrega).</li>
            <li><strong>Encarregado / DPO (Art. 5º, VIII):</strong> Pessoa indicada pelo controlador para atuar como canal de comunicação entre o controlador, os titulares dos dados e a Autoridade Nacional de Proteção de Dados (ANPD).</li>
            <li><strong>Tratamento (Art. 5º, X):</strong> Toda operação realizada com dados pessoais, como as que se referem a coleta, produção, recepção, classificação, utilização, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação ou controle da informação, modificação, comunicação, transferência, difusão ou extração.</li>
            <li><strong>Consentimento (Art. 5º, XII):</strong> Manifestação livre, informada e inequívoca pela qual o titular concorda com o tratamento de seus dados pessoais para uma finalidade determinada.</li>
          </ul>
        </div>

        <div className="legal-clause">
          <h3>Capítulo II — Dos Princípios Norteadores do Tratamento de Dados (Art. 6º da LGPD)</h3>
          <p>
            As atividades de tratamento de dados na Farmácia Poupe Mais observam a boa-fé e os dez princípios fundamentais do Artigo 6º da LGPD:
          </p>
          <ol>
            <li><strong>Finalidade:</strong> Realização do tratamento para propósitos legítimos, específicos, explícitos e informados ao titular, vedado o tratamento posterior de forma incompatível com essas finalidades;</li>
            <li><strong>Adequação:</strong> Compatibilidade do tratamento com as finalidades informadas ao titular;</li>
            <li><strong>Necessidade (Minimização):</strong> Limitação do tratamento ao mínimo necessário para a realização de suas finalidades, com abrangência dos dados pertinentes, proporcionais e não excessivos;</li>
            <li><strong>Livre Acesso:</strong> Garantia aos titulares de consulta facilitada e gratuita sobre a forma e a duração do tratamento, bem como sobre a integralidade de seus dados pessoais;</li>
            <li><strong>Qualidade dos Dados:</strong> Garantia de exatidão, clareza, relevância e atualização dos dados;</li>
            <li><strong>Transparência:</strong> Garantia de informações claras, precisas e facilmente acessíveis sobre a realização do tratamento e os respectivos agentes de tratamento;</li>
            <li><strong>Segurança:</strong> Utilização de medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração ou difusão;</li>
            <li><strong>Prevenção:</strong> Adoção de medidas para prevenir a ocorrência de danos em virtude do tratamento de dados pessoais;</li>
            <li><strong>Não Discriminação:</strong> Impossibilidade de realização do tratamento para fins discriminatórios ilícitos ou abusivos;</li>
            <li><strong>Responsabilização e Prestação de Contas:</strong> Demonstração, pelo agente, da adoção de medidas eficazes e capazes de comprovar a observância e o cumprimento das normas de proteção de dados.</li>
          </ol>
        </div>

        <div className="legal-clause">
          <h3>Capítulo III — Do Inventário de Dados Pessoais Coletados e Finalidades do Tratamento</h3>
          <p>
            A Farmácia Poupe Mais coleta estritamente as seguintes categorias de dados para as finalidades legítimas descritas:
          </p>
          <ul>
            <li>
              <strong>1. Dados Pessoais Cadastrais e Fiscais:</strong> Nome completo, CPF, RG, data de nascimento, endereço residencial completo e telefone WhatsApp.
              <br />
              <em>Finalidades:</em> Identificação inequívoca do comprador, emissão obrigatória de Nota Fiscal de Consumidor Eletrônica (NFC-e / NF-e) perante a Secretaria da Fazenda Estadual, faturamento e cumprimento da roteirização de tele-entrega expressa.
            </li>
            <li>
              <strong>2. Dados Pessoais Sensíveis de Saúde (Art. 5º, II e Art. 11 da LGPD):</strong> Prescrições médicas (físicas ou digitais), CRM/UF do profissional médico ou odontológico prescritor, dosagens, princípios ativos, posologia, medicamentos de uso contínuo, registros de aferição e registros de orientação farmacêutica.
              <br />
              <em>Finalidades:</em> Dispensação segura e orientada de medicamentos, conferência técnico-farmacêutica prévia (Art. 13 da Lei nº 13.021/2014), escrituração obrigatória no Sistema Nacional de Gerenciamento de Produtos Controlados (SNGPC/ANVISA) e guarda sanitária de receituários retidos conforme Portaria SVS/MS nº 344/1998 e RDC ANVISA nº 20/2011.
            </li>
            <li>
              <strong>3. Dados Financeiros e de Pagamento:</strong> Dados de cartão de crédito e débito são coletados diretamente em ambiente seguro do gateway de pagamento com certificação PCI-DSS Nível 1 e criptografia de ponta a ponta. <em>A Farmácia Poupe Mais não armazena em seus servidores o número completo do cartão nem o código verificador (CVV).</em>
              <br />
              <em>Finalidades:</em> Processamento da transação bancária, prevenção a fraudes e conciliação financeira.
            </li>
            <li>
              <strong>4. Dados de Conexão, Navegação e Logs Técnicos:</strong> Endereço IP, data e hora de cada acesso, identificador de sessão, tipo de navegador e requisições no catálogo.
              <br />
              <em>Finalidades:</em> Cumprimento do dever legal de guarda de registros de acesso a aplicações de internet por 6 (seis) meses, estatuído no Artigo 15 da Lei nº 12.965/2014 (Marco Civil da Internet), e auditoria de segurança cibernética contra ataques.
            </li>
          </ul>
        </div>

        <div className="legal-clause">
          <h3>Capítulo IV — Das Bases Legais do Tratamento (Artigos 7º e 11 da LGPD)</h3>
          <p>
            O tratamento de dados pessoais na Farmácia Poupe Mais é estritamente respaldado pelas seguintes hipóteses legais exaustivas:
          </p>
          <ul>
            <li>
              <strong>Tutela da Saúde (Art. 11, II, &quot;f&quot; da LGPD):</strong> O tratamento de dados pessoais sensíveis de saúde é realizado sob a responsabilidade e supervisão exclusiva de farmacêuticos habilitados inscritos no Conselho Regional de Farmácia (CRF/RS), em estrito procedimento de assistência farmacêutica voltado à saúde e bem-estar do paciente.
            </li>
            <li>
              <strong>Cumprimento de Obrigação Legal ou Regulatória (Art. 7º, II e Art. 11, II, &quot;a&quot; da LGPD):</strong>
              Atendimento compulsório às resoluções e portarias da ANVISA (RDC nº 44/2009, RDC nº 20/2011, Portaria nº 344/1998), escrituração no SNGPC, emissão e guarda de documentos fiscais perante a Receita Federal e Secretaria da Fazenda do RS, e cumprimento do Art. 15 do Marco Civil da Internet.
            </li>
            <li>
              <strong>Execução de Contrato e Procedimentos Preliminares (Art. 7º, V da LGPD):</strong>
              Tratamento indispensável para processamento do pedido de compra, faturamento, entrega domiciliar dos medicamentos e atendimento de pós-venda.
            </li>
            <li>
              <strong>Legítimo Interesse do Controlador (Art. 7º, IX da LGPD):</strong>
              Aprimoramento técnico da experiência de compra, prevenção a fraudes em transações eletrônicas e segurança da infraestrutura de rede, sempre respeitados os direitos e liberdades fundamentais do titular.
            </li>
            <li>
              <strong>Consentimento do Titular (Art. 7º, I e Art. 11, I da LGPD):</strong>
              Coleta de consentimento livre, inequívoco, destacado e informado através de nossa Central Flutuante de Governança e Escolha de Dados para funcionalidades opcionais (ex: geolocalização exata, lembretes de recompra de remédios de uso contínuo e notificações telemáticas por WhatsApp).
            </li>
          </ul>
        </div>

        <div className="legal-clause">
          <h3>Capítulo V — Da Cláusula Pétrea: Vedação Absoluta à Venda e Cessão de Dados de Saúde</h3>
          <div className="legal-callout danger" style={{ borderLeft: "4px solid #b91c1c", background: "#fef2f2", padding: "16px", borderRadius: "12px", margin: "14px 0" }}>
            <h4 style={{ color: "#991b1b", margin: "0 0 8px", fontSize: "1.05rem" }}>
              Compromisso Institucional e Cláusula Pétrea — Art. 11, § 4º da Lei nº 13.709/2018
            </h4>
            <p style={{ margin: "0 0 10px", fontSize: "0.86rem", color: "#7f1d1d", lineHeight: 1.6 }}>
              <strong>É TERMINANTEMENTE VEDADA</strong> a comercialização, aluguel, compartilhamento, cessão onerosa ou gratuita de quaisquer dados pessoais sensíveis de saúde de nossos clientes e pacientes — incluindo históricos de receituários médicos, diagnósticos clínicos, posologias e medicamentos adquiridos — com:
            </p>
            <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "0.84rem", color: "#7f1d1d" }}>
              <li>Operadoras de planos privados de assistência à saúde e seguradoras médicas;</li>
              <li>Instituições financeiras, bancos e birôs de análise de crédito;</li>
              <li>Empresas de publicidade direcionada, corretores de dados (data brokers) ou redes de mídia programática.</li>
            </ul>
            <p style={{ margin: "10px 0 0", fontSize: "0.82rem", color: "#991b1b" }}>
              A Farmácia Poupe Mais repudia e proíbe qualquer prática que possa resultar em seleção de riscos, discriminação tarifária de planos de saúde ou violação do sigilo terapêutico.
            </p>
          </div>
        </div>

        <div className="legal-clause">
          <h3>Capítulo VI — Do Compartilhamento Estrito e Legítimo com Terceiros</h3>
          <p>
            O compartilhamento de dados pessoais restringe-se ao estritamente necessário para o cumprimento de obrigações legais e operacionais, mediante formalização de cláusulas contratuais rigorosas de sigilo e conformidade com a LGPD:
          </p>
          <ul>
            <li><strong>Autoridades Sanitárias e Fiscais:</strong> ANVISA, Vigilância Sanitária Municipal, Conselho Regional de Farmácia (CRF/RS), Receita Federal e Secretaria Estadual da Fazenda, exclusivamente nos limites da lei e no âmbito de auditorias regulatórias obrigatórias.</li>
            <li><strong>Operadores de Pagamento e Antifraude:</strong> Gateways de pagamento homologados com certificação PCI-DSS, para processamento de pagamentos criptografados.</li>
            <li><strong>Operadores Logísticos e Entregadores Credenciados:</strong> Compartilhamento restrito ao nome do destinatário, endereço de entrega e telefone de contato, sendo expressamente proibido aos entregadores o acesso a diagnósticos médicos ou detalhes clínicos da prescrição.</li>
            <li><strong>Autoridades Judiciais ou Policiais:</strong> Exclusivamente mediante apresentação de mandado judicial fundamentado ou requisição formal legalmente amparada.</li>
          </ul>
        </div>

        <div className="legal-clause">
          <h3>Capítulo VII — Dos Prazos de Retenção e Descarte Seguro de Dados</h3>
          <p>
            Os dados pessoais serão retidos pela Farmácia Poupe Mais durante o tempo necessário para atingir as finalidades do tratamento, observados os prazos legais de guarda obrigatória:
          </p>
          <div className="legal-data-table-wrap" style={{ overflowX: "auto", margin: "14px 0" }}>
            <table style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--teal-deep)", color: "#ffffff" }}>
                  <th style={{ padding: "10px 12px" }}>Categoria de Dado</th>
                  <th style={{ padding: "10px 12px" }}>Prazo de Retenção Legal</th>
                  <th style={{ padding: "10px 12px" }}>Fundamento Legal / Regulatório</th>
                </tr>
              </thead>
              <tbody style={{ divideY: "1px solid #e2ece7" }}>
                <tr>
                  <td style={{ padding: "10px 12px", fontWeight: "bold" }}>Receitas de Medicamentos Controlados</td>
                  <td style={{ padding: "10px 12px" }}>5 (cinco) anos</td>
                  <td style={{ padding: "10px 12px" }}>Portaria SVS/MS nº 344/1998 e RDC ANVISA nº 44/2009</td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 12px", fontWeight: "bold" }}>Receitas de Antimicrobianos (Antibióticos)</td>
                  <td style={{ padding: "10px 12px" }}>2 (dois) anos</td>
                  <td style={{ padding: "10px 12px" }}>RDC ANVISA nº 20/2011, Artigo 14</td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 12px", fontWeight: "bold" }}>Dados Cadastrais e Notas Fiscais Eletrônicas</td>
                  <td style={{ padding: "10px 12px" }}>5 (cinco) anos</td>
                  <td style={{ padding: "10px 12px" }}>Código Tributário Nacional e Código de Defesa do Consumidor</td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 12px", fontWeight: "bold" }}>Logs de Acesso a Aplicações de Internet</td>
                  <td style={{ padding: "10px 12px" }}>6 (seis) meses</td>
                  <td style={{ padding: "10px 12px" }}>Artigo 15 da Lei nº 12.965/2014 (Marco Civil da Internet)</td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 12px", fontWeight: "bold" }}>Dados Apoiados Exclusivamente no Consentimento</td>
                  <td style={{ padding: "10px 12px" }}>Até revogação expressa pelo titular</td>
                  <td style={{ padding: "10px 12px" }}>Artigo 8º, § 5º da Lei nº 13.709/2018 (LGPD)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Exauridos os prazos prescricionais e regulatórios, os dados serão eliminados de forma segura mediante deleção criptográfica irreversível ou mantidos anonimizados para fins estatísticos internos (Art. 16, IV da LGPD).
          </p>
        </div>

        <div className="legal-clause">
          <h3>Capítulo VIII — Dos Direitos dos Titulares de Dados (Art. 18 da LGPD) e Canal de Exercício</h3>
          <p>
            O titular de dados pessoais possui o direito de obter da Farmácia Poupe Mais, a qualquer momento e mediante requisição formal gratuita:
          </p>
          <ul>
            <li><strong>I — Confirmação da existência de tratamento:</strong> Saber se a farmácia trata dados sobre você;</li>
            <li><strong>II — Acesso aos dados:</strong> Solicitar cópia legível de todos os dados cadastrais e de saúde mantidos em nossos sistemas;</li>
            <li><strong>III — Correção de dados incompletos, inexatos ou desatualizados:</strong> Atualizar suas informações cadastrais;</li>
            <li><strong>IV — Anonimização, bloqueio ou eliminação:</strong> Relativo a dados desnecessários, excessivos ou tratados em desconformidade com a LGPD;</li>
            <li><strong>V — Portabilidade dos dados:</strong> Solicitar o envio dos seus dados a outro fornecedor de serviços de saúde, mediante requisição expressa e observados os segredos comerciais;</li>
            <li><strong>VI — Eliminação dos dados pessoais tratados com consentimento:</strong> Salvo nas hipóteses de guarda obrigatória por dever regulatório da ANVISA ou dever fiscal;</li>
            <li><strong>VII — Informação sobre compartilhamento:</strong> Conhecer as entidades públicas e privadas com as quais a farmácia realizou uso compartilhado de dados;</li>
            <li><strong>VIII — Informação sobre a possibilidade de não fornecer consentimento:</strong> Informação sobre as consequências da negativa de consentimento;</li>
            <li><strong>IX — Revogação do consentimento:</strong> Revogar suas autorizações a qualquer momento por meio de procedimento gratuito e facilitado.</li>
          </ul>
          <div className="legal-callout warning">
            <strong>Procedimento Formal para Exercício dos Direitos:</strong>
            <br />
            Para exercer quaisquer dos direitos acima, envie requerimento formal para o e-mail: <strong style={{ color: "var(--farma-green-dark)" }}>dpo@poupemais.com.br</strong>, indicando: (i) seu nome completo, (ii) CPF, (iii) direito que deseja exercer e (iv) comprovante de identidade para prevenção de fraudes. Responderemos no prazo regulatório de até 15 (quinze) dias corridos.
          </div>
        </div>

        <div className="legal-clause">
          <h3>Capítulo IX — Das Medidas de Segurança da Informação e Criptografia</h3>
          <p>
            A Farmácia Poupe Mais implementa padrões avançados de segurança técnica e administrativa para resguardar a integridade, confidencialidade e disponibilidade dos dados:
          </p>
          <ul>
            <li>Criptografia de ponta a ponta nas transmissões de rede via protocolo TLS 1.3 com chaves seguras;</li>
            <li>Isolamento de receitas médicas e documentos sensíveis em repositórios criptografados com acesso restrito a farmacêuticos habilitados;</li>
            <li>Controle rigoroso de privilégios de acesso baseado em papéis (Role-Based Access Control - RBAC);</li>
            <li>Trilhas de auditoria imutáveis com registros de hash criptográfico (padrão <code>AUD-XXXXX-XF</code>) para cada visualização, aprovação ou estorno;</li>
            <li>Testes periódicos de vulnerabilidade e varreduras automatizadas de segurança.</li>
          </ul>
        </div>

        <div className="legal-clause">
          <h3>Capítulo X — Da Central Flutuante de Governança e Escolha de Dados</h3>
          <p>
            Em respeito à autodeterminação informativa do titular (Artigo 2º, II da LGPD), disponibilizamos em nossa plataforma a <strong>Central Flutuante de Governança e Escolha de Dados</strong>.
            <br />
            Por meio deste painel interativo permanente, acessível em todas as páginas do site através do botão flutuante no canto inferior da tela, você tem a liberdade absoluta de:
          </p>
          <ul>
            <li>Verificar exatamente quais categorias de dados estão ativas;</li>
            <li>Ativar ou desativar individualmente a coleta de dados de localização/CEP, perfil farmacoterapêutico para uso contínuo, telemetria analítica e alertas telemáticos por WhatsApp;</li>
            <li>Manter ativas apenas as categorias estritamente obrigatórias por lei sanitária;</li>
            <li>Consultar a data e o horário exatos do registro de seu consentimento.</li>
          </ul>
        </div>

        <div className="legal-clause">
          <h3>Capítulo XI — Das Notificações de Incidentes de Segurança</h3>
          <p>
            Na remota hipótese de ocorrência de incidente de segurança que possa acarretar risco ou dano relevante aos titulares de dados, a Farmácia Poupe Mais comunicará formalmente o fato à Autoridade Nacional de Proteção de Dados (ANPD) e aos titulares afetados, em prazo razoável, em conformidade com o Artigo 48 da Lei nº 13.709/2018, descrevendo a natureza dos dados, as medidas técnicas de proteção empregadas e as providências adotadas para mitigar os efeitos.
          </p>
        </div>

        <div className="legal-clause">
          <h3>Capítulo XII — Das Disposições Finais e Foro de Eleição</h3>
          <p>
            Esta Política integra formalmente os <Link href="/termos" className="text-link" style={{ textDecoration: "underline" }}>Termos de Uso e Condições Gerais de Dispensação Farmacêutica</Link> da Farmácia Poupe Mais, sendo regida pelas leis da República Federativa do Brasil, em especial pela Lei nº 13.709/2018 (LGPD), Marco Civil da Internet e legislação sanitária. Fica eleito o <strong>Foro da Comarca de Porto Alegre, Estado do Rio Grande do Sul</strong>, para dirimir eventuais controvérsias decorrentes deste documento, ressalvado o direito de o titular optar pelo foro de seu próprio domicílio.
          </p>
        </div>

        <div className="legal-clause-footer">
          <p>
            <strong>Vigência e Última Atualização:</strong> 08 de setembro de 2026.
            <br />
            <strong>Comitê de Privacidade e Proteção de Dados (DPO)</strong> — Farmácia Poupe Mais Ltda.
            <br />
            Contato: <a href="mailto:dpo@poupemais.com.br" style={{ color: "var(--teal)", textDecoration: "underline" }}>dpo@poupemais.com.br</a>
          </p>
        </div>
      </section>
    </ContentPage>
  );
}
