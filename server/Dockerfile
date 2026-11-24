FROM docker.io/library/node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=4000
COPY package.json package-lock.json ./
# ffmpeg-static baixa o binário do ffmpeg no postinstall (miniatura de vídeo).
RUN npm ci --omit=dev
# --chown: o painel extrai o zip com pastas 700, ilegíveis pro usuário node.
COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts
USER node
EXPOSE 4000
CMD ["node", "src/index.js"]
