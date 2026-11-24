# Portfólio — João Augusto de Freitas

Tudo no servidor caseiro (painel de hospedagem):

- `server/` — API Express + Sequelize. Postgres e bucket de arquivos do próprio hosting. Login próprio (bcrypt + JWT). App `portfolio-api` → https://portfolio-api.joaoaugusto.dev
- `client/` — site + painel admin em Next.js/React. App `portfolio` → https://www.joaoaugusto.dev
- `apex/` — só redireciona (308) `joaoaugusto.dev` → `www`, preservando caminho. App `portfolio-apex`: o hosting liga um endereço por app.

O hosting cria o DNS com o `cert.pem` padrão do `cloudflared`, que é de outra zona. Pra `joaoaugusto.dev`, crie o registro à mão:
`cloudflared --origincert ~/.cloudflared/cert.joaoaugusto.pem tunnel route dns --overwrite-dns $(cat ~/hosting/data/tunnel.id) <host>`

## Infra no hosting

| Recurso | Nome | Como chega no app |
|---|---|---|
| Banco Postgres | `portfolio` | `DATABASE_URL` (injetado ao ligar o banco) |
| Bucket privado | `portfolio` | `BUCKET_URL`, `BUCKET_NAME`, `BUCKET_TOKEN` (injetados ao ligar o bucket) |

Nenhum arquivo sai direto do bucket pro navegador: tudo passa proxiado pela API (`server/src/routes/files.js` e `covers.js`). Capas ficam em `covers/`, mídia na raiz.

As tabelas são criadas pelo `sequelize.sync()` no boot. `npm run seed` só popula o que estiver vazio.

## Variáveis

**API (`portfolio-api`)**, além das injetadas:

- `JWT_SECRET`: 32+ caracteres aleatórios. A API não sobe sem ele. Trocar derruba todas as sessões do painel.
- `CORS_ORIGIN`: origens do site separadas por vírgula (`https://www.joaoaugusto.dev,https://joaoaugusto.dev`).
- `STORAGE_CAP_GB`: teto do bucket (padrão 2). O bucket mora no disco do hosting, dividido com os outros apps. Suba depois de olhar o `df -h`.
- `DB_SSL=true`: só se um dia o banco for remoto e exigir SSL.

**Site (`portfolio`)**:

- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_PATH`: entram no bundle **no build**, e o painel não passa build args. Ficam num `client/.env.production` criado na pasta de deploy (fora do git).
- `API_INTERNAL_URL` (runtime): o Next fala com a API pela rede interna (`http://host.containers.internal:<porta da API>`) em vez de dar a volta pela Cloudflare. É isso que tira o próprio Next do limite de taxa das imagens.

## Deploy

Cada pasta tem o seu `Dockerfile`. Deploy por envio da pasta (`hosting_deploy`), sem `node_modules`/`.env`:

```bash
# API
hosting_deploy path=server name=portfolio-api db=portfolio bucket=portfolio cport=4000 host=portfolio-api.joaoaugusto.dev
# Site (com o client/.env.production na pasta)
hosting_deploy path=client name=portfolio cport=3000 env="API_INTERNAL_URL=http://host.containers.internal:10011"
```

## Login do painel

Acesse `/estudio` (ou o valor de `NEXT_PUBLIC_ADMIN_PATH`). Não há cadastro público. Pra trocar o e-mail e a senha do admin (ou criar o primeiro), rode no servidor e responda as perguntas:

```bash
podman exec -it hs-portfolio-api node scripts/set-admin.js
```

Sessões já abertas continuam valendo até vencer. Pra derrubar todas na hora (senha vazou, por exemplo), troque o `JWT_SECRET` do app.

A sessão é um JWT de 7 dias guardado no navegador. Quando vence, o painel volta pro login.

## Rodar local

```bash
cd server && cp .env.example .env   # DATABASE_URL, BUCKET_*, JWT_SECRET
npm install && npm run dev          # http://localhost:4000
node scripts/check-storage.js       # confere o bucket de ponta a ponta

cd client && cp .env.local.example .env.local
npm install && npm run dev          # http://localhost:3000
```

## Painel admin

- **Projetos**, **Cursos**, **Jornada**, **Galeria**, **Na Mídia**, **Skills**, **Links**, **Textos**, **Seções**: adicionar, editar, excluir e reordenar.
- **Arquivos**: enviar imagem/vídeo/PDF/outros e copiar o link público (`/midia/<slug>`, sem extensão). Vídeo ganha miniatura automática. O envio passa pela API até o bucket, em pedaços de 50MB (o túnel da Cloudflare, plano free, recusa mais de 100MB por requisição) e retomável se a conexão cair. Os pedaços se juntam num arquivo temporário do container antes de ir pro bucket, então um envio grande ocupa o dobro do espaço em disco enquanto termina. Teto por arquivo: o do bucket (`STORAGE_CAP_GB`).
