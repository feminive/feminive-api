# Solicitação de Projeto: Painel Admin (Next.js) para Visualizar e Editar Banco de Dados

> Documento de briefing para o time criar um novo projeto web (separado deste repositório) que permita visualizar, inserir, atualizar e remover dados do banco, com foco em segurança, boa DX e entrega rápida.

## Objetivo
Construir um painel administrativo em Next.js que permita:
- Visualizar dados do banco (listas, detalhes, filtros, ordenação e paginação).
- Criar, editar e excluir registros (CRUD completo) com validação e confirmação.
- Garantir segurança de acesso (autenticação + autorização por papel).
- Manter rastreabilidade básica (logs/auditoria) e testes mínimos de confiança.

## Escopo do MVP
- Entities suportadas no MVP: identificar automaticamente via introspecção do banco e liberar CRUD para as tabelas elegíveis. Começar por 2–4 tabelas principais (definidas abaixo em “Fonte de dados”).
- Listagens: tabela com colunas selecionáveis, busca, filtros, paginação e ordenação.
- Detalhe do registro: leitura com campos chave, ações “Editar” e “Excluir”.
- Formulários: criar/editar com validação de campos (cliente + servidor) e mensagens claras de erro.
- Segurança: login obrigatório, RBAC com perfis Admin/Editor/Viewer.
- Observabilidade mínima: logs de erro e auditoria de alterações (quem/quando/antes/depois).
- Deploy: produção em Vercel, banco existente (Supabase/Postgres). 

## Fora de Escopo (MVP)
- Workflows complexos, aprovações multi-etapas.
- Relatórios PDF e gráficos avançados (podem entrar no pós-MVP).
- Integrações externas além do banco atual.

---

## Fonte de Dados (Banco)
- Banco alvo: Postgres gerenciado pelo Supabase usado pelo projeto atual.
- Acesso: utilizar chaves do Supabase já provisionadas (criar variáveis `.env` abaixo).
- Política de segurança: habilitar e respeitar RLS no banco; operações administrativas devem rodar no servidor usando `service_role` (nunca expor no cliente).
- Descoberta do esquema: 
  - Preferível: introspecção com Prisma (`prisma db pull`) ou Supabase types (`supabase gen types typescript --project-id <id>`).
  - Gerar tipos TypeScript e manter versãoada a saída de geração (ou processo reprodutível via script).

Sugestão de tabelas iniciais (ajustar conforme o banco real):
- `users` (somente leitura para Viewer; edição para Admin)
- `articles` ou `posts` (CRUD completo para Admin/Editor)
- `newsletter_subscribers` (CRUD restrito; atenção a LGPD)
- `categories`/`tags` (CRUD completo)

---

## Stack Técnica Recomendada
- Framework: Next.js 14+ (App Router) com Server Actions habilitadas.
- UI: Tailwind CSS + shadcn/ui (ou Radix UI) para componentes acessíveis.
- Tabela de dados: TanStack Table (sorting, pagination, column visibility).
- Formulários: React Hook Form + Zod (validação schema-first compartilhada entre client/server).
- Data Access: 
  - Opção A (recomendada com Supabase): SDK do Supabase no servidor; RLS ativo; `service_role` apenas no server.
  - Opção B: Prisma Client para Postgres com conexão direta (se RLS for um impedimento). 
- Autenticação: Supabase Auth (e.g. magic link ou provedor) ou NextAuth com adapter do Supabase. Preferência: Supabase Auth para simplificar.
- Estado/Async: React Server Components + SWR/React Query no cliente quando necessário.
- Testes: Vitest/Jest (unit), Playwright (e2e básico).
- Lint/Format: ESLint + Prettier, regras sensatas para TS/React/Accessibility.

---

## Arquitetura & Padrões
- App Router: rotas em `app/` com segmentação por recurso (`/admin/<tabela>`).
- BFF/API: Route Handlers em `app/api/*` apenas quando fizer sentido (ex.: webhooks, ações não triviais). Preferir Server Actions diretamente dos componentes quando CRUD for simples.
- Pastas sugeridas:
  - `app/(admin)/admin/<recurso>/*` para páginas de lista/detalhe/editar
  - `lib/db/*` para clientes (supabase/prisma) e helpers
  - `lib/auth/*` para guardas de rota, middlewares e RBAC
  - `lib/validation/*` para schemas Zod
  - `components/*` para UI compartilhável (Table, Toolbar, FormField, Dialogs)
  - `styles/*` Tailwind config e temas
  - `tests/*` para unit/e2e
- RBAC: 
  - Roles: `admin`, `editor`, `viewer`.
  - Mapeamento por tabela/ação definido em config (`lib/auth/policies.ts`).
  - Guardas: checagem no servidor antes de executar a operação; esconder botões no cliente quando ação não for permitida.
- Logs/Auditoria:
  - Ao salvar/atualizar/deletar, registrar: usuário, timestamp, tabela, id, diff (antes/depois quando possível).
  - Console no dev; provider simples de logs em prod (ex.: Vercel Logs). Opcional: tabela `audit_logs`.

---

## Segurança
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no cliente; usar somente em Server Actions/Route Handlers.
- Sanitização e validação em duas camadas: Zod no client e no server.
- Consultas parametrizadas (Prisma/Supabase SDK já protegem contra SQL injection).
- RLS ativo no banco para dados sensíveis; regras específicas para cada role.
- Proteção contra CSRF/XSS: 
  - Preferir Server Actions (Next) que já mitigam CSRF por design; 
  - Escapar/serializar dados renderizados; 
  - Desabilitar dangerouslySetInnerHTML sem sanitização.
