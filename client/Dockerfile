FROM docker.io/library/node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* entra no bundle no BUILD e o painel do hosting não passa build
# args: vêm do .env.production gerado na pasta de deploy (ver README).
RUN npm run build && npm prune --omit=dev

FROM docker.io/library/node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
