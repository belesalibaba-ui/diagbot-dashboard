import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateSalt, generateLicenseKey } from '@/lib/crypto'

export async function POST() {
  try {
    let user = await db.user.findUnique({ where: { email: 'admin@diagbot.com' } })

    if (user) {
      // Mevcut admin lisansını sınırsız güncelle
      const expiresAt = new Date('2099-12-31T23:59:59Z')
      await db.license.updateMany({
        where: { userId: user.id },
        data: { licenseType: 'lifetime', status: 'active', expiresAt, maxDevices: 999 }
      })
      return NextResponse.json({ message: 'Admin lisansı sınırsız olarak güncellendi' })
    }

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

    const expiresAt = new Date('2099-12-31T23:59:59Z')

    await db.license.create({
      data: {
        userId: admin.id,
        licenseKey,
        licenseType: 'lifetime',
        status: 'active',
        expiresAt,
        maxDevices: 999
      }
    })

    return NextResponse.json({ message: 'Admin hesabı oluşturuldu', licenseKey }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
