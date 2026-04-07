'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Session {
  id: string
  status: string
  startedAt: string
  completedAt: string | null
  vehicle: { vin: string; brand: string; model: string } | null
  _count: { faultCodes: number; testResults: number; reports: number }
}

export default function SessionsView() {
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetch(`/api/sessions?userId=${user.id}`)
      .then(res => res.json())
      .then(data => { setSessions(data.sessions || []); setLoading(false) })
      .catch(() => { toast.error('Oturumlar yüklenemedi'); setLoading(false) })
  }, [user])

  const createSession = async () => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      })
      const data = await res.json()
      if (res.ok) {
        setSessions(prev => [data, ...prev])
        toast.success('Yeni tanı oturumu oluşturuldu')
      }
    } catch {
      toast.error('Oturum oluşturulamadı')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tanı Oturumları</h1>
          <p className="text-slate-400 text-sm mt-1">Araç tanı oturumlarınızı yönetin</p>
        </div>
        <Button onClick={createSession} className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white">
          + Yeni Tanı Başlat
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
              <CardContent className="p-6 h-20" />
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-lg font-semibold text-white mb-2">Henüz oturum yok</h3>
            <p className="text-slate-400 text-sm">Yukarıdaki butonu tıklayarak ilk tanı oturumunuzu başlatın.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-lg">
                      🔧
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {session.vehicle ? `${session.vehicle.brand} ${session.vehicle.model}` : 'Araç Seçilmedi'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {session.vehicle?.vin || '-'} • {new Date(session.startedAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={session.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-0' : 'bg-amber-500/10 text-amber-400 border-0'}>
                      {session.status === 'completed' ? 'Tamamlandı' : 'Aktif'}
                    </Badge>
                    <div className="text-right text-xs text-slate-500">
                      <p>{session._count.faultCodes} hata • {session._count.testResults} test</p>
                      <p>{session._count.reports} rapor</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
