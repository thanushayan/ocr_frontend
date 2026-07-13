'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'

// Pages that work without a client selected (accountant-level pages)
const CLIENT_FREE_ROUTES = ['/clients', '/profile', '/team', '/notifications']

export default function ClientGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, hasActiveClient } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const needsClient = !CLIENT_FREE_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  useEffect(() => {
    if (!isLoading && isAuthenticated && needsClient && !hasActiveClient) {
      router.replace('/clients')
    }
  }, [isLoading, isAuthenticated, needsClient, hasActiveClient, router])

  if (!isLoading && isAuthenticated && needsClient && !hasActiveClient) return null

  return <>{children}</>
}
