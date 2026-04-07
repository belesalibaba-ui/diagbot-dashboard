import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
}

interface License {
  id: string
  userId: string
  licenseKey: string
  hwid: string | null
  licenseType: string
  status: string
  expiresAt: string
  maxDevices: number
}

interface AuthState {
  user: User | null
  license: License | null
  isAuthenticated: boolean
  view: 'login' | 'license_activate' | 'license_expired' | 'dashboard' | 'sessions' | 'vehicles' | 'settings' | 'admin' | 'admin_users' | 'admin_licenses'
  setUser: (user: User | null) => void
  setLicense: (license: License | null) => void
  setView: (view: AuthState['view']) => void
  logout: () => void
  checkLicenseStatus: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      license: null,
      isAuthenticated: false,
      view: 'login',

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setLicense: (license) => {
        if (license) {
          const isExpired = new Date(license.expiresAt) < new Date()
          const isSuspended = license.status === 'suspended'
          if (isExpired) {
            set({ license, view: 'license_expired' })
            return
          }
          if (isSuspended) {
            set({ license, view: 'license_activate' })
            return
          }
          const isAdmin = get().user?.role === 'admin'
          set({ license, view: isAdmin ? 'admin' : 'dashboard' })
        } else {
          set({ license, view: 'license_activate' })
        }
      },

      setView: (view) => set({ view }),

      logout: () => set({ user: null, license: null, isAuthenticated: false, view: 'login' }),

      checkLicenseStatus: () => {
        const { license, user } = get()
        if (!license || !user) return
        const isExpired = new Date(license.expiresAt) < new Date()
        if (isExpired) {
          set({ view: 'license_expired' })
        }
      }
    }),
    {
      name: 'diagbot-auth',
      partialize: (state) => ({
        user: state.user,
        license: state.license,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
