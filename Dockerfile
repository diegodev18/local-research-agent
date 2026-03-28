# --- API (Bun + Git clone en entrypoint) ---
FROM oven/bun:1 AS api

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY apps/api/package.json apps/api/bun.lock ./
RUN bun install --frozen-lockfile

COPY apps/api/ ./
COPY docker/entrypoint-api.sh /entrypoint-api.sh
RUN chmod +x /entrypoint-api.sh

ENV AGENT_WORKSPACE_ROOT=/workspace
EXPOSE 3000

ENTRYPOINT ["/entrypoint-api.sh"]
CMD ["bun", "run", "index.ts"]

# --- Web: build estático (usa lockfile del monorepo en la raíz; apps/web/bun.lock puede estar desactualizado) ---
FROM oven/bun:1 AS web-builder

ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /repo

COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

RUN bun install --frozen-lockfile

COPY apps/web/ ./apps/web/

WORKDIR /repo/apps/web
RUN bun run build

# --- Web: Nginx + SPA ---
FROM nginx:alpine AS web

COPY --from=web-builder /repo/apps/web/dist /usr/share/nginx/html
COPY docker/nginx-web.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
