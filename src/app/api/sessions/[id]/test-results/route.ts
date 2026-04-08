import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const testResults = await db.testResult.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'desc' }
    })

    // Get the session with vehicle info for context
    const session = await db.diagnosticSession.findUnique({
      where: { id },
      include: { vehicle: true, faultCodes: true }
    })

    return NextResponse.json({ testResults, session })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { testName, result, unit, value, min, max, status } = body
    const { getRecommendation } = body

    if (!testName) {
      return NextResponse.json({ error: 'testName zorunlu' }, { status: 400 })
    }

    const testResult = await db.testResult.create({
      data: {
        sessionId: id,
        testName,
        result,
        unit,
        value,
        min,
        max,
        status: status || 'passed'
      }
    })

    let aiRecommendation: string | null = null

    // If client requests AI recommendation for failed tests
    if (getRecommendation && (status === 'failed' || status === 'warning')) {
      try {
        const session = await db.diagnosticSession.findUnique({
          where: { id },
          include: { vehicle: true, faultCodes: true }
        })

        const vehicleStr = session?.vehicle
          ? `${session.vehicle.brand} ${session.vehicle.model || ''} ${session.vehicle.year || ''}`
          : 'Bilinmeyen Araç'

        const zai = await ZAI.create()
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `Sen Mercedes-Benz uzmani bir oto tanı asistanısın. Başarısız bir test sonucu analiz ediyorsun. Kısa ve öz bir öneri ver. Türkçe cevap ver.`
            },
            {
              role: 'user',
              content: `Araç: ${vehicleStr}\nTest: ${testName}\nSonuç: ${result} ${unit ? `(${unit})` : ''} ${value ? `[Değer: ${value}, Min: ${min || '-'}, Max: ${max || '-'}]` : ''}\nDurum: ${status}\n\nKısa bir öneri yaz.`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })

        aiRecommendation = completion.choices?.[0]?.message?.content || null
      } catch (aiError) {
        console.error('AI recommendation error:', aiError)
        aiRecommendation = 'Bu test sonucu için detaylı analiz önerilir. Mercedes-Benz yetkili servise başvurun.'
      }
    }

    return NextResponse.json({ testResult, aiRecommendation }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
