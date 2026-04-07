import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await req.json()
    if (!licenseKey) {
      return NextResponse.json({ error: 'licenseKey zorunlu' }, { status: 400 })
    }

    const license = await db.license.findUnique({
      where: { licenseKey },
      include: { user: { select: { id: true, email: true, name: true, isActive: true } } }
    })

    if (!license) {
      return NextResponse.json({ valid: false, error: 'Lisans bulunamadı' })
    }

    if (license.status !== 'active') {
      return NextResponse.json({ valid: false, error: 'Lisans askıya alınmış' })
    }

    if (!license.user.isActive) {
      return NextResponse.json({ valid: false, error: 'Hesap devre dışı' })
    }

    if (new Date() > license.expiresAt) {
      await db.license.update({ where: { id: license.id }, data: { status: 'expired' } })
      return NextResponse.json({ valid: false, error: 'Lisans süresi dolmuş' })
    }

    return NextResponse.json({
      valid: true,
      license: {
        id: license.id,
        licenseType: license.licenseType,
        status: license.status,
        expiresAt: license.expiresAt,
        maxDevices: license.maxDevices,
        hwid: license.hwid
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
