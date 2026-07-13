'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { clientService } from '../../services/client.service'
import type { Client } from '../../types/client.types'
import { ChevronDown, Store, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ClientSelector() {
  const { activeClient, setActiveClient } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load clients when dropdown opens
  useEffect(() => {
    if (!open || clients.length > 0) return
    setLoading(true)
    clientService.getAll()
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [open])

  function handleSelect(client: Client) {
    setActiveClient(client)
    setOpen(false)
    router.push('/dashboard')
  }

  // Same styling as existing "My Company" button in Header
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-extrabold shrink-0"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)' }}>
          <Store size={12} />
        </div>
        <span className="text-sm font-bold text-gray-900 max-w-[140px] truncate">
          {activeClient ? activeClient.businessName : 'Select Client'}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">

            {/* Header */}
            <div className="px-3 py-2.5 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Clients</p>
            </div>

            {/* Client list */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : clients.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Store className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No clients yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">Add your first off-licence client</p>
                </div>
              ) : (
                clients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => handleSelect(client)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      activeClient?.id === client.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)' }}>
                      {client.businessName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{client.businessName}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {client.businessPostcode} · {client.localAuthority ?? client.vatRegistrationNumber ?? 'Off-Licence'}
                      </p>
                    </div>
                    {activeClient?.id === client.id && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Add client link */}
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => { setOpen(false); router.push('/clients/new') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                <Plus size={15} /> Add new client
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
