# ==============================================================================
# TARA Backend — Dockerfile
# Builds the NestJS API, includes Prisma migrations, and runs auto-migration on
# container start via docker-entrypoint.sh.
# ==============================================================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies (for native modules if any)
RUN apk add --no-cache python3 make g++

# Install dependencies first (layer caching)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Compile the seed script (standalone, not part of NestJS module tree)
RUN npx tsc src/scripts/seed-defaults.ts \
    --outDir dist/scripts \
    --esModuleInterop \
    --resolveJsonModule \
    --skipLibCheck \
    --module commonjs \
    --target ES2021 \
    --declaration false \
    2>/dev/null || echo "Seed script compilation skipped"

# --- Stage 2: Production ---
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install only what's needed at runtime
RUN apk add --no-cache tini

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy Prisma (schema + migrations for runtime migrate deploy)
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

EXPOSE 3001

# Entrypoint handles: wait for DB → run migrations → seed → start app
CMD ["/app/docker-entrypoint.sh"]
