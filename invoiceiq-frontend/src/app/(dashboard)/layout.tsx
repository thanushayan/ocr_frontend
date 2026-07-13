import React from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import ClientGuard from '../../components/ClientGuard'
import Sidebar from '../../components/layout/Sidebar'
import Header from '../../components/layout/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ClientGuard>
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <Header />
            <main className="flex-1 overflow-y-auto p-7">
              {children}
            </main>
          </div>
        </div>
      </ClientGuard>
    </ProtectedRoute>
  )
}