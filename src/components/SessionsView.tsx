'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import DiagnosticView from '@/components/DiagnosticView'
import ReportView from '@/components/ReportView'

interface Session {
  id: string
  status: string
  startedAt: string
  completedAt: string | null
  vehicle: { vin: string; brand: string; model: string | null; year: number | null } | null
  _count: { faultCodes: number; testResults: number; reports: number }
}

interface SessionViewProps {
  view: 'list' | 'diagnostic' | 'report'
  sessionId: string | null
  reportId: string | null
}

export default function SessionsView() {
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [viewState, setViewState] = useState<SessionViewProps>({
    view: 'list',
    sessionId: null,
    reportId: null
  })

  const loadSessions = () => {
    if (!user) return
    setLoading(true)
    fetch(`/api/sessions?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setSessions(data.sessions || [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('Oturumlar yüklenemedi')
        setLoading(false)
      })
  }

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetch(`/api/sessions?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setSessions(data.sessions || [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Oturumlar yüklenemedi')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [user])

  const startNewDiagnostic = () => {
    setViewState({ view: 'diagnostic', sessionId: null, reportId: null })
  }

  const handleDiagnosticComplete = () => {
    setViewState({ view: 'list', sessionId: null, reportId: null })
    loadSessions()
  }

  const handleViewReport = (sessionId: string, reportId: string) => {
    setViewState({ view: 'report', sessionId, reportId })
  }

  const handleBack = () => {
    setViewState({ view: 'list', sessionId: null, reportId: null })
  }

  // Sub-views
  if (viewState.view === 'diagnostic' && user) {
    return (
      <DiagnosticView
        userId={user.id}
        onComplete={handleDiagnosticComplete}
        onBack={handleBack}
      />
    )
  }

  if (viewState.view === 'report' && viewState.sessionId && viewState.reportId) {
    return (
      <ReportView
        reportId={viewState.reportId}
        sessionId={viewState.sessionId}
        onBack={handleBack}
      />
    )
  }

  // Main list view
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-xs">Tamamlandı</Badge>
      case 'active':
        return <Badge className="bg-amber-500/10 text-amber-400 border-0 text-xs">Aktif</Badge>
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-400 border-0 text-xs">Başarısız</Badge>
      default:
        return <Badge className="bg-slate-500/10 text-slate-400 border-0 text-xs">{status}</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tanı Oturumları</h1>
          <p className="text-slate-400 text-sm mt-1">Mercedes-Benz AI teşhis oturumlarınızı yönetin</p>
        </div>
        <Button
          onClick={startNewDiagnostic}
          className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium rounded-xl shadow-lg shadow-gray-500/20"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Yeni Tanı Başlat
        </Button>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card
          onClick={startNewDiagnostic}
          className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 border-slate-700/40 hover:border-gray-500/30 transition-all cursor-pointer group"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/10 border border-gray-500/20 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AI ile Tanı</p>
              <p className="text-xs text-slate-500">Arıza kodlarını AI ile analiz et</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/40 border-slate-700/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{sessions.filter(s => s.status === 'completed').length} Tamamlanan</p>
              <p className="text-xs text-slate-500">Başarılı teşhisler</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/40 border-slate-700/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{sessions.reduce((sum, s) => sum + s._count.faultCodes, 0)} Toplam Hata</p>
              <p className="text-xs text-slate-500">Tespit edilen arıza kodları</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-slate-800/60" />

      {/* Sessions List */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
              <CardContent className="p-5 h-20" />
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="bg-slate-800/40 border-slate-700/40">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gray-500/20 to-gray-600/10 border border-gray-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Henüz tanı oturumu yok</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Yeni bir tanı oturumu başlatarak Mercedes-Benz arıza kodlarınızı AI ile analiz edebilirsiniz.
            </p>
            <Button
              onClick={startNewDiagnostic}
              className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium rounded-xl px-8"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              İlk Tanınızı Başlatın
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <Card key={session.id} className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40 hover:border-slate-600/50 transition-colors group">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-700/40 flex items-center justify-center text-lg shrink-0">
                      🔧
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {session.vehicle
                          ? `${session.vehicle.brand} ${session.vehicle.model || ''} ${session.vehicle.year || ''}`
                          : 'Araç Seçilmedi'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {session.vehicle?.vin || '-'} • {formatDate(session.startedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-3 text-right">
                      <div className="text-xs text-slate-500">
                        <p>{session._count.faultCodes} hata kodu</p>
                        <p>{session._count.testResults} test</p>
                      </div>
                    </div>
                    {getStatusBadge(session.status)}
                    {session._count.reports > 0 && (
                      <Button
                        onClick={() => handleViewReport(session.id, session.id)}
                        variant="ghost"
                        size="sm"
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs h-8 px-3"
                      >
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        Rapor
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mobile stats */}
                <div className="sm:hidden flex items-center gap-3 mt-2 pl-14">
                  <span className="text-xs text-slate-500">{session._count.faultCodes} hata • {session._count.testResults} test</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
