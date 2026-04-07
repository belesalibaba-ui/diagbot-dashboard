'use client'

import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function SettingsView() {
  const { user, license } = useAuthStore()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
        <p className="text-slate-400 text-sm mt-1">Hesap ve lisans bilgilerinizi yönetin</p>
      </div>

      {/* Profil */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-white mb-4">Profil Bilgileri</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">E-posta</Label>
              <Input value={user?.email || ''} disabled className="bg-slate-900 border-slate-600 text-slate-400" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">İsim</Label>
              <Input value={user?.name || ''} disabled className="bg-slate-900 border-slate-600 text-slate-400" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Rol</Label>
              <Input value={user?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'} disabled className="bg-slate-900 border-slate-600 text-slate-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lisans */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-white mb-4">Lisans Bilgileri</h3>
          {license ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Lisans Anahtarı</span>
                <span className="text-sm font-mono text-white">{license.licenseKey}</span>
              </div>
              <Separator className="bg-slate-700/50" />
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Plan</span>
                <span className="text-sm text-white capitalize">
                  {license.licenseType === 'trial' && 'Deneme'}
                  {license.licenseType === 'monthly' && 'Aylık'}
                  {license.licenseType === 'quarterly' && '3 Aylık'}
                  {license.licenseType === 'yearly' && 'Yıllık'}
                  {license.licenseType === 'lifetime' && 'Ömür'}
                </span>
              </div>
              <Separator className="bg-slate-700/50" />
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Durum</span>
                <span className={`text-sm ${license.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {license.status === 'active' ? 'Aktif' : license.status === 'suspended' ? 'Askıda' : 'Süresi Dolmuş'}
                </span>
              </div>
              <Separator className="bg-slate-700/50" />
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Son Kullanma</span>
                <span className="text-sm text-white">{new Date(license.expiresAt).toLocaleDateString('tr-TR')}</span>
              </div>
              <Separator className="bg-slate-700/50" />
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Maks. Cihaz</span>
                <span className="text-sm text-white">{license.maxDevices}</span>
              </div>
              {license.hwid && (
                <>
                  <Separator className="bg-slate-700/50" />
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Cihaz ID</span>
                    <span className="text-sm font-mono text-white">{license.hwid.substring(0, 16)}...</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Lisans bilgisi bulunamadı.</p>
          )}
        </CardContent>
      </Card>

      {/* İndir */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-white mb-2">Masaüstü Uygulaması</h3>
          <p className="text-sm text-slate-400 mb-4">Araç tanı cihazınıza bağlamak için KURULUM.bat dosyasını indirin.</p>
          <a href="/indir">
            <Button className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
              KURULUM.BAT İndir
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
