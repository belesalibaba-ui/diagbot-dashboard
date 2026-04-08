import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { faultCodes, vehicleInfo, km, fuelType } = body

    if (!faultCodes || !Array.isArray(faultCodes) || faultCodes.length === 0) {
      return NextResponse.json({ error: 'En az bir arıza kodu gerekli' }, { status: 400 })
    }

    // Verify session exists
    const session = await db.diagnosticSession.findUnique({
      where: { id },
      include: { vehicle: true, faultCodes: true }
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })
    }

    // Save fault codes to database
    const savedFaultCodes = []
    for (const fc of faultCodes) {
      const existing = session.faultCodes.find(f => f.code === fc.code)
      if (!existing) {
        const saved = await db.faultCode.create({
          data: {
            sessionId: id,
            code: fc.code,
            description: fc.description || null,
            severity: fc.severity || 'warning',
            status: 'active'
          }
        })
        savedFaultCodes.push(saved)
      } else {
        savedFaultCodes.push(existing)
      }
    }

    // Build vehicle info string
    const vehicleStr = vehicleInfo || (session.vehicle
      ? `${session.vehicle.brand} ${session.vehicle.model || ''} ${session.vehicle.year || ''} (VIN: ${session.vehicle.vin})`
      : 'Bilinmeyen Araç')

    const kmStr = km || session.vehicle?.engine || 'Bilinmiyor'
    const fuelStr = fuelType || 'Bilinmiyor'

    const codesStr = faultCodes.map(fc => `${fc.code}${fc.description ? ` (${fc.description})` : ''}`).join(', ')

    // Call AI for analysis
    let aiAnalysis = ''
    let structuredAnalysis: any[] = []

    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Sen Mercedes-Benz uzmani bir oto tanı asistanısın. XENTRY tanı cihazından okunan arıza kodlarını analiz ediyorsun. Her kod için:
1. Arıza kodunun anlamı (Türkçe)
2. Olası nedenler (en olasından başla)
3. Çözüm önerileri (maliyet ve zorluk derecesine göre sırala)
4. Aciliyet derecesi (KRİTİK/UYARI/BİLGİ)
5. Tahmini onarım maliyeti (TL)

Aşağıdaki JSON formatında yanıt ver. Sadece JSON döndür, başka metin ekleme:
{
  "analizler": [
    {
      "kod": "P0300",
      "aciklama": "Rastgele/sayılamayan atış",
      "nedenler": ["Buji arızası", "Bobin arızası", "Enjektör sorunu"],
      "cozumler": [
        {"oneri": "Buji setini değiştir", "maliyet": 1500, "zorluk": "Kolay"},
        {"oneri": "Bobin değişimi", "maliyet": 3500, "zorluk": "Orta"}
      ],
      "aciliyet": "KRİTİK",
      "maliyetTahmini": 3000
    }
  ],
  "ozet": "Toplam analiz özeti",
  "genelTavsiye": "Genel öneriler"
}`
          },
          {
            role: 'user',
            content: `Bu Mercedes-Benz arac için arıza kodlarını analiz et:
