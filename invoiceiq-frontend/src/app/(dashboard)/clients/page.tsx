'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Search, Plus, Store, CheckCircle, ChevronRight } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { clientService } from '../../../services/client.service'
import type { Client } from '../../../types/auth.types'

function fmtFee(n?: number) {
  if (!n) return '—'
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n) }
  catch { return `£${n}` }
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center h-6 px-2 rounded-full text-xs font-bold border ${
      active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-400'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export default function ClientListPage() {
  const { activeClient, setActiveClient } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => clientService.list(),
  })

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    return !q ||
      c.businessName.toLowerCase().includes(q) ||
      (c.tradingName ?? '').toLowerCase().includes(q) ||
      (c.businessPostcode ?? '').toLowerCase().includes(q)
  })

  const handleSelect = (client: Client) => {
    setActiveClient(client)
    router.push('/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Select an off-licence to work on, or add a new client.</p>
        </div>
        <button
          onClick={() => router.push('/clients/new')}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 h-10 px-3 w-full max-w-sm border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or postcode…"
          className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
        />
      </div>

      {/* Client list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-sm text-gray-500 text-center">Loading clients…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <Store className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              {clients.length === 0 ? 'No clients yet. Add your first off-licence client.' : 'No clients match your search.'}
            </p>
            {clients.length === 0 && (
              <button
                onClick={() => router.push('/clients/new')}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Client
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Business</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Postcode</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">VAT No.</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Monthly fee</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(client => {
                const isActive = activeClient?.id === client.id
                return (
                  <tr
                    key={client.id}
                    onClick={() => handleSelect(client)}
                    className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                      isActive ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)' }}>
                          {client.businessName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                            {client.businessName}
                            {isActive && <CheckCircle size={14} className="text-blue-600" />}
                          </div>
                          <div className="text-xs text-gray-400">{client.tradingName ?? client.localAuthority ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{client.businessPostcode ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{client.vatRegistrationNumber ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{fmtFee(client.monthlyFee)}</td>
                    <td className="px-5 py-3.5"><StatusBadge active={client.isActive} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/clients/${client.id}`) }}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Details <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
