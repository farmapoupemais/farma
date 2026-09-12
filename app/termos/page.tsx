import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/content-page";

export const metadata: Metadata = {
  title: "Termos de Uso e Condições Gerais de Dispensação Farmacêutica e Compra",
  description:
    "Instrumento contratual e termos de uso da Farmácia Poupe Mais em estrita conformidade com a RDC ANVISA nº 44/2009, Lei Federal nº 13.021/2014, Código de Defesa do Consumidor (Lei nº 8.078/1990), Decreto nº 7.962/2013 e Marco Civil da Internet.",
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Termos de Uso e Condições Gerais de Dispensação Farmacêutica"
      eyebrow="Contrato de Adesão & Marco Regulatório Sanitário"
      description="Instrumento jurídico que estabelece os direitos, deveres, condições de navegação, dispensação remota de medicamentos, tele-entrega expressa e garantias sanitárias da Farmácia Poupe Mais, em estrito cumprimento à RDC nº 44/2009 da ANVISA, Lei nº 13.021/2014, Lei nº 8.078/1990 (CDC) e Decreto Federal nº 7.962/2013."
    >
      {/* 1. QUADRO OFICIAL DE IDENTIFICAÇÃO REGULATÓRIA OBRIGATÓRIA (Art. 53 da RDC ANVISA nº 44/2009) */}
      <section className="legal-notice-box" aria-label="Identificação Regulatória e Sanitária">
        <div className="legal-badge-pill">Informações Sanitárias Obrigatórias — Art. 53 da RDC ANVISA nº 44/2009</div>
        <h2 style={{ marginTop: "10px", fontSize: "var(--text-xl)", fontWeight: "var(--font-bold)", color: "var(--teal-deep)" }}>
          Identificação do Estabelecimento, Responsabilidade Técnica e Fiscalização
        </h2>
        <p style={{ margin: "6px 0 16px", fontSize: "var(--text-sm)", color: "var(--muted)", lineHeight: 1.6 }}>
          O presente comércio eletrônico opera exclusivamente como extensão digital vinculada à farmácia física aberta ao público, sob supervisão e responsabilidade contínua de farmacêutico habilitado durante todo o período de atendimento e funcionamento do estabelecimento.
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
            <strong>42.189.304/0001-85</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Inscrição Estadual</span>
            <strong>096/3948210</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Endereço Físico do Estabelecimento</span>
            <strong>Av. Paraguassú, 2200 — Imbé / RS — CEP 95625-000</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Horário de Funcionamento Presencial</span>
            <strong>Todos os dias, inclusive domingos e feriados, das 07:30 às 22:30</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Autorização de Funcionamento (AFE / ANVISA)</span>
            <strong>AFE ANVISA nº 7.39482.1</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Alvará Sanitário Municipal</span>
            <strong>Licença Sanitária nº 2026/0481 — Vigilância Sanitária Municipal de Imbé</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Farmacêutico Responsável Técnico (RT)</span>
            <strong>Dr. Raul da Costa • CRF/RS nº 14.892</strong>
          </div>
          <div className="legal-data-card">
            <span className="legal-data-label">Certidão de Regularidade Técnica (CRT)</span>
            <strong>CRT CRF/RS nº 98765/2026 (Validade Vigente)</strong>
          </div>
          <div className="legal-data-card highlight-contact">
            <span className="legal-data-label">Plantão de Orientação Farmacêutica Direta</span>
            <strong style={{ color: "var(--farma-green-dark)" }}>Telefone / WhatsApp: (51) 98183-4039 • (51) 99794-8494</strong>
            <small>Canal telefônico e telemático para assistência farmacêutica imediata e esclarecimento de dúvidas sobre posologia, interações medicamentosas, contraindicações e modo de uso.</small>
          </div>
          <div className="legal-data-card highlight-contact">
            <span className="legal-data-label">Canais dos Órgãos Oficiais de Fiscalização</span>
            <span>
              <strong>ANVISA:</strong> <a href="https://www.gov.br/anvisa" target="_blank" rel="noopener noreferrer">www.gov.br/anvisa</a> | Disque-Saúde: 0800 642 9782
              <br />
              <strong>CRF/RS:</strong> <a href="https://www.crfrs.org.br" target="_blank" rel="noopener noreferrer">www.crfrs.org.br</a> | Telefone: (51) 3320-1800
              <br />
              <strong>PROCON Porto Alegre:</strong> Rua dos Andradas, nº 686 — Fone: 156
            </span>
          </div>
        </div>
      </section>

      {/* 2. TEXTO CONTRATUAL COMPLETO COM TÉCNICA JURÍDICA ESTRUTURADA */}
      <section className="legal-clauses-wrapper">
        <div className="legal-clause">
          <h3>Capítulo I — Do Objeto, da Natureza da Plataforma e da Adesão Vinculante</h3>
          <p>
            <strong>1.1. Objeto Contratual:</strong> O presente Contrato de Adesão e Termos Gerais de Uso disciplina o acesso ao sítio eletrônico, a consulta ao catálogo institucional de produtos, a realização de pedidos e o fornecimento de serviços de dispensação farmacêutica e tele-entrega operados pela <strong>Farmácia Poupe Mais de Medicamentos e Perfumaria Ltda.</strong>
          </p>
          <p>
            <strong>1.2. Unidade de Saúde (Lei Federal nº 13.021/2014):</strong> O Usuário declara ter ciência de que a Farmácia Poupe Mais constitui uma <em>unidade de prestação de serviços de assistência à saúde, assistência farmacêutica e orientação sanitária individual e coletiva</em>, não se equiparando a estabelecimentos meramente mercantis. Toda e qualquer dispensação de medicamentos opera sob o crivo técnico, indelegável e ético do profissional Farmacêutico de plantão.
          </p>
          <p>
            <strong>1.3. Adesão Plena e Irretratável:</strong> Ao navegar pela plataforma, criar uma conta de usuário ou concluir qualquer pedido de compra, o Usuário declara ter lido, compreendido e aceitado expressamente, de forma livre e informada, a totalidade das cláusulas deste instrumento e da correlata <Link href="/privacidade" className="text-link" style={{ textDecoration: "underline" }}>Política de Privacidade e LGPD</Link>. Caso não concorde com qualquer disposição aqui estatuída, deverá abster-se imediatamente de utilizar os serviços.
          </p>
          <p>
            <strong>1.4. Não Substituição de Diagnóstico Médico:</strong> As informações técnicas, sinopses de bula, indicações terapêuticas e materiais educativos veiculados no site possuem caráter exclusivamente informativo, preventivo e educativo. <strong>Em nenhuma hipótese tais informações substituem a consulta, o diagnóstico clínico, a prescrição médica ou a orientação odontológica e médico-veterinária presencial.</strong>
          </p>
        </div>

        <div className="legal-clause">
          <h3>Capítulo II — Do Acesso à Plataforma, Cadastro, Capacidade Civil e Segurança</h3>
          <p>
            <strong>2.1. Capacidade Civil:</strong> Os serviços digitais destinam-se exclusivamente a pessoas físicas plenamente capazes, nos termos dos artigos 1º a 5º do Código Civil Brasileiro (Lei nº 10.406/2002), ou a menores emancipados. O cadastro de menores de 18 (dezoito) anos somente será admitido quando formalmente assistidos ou representados por seus pais ou responsáveis legais, os quais responderão integralmente por todos os atos praticados na plataforma.
          </p>
          <p>
            <strong>2.2. Veracidade dos Dados e Responsabilidade Legal:</strong> O Usuário garante a autenticidade, exatidão e atualização de todos os dados cadastrais informados, incluindo nome civil completo, Cadastro de Pessoas Físicas (CPF/MF válido) e endereço físico. A prestação de declaração falsa ou a inserção de dados de terceiros sem autorização configura ilícito civil e criminal, nos termos do artigo 299 do Código Penal Brasileiro (falsidade ideológica), sujeitando o infrator às sanções legais cabíveis e ao imediato cancelamento da conta.
          </p>
          <p>
            <strong>2.3. Guarda e Sigilo de Senha:</strong> As credenciais de acesso (login e senha) são de uso pessoal e intransferível. O Usuário é o único e exclusivo responsável pela confidencialidade de sua senha e por todas as operações realizadas em sua conta. Em caso de perda, extravio, furto ou suspeita de uso não autorizado, o Usuário deverá comunicar imediatamente a equipe de suporte através do canal oficial de atendimento.
          </p>
          <p>
            <strong>2.4. Suspensão e Cancelamento Cautelar:</strong> A Farmácia Poupe Mais reserva-se o direito de recusar cadastros, suspender ou cancelar unilateralmente contas de usuários que apresentem indícios de fraude, duplicidade cadastral abusiva, violação das normas sanitárias, fornecimento de informações inverídicas, uso indevido da plataforma ou inadimplemento contratual.
          </p>
        </div>

        <div className="legal-clause">
          <h3>Capítulo III — Da Assistência Farmacêutica e Garantia Sanitária</h3>
          <p>
            A dispensação de produtos e medicamentos realizada pela Farmácia Poupe Mais obedece rigorosamente às diretrizes da Agência Nacional de Vigilância Sanitária (ANVISA), do Conselho Federal de Farmácia (CFF) e da legislação sanitária brasileira:
          </p>

          <p>
            <strong>3.1. Orientação Farmacêutica e Posologia:</strong> A Farmácia Poupe Mais assegura a disponibilidade permanente de canais diretos de atendimento (telefone e WhatsApp) para que o consumidor receba esclarecimentos prévios sobre modo de uso, contraindicações e reações adversas antes e após a conclusão do pedido.
          </p>

          <p>
            <strong>3.2. Procedência e Rastreabilidade (RDC ANVISA nº 44/2009):</strong> Todos os medicamentos, cosméticos e suplementos comercializados possuem registro ativo e regular na ANVISA e são adquiridos diretamente de fabricantes e distribuidoras farmacêuticas autorizadas, com nota fiscal eletrônica e garantia de procedência.
          </p>

          <p>
            <strong>3.3. Autonomia Técnica do Farmacêutico (Lei Federal nº 13.021/2014):</strong> O Farmacêutico Responsável Técnico e sua equipe possuem total autonomia técnico-científica e o dever legal de orientar os clientes quanto ao uso consciente e de intervir caso sejam constatados indícios de uso abusivo ou incompatibilidades terapêuticas manifestas.
          </p>
        </div>

        <div className="legal-clause">
          <h3>Capítulo IV — Da Política Sanitária de Trocas, Devoluções e Direito de Arrependimento</h3>
          <p>
            <strong>4.1. Regra Geral Sanitária de Medicamentos (Artigo 90 da RDC ANVISA nº 44/2009):</strong>
            Em virtude da legislação sanitária brasileira de proteção à saúde pública e segurança do paciente, <strong>medicamentos que tenham saído do controle e guarda do estabelecimento farmacêutico não podem ser devolvidos, trocados ou reinseridos no estoque comercial</strong>.
            <br />
            <em>Fundamento Sanitário:</em> Uma vez entregue o medicamento ao domicílio do consumidor, cessa a garantia da cadeia de custódia sanitária, tornando biológica e tecnicamente impossível atestar que o produto foi mantido sob as condições adequadas de temperatura, umidade, luminosidade e integridade físico-química exigidas pela farmacopeia brasileira.
          </p>
          <p>
            <strong>4.2. Hipóteses Legítimas de Substituição ou Ressarcimento:</strong> A Farmácia Poupe Mais garante a substituição imediata do medicamento por outro do mesmo lote/especificação ou a restituição integral dos valores pagos nos seguintes casos específicos, após validação farmacêutica:
          </p>
          <ul>
            <li>Desvio de qualidade ou defeito de fabricação comprovado (ex: quebra de lacre primário, coloração, odor ou consistência anômalos);</li>
            <li>Determinação de recolhimento sanitário de lote (Recall) expedida pela ANVISA ou pelo fabricante;</li>
            <li>Divergência entre o produto fisicamente entregue e o pedido confirmado;</li>
            <li>Avaria física comprovada decorrente do processo de transporte pela equipe de tele-entrega.</li>
          </ul>
          <p>
            <strong>4.3. Produtos Não Medicamentosos (Perfumaria, Higiene e Cosméticos):</strong> Conforme o Artigo 49 da Lei nº 8.078/1990 (Código de Defesa do Consumidor), o cliente poderá exercer o direito de arrependimento em até 7 (sete) dias corridos a contar do recebimento, <strong>desde que os produtos permaneçam em suas embalagens originais intactas, invioladas, sem indício de uso e acompanhados da respectiva Nota Fiscal</strong>. Produtos de uso íntimo ou dermocosméticos cujo lacre protetor tenha sido rompido não serão aceitos para devolução, por razões estritas de biossegurança.
          </p>
        </div>

        <div className="legal-clause">
          <h3>Capítulo V — Da Logística de Tele-Entrega, Retirada em Loja e Transporte Térmico</h3>
          <p>
            <strong>5.1. Boas Práticas de Transporte (RDC ANVISA nº 430/2020):</strong> O serviço de tele-entrega é executado em estrito cumprimento às normas de transporte de medicamentos, utilizando baús e compartimentos limpos, secos, protegidos de radiação solar direta, poeira e intempéries climáticas.
          </p>
          <p>
            <strong>5.2. Medicamentos Termolábeis (Cadeia de Frio):</strong> Medicamentos biológicos, insulinas e vacinas que exigem refrigeração (2°C a 8°C) são acondicionados e transportados em embalagens térmicas isolantes dotadas de elementos refrigerantes validados e termômetros de monitoramento, assegurando a estabilidade molecular do princípio ativo até o destino.
          </p>
          <p>
            <strong>5.3. Prazos Estimados e Roteirização:</strong> O prazo de tele-entrega expressa (de 60 a 90 minutos) e a retirada rápida em loja (30 minutos) são estimativas calculadas a partir da confirmação do pagamento e da aprovação do receituário médico pelo farmacêutico, podendo sofrer variações em caso de eventos de força maior, condições climáticas adversas ou bloqueios de vias públicas.
          </p>
          <p>
            <strong>5.4. Recebimento e Conferência Obrigatória:</strong> No momento do recebimento, o adquirente ou pessoa autorizada por ele deverá conferir o lacre da embalagem, a integridade do produto e a respectiva Nota Fiscal Eletrônica, apondo assinatura legível no canhoto de entrega.
          </p>
        </div>

        <div className="legal-clause">
          <h3>Capítulo VI — Da Política de Preços, Faturamento e Publicidade Ética</h3>
          <p>
            <strong>6.1. Preço Máximo ao Consumidor (PMC / CMED):</strong> Todos os preços de medicamentos comercializados respeitam com rigor os limites máximos estabelecidos pela Câmara de Regulação do Mercado de Medicamentos (CMED/ANVISA).
          </p>
          <p>
            <strong>6.2. Publicidade Ética e Vedação ao Consumo Irracional:</strong> Em conformidade com o Artigo 58 da RDC ANVISA nº 44/2009 e com a Lei nº 9.294/1996, a veiculação de medicamentos no site possui caráter exclusivamente técnico e informativo. São vedadas propagandas com apelo ao consumo impulsivo, promessas milagrosas de cura ou distribuição de brindes e premiações condicionadas à compra de fármacos.
          </p>
          <p>
            <strong>6.3. Formas de Pagamento e Liquidação:</strong> Aceitam-se pagamentos via Pix (com liquidação imediata), cartões de crédito e débito das principais bandeiras e pagamento presencial na tele-entrega. Os pagamentos com cartão são processados em conformidade com o padrão internacional de segurança PCI-DSS.
          </p>
        </div>

        <div className="legal-clause">
          <h3>Capítulo VII — Das Responsabilidades e Limitações Legais</h3>
          <p>
            <strong>7.1. Responsabilidade do Estabelecimento:</strong> A Farmácia Poupe Mais responsabiliza-se pela procedência lícita dos produtos fornecidos, pela autenticidade dos lotes adquiridos diretamente de distribuidoras e laboratórios autorizados pela ANVISA, pela conservação sanitária em suas dependências e pela correta escrituração fiscal e sanitária.
          </p>
          <p>
            <strong>7.2. Exclusão de Responsabilidade:</strong> A farmácia não se responsabiliza por:
          </p>
          <ul>
            <li>Uso incorreto, abusivo, intempestivo ou em desconformidade com a prescrição médica ou bula do produto;</li>
            <li>Armazenamento inadequado promovido pelo consumidor em seu domicílio após a entrega física;</li>
            <li>Reações idiossincráticas, hipersensibilidade individual ou efeitos colaterais inerentes ao próprio fármaco e descritos na literatura médica;</li>
            <li>Interrupções temporárias de acesso ao site decorrentes de falhas gerais na infraestrutura da internet, provedores de telecomunicações ou ataques cibernéticos em massa.</li>
          </ul>
        </div>

        <div className="legal-clause">
          <h3>Capítulo VIII — Da Proteção de Dados, Sigilo e Governança LGPD</h3>
          <p>
            O tratamento de dados pessoais comuns e de dados sensíveis de saúde é regido pelos preceitos da Lei Geral de Proteção de Dados Pessoais (Lei Federal nº 13.709/2018) e pelas normas éticas de sigilo farmacêutico do Conselho Federal de Farmácia. A Farmácia Poupe Mais disponibiliza uma <strong>Central Flutuante de Governança e Escolha de Dados</strong> acessível em todas as páginas, permitindo ao Usuário gerenciar com precisão e transparência quais dados autoriza ceder. O detalhamento completo consta em nossa <Link href="/privacidade" className="text-link" style={{ textDecoration: "underline" }}>Política de Privacidade e Proteção de Dados (LGPD)</Link>.
          </p>
        </div>

        <div className="legal-clause">
          <h3>Capítulo IX — Da Propriedade Intelectual</h3>
          <p>
            Todo o conteúdo da plataforma, incluindo marca nominativa e mista &quot;Farmácia Poupe Mais&quot;, layout, textos, códigos-fonte, logotipos, ícones e bases de dados constituem propriedade intelectual exclusiva da Farmácia Poupe Mais de Medicamentos e Perfumaria Ltda., protegidos pela Lei nº 9.279/1996 (Propriedade Industrial) e Lei nº 9.610/1998 (Direitos Autorais). É terminantemente proibida a reprodução, cópia, extração (scraping) ou imitação sem prévia e expressa autorização por escrito.
          </p>
        </div>

        <div className="legal-clause">
          <h3>Capítulo X — Das Disposições Gerais, Vigência e Foro de Eleição</h3>
          <p>
            <strong>10.1. Modificações dos Termos:</strong> A Farmácia Poupe Mais poderá revisar e atualizar este instrumento a qualquer momento para adequação a novas normativas da ANVISA, alterações legislativas ou melhorias de serviço. As alterações passarão a vigorar imediatamente a partir de sua publicação nesta página.
          </p>
          <p>
            <strong>10.2. Nulidade Parcial:</strong> Caso qualquer cláusula deste contrato venha a ser declarada nula ou inexequível por decisão judicial transitada em julgado, as demais cláusulas permanecerão plenamente válidas, eficazes e vinculantes.
          </p>
          <p>
            <strong>10.3. Legislação Aplicável e Foro de Eleição:</strong> O presente contrato é regido integralmente pelas leis da República Federativa do Brasil. Para a solução de quaisquer controvérsias decorrentes deste instrumento, fica eleito o <strong>Foro da Comarca de Tramandaí / Imbé, Estado do Rio Grande do Sul</strong>, com expressa renúncia a qualquer outro, por mais privilegiado que seja, ressalvada a faculdade legal de o consumidor optar pelo foro de seu domicílio, na forma do Art. 101, I do Código de Defesa do Consumidor.
          </p>
        </div>

        <div className="legal-clause-footer">
          <p>
            <strong>Data da Vigência e Última Atualização:</strong> 08 de setembro de 2026.
            <br />
            <strong>Farmácia Poupe Mais de Medicamentos e Perfumaria Ltda.</strong> — CNPJ 42.189.304/0001-85
            <br />
            Responsável Técnico: Dr. Raul da Costa • CRF/RS nº 14.892 • AFE ANVISA nº 7.39482.1
          </p>
        </div>
      </section>
    </ContentPage>
  );
}
