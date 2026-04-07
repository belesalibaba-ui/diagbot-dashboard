import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId zorunlu' }, { status: 400 })
    }

    const sessions = await db.diagnosticSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: {
        vehicle: { select: { vin: true, brand: true, model: true } },
        _count: { select: { faultCodes: true, testResults: true, reports: true } }
      }
    })

    return NextResponse.json({ sessions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, vehicleId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId zorunlu' }, { status: 400 })
    }

    const session = await db.diagnosticSession.create({
      data: { userId, vehicleId }
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
