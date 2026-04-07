import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, name: true, role: true,
          isActive: true, createdAt: true,
          licenses: { select: { licenseType: true, status: true, expiresAt: true } },
          _count: { select: { vehicles: true, sessions: true } }
        }
      }),
      db.user.count({ where })
    ])

    return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, isActive } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId zorunlu' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { isActive: isActive !== undefined ? isActive : undefined }
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
