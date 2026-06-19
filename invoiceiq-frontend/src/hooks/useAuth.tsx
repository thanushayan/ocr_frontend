'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authLib } from '../lib/auth'
import { authService } from '../services/auth.service'
import { User, LoginRequest, RegisterRequest, UpdateProfileRequest } from '../types/auth.types'

interface AuthContextType {
  user: User | null
  companyId: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (body: UpdateProfileRequest) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    initAuth()
  }, [])

  async function initAuth() {
    try {
      if (authLib.isLoggedIn()) {
        const cached = authLib.getUser<User>()
        if (cached) setUser(cached)

        const me = await authService.getMe()
        setUser(me)
        authLib.setUser(me)
      }
    } catch {
      authLib.clearAll()
    } finally {
      setIsLoading(false)
    }
  }

  async function login(data: LoginRequest): Promise<void> {
    const res = await authService.login(data)
    authLib.setTokens(res.token, res.refreshToken ?? '')
    const me = await authService.getMe()
    setUser(me)
    authLib.setUser(me)
  }

  async function register(data: RegisterRequest): Promise<void> {
    const res = await authService.register(data)
    authLib.setTokens(res.token, res.refreshToken ?? '')
    const me = await authService.getMe()
    setUser(me)
    authLib.setUser(me)
  }

  async function logout(): Promise<void> {
    try {
      await authService.logout()
    } catch {
      // API fail ஆனாலும் தொடரு
    } finally {
      authLib.clearAll()
      setUser(null)
      router.push('/login')
    }
  }

  async function refreshUser(): Promise<void> {
    const me = await authService.getMe()
    setUser(me)
    authLib.setUser(me)
  }

  async function updateProfile(body: UpdateProfileRequest): Promise<void> {
    const me = await authService.updateProfile(body)
    setUser(me)
    authLib.setUser(me)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        companyId: user?.companyId ?? null,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}