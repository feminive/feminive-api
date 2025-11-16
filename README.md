# Feminive API

API serverless pra centralizar dados do site estático [feminive-fanfics](https://github.com/). Ela roda na Vercel com funções serverless e usa o Supabase (Postgres gerenciado) como banco de dados. Todas as respostas saem em JSON, com mensagens em português informal e formato de erro padronizado `{ "mensagem": string, "detalhes"?: any }`.

## Como rodar localmente

1. **Instale dependências**
   ```bash
   npm install
   ```
2. **Configure variáveis de ambiente**
   Crie um arquivo `.env.local` (lido pela Vercel CLI) com:
   ```bash
   SUPABASE_URL=... # URL do projeto Supabase
   SUPABASE_SERVICE_ROLE_KEY=... # chave service_role do Supabase
   ```
3. **Rodar em modo desenvolvimento**
   ```bash
   npm run dev
   ```
   Isso executa `vercel dev`, expondo as rotas em `http://localhost:3000/api/...`.

4. **Testes automatizados**
   ```bash
   npm test
   ```

5. **Lint**
   ```bash
   npm run lint
   ```

6. **Deploy manual**
   ```bash
   npm run deploy
   ```
   (Requer `vercel` CLI autenticada.)

## Estrutura das rotas

| Método e rota | Descrição rápida |
| ------------- | ---------------- |
| `POST /api/newsletter/inscrever` | Inscreve/reativa um e-mail na newsletter |
| `POST /api/newsletter/cancelar` | Marca inscrição como cancelada |
| `DELETE /api/newsletter/remover` | Remove inscrição (hard delete) |
| `GET /api/newsletter/status?email=` | Consulta status da inscrição |
| `GET /api/leitores/:email` | Busca perfil do leitor |
| `PUT /api/leitores/:email` | Cria/atualiza apelido do leitor |
| `POST /api/leitores/:email/progresso` | Registra progresso de leitura por slug |
| `GET /api/leitores/:email/progresso` | Lista progresso e posts concluídos |
| `GET /api/posts/:slug/comentarios` | Lista comentários do post |
| `POST /api/posts/:slug/comentarios` | Cria novo comentário (sem links) |
| `POST /api/comentarios/:id/curtir` | Incrementa curtidas limitando IP |
| `GET /api/posts/mais-lidos?limit=&locale=` | Ranking dos posts com mais leituras concluídas por locale (`br`/`en`, limite opcional de até 50) |

Todas as respostas de sucesso incluem a chave `mensagem` com um resumo amigável. Erros sempre retornam `{ "mensagem": string, "detalhes"?: any }`.

## Validações importantes

- E-mails normalizados para minúsculas.
- Apelido máximo 60 caracteres e sem HTML.
- Progresso de leitura entre 0 e 1.
- Comentários entre 5 e 500 caracteres, sem links.
- Curtidas por IP são únicas por comentário.

## Configurando o Supabase

1. **Instale a CLI**
   ```bash
   npm install -g supabase
   ```
2. **Faça login**
   ```bash
   supabase login
   ```
3. **Inicialize o projeto (caso ainda não tenha)**
   ```bash
   supabase init
   ```
4. **Aplique as migrations**
   ```bash
   supabase migration up
   ```
   Isso cria as tabelas:
   - `newsletter_inscricoes`
   - `leitores`
   - `leitura_progresso`
   - `comentarios`
   - `comentario_curtidas`

   E a função `increment_comentario_curtidas` usada para atualizar curtidas.

5. **Policies e RLS**
   Todas as tabelas têm RLS habilitado por padrão. Como a API usa a chave `service_role`, as policies são ignoradas, mas recomenda-se criar policies específicas se for expor chaves públicas. Exemplos:
   ```sql
   create policy "Leitores só alteram a si mesmos" on public.leitores
     for update using (auth.email() = email);
   ```

6. **Migrations futuras**
   Para criar novas migrations use:
   ```bash
   supabase migration new "descricao"
   ```
   Depois edite o arquivo gerado em `supabase/migrations`.

7. **Seeds (opcional)**
   Você pode adicionar scripts `.sql` em `supabase/seed.sql` e rodar:
   ```bash
   supabase db reset --seed
   ```

## Variáveis de ambiente na Vercel

No painel da Vercel, configure as mesmas variáveis usadas localmente:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Defina-as para os ambientes `Development`, `Preview` e `Production` conforme necessário.

## Testes

Os testes com Vitest cobrem as validações de entrada e as respostas das rotas em cenários principais usando mocks das camadas de repositório. Rode tudo com `npm test`.

## Formato de erro

Sempre que algo dá errado, espere respostas como:
```json
{
  "mensagem": "apelido inválido",
  "detalhes": [ ... ]
}
```
O front pode confiar nesse formato pra exibir feedback rápido para quem usa o site.

## Boas práticas adicionais

- Reutilize a camada de serviços para facilitar mocks em testes.
- Centralize mensagens de erro amigáveis no front caso queira traduzir.
- Como a API usa a chave `service_role`, mantenha essa chave só nas funções serverless (não expose no front Astro).

Qualquer dúvida ou ajuste futuro é só criar uma nova migration e atualizar as rotas.
