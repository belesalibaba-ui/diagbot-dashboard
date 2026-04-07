'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'

interface UserWithLicense {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  licenses: Array<{ licenseType: string; status: string; expiresAt: string }>
  _count: { vehicles: number; sessions: number }
}

export default function AdminUsersView() {
  const [users, setUsers] = useState<UserWithLicense[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10' })
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch {
      toast.error('Kullanıcılar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setTogglingId(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentActive }),
      })
      if (res.ok) {
        toast.success(`Kullanıcı ${!currentActive ? 'aktifleştirildi' : 'devre dışı bırakıldı'}`)
        fetchUsers()
      } else {
        toast.error('İşlem başarısız')
      }
    } catch {
      toast.error('Sunucuya bağlanılamadı')
    } finally {
      setTogglingId(null)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">Admin</Badge>
    }
    return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 text-xs">Kullanıcı</Badge>
  }

  const getLicenseBadge = (licenses: UserWithLicense['licenses']) => {
    const active = licenses.find((l) => l.status === 'active')
    if (!active) {
      return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">Lisans Yok</Badge>
    }
    const label: Record<string, string> = {
      trial: 'Deneme', monthly: 'Aylık', quarterly: '3 Aylık', yearly: 'Yıllık', lifetime: 'Ömür',
    }
    return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">{label[active.licenseType] || active.licenseType}</Badge>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="h-10 lg:hidden" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Kullanıcı Yönetimi</h1>
          <p className="text-slate-400 text-sm mt-1">Tüm kullanıcıları görüntüleyin ve yönetin</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya e-posta ara..."
            className="pl-10 bg-slate-800/40 border-slate-700/50 text-white placeholder:text-slate-500 h-10 focus:border-gray-400 focus:ring-gray-400/20"
          />
        </div>
        <Button type="submit" className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white h-10 rounded-xl px-5">
          Ara
        </Button>
      </form>

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
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">E-posta</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">İsim</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Rol</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Durum</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Lisans</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Kayıt Tarihi</TableHead>
                  <TableHead className="text-slate-400 text-xs font-semibold uppercase tracking-wider text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      Kullanıcı bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="border-slate-700/30 hover:bg-slate-800/40">
                      <TableCell className="text-sm text-slate-300">{user.email}</TableCell>
                      <TableCell className="text-sm text-white font-medium">{user.name}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] px-2 py-0 h-5 border-0 ${
                          user.isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {user.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getLicenseBadge(user.licenses)}</TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          disabled={togglingId === user.id}
                          className={`h-8 px-3 text-xs rounded-lg ${
                            user.isActive
                              ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                          }`}
                        >
                          {togglingId === user.id ? (
                            <svg className="animate-spin w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : null}
                          {user.isActive ? 'Devre Dışı' : 'Aktifleştir'}
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
