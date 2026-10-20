# NovaLab для VPS. Четыре цели:
#   web     — сайт (Next.js standalone, ~150–250 МБ памяти)
#   migrate — разовый запуск: миграции базы (+ сид программы, если SEED=1)
#   caddy   — HTTPS и отдача Unity-билдов с диска в сжатом виде
# Сборка и запуск: docker compose -f docker-compose.prod.yml up -d --build

FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------- зависимости ----------
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
# npm install, а не npm ci: lock-файл собран на Windows и не содержит части Linux-зависимостей (известное поведение npm);
# версии из lock-файла при этом соблюдаются
RUN npm install --no-audit --no-fund

# ---------- сборка ----------
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_STANDALONE=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npx next build && node scripts/compress-modules.mjs

# ---------- миграции и сид (запускается и завершается) ----------
FROM build AS migrate
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SEED\" = \"1\" ]; then npx prisma db seed; fi"]

# ---------- сайт ----------
FROM base AS web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    NEXT_COMPRESS=0 DATA_DIR=/data \
    # Потолок памяти Node: при 4 ГБ на сервере сайту хватает с запасом; сборщик мусора держит кучу в этих рамках
    NODE_OPTIONS=--max-old-space-size=384
RUN groupadd -r app && useradd -r -g app app && mkdir -p /data && chown app:app /data
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]

# ---------- Caddy со встроенными Unity-билдами ----------
FROM caddy:2-alpine AS caddy
COPY --from=build /app/public/modules /srv/modules
COPY deploy/Caddyfile /etc/caddy/Caddyfile