- Rate limiting básico em endpoints sensíveis (opcional para MVP).

---

## UX/Usabilidade
- Tabela com: pesquisa global, filtros por coluna, ordenação, paginação, seleção múltipla, ações em massa (excluir selecionados).
- Formulários com feedback claro: estados de loading, sucesso, erro; validação inline.
- Modais de confirmação para exclusão.
- Acessibilidade: seguir WCAG AA; foco visível; navegação por teclado; `aria-*` em componentes customizados.
- i18n (opcional): estrutura pronta para PT/EN, mantendo strings em dicionários.

---

## Variáveis de Ambiente
Criar `.env.local` com as chaves do Supabase (ajustar nomes conforme opção de acesso):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # servidor apenas
SUPABASE_DB_URL=            # se usar Prisma/conexão direta
```
Nunca enviar `SERVICE_ROLE` para o cliente. 

---

## Fluxos Principais (MVP)
1) Login: usuário acessa `/login` e autentica via Supabase Auth. Após login, redirecionar para `/admin`.
2) Listagem: `/admin/<tabela>` exibe registros com filtros/sort/paginação. Ações: “Novo”, “Exportar CSV” (opcional), “Excluir selecionados”.
3) Detalhe: `/admin/<tabela>/<id>` mostra campos e `Editar`/`Excluir` conforme permissão.
4) Criar/Editar: formulários com Zod; rotas server-side validam novamente; em sucesso, toasts e redirecionamento.
5) Exclusão: modal de confirmação; se falhar por permissão/relacionamento, exibir mensagem amigável.

---

## Testes
- Unit: validações (Zod), utilitários (`lib/`), RBAC (policies).
- Integração: chamadas server actions com dados mock/fake.
- E2E: smoke tests com Playwright (login, ver lista, criar/editar/excluir registro simples).

---

## Deploy & Observabilidade
- Deploy em Vercel (preview por PR + produção em main).
- Configurar variáveis de ambiente nos ambientes Vercel (Preview/Production).
- Logs: revisar erros no Vercel; opcional enviar audit logs ao banco.
- Monitoramento básico: status page opcional; alerta por falha de build.

---

## Entregáveis
- Repositório: `PROJETO_NOME` (Next.js + TS) público ou privado.
- README com: 
  - Como rodar localmente
  - Estrutura de pastas
  - Como configurar `.env`
  - Scripts de geração de tipos e migrações (se houver)
  - Fluxos de release/deploy
- Scripts npm úteis:
  - `dev`, `build`, `start`, `lint`, `test`, `e2e`
  - `db:types` para gerar tipos do Supabase ou `prisma:pull`/`prisma:generate`

---

## Critérios de Aceite (Checklist)
- Autenticação funcional (não é possível acessar `/admin` sem login).
- RBAC respeitado por rota e ação (Admin/Editor/Viewer).
- CRUD completo para as tabelas priorizadas, com validação de dados.
- Tabela com filtros, ordenação, paginação e seleção múltipla.
- Logs de auditoria básicos gravados em operação de escrita.
- `.env` documentado; `SERVICE_ROLE` não acessível no cliente.
- Testes: pelo menos 10–15 testes unitários + 2–3 e2e de fumaça passando no CI.
- Deploy em produção (Vercel) com preview por PR.

---

## Passos de Bootstrap (sugestão)
```bash
# 1) Criar projeto
npx create-next-app@latest PROJETO_NOME --ts --eslint --tailwind --app --src-dir --import-alias "@/*"

cd PROJETO_NOME

# 2) UI libs
pnpm add class-variance-authority clsx tailwind-merge @radix-ui/react-dropdown-menu
pnpm add -D tailwindcss-animate

# 3) Forms/Validation/Data
pnpm add zod react-hook-form @tanstack/react-table

# 4) Supabase (ou Prisma)
pnpm add @supabase/supabase-js
# ou
pnpm add prisma @prisma/client && npx prisma init

# 5) Testes
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
pnpm add -D playwright
```

---

## Perguntas em Aberto (para preencher antes do desenvolvimento)
- Quais tabelas do banco são prioritárias para o MVP? (listar)
- Há dados sensíveis com regras de RLS específicas? (detalhar)
- Preferimos Supabase SDK com RLS ou Prisma sem RLS? (decisão)
- Método de login preferido (email link, OAuth)? (definir)
- Necessidade de exportação CSV/Excel? (sim/não)
- Prazos e janelas de release? (datas)

---

## Anexos/Referências
- Next.js App Router: https://nextjs.org/docs/app
- Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- Supabase JS: https://supabase.com/docs/reference/javascript
- Prisma: https://www.prisma.io/docs
- TanStack Table: https://tanstack.com/table
- shadcn/ui: https://ui.shadcn.com
- React Hook Form: https://react-hook-form.com
- Zod: https://zod.dev
- Playwright: https://playwright.dev

---

## Resumo para o Time
Construir um painel admin Next.js seguro e acessível, integrando ao banco Postgres existente (Supabase), oferecendo CRUD completo e observabilidade mínima. Seguir padrões de arquitetura, RBAC, validação com Zod, UI consistente com Tailwind/shadcn, e entregar com testes e deploy em Vercel. O MVP foca em 2–4 tabelas principais, com expansão posterior conforme necessidade.
