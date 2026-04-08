'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import LoginView from '@/components/LoginView'
import LicenseActivateView from '@/components/LicenseActivateView'
import LicenseExpiredView from '@/components/LicenseExpiredView'
import DashboardView from '@/components/DashboardView'
import SessionsView from '@/components/SessionsView'
import VehiclesView from '@/components/VehiclesView'
import SettingsView from '@/components/SettingsView'
import AdminView from '@/components/AdminView'
import AdminUsersView from '@/components/AdminUsersView'
import AdminLicensesView from '@/components/AdminLicensesView'
import Sidebar from '@/components/Sidebar'

export default function Home() {
  const { view, isAuthenticated, checkLicenseStatus } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkLicenseStatus()
  }, [])

  useEffect(() => {
    const interval = setInterval(checkLicenseStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  // Wait for client-side hydration before showing auth-gated content
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || view === 'login') {
    return <LoginView />
  }

  if (view === 'license_activate') {
    return <LicenseActivateView />
  }

  if (view === 'license_expired') {
    return <LicenseExpiredView />
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        {view === 'dashboard' && <DashboardView />}
        {view === 'sessions' && <SessionsView />}
        {view === 'vehicles' && <VehiclesView />}
        {view === 'settings' && <SettingsView />}
        {view === 'admin' && <AdminView />}
        {view === 'admin_users' && <AdminUsersView />}
        {view === 'admin_licenses' && <AdminLicensesView />}
      </main>
    </div>
  )
}
