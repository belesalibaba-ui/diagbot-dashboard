'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  view: string
  adminOnly?: boolean
}

function getLicenseCountdown(expiresAt: string): string {
  const now = Date.now()
  const expiry = new Date(expiresAt).getTime()
  const diff = expiry - now

  if (diff <= 0) return 'Süre doldu'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 30) return `${days} gün`
  if (days > 0) return `${days}g ${hours}s`
  return `${hours} saat`
}

export default function Sidebar() {
  const { user, license, view, setView, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [countdown, setCountdown] = useState('')

  const isAdmin = user?.role === 'admin'

  // Initialize countdown from license expiry
  const initialCountdown = license?.expiresAt ? getLicenseCountdown(license.expiresAt) : ''

  useEffect(() => {
    if (initialCountdown) {
      const interval = setInterval(() => {
        setCountdown(getLicenseCountdown(license?.expiresAt || ''))
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [initialCountdown])

  const displayCountdown = countdown || initialCountdown

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Ana Panel',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
      view: 'dashboard',
    },
    {
      id: 'sessions',
      label: 'Tanı Oturumları',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      ),
      view: 'sessions',
    },
    {
      id: 'vehicles',
      label: 'Araçlarım',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h3.375m0 0V11.25m0 3H12M5.25 14.25V11.25m6.75 3v-3m0 0h3.375M12 11.25h3.375M5.625 5.25H18.75a1.125 1.125 0 011.125 1.125v4.5H4.5v-4.5A1.125 1.125 0 015.625 5.25z" />
        </svg>
      ),
      view: 'vehicles',
    },
    {
      id: 'settings',
      label: 'Ayarlar',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      view: 'settings',
    },
  ]

  const adminItems: NavItem[] = [
    {
      id: 'admin',
      label: 'Admin Paneli',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      ),
      view: 'admin',
      adminOnly: true,
    },
    {
      id: 'admin_users',
      label: 'Kullanıcılar',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      view: 'admin_users',
      adminOnly: true,
    },
    {
      id: 'admin_licenses',
      label: 'Lisanslar',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      ),
      view: 'admin_licenses',
      adminOnly: true,
    },
  ]

  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems

  const handleNavClick = (item: NavItem) => {
    setView(item.view as any)
    setMobileOpen(false)
  }

  const isActive = (item: NavItem) => view === item.view

  // Mobile overlay
  if (mobileOpen) {
    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />

        {/* Mobile sidebar */}
        <div className="fixed inset-y-0 left-0 w-[280px] bg-slate-900 border-r border-slate-800 z-50 flex flex-col lg:hidden">
          <SidebarContent
            user={user}
            license={license}
            countdown={displayCountdown}
            allItems={allItems}
            isActive={isActive}
            handleNavClick={handleNavClick}
            logout={logout}
            isAdmin={isAdmin}
            onClose={() => setMobileOpen(false)}
          />
        </div>
      </>
    )
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden w-10 h-10 rounded-xl bg-slate-800/80 backdrop-blur border border-slate-700/50 flex items-center justify-center text-white hover:bg-slate-700/80 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[280px] shrink-0 flex-col bg-slate-900 border-r border-slate-800/60 min-h-screen sticky top-0">
        <SidebarContent
          user={user}
          license={license}
          countdown={countdown}
          allItems={allItems}
          isActive={isActive}
          handleNavClick={handleNavClick}
          logout={logout}
          isAdmin={isAdmin}
        />
      </aside>
    </>
  )
}

interface SidebarContentProps {
  user: any
  license: any
  countdown: string
  allItems: NavItem[]
  isActive: (item: NavItem) => boolean
  handleNavClick: (item: NavItem) => void
  logout: () => void
  isAdmin: boolean
  onClose?: () => void
}

function SidebarContent({
  user,
  license,
  countdown,
  allItems,
  isActive,
  handleNavClick,
  logout,
  isAdmin,
  onClose,
}: SidebarContentProps) {
  const isLicenseExpiringSoon = countdown && !countdown.includes('Süre doldu') && (
    countdown.includes('saat') || (parseInt(countdown) <= 7 && parseInt(countdown) > 0)
  )

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 100 100" className="w-5 h-5" fill="none">
            <path d="M50 14 L50 86" stroke="white" strokeWidth="5" />
            <path d="M20 62 Q50 8 80 62" stroke="white" strokeWidth="5" />
            <path d="M20 38 Q50 92 80 38" stroke="white" strokeWidth="5" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-white truncate">XENTRY DiagBot Pro</h2>
          <p className="text-[10px] text-slate-500 truncate">Mercedes-Benz Tanı Sistemi</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <Separator className="bg-slate-800/60" />

      {/* User info */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-slate-700/50">
            <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-700 text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Kullanıcı'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
          </div>
        </div>

        {/* License status */}
        {license && (
          <div className="mt-3 bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Lisans Durumu</span>
              <Badge
                className={`text-[10px] px-2 py-0 h-5 border-0 font-medium ${
                  license.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : license.status === 'suspended'
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {license.status === 'active' && '● Aktif'}
                {license.status === 'suspended' && '● Askıda'}
                {license.status === 'expired' && '● Süresi Dolmuş'}
              </Badge>
            </div>
            {license.status === 'active' && countdown && (
              <p className={`text-xs font-medium ${isLicenseExpiringSoon ? 'text-amber-400' : 'text-slate-400'}`}>
                {isLicenseExpiringSoon && '⚠ '}
                {countdown} kaldı
              </p>
            )}
            <p className="text-[10px] text-slate-600 mt-1 capitalize">
              {license.licenseType === 'trial' && 'Deneme Plan'}
              {license.licenseType === 'monthly' && 'Aylık Plan'}
              {license.licenseType === 'quarterly' && '3 Aylık Plan'}
              {license.licenseType === 'yearly' && 'Yıllık Plan'}
              {license.licenseType === 'lifetime' && 'Ömür Plan'}
            </p>
          </div>
        )}
      </div>

      <Separator className="bg-slate-800/60" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="space-y-1">
          {allItems.filter(i => !i.adminOnly).map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive(item)
                  ? 'bg-gradient-to-r from-gray-600/20 to-gray-500/10 text-white border border-gray-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <span className={isActive(item) ? 'text-gray-300' : 'text-slate-500'}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Admin separator */}
        {isAdmin && allItems.some(i => i.adminOnly) && (
          <>
            <Separator className="bg-slate-800/60 my-3" />
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-600 font-semibold mb-2">
              Yönetim
            </p>
            <div className="space-y-1">
              {allItems.filter(i => i.adminOnly).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive(item)
                      ? 'bg-gradient-to-r from-gray-600/20 to-gray-500/10 text-white border border-gray-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <span className={isActive(item) ? 'text-gray-300' : 'text-slate-500'}>{item.icon}</span>
                  <span>{item.label}</span>
                  <Badge className="ml-auto bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] px-1.5 py-0 h-4">
                    Admin
                  </Badge>
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Footer / Logout */}
      <div className="px-3 pb-4">
        <Separator className="bg-slate-800/60 mb-3" />
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 h-10 rounded-xl font-medium text-sm"
        >
          <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Çıkış Yap
        </Button>
      </div>
    </div>
  )
}
