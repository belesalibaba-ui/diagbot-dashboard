import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateLicenseKey } from '@/lib/crypto'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [licenses, total] = await Promise.all([
      db.license.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, name: true } }
        }
      }),
      db.license.count()
    ])

    return NextResponse.json({ licenses, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, licenseType, durationDays } = await req.json()

    if (!userId || !licenseType) {
      return NextResponse.json({ error: 'userId ve licenseType zorunlu' }, { status: 400 })
    }

    const licenseKey = generateLicenseKey()
    const durationMap: Record<string, number> = {
      trial: 7,
      monthly: 30,
      quarterly: 90,
      yearly: 365,
      lifetime: 36500
    }

    const days = durationDays || durationMap[licenseType] || 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    const license = await db.license.create({
      data: {
        userId,
        licenseKey,
        licenseType,
        status: 'active',
        expiresAt,
        maxDevices: licenseType === 'lifetime' ? 999 : 1
      }
    })

    await db.activityLog.create({
      data: { userId, action: 'license_created', details: `${licenseType} lisans oluşturuldu: ${licenseKey}` }
    })

    return NextResponse.json({ license }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { licenseId, status } = await req.json()

    if (!licenseId || !status) {
      return NextResponse.json({ error: 'licenseId ve status zorunlu' }, { status: 400 })
    }

    const license = await db.license.update({
      where: { id: licenseId },
      data: { status }
    })

    return NextResponse.json({ license })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
