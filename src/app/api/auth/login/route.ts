import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/crypto'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email ve şifre zorunlu' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Geçersiz email veya şifre' }, { status: 401 })
    }

    const isValid = verifyPassword(password, user.salt, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Geçersiz email veya şifre' }, { status: 401 })
    }

    await db.activityLog.create({
      data: { userId: user.id, action: 'login', details: 'Başarılı giriş' }
    })

    const license = await db.license.findFirst({
      where: { userId: user.id, status: 'active' },
      orderBy: { createdAt: 'desc' }
    })

    const { password: _, salt: __, ...safeUser } = user

    return NextResponse.json({ user: safeUser, license })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
