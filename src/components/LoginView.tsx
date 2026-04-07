'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function MercedesStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" className="text-gray-500" />
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" className="text-gray-600" />
      <path d="M50 14 L50 86" stroke="currentColor" strokeWidth="2.5" className="text-gray-300" />
      <path d="M20 62 Q50 8 80 62" stroke="currentColor" strokeWidth="2.5" className="text-gray-300" />
      <path d="M20 38 Q50 92 80 38" stroke="currentColor" strokeWidth="2.5" className="text-gray-300" />
    </svg>
  )
}

export default function LoginView() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const { setUser, setLicense } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }

    if (!isLogin && !name) {
      toast.error('Lütfen isminizi girin')
      return
    }

    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin ? { email, password } : { email, password, name }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Bir hata oluştu')
        return
      }

      if (isLogin) {
        toast.success('Giriş başarılı!')
      } else {
        toast.success('Kayıt başarılı! Hoş geldiniz.')
      }

      setUser(data.user)
      if (data.license) {
        setLicense(data.license)
      } else {
        useAuthStore.getState().setView('license_activate')
      }
    } catch {
      toast.error('Sunucuya bağlanılamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gray-500/3 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-5">
            <MercedesStar className="w-full h-full drop-shadow-2xl" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-200 via-gray-100 to-gray-300 bg-clip-text text-transparent tracking-tight">
            XENTRY DiagBot Pro
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium tracking-wide">
            Mercedes-Benz Otonom Tanı Sistemi
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/20 p-8">
          {/* Tab toggle */}
          <div className="flex bg-slate-900/60 rounded-xl p-1 mb-7">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isLogin
                  ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-lg shadow-gray-500/20'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                !isLogin
                  ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-lg shadow-gray-500/20'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300 text-sm font-medium">
                  İsim Soyisim
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Adınız Soyadınız"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500 h-11 focus:border-gray-400 focus:ring-gray-400/20 transition-colors"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                E-posta
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500 h-11 focus:border-gray-400 focus:ring-gray-400/20 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                Şifre
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-900/60 border-slate-600/50 text-white placeholder:text-slate-500 h-11 focus:border-gray-400 focus:ring-gray-400/20 transition-colors"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-semibold rounded-xl shadow-lg shadow-gray-500/20 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isLogin ? 'Giriş yapılıyor...' : 'Kayıt olunuyor...'}
                </span>
              ) : (
                isLogin ? 'Giriş Yap' : 'Kayıt Ol'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/50">
            <p className="text-center text-xs text-slate-500">
              {isLogin ? (
                <>
                  Hesabınız yok mu?{' '}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-gray-400 hover:text-gray-300 font-medium transition-colors"
                  >
                    Kayıt Ol
                  </button>
                </>
              ) : (
                <>
                  Zaten hesabınız var mı?{' '}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-gray-400 hover:text-gray-300 font-medium transition-colors"
                  >
                    Giriş Yap
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-slate-600 text-xs">
            v2.2.0 &bull; Mercedes-Benz Tanı Sistemi
          </p>
        </div>
      </div>
    </div>
  )
}
