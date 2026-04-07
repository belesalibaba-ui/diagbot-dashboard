import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateSalt, generateLicenseKey } from '@/lib/crypto'

export async function POST() {
  try {
    const existing = await db.user.findUnique({ where: { email: 'admin@diagbot.com' } })
    if (existing) {
      return NextResponse.json({ message: 'Admin zaten mevcut' })
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

    return NextResponse.json({ message: 'Admin hesabı oluşturuldu', licenseKey }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
