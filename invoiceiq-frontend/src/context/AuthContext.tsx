'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import Cookies from 'js-cookie'
import { User, UpdateProfileRequest } from '../types/auth.types'
import { authService } from '../services/auth.service'

interface AuthContextType {
  user: User | null
  companyId: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string, companyName: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (body: UpdateProfileRequest) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // App start ஆகும்போது cookie-ல் token இருந்தா user fetch பண்ணு
  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (!token) { setIsLoading(false); return }

    authService.getMe()
      .then((u) => {
        setUser(u)
        // companyId — getMe response-ல் வரும் (நாம் backend-ல் சேர்த்தோம்)
        if (u.companyId) {
          setCompanyId(u.companyId)
          Cookies.set('companyId', u.companyId, { expires: 1 })
        }
      })
      .catch(() => {
        Cookies.remove('accessToken')
        Cookies.remove('refreshToken')
        Cookies.remove('companyId')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password })
    // login response-ல் companyId நேரடியா வரும்
    if (res.companyId) {
      setCompanyId(res.companyId)
      Cookies.set('companyId', res.companyId, { expires: 1 })
    }
    // getMe call பண்ணி full user profile எடு
    const u = await authService.getMe()
    setUser(u)
  }

  const register = async (
    fullName: string,
    email: string,
    password: string,
    companyName: string
  ) => {
    const res = await authService.register({ fullName, email, password, companyName })
    if (res.companyId) {
      setCompanyId(res.companyId)
      Cookies.set('companyId', res.companyId, { expires: 1 })
    }
    const u = await authService.getMe()
    setUser(u)
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    setCompanyId(null)
  }

  const refreshUser = async () => {
    const u = await authService.getMe()
    setUser(u)
    if (u.companyId) setCompanyId(u.companyId)
  }

  const updateProfile = async (body: UpdateProfileRequest) => {
    const u = await authService.updateProfile(body)
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{
      user,
      companyId,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}