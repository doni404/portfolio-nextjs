# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm run db:generate && npm run build && npm prune --omit=dev

FROM base AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
ARG APP_REVISION=development
ENV NODE_ENV=production \
    PORT=4000 \
    UPLOAD_DIR=/app/storage/uploads \
    APP_REVISION=$APP_REVISION
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node content ./content
RUN mkdir -p storage/uploads storage/backups && chown -R node:node storage
USER node
EXPOSE 4000
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "npm run db:migrate && exec node dist/index.js"]
