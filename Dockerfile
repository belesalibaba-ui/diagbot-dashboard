FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN mkdir -p /data

EXPOSE 3000

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

CMD ["./entrypoint.sh"]
