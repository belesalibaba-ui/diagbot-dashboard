FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json bun.lockb* ./
RUN npm install

COPY . .

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir -p /data && chown nextjs:nodejs /data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Schema sync + seed + start
CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>/dev/null && node -e \"const{PrismaClient}=require('@prisma/client');const db=new PrismaClient();const{hashPassword,generateSalt,generateLicenseKey}=require('./src/lib/crypto');(async()=>{try{const u=await db.user.findUnique({where:{email:'admin@diagbot.com'}});if(!u){const s=generateSalt();const h=hashPassword('Admin123!',s);const a=await db.user.create({data:{email:'admin@diagbot.com',password:h,salt:s,name:'Admin',role:'admin',isActive:true}});const k=generateLicenseKey();await db.license.create({data:{userId:a.id,licenseKey:k,licenseType:'lifetime',status:'active',expiresAt:new Date('2099-12-31T23:59:59Z'),maxDevices:999}});console.log('Admin olusturuldu')}else{await db.license.updateMany({where:{userId:u.id},data:{licenseType:'lifetime',status:'active',expiresAt:new Date('2099-12-31T23:59:59Z'),maxDevices:999}});console.log('Admin lisans guncellendi')}}catch(e){console.error(e)}await db.\$disconnect()})() && node server.js"]
