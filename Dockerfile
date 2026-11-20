# ========================================================
# Industrial Docker Template for Catalog Service (Traefik)
# ========================================================

# Step 1: Base Environment
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Step 2: Dependency Resolution
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Step 3: Final Production Image
FROM base AS runner
RUN apt-get update && apt-get install -y default-mysql-client tzdata && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=5005
ENV TZ=Asia/Colombo

# Metadata
EXPOSE 5005

# Execute server
CMD ["node", "server.js"]

