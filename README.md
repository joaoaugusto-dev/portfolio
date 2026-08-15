# Portfólio — João Augusto de Freitas

Duas apps:

- `server/` — API Express + Sequelize (Postgres do Supabase) + upload para o Supabase Storage. Hospedar no Railway.
- `client/` — site + painel admin em Next.js/React. Hospedar no Vercel.

## 1. Configurar o Supabase

1. Crie um projeto em https://supabase.com.
2. Em **SQL Editor > New query**, cole o conteúdo de [`server/database.sql`](server/database.sql) e rode. Isso cria o bucket público `uploads`, a tabela `Projects` e já insere os 11 projetos originais do portfólio.
3. Em **Authentication > Users**, crie seu usuário admin (email + senha) — é o login do painel. Não há cadastro público, então crie manualmente pelo painel do Supabase.
4. Em **Project Settings > API**, anote `Project URL`, a chave `anon public` e a `service_role` (secreta).
5. Em **Project Settings > Database > Connect**, aba **Transaction pooler**, copie a connection string do Postgres. Use o pooler (porta 6543), não o host direto `db.xxxx.supabase.co` — esse só tem endereço IPv6 e não conecta em redes sem suporte a IPv6.

## 2. Rodar o backend (`server/`)

```bash
cd server
cp .env.example .env   # preencha DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev               # http://localhost:4000
```

Se você pulou o passo do `database.sql` no Supabase, rode `npm run seed` — o Sequelize cria a tabela automaticamente ao subir o servidor e o script popula os projetos originais (só roda se a tabela estiver vazia).

Deploy no Railway: crie um projeto apontando para `server/`, configure as mesmas variáveis de `.env.example` e `CORS_ORIGIN` com a URL de produção do site no Vercel.

## 3. Rodar o frontend (`client/`)

```bash
cd client
cp .env.local.example .env.local   # preencha com URL/anon key do Supabase e a URL da API
npm install
npm run dev              # http://localhost:3000
```

Deploy no Vercel: importe a pasta `client/` como projeto e configure as mesmas variáveis de `.env.local.example`, com `NEXT_PUBLIC_API_URL` apontando pro backend no Railway.

## Painel admin

Acesse `/admin`, entre com o usuário criado no Supabase Auth. Lá dá pra:

- Adicionar/editar/excluir projetos (aba **Projetos**).
- Enviar arquivos (imagem, vídeo, PDF, outros) e copiar o link público pra compartilhar (aba **Arquivos**). O link de imagem também pode ser colado no campo "URL da imagem" ao criar um projeto.

## O que ficou de fora (de propósito)

- Seção de linha do tempo / cursos do site antigo — dava pra portar, mas não fazia parte do pedido (projetos + admin + upload). Fica fácil de adicionar depois seguindo o padrão de `components/About.js`.
- Multi-idioma (pt/en) do site antigo — o conteúdo migrado ficou só em português; adicionar de volta significa reintroduzir um dicionário de traduções, que eu não quis assumir sem confirmar que ainda é necessário.
