'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  color: string
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  return (
    <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40 hover:border-slate-600/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-emerald-400 mt-1">{trend}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface Session {
  id: string
  status: string
  startedAt: string
  completedAt: string | null
  vehicle: { vin: string; brand: string; model: string | null } | null
  _count: { faultCodes: number; testResults: number; reports: number }
}

interface DiagnosisReport {
  id: string
  title: string
  summary: string
  createdAt: string
}

export default function DashboardView() {
  const { user, setView } = useAuthStore()
  const [sessions, setSessions] = useState<Session[]>([])
  const [reports, setReports] = useState<DiagnosisReport[]>([])
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalVehicles: 0,
    activeFaults: 0,
    completedDiag: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [sessionsRes, vehiclesRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/vehicles'),
      ])

      let sessionsData: Session[] = []
      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        sessionsData = data.sessions || data || []
        setSessions(sessionsData)
      }
      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json()
        setStats(prev => ({
          ...prev,
          totalVehicles: vehiclesData.total || vehiclesData.length || 0,
        }))
      }

      // Calculate stats from sessions
      const totalSessions = sessionsData.length
      const completedDiag = sessionsData.filter(s => s.status === 'completed').length
      const activeFaults = sessionsData.reduce((sum, s) => sum + s._count.faultCodes, 0)

      setStats(prev => ({
        ...prev,
        totalSessions: prev.totalSessions || totalSessions,
        activeFaults: prev.activeFaults || activeFaults,
        completedDiag: prev.completedDiag || completedDiag,
      }))

      // Extract recent reports from sessions (completed ones)
      const recentCompleted = sessionsData
        .filter(s => s.status === 'completed' && s._count.reports > 0)
        .slice(0, 5)

      setReports(recentCompleted.map(s => ({
        id: s.id,
        title: `Teşhis Raporu - ${s.vehicle?.vin || s.id.slice(0, 8)}`,
        summary: `${s._count.faultCodes} arıza kodu analiz edildi`,
        createdAt: s.startedAt,
      })))
    } catch {
      // Use demo data
      setStats({
        totalSessions: 0,
        totalVehicles: 0,
        activeFaults: 0,
        completedDiag: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const displayStats = loading
    ? { totalSessions: '—', totalVehicles: '—', activeFaults: '—', completedDiag: '—' }
    : stats

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">Tamamlandı</Badge>
      case 'active':
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">Aktif</Badge>
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">Başarısız</Badge>
      default:
        return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 text-xs">{status}</Badge>
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Mobile spacing for hamburger */}
      <div className="h-10 lg:hidden" />

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hoş Geldiniz, {user?.name || 'Kullanıcı'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            XENTRY DiagBot Pro — Mercedes-Benz AI Teşhis Sistemi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setView('sessions')}
            className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium rounded-xl shadow-lg shadow-gray-500/20 h-10"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Yeni Tanı Başlat
          </Button>
          <Button
            onClick={() => setView('vehicles')}
            variant="outline"
            className="border-slate-600/50 text-slate-300 hover:bg-slate-800/50 hover:text-white rounded-xl h-10"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Araç Ekle
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Oturum"
          value={displayStats.totalSessions}
          color="bg-gray-500/10"
          icon={
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          }
        />
        <StatCard
          title="Araç Sayısı"
          value={displayStats.totalVehicles}
          color="bg-emerald-500/10"
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h3.375m0 0V11.25m0 3H12M5.25 14.25V11.25m6.75 3v-3m0 0h3.375M12 11.25h3.375M5.625 5.25H18.75a1.125 1.125 0 011.125 1.125v4.5H4.5v-4.5A1.125 1.125 0 015.625 5.25z" />
            </svg>
          }
        />
        <StatCard
          title="AI Teşhis"
          value={displayStats.completedDiag}
          color="bg-amber-500/10"
          icon={
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          }
        />
        <StatCard
          title="Tespit Edilen Hata"
          value={displayStats.activeFaults}
          color="bg-red-500/10"
          icon={
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
      </div>

      {/* AI Diagnostic CTA */}
      <Card className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 border-gray-500/20 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-500/30 to-gray-600/20 border border-gray-500/20 flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-white">AI ile Mercedes-Benz Teşhisi</h2>
              <p className="text-sm text-slate-400 mt-1">
                Arıza kodlarını girin, yapay zeka analiz etsin. Nedenler, çözümler, maliyet tahminleri ve aciliyet derecesi otomatik oluşturulsun.
              </p>
            </div>
            <Button
              onClick={() => setView('sessions')}
              className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium rounded-xl px-6 h-11 shrink-0"
            >
              Hemen Başla
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      {reports.length > 0 && (
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">Son Teşhis Raporları</CardTitle>
              <Button
                variant="ghost"
                onClick={() => setView('sessions')}
                className="text-xs text-slate-500 hover:text-slate-300 h-7"
              >
                Tümünü Gör
                <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-700/30">
              {reports.map(r => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{r.title}</p>
                      <p className="text-xs text-slate-500">{r.summary}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0 ml-3">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">Son Oturumlar</CardTitle>
            {sessions.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => setView('sessions')}
                className="text-xs text-slate-500 hover:text-slate-300 h-7"
              >
                Tümünü Gör
                <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/40 hover:bg-transparent">
                    <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Araç</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Durum</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">Hata Kodu</TableHead>
                    <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.slice(0, 5).map((session) => (
                    <TableRow
                      key={session.id}
                      className="border-slate-700/30 hover:bg-slate-800/40 cursor-pointer"
                      onClick={() => setView('sessions')}
                    >
                      <TableCell className="text-sm text-slate-300">
                        {session.vehicle
                          ? `${session.vehicle.brand} ${session.vehicle.model || ''}`
                          : 'Araç Seçilmedi'}
                      </TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell className="text-sm text-slate-400 hidden sm:table-cell">
                        {session._count.faultCodes > 0 ? `${session._count.faultCodes} kod` : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {formatDate(session.startedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">Henüz oturum yok. İlk tanınızı başlatın!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          onClick={() => setView('sessions')}
          className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40 hover:border-gray-500/30 transition-colors cursor-pointer group"
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/10 border border-gray-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Yeni Tanı Başlat</p>
              <p className="text-xs text-slate-500">AI ile arıza kodu analiz</p>
            </div>
          </CardContent>
        </Card>
        <Card
          onClick={() => setView('vehicles')}
          className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40 hover:border-emerald-500/30 transition-colors cursor-pointer group"
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Araç Ekle</p>
              <p className="text-xs text-slate-500">Yeni araç kaydı</p>
            </div>
          </CardContent>
        </Card>
        <Card
          onClick={() => setView('sessions')}
          className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40 hover:border-amber-500/30 transition-colors cursor-pointer group"
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Raporlar</p>
              <p className="text-xs text-slate-500">Geçmiş teşhis raporları</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base">Nasıl Çalışır?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Araç Seç', desc: 'Tanı yapacağınız Mercedes-Benz aracını seçin veya yeni ekleyin', icon: '🚗' },
              { step: '2', title: 'Kod Gir', desc: 'XENTRY cihazından okunan arıza kodlarını girin', icon: '🔢' },
              { step: '3', title: 'AI Analiz', desc: 'Yapay zeka her kodu analiz eder ve nedenler/çözümler sunar', icon: '🤖' },
              { step: '4', title: 'Rapor Al', desc: 'Detaylı teşhis raporunu yazdırın veya paylaşın', icon: '📄' },
            ].map(item => (
              <div key={item.step} className="text-center p-3">
                <div className="w-10 h-10 mx-auto rounded-xl bg-slate-700/40 flex items-center justify-center text-xl mb-2">
                  {item.icon}
                </div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
