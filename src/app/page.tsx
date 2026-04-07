'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    checkLicenseStatus()
  }, [])

  useEffect(() => {
    const interval = setInterval(checkLicenseStatus, 60000)
    return () => clearInterval(interval)
  }, [])

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
