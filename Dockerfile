FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN mkdir -p /app/db
ENV DATABASE_URL="file:/app/db/diagbot.db"
RUN npx prisma db push --force-reset
RUN node seed.js

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Memory optimization for 512MB free tier
ENV NODE_OPTIONS="--max-old-space-size=384"

# Database location (persistent disk on Render)
ENV DATABASE_URL="file:/data/diagbot.db"

RUN mkdir -p /data

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/db/diagbot.db /data/diagbot.db

# Custom startup script
COPY --from=builder /app/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-10000}/api/health || exit 1

CMD ["/app/start.sh"]
