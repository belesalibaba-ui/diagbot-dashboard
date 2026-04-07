'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'

interface LicenseWithUser {
  id: string
  licenseKey: string
  licenseType: string
  status: string
  expiresAt: string
  maxDevices: number
  createdAt: string
  user: { id: string; email: string; name: string }
}

interface SimpleUser {
  id: string
  email: string
  name: string
}

export default function AdminLicensesView() {
  const [licenses, setLicenses] = useState<LicenseWithUser[]>([])
  const [users, setUsers] = useState<SimpleUser[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [creating, setCreating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchLicenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10' })
      const res = await fetch(`/api/admin/licenses?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLicenses(data.licenses || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch {
      toast.error('Lisanslar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [page])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users?limit=100')
      if (res.ok) {
        const data = await res.json()
        setUsers((data.users || []).map((u: any) => ({ id: u.id, email: u.email, name: u.name })))
      }
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    fetchLicenses()
  }, [fetchLicenses])

  useEffect(() => {
    if (dialogOpen) fetchUsers()
  }, [dialogOpen, fetchUsers])

  const handleCreateLicense = async () => {
    if (!selectedUser || !selectedType) {
      toast.error('Kullanıcı ve lisans tipi seçin')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser, licenseType: selectedType }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Lisans oluşturuldu: ${data.license.licenseKey}`)
        setDialogOpen(false)
        setSelectedUser('')
        setSelectedType('')
        fetchLicenses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Lisans oluşturulamadı')
      }
    } catch {
      toast.error('Sunucuya bağlanılamadı')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStatus = async (licenseId: string, currentStatus: string) => {
    setUpdatingId(licenseId)
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId, status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Lisans ${newStatus === 'active' ? 'aktifleştirildi' : 'askıya alındı'}`)
        fetchLicenses()
      } else {
        toast.error('İşlem başarısız')
      }
    } catch {
      toast.error('Sunucuya bağlanılamadı')
    } finally {
      setUpdatingId(null)
    }
  }

  const getTypeBadge = (type: string) => {
    const config: Record<string, { label: string; className: string }> = {
      trial: { label: 'Deneme', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
      monthly: { label: 'Aylık', className: 'bg-gray-500/10 text-gray-300 border-gray-500/20' },
      quarterly: { label: '3 Aylık', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      yearly: { label: 'Yıllık', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      lifetime: { label: 'Ömür', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    }
    const c = config[type] || { label: type, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
    return <Badge className={`text-xs ${c.className}`}>{c.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: 'Aktif', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      suspended: { label: 'Askıda', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      expired: { label: 'Süresi Dolmuş', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
    }
    const c = config[status] || { label: status, className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
    return <Badge className={`text-xs ${c.className}`}>{c.label}</Badge>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="h-10 lg:hidden" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Lisans Yönetimi</h1>
          <p className="text-slate-400 text-sm mt-1">Tüm lisansları görüntüleyin ve yönetin</p>
        </div>

        {/* Create License Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium rounded-xl shadow-lg shadow-gray-500/20 h-10">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Yeni Lisans
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700/50 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Yeni Lisans Oluştur</DialogTitle>
              <DialogDescription className="text-slate-400">
                Bir kullanıcıya yeni lisans atayın
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Kullanıcı</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-600/50 text-white">
                    <SelectValue placeholder="Kullanıcı seçin..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600/50">
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-slate-200 focus:bg-slate-700 focus:text-white">
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Lisans Tipi</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-600/50 text-white">
                    <SelectValue placeholder="Lisans tipi seçin..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600/50">
                    <SelectItem value="trial" className="text-slate-200 focus:bg-slate-700 focus:text-white">🧪 Deneme (7 gün)</SelectItem>
                    <SelectItem value="monthly" className="text-slate-200 focus:bg-slate-700 focus:text-white">📅 Aylık (30 gün)</SelectItem>
                    <SelectItem value="quarterly" className="text-slate-200 focus:bg-slate-700 focus:text-white">⭐ 3 Aylık (90 gün)</SelectItem>
                    <SelectItem value="yearly" className="text-slate-200 focus:bg-slate-700 focus:text-white">🏆 Yıllık (365 gün)</SelectItem>
                    <SelectItem value="lifetime" className="text-slate-200 focus:bg-slate-700 focus:text-white">💎 Ömür</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-slate-600/50 text-slate-300 hover:bg-slate-800/50"
              >
                İptal
              </Button>
              <Button
                onClick={handleCreateLicense}
                disabled={creating}
                className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Oluşturuluyor...
                  </span>
                ) : (
                  'Oluştur'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/40 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 bg-slate-700/30 rounded-lg" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/40 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Anahtar</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Kullanıcı</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tip</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Durum</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Son Kullanma</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      Lisans bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  licenses.map((license) => (
                    <TableRow key={license.id} className="border-slate-700/30 hover:bg-slate-800/40">
                      <TableCell className="text-sm text-slate-300 font-mono text-xs">
                        {license.licenseKey.slice(0, 16)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-white font-medium">{license.user.name}</p>
                          <p className="text-xs text-slate-500">{license.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(license.licenseType)}</TableCell>
                      <TableCell>{getStatusBadge(license.status)}</TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {new Date(license.expiresAt).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(license.id, license.status)}
                          disabled={updatingId === license.id}
                          className={`h-8 px-3 text-xs rounded-lg ${
                            license.status === 'active'
                              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                          }`}
                        >
                          {updatingId === license.id ? (
                            <svg className="animate-spin w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : null}
                          {license.status === 'active' ? 'Askıya Al' : 'Aktifleştir'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/40">
            <p className="text-xs text-slate-500">
              Sayfa {page} / {totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Önceki
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-3 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
