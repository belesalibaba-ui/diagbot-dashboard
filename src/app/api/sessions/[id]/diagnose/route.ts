import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const session = await db.diagnosticSession.findUnique({
      where: { id },
      include: {
        vehicle: true,
        faultCodes: true,
        testResults: true
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })
    }

    const criticalFaults = session.faultCodes.filter(f => f.severity === 'critical')
    const warnings = session.faultCodes.filter(f => f.severity === 'warning')
    const failedTests = session.testResults.filter(t => t.status === 'failed')
    const passedTests = session.testResults.filter(t => t.status === 'passed')

    let summary = ''
    let content = ''

    if (criticalFaults.length > 0) {
      summary += `⚠️ ${criticalFaults.length} KRİTİK HATA `
      content += `## KRİTİK HATALAR\n\n`
      criticalFaults.forEach(f => {
        content += `- **${f.code}**: ${f.description || 'Açıklama yok'}\n`
      })
      content += '\n'
    }

    if (warnings.length > 0) {
      summary += `🔔 ${warnings.length} UYARI `
      content += `## UYARILAR\n\n`
      warnings.forEach(f => {
        content += `- **${f.code}**: ${f.description || 'Açıklama yok'}\n`
      })
      content += '\n'
    }

    if (failedTests.length > 0) {
      summary += `❌ ${failedTests.length} BAŞARISIZ TEST `
      content += `## BAŞARISIZ TESTLER\n\n`
      failedTests.forEach(t => {
        content += `- **${t.testName}**: ${t.result} ${t.unit ? `(${t.unit})` : ''} ${t.value ? `[${t.value}]` : ''}\n`
      })
      content += '\n'
    }

    if (summary === '') {
      summary = '✅ Tüm kontroller başarılı'
      content = '## Sonuç\n\nAraçta herhangi bir kritik hata veya uyarı tespit edilmemiştir. Tüm testler başarıyla geçmiştir.'
    }

    summary += `| ✅ ${passedTests.length} başarılı`

    content += `\n---\n*Araç: ${session.vehicle?.brand || 'Bilinmeyen'} ${session.vehicle?.model || ''} ${session.vehicle?.year || ''}*\n`
    content += `*VIN: ${session.vehicle?.vin || 'Bilinmeyen'}*\n`
    content += `*Tarih: ${new Date().toLocaleString('tr-TR')}*\n`

    const report = await db.diagnosisReport.create({
      data: {
        sessionId: id,
        title: `Teşhis Raporu - ${session.vehicle?.vin || id.substring(0, 8)}`,
        summary,
        content
      }
    })

    await db.diagnosticSession.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() }
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
