import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId zorunlu' }, { status: 400 })
    }

    const vehicles = await db.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { sessions: true } } }
    })

    return NextResponse.json({ vehicles })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, vin, brand, model, year, engine } = await req.json()
    if (!userId || !vin) {
      return NextResponse.json({ error: 'userId ve VIN zorunlu' }, { status: 400 })
    }

    const existing = await db.vehicle.findUnique({ where: { vin } })
    if (existing) {
      return NextResponse.json({ error: 'Bu VIN zaten kayıtlı' }, { status: 409 })
    }

    const vehicle = await db.vehicle.create({
      data: { userId, vin, brand: brand || 'Mercedes-Benz', model, year, engine }
    })

    return NextResponse.json({ vehicle }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
