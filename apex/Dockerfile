FROM docker.io/library/node:22-slim
WORKDIR /app
COPY --chown=node:node server.js ./
USER node
EXPOSE 3000
CMD ["node", "server.js"]
