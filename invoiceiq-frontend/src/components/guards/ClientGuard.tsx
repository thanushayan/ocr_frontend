'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import { Store } from 'lucide-react'

// Routes that don't require a client to be selected
const CLIENT_FREE_ROUTES = [
  '/clients',
  '/clients/new',
  '/profile',
  '/settings',
]

export default function ClientGuard({ children }: { children: React.ReactNode }) {
  const { activeClient, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const needsClient = !CLIENT_FREE_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  useEffect(() => {
    if (!isLoading && isAuthenticated && needsClient && !activeClient) {
      router.replace('/clients')
    }
  }, [isLoading, isAuthenticated, activeClient, needsClient, router])

  if (isLoading) return null

  if (needsClient && !activeClient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Store className="w-12 h-12 text-gray-300" />
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">No client selected</p>
          <p className="text-sm text-gray-500 mt-1">Redirecting to client selection...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
