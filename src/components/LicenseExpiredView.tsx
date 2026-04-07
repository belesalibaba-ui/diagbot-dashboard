'use client'

import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function LicenseExpiredView() {
  const { license, user, setView, logout } = useAuthStore()

  const expiryDate = license?.expiresAt
    ? new Date(license.expiresAt).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Bilinmeyen'

  const daysSinceExpiry = license?.expiresAt
    ? Math.floor((Date.now() - new Date(license.expiresAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-5 h-5" fill="none">
              <path d="M50 14 L50 86" stroke="white" strokeWidth="5" />
              <path d="M20 62 Q50 8 80 62" stroke="white" strokeWidth="5" />
              <path d="M20 38 Q50 92 80 38" stroke="white" strokeWidth="5" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">XENTRY DiagBot Pro</h2>
            <p className="text-xs text-slate-500">Mercedes-Benz Otonom Tanı Sistemi</p>
          </div>
        </div>

        {/* Warning Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-red-500/20 shadow-2xl shadow-red-500/5 overflow-hidden">
          {/* Red top bar */}
          <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />

          <div className="p-8">
            {/* Warning Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Lisans Süreniz Dolmuş</h1>
              <p className="text-slate-400 text-sm">
                {user?.name} olarak giriş yaptınız. Lisansınızın süresi dolmuştur.
              </p>
            </div>

            {/* License Info */}
            <div className="bg-slate-900/60 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Lisans Tipi</span>
                <Badge className="bg-slate-700 text-slate-300 border-0 text-xs">
                  {license?.licenseType === 'trial' && '🧪 Deneme'}
                  {license?.licenseType === 'monthly' && '📅 Aylık'}
                  {license?.licenseType === 'quarterly' && '⭐ 3 Aylık'}
                  {license?.licenseType === 'yearly' && '🏆 Yıllık'}
                  {license?.licenseType === 'lifetime' && '💎 Ömür'}
                </Badge>
              </div>
              <div className="h-px bg-slate-700/50" />
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Son Kullanma</span>
                <span className="text-red-400 text-sm font-medium">{expiryDate}</span>
              </div>
              <div className="h-px bg-slate-700/50" />
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Süre Dolma</span>
                <span className="text-red-400 text-sm font-medium">
                  {daysSinceExpiry > 0 ? `${daysSinceExpiry} gün önce` : 'Bugün'}
                </span>
              </div>
              {license?.licenseKey && (
                <>
                  <div className="h-px bg-slate-700/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Lisans Anahtarı</span>
                    <span className="text-slate-500 text-xs font-mono">{license.licenseKey}</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => setView('license_activate')}
                className="w-full h-11 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-semibold rounded-xl shadow-lg shadow-gray-500/20"
              >
                Yeni Lisans Aktifleştir
              </Button>
              <Button
                variant="outline"
                onClick={logout}
                className="w-full h-11 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-xl"
              >
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>

        {/* Renewal Pricing Summary */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Lisans Yenileme Seçenekleri</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Aylık', price: '₺999', popular: false },
              { label: '3 Aylık', price: '₺2.499', popular: false },
              { label: 'Yıllık', price: '₺7.999', popular: true },
              { label: 'Ömür', price: '₺24.999', popular: false },
            ].map((plan) => (
              <Card
                key={plan.label}
                className={`bg-slate-800/40 backdrop-blur-sm rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                  plan.popular
                    ? 'border-amber-500/30 shadow-md shadow-amber-500/5'
                    : 'border-slate-700/50'
                }`}
                onClick={() => setView('license_activate')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm font-medium">{plan.label}</span>
                    {plan.popular && (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-1.5 py-0">
                        Popüler
                      </Badge>
                    )}
                  </div>
                  <p className="text-white font-bold text-lg mt-1">{plan.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
