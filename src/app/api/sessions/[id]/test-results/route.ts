import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const testResults = await db.testResult.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ testResults })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { testName, result, unit, value, min, max, status } = await req.json()
    if (!testName) {
      return NextResponse.json({ error: 'testName zorunlu' }, { status: 400 })
    }

    const testResult = await db.testResult.create({
      data: { sessionId: id, testName, result, unit, value, min, max, status: status || 'passed' }
    })

    return NextResponse.json({ testResult }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
