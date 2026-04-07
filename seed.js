const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

async function seed() {
  const db = new PrismaClient();
  try {
    const existing = await db.user.findUnique({ where: { email: 'admin@diagbot.com' } });
    if (!existing) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.createHash('sha256').update('Admin123!' + salt).digest('hex');
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let key = '';
      for (let i = 0; i < 16; i++) {
        key += chars[Math.floor(Math.random() * chars.length)];
        if ((i + 1) % 4 === 0 && i < 15) key += '-';
      }
      const user = await db.user.create({
        data: { email: 'admin@diagbot.com', password: hash, salt, name: 'Admin', role: 'admin', isActive: true }
      });
      await db.license.create({
        data: { userId: user.id, licenseKey: key, licenseType: 'lifetime', status: 'active', expiresAt: '2099-12-31T23:59:59.000Z', maxDevices: 999 }
      });
      console.log('Admin created: admin@diagbot.com / Admin123!');
    } else {
      await db.license.updateMany({
        where: { userId: existing.id },
        data: { licenseType: 'lifetime', status: 'active', expiresAt: '2099-12-31T23:59:59.000Z', maxDevices: 999 }
      });
      console.log('Admin license updated');
    }
  } catch (e) {
    console.error('Seed error:', e.message);
  }
  await db.$disconnect();
}

seed();
