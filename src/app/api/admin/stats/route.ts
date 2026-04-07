import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const totalUsers = await db.user.count()
    const activeUsers = await db.user.count({ where: { isActive: true } })
    const totalLicenses = await db.license.count()
    const activeLicenses = await db.license.count({ where: { status: 'active' } })
    const totalSessions = await db.session.count()
    const totalVehicles = await db.vehicle.count()
    const expiringLicenses = await db.license.count({
      where: {
        status: 'active',
        expiresAt: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      }
    })

    const licenseTypes = await db.license.groupBy({
      by: ['licenseType'],
      _count: { licenseType: true }
    })

    const recentUsers = await db.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, createdAt: true, isActive: true }
    })

    return NextResponse.json({
      totalUsers, activeUsers, totalLicenses, activeLicenses,
      totalSessions, totalVehicles, expiringLicenses,
      licenseTypes, recentUsers
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
