# Portfólio — João Augusto de Freitas

Duas apps:

- `server/` — API Express + Sequelize (Postgres do Supabase) + upload pro Cloudflare R2. Hospedar no Render.
- `client/` — site + painel admin em Next.js/React. Hospedar no Vercel.

## 1. Configurar o Supabase (banco + autenticação)

1. Crie um projeto em https://supabase.com.
2. Em **SQL Editor > New query**, cole o conteúdo de [`server/database.sql`](server/database.sql) e rode. Isso cria a tabela `Projects` e já insere os 11 projetos originais do portfólio.
3. Ainda no SQL Editor, rode também [`server/migrations/002_courses_journey.sql`](server/migrations/002_courses_journey.sql) — cria e semeia as tabelas de `Courses` e `JourneyItem` (aba **Cursos** e **Jornada** do admin).
4. Em **Authentication > Users**, crie seu usuário admin (email + senha) — é o login do painel. Não há cadastro público, então crie manualmente pelo painel do Supabase.
5. Em **Project Settings > API**, anote `Project URL`, a chave `anon public` e a `service_role` (secreta).
6. Em **Project Settings > Database > Connect**, aba **Transaction pooler**, copie a connection string do Postgres. Use o pooler (porta 6543), não o host direto `db.xxxx.supabase.co` — esse só tem endereço IPv6 e não conecta em redes sem suporte a IPv6.

O Supabase aqui é só banco + autenticação do admin — nenhum arquivo (imagem, vídeo, capa) passa por ele.

## 2. Configurar o Cloudflare R2 (armazenamento de arquivos)

1. Crie uma conta em https://dash.cloudflare.com (grátis, sem cartão pro free tier do R2).
2. No menu lateral, **R2 Object Storage** → **Create bucket**. Nome: `portfolio` (se usar outro nome, ajuste `R2_BUCKET` no passo 3). Deixa **Private** — nenhum arquivo é servido direto do R2, tudo passa proxiado pela API (`server/src/routes/files.js` e `covers.js`).
3. Anote o **Account ID** (aparece na página do R2).
4. **Manage API tokens > Create Account API token** (não "User API token" — esse fica preso à sua conta pessoal). Permissão **Object Read & Write**, restrita ao bucket criado. Copia **Access Key ID** e **Secret Access Key** — o secret só aparece essa vez.
5. No bucket, aba **Settings > CORS Policy**, adicione (upload de arquivo grande vai direto do navegador pro R2, por isso precisa liberar `PUT`):
   ```json
   [{ "AllowedOrigins": ["http://localhost:3000", "https://SEU-DOMINIO-AQUI"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["*"] }]
   ```

## 3. Rodar o backend (`server/`)

```bash
cd server
cp .env.example .env   # preencha DATABASE_URL, SUPABASE_URL/SERVICE_ROLE_KEY e os R2_*
npm install
npm run dev               # http://localhost:4000
```

Se você pulou os passos de SQL no Supabase, `npm run seed` cria as tabelas via Sequelize e popula os projetos originais (só roda se a tabela `Projects` estiver vazia — não cobre `Courses`/`JourneyItem`, isso só vem do `database.sql`/`002_courses_journey.sql`).

Deploy no Render: o [`render.yaml`](render.yaml) já descreve o serviço (blueprint) — Render → New → Blueprint, aponta pro repo. As variáveis marcadas `sync: false` (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) precisam ser preenchidas à mão no dashboard depois — o blueprint só declara os nomes, nunca guarda segredo. `CORS_ORIGIN` já vem com a URL de produção do site; ajuste se o domínio mudar.

## 4. Rodar o frontend (`client/`)

```bash
cd client
cp .env.local.example .env.local   # preencha com URL/anon key do Supabase e a URL da API
npm install
npm run dev              # http://localhost:3000
```

Deploy no Vercel: importe a pasta `client/` como projeto e configure as mesmas variáveis de `.env.local.example`, com `NEXT_PUBLIC_API_URL` apontando pro backend no Render.

## Painel admin

Acesse `/estudio` (ou o valor de `NEXT_PUBLIC_ADMIN_PATH`, se você mudou — ver comentário em [`client/.env.local.example`](client/.env.local.example) e [`client/proxy.js`](client/proxy.js)), entre com o usuário criado no Supabase Auth. Lá dá pra:

- **Projetos** — adicionar/editar/excluir, reordenar.
- **Cursos** — mesma coisa, pra seção de cursos complementares.
- **Jornada** — linha do tempo (educação/experiência).
- **Arquivos** — enviar imagem/vídeo/PDF/outros e copiar o link público pra compartilhar (`/midia/<slug>`, sem extensão). Vídeo ganha miniatura automática (com opção de trocar por outro frame ou por uma imagem escolhida à mão). O link direto do arquivo também pode ser colado no campo "URL da imagem"/capa ao criar projeto ou curso.

Todo upload (arquivo, poster, capa) é travado por um teto de armazenamento configurado em `server/src/lib/storageCap.js` (9GB, com margem do free tier de 10GB do R2) — a barra de uso aparece no topo da aba Arquivos.
