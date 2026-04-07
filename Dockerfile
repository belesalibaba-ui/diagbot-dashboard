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
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/data/diagbot.db"

RUN mkdir -p /data

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/db/diagbot.db /data/diagbot.db

EXPOSE 3000

CMD ["node", "server.js"]
