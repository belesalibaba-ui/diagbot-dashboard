FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Standalone output .next/standalone/server.js icinde
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN mkdir -p /data

EXPOSE 3000

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

WORKDIR /app/.next/standalone

# Prisma ve statik dosyalari standalone icine kopyala
COPY prisma ./prisma
RUN cp -r /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=0 /app/.next/static ./.next/static
COPY --from=0 /app/public ./public

CMD ["../entrypoint.sh"]