Araç: ${vehicleStr}
Arıza Kodları: ${codesStr}
Kilometre: ${kmStr}
Yakıt Tipi: ${fuelStr}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })

      const aiContent = completion.choices?.[0]?.message?.content || ''

      // Try to parse as JSON
      try {
        // Extract JSON from response (in case there's markdown wrapper)
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          structuredAnalysis = parsed.analizler || []
          aiAnalysis = JSON.stringify(parsed, null, 2)
        } else {
          aiAnalysis = aiContent
          // Create a basic structured version from the text
          structuredAnalysis = faultCodes.map(fc => ({
            kod: fc.code,
            aciklama: fc.description || fc.code,
            nedenler: ['Detaylı analiz gerekli'],
            cozumler: [{ oneri: 'Profesyonel kontrol önerilir', maliyet: 0, zorluk: 'Orta' }],
            aciliyet: fc.severity === 'critical' ? 'KRİTİK' : fc.severity === 'warning' ? 'UYARI' : 'BİLGİ',
            maliyetTahmini: 0
          }))
        }
      } catch {
        aiAnalysis = aiContent
        structuredAnalysis = faultCodes.map(fc => ({
          kod: fc.code,
          aciklama: fc.description || fc.code,
          nedenler: ['Detaylı analiz gerekli'],
          cozumler: [{ oneri: 'Profesyonel kontrol önerilir', maliyet: 0, zorluk: 'Orta' }],
          aciliyet: fc.severity === 'critical' ? 'KRİTİK' : fc.severity === 'warning' ? 'UYARI' : 'BİLGİ',
          maliyetTahmini: 0
        }))
      }
    } catch (aiError: any) {
      console.error('AI Analysis error:', aiError)
      // Fallback: basic analysis without AI
      aiAnalysis = JSON.stringify({
        analizler: faultCodes.map(fc => ({
          kod: fc.code,
          aciklama: fc.description || fc.code,
          nedenler: ['Detaylı analiz yapılacak'],
          cozumler: [{ oneri: 'Mercedes-Benz yetkili servise başvurun', maliyet: 0, zorluk: 'Orta' }],
          aciliyet: fc.severity === 'critical' ? 'KRİTİK' : 'UYARI',
          maliyetTahmini: 0
        })),
        ozet: `${faultCodes.length} arıza kodu tespit edildi. Detaylı analiz için AI servisi kullanılamadı.`,
        genelTavsiye: 'Aracı en kısa sürede kontrol ettirin.'
      }, null, 2)

      structuredAnalysis = faultCodes.map(fc => ({
        kod: fc.code,
        aciklama: fc.description || fc.code,
        nedenler: ['Detaylı analiz yapılacak'],
        cozumler: [{ oneri: 'Mercedes-Benz yetkili servise başvurun', maliyet: 0, zorluk: 'Orta' }],
        aciliyet: fc.severity === 'critical' ? 'KRİTİK' : 'UYARI',
        maliyetTahmini: 0
      }))
    }

    // Build summary
    const criticalCount = structuredAnalysis.filter(a => a.aciliyet === 'KRİTİK').length
    const warningCount = structuredAnalysis.filter(a => a.aciliyet === 'UYARI').length
    const infoCount = structuredAnalysis.filter(a => a.aciliyet === 'BİLGİ').length

    let summary = ''
    if (criticalCount > 0) summary += `⚠️ ${criticalCount} KRİTİK `
    if (warningCount > 0) summary += `🔔 ${warningCount} UYARI `
    if (infoCount > 0) summary += `ℹ️ ${infoCount} BİLGİ `
    if (!summary) summary = '✅ Analiz tamamlandı'

    // Build markdown content for report
    let content = `# Mercedes-Benz Teşhis Raporu\n\n`
    content += `**Araç:** ${vehicleStr}\n`
    content += `**Kilometre:** ${kmStr}\n`
    content += `**Yakıt Tipi:** ${fuelStr}\n`
    content += `**Tarih:** ${new Date().toLocaleString('tr-TR')}\n\n`
    content += `---\n\n`

    for (const analysis of structuredAnalysis) {
      const urgencyEmoji = analysis.aciliyet === 'KRİTİK' ? '🔴' : analysis.aciliyet === 'UYARI' ? '🟡' : '🟢'
      content += `## ${urgencyEmoji} ${analysis.kod} - ${analysis.aciklama}\n\n`
      content += `**Aciliyet:** ${analysis.aciliyet}\n\n`

      if (analysis.nedenler?.length) {
        content += `### Olası Nedenler\n`
        analysis.nedenler.forEach((n: string, i: number) => {
          content += `${i + 1}. ${n}\n`
        })
        content += '\n'
      }

      if (analysis.cozumler?.length) {
        content += `### Çözüm Önerileri\n`
        analysis.cozumler.forEach((c: any, i: number) => {
          content += `${i + 1}. **${c.oneri}** - ${c.maliyet > 0 ? `~${c.maliyet.toLocaleString('tr-TR')} TL` : 'Maliyet belirlenemedi'} (${c.zorluk})\n`
        })
        content += '\n'
      }

      content += `**Tahmini Toplam Maliyet:** ${analysis.maliyetTahmini > 0 ? `~${analysis.maliyetTahmini.toLocaleString('tr-TR')} TL` : 'Belirlenemedi'}\n\n`
    }

    content += `---\n\n*XENTRY DiagBot Pro tarafından otomatik oluşturulmuştur.*\n`

    // Save report
    const report = await db.diagnosisReport.create({
      data: {
        sessionId: id,
        title: `Teşhis Raporu - ${session.vehicle?.vin || id.substring(0, 8)} - ${new Date().toLocaleDateString('tr-TR')}`,
        summary,
        content
      }
    })

    // Update session status
    await db.diagnosticSession.update({
      where: { id },
      data: { completedAt: new Date() }
    })

    // Update fault code descriptions from AI analysis
    for (const analysis of structuredAnalysis) {
      const matchingCode = savedFaultCodes.find(fc => fc.code.toUpperCase() === analysis.kod.toUpperCase())
      if (matchingCode && analysis.aciklama) {
        await db.faultCode.update({
          where: { id: matchingCode.id },
          data: {
            description: analysis.aciklama,
            severity: analysis.aciliyet === 'KRİTİK' ? 'critical' : analysis.aciliyet === 'UYARI' ? 'warning' : 'info'
          }
        })
      }
    }

    return NextResponse.json({
      report,
      analysis: structuredAnalysis,
      rawAnalysis: aiAnalysis,
      savedFaultCodes
    }, { status: 201 })
  } catch (error: any) {
    console.error('Diagnose error:', error)
    return NextResponse.json({ error: error.message || 'Tanı analizi başarısız' }, { status: 500 })
  }
}
