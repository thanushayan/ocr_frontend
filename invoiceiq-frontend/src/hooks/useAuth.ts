'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authLib } from '../lib/auth'
import { authService } from '../services/auth.service'
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth.types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<{ requiresTwoFactor?: boolean; email?: string }>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
        if (cached) {
          setUser(cached)
        } else {
          const me = await authService.getMe()
          setUser(me)
          authLib.setUser(me)
        }
      }
    } catch {
      authLib.clearAll()
    } finally {
      setIsLoading(false)
    }
  }

  async function login(data: LoginRequest): Promise<{ requiresTwoFactor?: boolean; email?: string }> {
    const res = await authService.login(data)
    if ('requiresTwoFactor' in res && res.requiresTwoFactor) {
      return { requiresTwoFactor: true, email: data.email }
    }
    const authRes = res as AuthResponse
    authLib.setTokens(authRes.token, authRes.refreshToken)
    authLib.setUser(authRes.user)
    setUser(authRes.user)
    return {}
  }

  async function register(data: RegisterRequest): Promise<void> {
    const res = await authService.register(data)
    authLib.setTokens(res.token, res.refreshToken)
    authLib.setUser(res.user)
    setUser(res.user)
  }

  async function logout(): Promise<void> {
    try {
      await authService.logout()
    } catch {
      // continue even if API fails
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

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      },
    },
    children,
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}