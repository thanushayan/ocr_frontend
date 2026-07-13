'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../hooks/useAuth'
import { clientService } from '../../../services/client.service'
import type { Client } from '../../../types/client.types'
import { Store, Plus, ChevronRight, MapPin, Building2, Users, ClipboardCheck, AlertCircle, ReceiptText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

function OverviewCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={17} className="text-white" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const { setActiveClient, activeClient } = useAuth()
  const router = useRouter()

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll(),
  })

  const { data: overview } = useQuery({
    queryKey: ['accountant-dashboard'],
    queryFn: () => clientService.getAccountantDashboard(),
  })

  function handleSelect(client: Client) {
    setActiveClient(client)
    toast.success(`Switched to ${client.businessName}`)
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header — same style as other pages */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your off-licence accounting clients. Select one to start working.
          </p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)' }}
        >
          <Plus size={16} /> Add Client
        </Link>
      </div>

      {/* Practice overview (accountant-level) */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <OverviewCard label="Active clients"      value={`${overview.activeClients}/${overview.totalClients}`} icon={Users} color="bg-blue-500" />
          <OverviewCard label="Invoices this month" value={overview.invoicesThisMonth} icon={ReceiptText} color="bg-indigo-500" />
          <OverviewCard label="Open tasks"          value={overview.openTasks} icon={ClipboardCheck} color="bg-amber-500" />
          <OverviewCard label="Unresolved alerts"   value={overview.unresolvedAlerts} icon={AlertCircle} color={overview.criticalAlerts > 0 ? 'bg-red-500' : 'bg-emerald-500'} />
        </div>
      )}

      {/* No clients state */}
      {clients.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No clients yet</h3>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            Add your first off-licence client to get started.
          </p>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)' }}
          >
            <Plus size={16} /> Add first client
          </Link>
        </div>
      )}

      {/* Clients grid */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => (
            <div
              key={client.id}
              className={`bg-white rounded-xl border p-5 hover:shadow-md transition-all cursor-pointer ${
                activeClient?.id === client.id
                  ? 'border-blue-500 ring-1 ring-blue-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSelect(client)}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)' }}>
                  {client.businessName[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{client.businessName}</h3>
                  {client.tradingName && (
                    <p className="text-xs text-gray-400 truncate">t/a {client.tradingName}</p>
                  )}
                </div>
                {activeClient?.id === client.id && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                    Active
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-gray-500">
                {client.businessPostcode && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-gray-400" />
                    {client.businessAddress
                      ? `${client.businessAddress}, ${client.businessPostcode}`
                      : client.businessPostcode}
                  </div>
                )}
                {client.localAuthority && (
                  <div className="flex items-center gap-1.5">
                    <Building2 size={12} className="text-gray-400" />
                    {client.localAuthority}
                  </div>
                )}
                {client.vatRegistrationNumber && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-medium">VAT</span>
                    {client.vatRegistrationNumber}
                  </div>
                )}
                {client.awrsUrn && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-medium">AWRS</span>
                    {client.awrsUrn}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  client.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {client.isActive ? 'Active' : 'Inactive'}
                </span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
