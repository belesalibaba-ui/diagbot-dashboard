import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateSalt, generateLicenseKey } from '@/lib/crypto'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, şifre ve ad zorunlu' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Bu email zaten kayıtlı' }, { status: 409 })
    }

    const salt = generateSalt()
    const hashedPassword = hashPassword(password, salt)
    const licenseKey = generateLicenseKey()

    const user = await db.user.create({
      data: { email, password: hashedPassword, salt, name }
    })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const license = await db.license.create({
      data: {
        userId: user.id,
        licenseKey,
        licenseType: 'trial',
        status: 'active',
        expiresAt
      }
    })

    await db.activityLog.create({
      data: { userId: user.id, action: 'register', details: 'Kayıt olundu, 7 gün deneme lisansı oluşturuldu' }
    })

    const { password: _, salt: __, ...safeUser } = user

    return NextResponse.json({ user: safeUser, license }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
