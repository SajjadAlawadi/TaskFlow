# ── Stage 1: build Vite frontend ──────────────────────────────────────────────
FROM node:lts-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production runtime ───────────────────────────────────────────────
FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

COPY --from=builder /app/dist ./dist
COPY server.js db.js ./

RUN mkdir -p data && chown -R node:node /app
USER node

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server.js"]
