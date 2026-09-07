# Farmácia Poupe Mais

Loja e operação digital de farmácia em português do Brasil, construída para OpenAI Sites com Vinext, D1 e R2.

## Experiência incluída

- vitrine com 48 produtos e marcas fictícios, busca, oito categorias, ofertas, produto, carrinho, entrega e retirada;
- envio privado de receita e análise farmacêutica;
- painel por perfil: proprietário, gerente, farmacêutico, catálogo/marketing, atendimento e cliente;
- catálogo administrativo conectado ao D1, estoque, classificação regulatória, banners, descontos, permissões e auditoria;
- D1 para estado transacional e R2 privado para documentos;
- Sign in with ChatGPT e autorização server-side;
- cabeçalhos de segurança, limites reais de corpo, cotas de upload e retenção limitada.

## Perfis e limites

- **Proprietário:** negócio, equipe, pedidos e auditoria; não acessa documentos clínicos.
- **Gerente:** operação, catálogo, campanhas e pedidos; não acessa documentos clínicos.
- **Farmacêutico:** receitas e aprovação da classificação regulatória de produtos.
- **Catálogo/marketing:** cria rascunhos de produtos e gerencia banners/descontos; não publica classificação regulatória.
- **Atendimento:** consulta pedidos e executa apenas cancelamentos permitidos.
- **Cliente:** compra, acompanha a conta e envia receitas próprias.

Defina `PHARMACY_OWNER_EMAIL` no ambiente publicado para habilitar o primeiro proprietário. Sem essa variável ou uma linha válida em `user_roles`, o acesso falha para o perfil de cliente.

## Fluxos sensíveis

Produtos novos entram inativos e pendentes de análise. Somente farmacêutico pode definir se exigem receita e publicá-los. Uma receita aprovada registra produtos, quantidades e validade; ela pertence ao cliente, não pode ser autoaprovada e é consumida uma única vez de forma atômica com o pedido.

Pedidos usam preço e estado ativos do D1, agregam linhas duplicadas, reservam estoque em batch transacional e validam cupons persistidos com resgate único por conta. O estado `paid` é reservado para uma futura integração autenticada de pagamentos.

## Comandos

- `npm run dev` — desenvolvimento local;
- `npm run build` — build Vinext;
- `npm run lint` — ESLint;
- `npm test` — build, renderização e regressões de segurança;
- `npm run db:generate` — gerar migração Drizzle.

## Antes de produção real

Preencha razão social, CNPJ, endereço, responsável técnico/CRF, AFE/licenças, encarregado e canais oficiais. Integre pagamento, ERP/estoque, transportadora, registro regulatório de medicamentos, verificação profissional, antimalware/CDR para documentos e uma rotina agendada de retenção. Faça revisão jurídica, sanitária e de acessibilidade com dados e fornecedores definitivos.
