'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
 

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // AuthContext-ல் இருந்து தேவையான values எடுக்கிறோம்
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // ── State 2 handle: login பண்ணல → redirect ──
  // useEffect-ல் போடுறோம், render-ல் இல்லை (கீழே explain பண்ணியிருக்கேன்)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // ── State 1: இன்னும் check பண்ணிட்டிருக்கோம் → spinner ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── State 2 (continued): redirect நடந்துட்டிருக்கு → ஒண்ணும் காட்டாதே ──
  if (!isAuthenticated) return null

  // ── State 3: எல்லாம் சரி → உள்ள இருக்கற page-ஐ காட்டு ──
  return <>{children}</>
}