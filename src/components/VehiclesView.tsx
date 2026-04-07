'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Vehicle {
  id: string
  vin: string
  brand: string
  model: string | null
  year: number | null
  engine: string | null
  createdAt: string
  _count: { sessions: number }
}

export default function VehiclesView() {
  const { user } = useAuthStore()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ vin: '', brand: 'Mercedes-Benz', model: '', year: '', engine: '' })

  const loadVehicles = () => {
    if (!user) return
    fetch(`/api/vehicles?userId=${user.id}`)
      .then(res => res.json())
      .then(data => { setVehicles(data.vehicles || []); setLoading(false) })
      .catch(() => { toast.error('Araçlar yüklenemedi'); setLoading(false) })
  }

  useEffect(() => { loadVehicles() }, [user])

  const addVehicle = async () => {
    if (!form.vin) { toast.error('VIN zorunlu'); return }
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, vin: form.vin.toUpperCase(), brand: form.brand, model: form.model, year: parseInt(form.year) || null, engine: form.engine })
      })
      if (res.ok) {
        toast.success('Araç eklendi')
        setDialogOpen(false)
        setForm({ vin: '', brand: 'Mercedes-Benz', model: '', year: '', engine: '' })
        loadVehicles()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Araç eklenemedi')
      }
    } catch {
      toast.error('Araç eklenemedi')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Araçlarım</h1>
          <p className="text-slate-400 text-sm mt-1">Kayıtlı araçlarınızı yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white">
              + Araç Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Araç Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">VIN *</Label>
                <Input value={form.vin} onChange={e => setForm({ ...form, vin: e.target.value })} placeholder="WDDGF4HB1EA123456" className="bg-slate-900 border-slate-600 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Marka</Label>
                  <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="bg-slate-900 border-slate-600 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Model</Label>
                  <Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="E-Class, C-Class..." className="bg-slate-900 border-slate-600 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Yıl</Label>
                  <Input value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="2024" className="bg-slate-900 border-slate-600 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Motor</Label>
                  <Input value={form.engine} onChange={e => setForm({ ...form, engine: e.target.value })} placeholder="2.0 CDI" className="bg-slate-900 border-slate-600 text-white" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-slate-400">İptal</Button>
              <Button onClick={addVehicle} className="bg-gray-600 hover:bg-gray-500 text-white">Ekle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
              <CardContent className="p-6 h-24" />
            </Card>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">🚗</div>
            <h3 className="text-lg font-semibold text-white mb-2">Henüz araç yok</h3>
            <p className="text-slate-400 text-sm mb-4">İlk aracınızı ekleyerek tanı işlemlerine başlayın.</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-gray-600 hover:bg-gray-500 text-white">+ Araç Ekle</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Card key={v.id} className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-2xl">🚗</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{v.brand} {v.model || ''}</p>
                    <p className="text-xs text-slate-500">{v.year || '-'} • {v.engine || '-'}</p>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2 mb-3">
                  <p className="text-[11px] font-mono text-slate-400 tracking-wide">{v.vin}</p>
                </div>
                <p className="text-xs text-slate-500">{v._count.sessions} tanı oturumu</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* İndir bölümü */}
      <Card className="bg-slate-800/50 border-emerald-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">XENTRY DiagBot Masaüstü Uygulaması</p>
                <p className="text-xs text-slate-400">KURULUM.bat dosyasını indirerek araca bağlantı kurun</p>
              </div>
            </div>
            <a href="/indir" className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl transition-colors">
              İndir
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
