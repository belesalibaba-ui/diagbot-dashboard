import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, hwid, deviceName } = await req.json()
    if (!licenseKey || !hwid) {
      return NextResponse.json({ error: 'licenseKey ve hwid zorunlu' }, { status: 400 })
    }

    const license = await db.license.findUnique({ where: { licenseKey } })
    if (!license) {
      return NextResponse.json({ error: 'Lisans bulunamadı' }, { status: 404 })
    }

    if (license.status !== 'active') {
      return NextResponse.json({ error: 'Lisans aktif değil' }, { status: 400 })
    }

    if (new Date() > license.expiresAt) {
      await db.license.update({ where: { id: license.id }, data: { status: 'expired' } })
      return NextResponse.json({ error: 'Lisans süresi dolmuş' }, { status: 400 })
    }

    if (license.hwid && license.hwid !== hwid) {
      return NextResponse.json({ error: 'Bu lisans başka bir cihazda aktif', }, { status: 403 })
    }

    const updated = await db.license.update({
      where: { id: license.id },
      data: { hwid }
    })

    await db.activityLog.create({
      data: {
        userId: license.userId,
        action: 'license_activated',
        details: `HWID: ${hwid.substring(0, 8)}... Cihaz: ${deviceName || 'Bilinmeyen'}`
      }
    })

    return NextResponse.json({ success: true, license: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
