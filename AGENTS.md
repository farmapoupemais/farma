# AGENTS.md

Este repositório é a loja digital Farmácia Poupe Mais, construída com Next.js, Vinext, D1/R2, Supabase e autenticação do ChatGPT/OpenAI Sites.

## Visão rápida do projeto

- Use [README.md](README.md) como fonte principal do contexto de produto, perfis de usuário e regras de negócio.
- A aplicação usa rotas em [app/](app/) para páginas e APIs, componentes em [components/](components/), e lógica compartilhada em [lib/](lib/).
- Persistência e schema ficam em [db/](db/), [drizzle/](drizzle/) e no SQL em [supabase_setup.sql](supabase_setup.sql), [supabase_schema.sql](supabase_schema.sql) e [supabase_security_hardening.sql](supabase_security_hardening.sql).
- O código de segurança e autorização é sensível: [lib/access.ts](lib/access.ts), [lib/permissions.ts](lib/permissions.ts), [lib/security.ts](lib/security.ts) e [app/chatgpt-auth.ts](app/chatgpt-auth.ts).

## Comandos principais

- `npm run dev` — desenvolvimento local.
- `npm run build` — build do Vinext/Next.
- `npm run lint` — validação ESLint.
- `npm test` — build + testes de renderização/regressão de segurança.
- `npm run db:generate` — gera migração Drizzle.

## Convenções importantes

- Preserve o idioma e o tom em português do Brasil nas mensagens, textos e comentários visíveis ao usuário.
- Respeite os perfis e permissões do sistema: proprietário, gerente, farmacêutico, catálogo/marketing, atendimento e cliente.
- Não contorne autenticação, autorização ou validação de receitas. O fluxo de receitas e produtos é uma área crítica do domínio.
- Mantenha a separação entre D1 (estado transacional) e R2 (documentos privados).
- Sempre priorize sanitização, validação e auditoria quando alterar entradas de usuário, uploads, documentos ou logs.
- Antes de mudar regras de acesso, estoque, pedido, receita ou produtos regulados, leia primeiro os arquivos das áreas afetadas em [lib/](lib/), [app/api/](app/api/) e [db/schema.ts](db/schema.ts).
- Quando houver mudança em schema ou regras de banco, prefira gerar migrações via `npm run db:generate` e revisar o impacto antes de aplicar.

## Orientação para ChatGPT e Gemini CLI

- Quando o agente for solicitado a configurar, instalar ou orientar setup de ferramentas para o projeto, use a versão mais recente estável disponível do ChatGPT e do Gemini CLI, salvo instrução explícita em contrário do usuário.
- Ao documentar ou sugerir instalação em qualquer ambiente (local, CI, deploy, container), mantenha instruções consistentes e facilmente reproduzíveis em todos os contextos.
- Evite versões antigas ou caminhos improvisados quando o objetivo for "instala em todo lugar"; prefira comandos de instalação padronizados e atualizados.
- Se a tarefa exigir uma escolha de ferramenta, prefira manter o ecossistema do projeto compatível com o ChatGPT e com o Gemini CLI sem quebrar as convenções do repositório.

## Áreas a verificar antes de concluir alterações

- [README.md](README.md)
- [package.json](package.json)
- [lib/access.ts](lib/access.ts)
- [lib/security.ts](lib/security.ts)
- [lib/permissions.ts](lib/permissions.ts)
- [db/schema.ts](db/schema.ts)
- [tests/](tests/)

## Regras de edição

- Mantenha alterações pequenas, focadas e compatíveis com a arquitetura atual.
- Reaproveite o estilo e os padrões já existentes no código e nos módulos de segurança.
- Para tarefas complexas, documente o que foi alterado e o porquê no próprio código ou em arquivos de documentação existentes, sem duplicar conteúdo do README.
- Faça validações relevantes antes de finalizar: lint, testes e checagens de segurança quando aplicável.
