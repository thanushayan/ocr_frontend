'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Store, Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { clientService } from '../services/client.service'
import type { Client } from '../types/auth.types'

interface Props {
  onSelect?: (client: Client) => void
}

export default function ClientSelector({ onSelect }: Props) {
  const { activeClient, setActiveClient } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => clientService.list(),
  })

  const handleSelect = (client: Client) => {
    setActiveClient(client)
    setOpen(false)
    onSelect?.(client)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-extrabold shrink-0"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)' }}>
          {activeClient ? activeClient.businessName[0].toUpperCase() : <Store size={13} />}
        </div>
        <span className="text-sm font-bold text-gray-900">
          {activeClient ? activeClient.businessName : 'Select Client'}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-sm text-gray-500 text-center">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">No clients yet. Add your first client.</div>
          ) : (
            <div className="max-h-60 overflow-y-auto py-1">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    activeClient?.id === client.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{client.businessName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {[client.businessPostcode, client.localAuthority].filter(Boolean).join(' · ')}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-gray-100">
            <button
              onClick={() => { setOpen(false); router.push('/clients') }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus size={15} /> Manage clients
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
