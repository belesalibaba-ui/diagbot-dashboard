'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

interface PricingPlan {
  id: string
  title: string
  price: string
  period: string
  description: string
  features: string[]
  icon: string
  highlighted?: boolean
  current?: boolean
  badge?: string
}

const plans: PricingPlan[] = [
  {
    id: 'trial',
    title: 'Deneme',
    price: 'Ücretsiz',
    period: '7 gün',
    description: 'Sistemi keşfetmek için ücretsiz deneyin',
    features: [
      'Tüm temel tanı özellikleri',
      'Sınırsız oturum',
      '1 cihaz desteği',
      '7 gün tam erişim',
      'E-posta desteği',
    ],
    icon: '🎁',
    current: true,
    badge: 'Mevcut Plan',
  },
  {
    id: 'monthly',
    title: 'Aylık',
    price: '₺999',
    period: '/ay',
    description: 'Esnek aylık abonelik',
    features: [
      'Tüm tanı özellikleri',
      'Sınırsız oturum',
      '1 cihaz desteği',
      'Öncelikli destek',
      ' Haftalık raporlar',
      'OTA güncellemeler',
    ],
    icon: '📅',
  },
  {
    id: 'quarterly',
    title: '3 Aylık',
    price: '₺2.499',
    period: '/3 ay',
    description: '3 aylık tasarruflu plan',
    features: [
      'Tüm tanı özellikleri',
      'Sınırsız oturum',
      '2 cihaz desteği',
      'Öncelikli destek',
      'Günlük raporlar',
      'OTA güncellemeler',
      'Detaylı analiz',
    ],
    icon: '⭐',
  },
  {
    id: 'yearly',
    title: 'Yıllık',
    price: '₺7.999',
    period: '/yıl',
    description: 'En popüler yıllık plan',
    features: [
      'Tüm tanı özellikleri',
      'Sınırsız oturum',
      '3 cihaz desteği',
      '7/24 destek',
      'Günlük raporlar',
      'OTA güncellemeler',
      'Detaylı analiz',
      'API erişimi',
    ],
    icon: '🏆',
    highlighted: true,
    badge: 'Önerilen',
  },
  {
    id: 'lifetime',
    title: 'Ömür',
    price: '₺24.999',
    period: '/tek sefer',
    description: 'Ömür boyu tam erişim',
    features: [
      'Tüm tanı özellikleri',
      'Sınırsız oturum',
      'Sınırsız cihaz',
      '7/24 öncelikli destek',
      'Günlük raporlar',
      'OTA güncellemeler',
      'Detaylı analiz',
      'API erişimi',
      'Beta erişimi',
    ],
    icon: '💎',
  },
]

export default function LicenseActivateView() {
  const [licenseKey, setLicenseKey] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, setLicense } = useAuthStore()

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setLicenseKey(text.trim())
      toast.success('Lisans anahtarı yapıştırıldı')
    } catch {
      toast.error('Pano erişimi reddedildi')
    }
  }

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      toast.error('Lütfen lisans anahtarınızı girin')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/licenses/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: licenseKey.trim(),
          hwid: 'web-' + (user?.id || 'unknown'),
          deviceName: 'Web Tarayıcı',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Aktivasyon başarısız')
        return
      }

      toast.success('Lisans başarıyla aktifleştirildi!')
      setLicense(data.license)
    } catch {
      toast.error('Sunucuya bağlanılamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-5 h-5" fill="none">
                  <path d="M50 14 L50 86" stroke="white" strokeWidth="5" />
                  <path d="M20 62 Q50 8 80 62" stroke="white" strokeWidth="5" />
                  <path d="M20 38 Q50 92 80 38" stroke="white" strokeWidth="5" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">XENTRY DiagBot Pro</h1>
                <p className="text-xs text-slate-500">Lisans Yönetimi</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-300">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-sm font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* License Activation Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Lisans Aktifleştirme</h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Lisans anahtarınızı girerek XENTRY DiagBot Pro&apos;nun tüm özelliklerine erişim sağlayın
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <Label className="text-slate-300 text-sm font-medium mb-2 block">Lisans Anahtarı</Label>
              <div className="flex gap-2">
                <Input
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="flex-1 bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500 h-11 font-mono tracking-wider focus:border-gray-400 focus:ring-gray-400/20"
                />
                <Button
                  variant="outline"
                  onClick={handlePaste}
                  className="h-11 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white px-4"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Yapıştır
                </Button>
              </div>
              <Button
                onClick={handleActivate}
                disabled={loading}
                className="w-full mt-4 h-11 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-semibold rounded-xl shadow-lg shadow-gray-500/20 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Aktifleştiriliyor...
                  </span>
                ) : (
                  'Aktifleştir'
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Lisans Planları</h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              İhtiyacınıza en uygun planı seçin, tüm planlar otomatik yenilenir
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative bg-slate-800/40 backdrop-blur-sm border transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlighted
                    ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : plan.current
                    ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-700/50 hover:border-slate-600/50'
                }`}
              >
                {(plan.highlighted || plan.current) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge
                      className={`text-xs font-semibold px-3 py-0.5 rounded-full border-0 ${
                        plan.highlighted
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3 pt-5">
                  <div className="text-3xl mb-2">{plan.icon}</div>
                  <CardTitle className="text-white text-lg">{plan.title}</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="mb-4">
                    <span className={`text-2xl font-bold ${plan.highlighted ? 'text-amber-400' : plan.current ? 'text-emerald-400' : 'text-white'}`}>
                      {plan.price}
                    </span>
                    <span className="text-slate-500 text-sm ml-1">{plan.period}</span>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                        <svg className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-2 pb-5">
                  <Button
                    className={`w-full font-medium rounded-xl h-10 transition-all duration-200 ${
                      plan.highlighted
                        ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20'
                        : plan.current
                        ? 'bg-slate-700/50 text-slate-300 cursor-default'
                        : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white'
                    }`}
                    disabled={plan.current || loading}
                    onClick={() => {
                      if (!plan.current) {
                        toast.info('İletişim üzerinden lisans satın alabilirsiniz')
                      }
                    }}
                  >
                    {plan.current ? 'Aktif Plan' : plan.highlighted ? 'Şimdi Al' : 'Seç'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-12 mb-8">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/40 p-6 sm:p-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Lisans Satın Almak mı İstiyorsunuz?</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                Özel fiyat teklifleri ve toplu lisans seçenekleri için bizimle iletişime geçin
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  destek@xentrydiagbot.com
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +90 (555) 123 45 67
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pzt - Cum: 09:00 - 18:00
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
