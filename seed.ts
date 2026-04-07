// Seed script for Docker/container startup
import { db } from './src/lib/db'
import { hashPassword, generateSalt, generateLicenseKey } from './src/lib/crypto'

async function main() {
  try {
    const existing = await db.user.findUnique({ where: { email: 'admin@diagbot.com' } })
    if (!existing) {
      const salt = generateSalt()
      const hashedPassword = hashPassword('Admin123!', salt)
      const licenseKey = generateLicenseKey()

      const admin = await db.user.create({
        data: {
          email: 'admin@diagbot.com',
          password: hashedPassword,
          salt,
          name: 'Admin',
          role: 'admin',
          isActive: true
        }
      })

      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      await db.license.create({
        data: {
          userId: admin.id,
          licenseKey,
          licenseType: 'yearly',
          status: 'active',
          expiresAt,
          maxDevices: 10
        }
      })

      console.log('✅ Admin hesabı oluşturuldu')
      console.log('   Email: admin@diagbot.com')
      console.log('   Şifre: Admin123!')
      console.log('   Lisans Anahtarı:', licenseKey)
    } else {
      console.log('✅ Admin hesabı zaten mevcut')
    }
  } catch (error) {
    console.error('❌ Seed hatası:', error)
    process.exit(1)
  } finally {
    await db.$disconnect()
  }
}

main()
