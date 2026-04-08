'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface ReportData {
  id: string
  title: string
  summary: string
  content: string
  createdAt: string
  session: {
    vehicle: {
      vin: string
      brand: string
      model: string | null
      year: number | null
    } | null
  }
}

interface ReportViewProps {
  reportId: string
  sessionId: string
  onBack: () => void
}

export default function ReportView({ reportId, sessionId, onBack }: ReportViewProps) {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
  }, [reportId, sessionId])

  const loadReport = async () => {
    setLoading(true)
    try {
      // Try to get the report from session's reports
      const res = await fetch(`/api/sessions/${sessionId}/fault-codes`)
      if (res.ok) {
        const data = await res.json()
        // The report content is loaded via the diagnose endpoint - we'll show it from passed data
      }
    } catch {
      toast.error('Rapor yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    if (!report) return
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>${report.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
          h1 { color: #111; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { color: #333; font-size: 16px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
          h3 { color: #555; font-size: 14px; margin-top: 16px; margin-bottom: 6px; }
          p { line-height: 1.7; color: #444; }
          ul { padding-left: 20px; }
          li { margin-bottom: 4px; line-height: 1.6; }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
          hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { border: none; margin-bottom: 5px; }
          .header p { color: #888; font-size: 12px; }
          strong { color: #222; }
        </style>
        </head><body>
        <div class="header">
          <h1>XENTRY DiagBot Pro</h1>
          <p>Mercedes-Benz AI Teşhis Raporu</p>
        </div>
        ${report.content?.replace(/\n/g, '<br>') || '<p>Rapor içeriği bulunamadı.</p>'}
        </body></html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getUrgencyColor = (text: string) => {
    if (text.includes('KRİTİK') || text.includes('🔴')) return 'bg-red-500/10 text-red-400 border-red-500/20'
    if (text.includes('UYARI') || text.includes('🟡')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    if (text.includes('BİLGİ') || text.includes('🟢')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <Card className="bg-slate-800/40 border-slate-700/40">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full bg-slate-700" />
            <Skeleton className="h-4 w-3/4 bg-slate-700" />
            <Skeleton className="h-4 w-1/2 bg-slate-700" />
            <Separator className="bg-slate-700" />
            <Skeleton className="h-4 w-full bg-slate-700" />
            <Skeleton className="h-4 w-full bg-slate-700" />
            <Skeleton className="h-4 w-2/3 bg-slate-700" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 px-3"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Geri
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Teşhis Raporu</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {report ? new Date(report.createdAt).toLocaleString('tr-TR') : 'Rapor yükleniyor...'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            disabled={!report}
            variant="outline"
            className="border-slate-600/50 text-slate-300 hover:bg-slate-800/50 rounded-xl"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.159 48.159 0 018.5 0m-8.5 0V6.466m8.5 0V6.466m-8.5 0a48.29 48.29 0 018.5 0" />
            </svg>
            Yazdır / PDF
          </Button>
        </div>
      </div>

      {/* Report Content */}
      {report ? (
        <>
          {/* Summary Card */}
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">Özet</CardTitle>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs border px-2 py-0">
                  Tamamlandı
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">{report.summary}</p>
            </CardContent>
          </Card>

          {/* Full Report */}
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Detaylı Rapor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                  {report.content}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="bg-slate-800/40 border-slate-700/40">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-white mb-2">Rapor Bulunamadı</h3>
            <p className="text-slate-400 text-sm">Bu oturum için henüz bir teşhis raporu oluşturulmamış.</p>
            <Button
              onClick={onBack}
              variant="outline"
              className="mt-4 border-slate-600/50 text-slate-300 hover:bg-slate-800/50"
            >
              Oturum Listesine Dön
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-slate-600">
          XENTRY DiagBot Pro tarafından AI destekli olarak oluşturulmuştur.
          <br />
          Bu rapor yalnızca bilgi amaçlıdır. Kesin onarım için Mercedes-Benz yetkili servise başvurun.
        </p>
      </div>
    </div>
  )
}
