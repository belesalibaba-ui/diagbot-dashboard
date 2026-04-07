'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalLicenses: number
  activeLicenses: number
  totalSessions: number
  totalVehicles: number
  expiringLicenses: number
  licenseTypes: Array<{ licenseType: string; _count: { licenseType: number } }>
  recentUsers: Array<{
    id: string
    email: string
    name: string
    createdAt: string
    isActive: boolean
  }>
}

interface StatItemProps {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
  bgColor: string
}

function StatItem({ label, value, icon, color, bgColor }: StatItemProps) {
  return (
    <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40 hover:border-slate-600/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminView() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // fallback to demo data
    } finally {
      setLoading(false)
    }
  }

  const licenseTypeLabels: Record<string, string> = {
    trial: '🧪 Deneme',
    monthly: '📅 Aylık',
    quarterly: '⭐ 3 Aylık',
    yearly: '🏆 Yıllık',
    lifetime: '💎 Ömür',
  }

  const licenseTypeColors: Record<string, string> = {
    trial: 'bg-slate-500',
    monthly: 'bg-gray-500',
    quarterly: 'bg-amber-500',
    yearly: 'bg-emerald-500',
    lifetime: 'bg-purple-500',
  }

  const maxLicenseCount = stats?.licenseTypes?.length
    ? Math.max(...stats.licenseTypes.map((l) => l._count.licenseType))
    : 1

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-10 lg:hidden" />
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-slate-800 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 bg-slate-800 rounded-xl" />
        <Skeleton className="h-48 bg-slate-800 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="h-10 lg:hidden" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Paneli</h1>
        <p className="text-slate-400 text-sm mt-1">Sistem genel bakış ve istatistikler</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatItem
          label="Toplam Kullanıcı"
          value={stats?.totalUsers ?? 0}
          color="text-gray-400"
          bgColor="bg-gray-500/10"
          icon={
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <StatItem
          label="Aktif Kullanıcı"
          value={stats?.activeUsers ?? 0}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatItem
          label="Toplam Lisans"
          value={stats?.totalLicenses ?? 0}
          color="text-gray-400"
          bgColor="bg-gray-500/10"
          icon={
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          }
        />
        <StatItem
          label="Aktif Lisans"
          value={stats?.activeLicenses ?? 0}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          }
        />
        <StatItem
          label="Toplam Oturum"
          value={stats?.totalSessions ?? 0}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
          icon={
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
            </svg>
          }
        />
        <StatItem
          label="Süresi Dolacak"
          value={stats?.expiringLicenses ?? 0}
          color="text-red-400"
          bgColor="bg-red-500/10"
          icon={
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* License Type Distribution */}
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Lisans Tipi Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(stats?.licenseTypes || []).length > 0 ? (
              stats!.licenseTypes.map((lt) => {
                const percentage = Math.round((lt._count.licenseType / maxLicenseCount) * 100)
                return (
                  <div key={lt.licenseType} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">
                        {licenseTypeLabels[lt.licenseType] || lt.licenseType}
                      </span>
                      <span className="text-sm font-semibold text-white">{lt._count.licenseType}</span>
                    </div>
                    <div className="h-2.5 bg-slate-900/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${licenseTypeColors[lt.licenseType] || 'bg-gray-500'} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                Lisans verisi bulunamadı
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Son Kayıt Olan Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.recentUsers || []).length > 0 ? (
              stats!.recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      className={`text-[10px] px-2 py-0 h-5 border-0 ${
                        u.isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {u.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                    <p className="text-[10px] text-slate-600 mt-1">
                      {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                Kullanıcı verisi bulunamadı
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
