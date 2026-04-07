import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, hwid } = await req.json()
    if (!licenseKey || !hwid) {
      return NextResponse.json({ error: 'licenseKey ve hwid zorunlu' }, { status: 400 })
    }

    const license = await db.license.findUnique({ where: { licenseKey } })
    if (!license || license.status !== 'active') {
      return NextResponse.json({ alive: false, error: 'Lisans aktif değil' })
    }

    if (license.hwid !== hwid) {
      return NextResponse.json({ alive: false, error: 'HWID eşleşmiyor' })
    }

    if (new Date() > license.expiresAt) {
      await db.license.update({ where: { id: license.id }, data: { status: 'expired' } })
      return NextResponse.json({ alive: false, error: 'Lisans süresi dolmuş' })
    }

    await db.activityLog.create({
      data: { userId: license.userId, action: 'heartbeat', details: `HWID: ${hwid.substring(0, 8)}...` }
    })

    return NextResponse.json({ alive: true, expiresAt: license.expiresAt })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
