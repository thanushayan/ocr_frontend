'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Store, CheckCircle, MapPin, Phone, Mail, User, FileText, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../../../hooks/useAuth'
import { clientService } from '../../../../services/client.service'
import type { Client } from '../../../../types/auth.types'

function fmtFee(n?: number) {
  if (!n) return '—'
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n) }
  catch { return `£${n}` }
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-sm text-gray-800 mt-0.5">{value || '—'}</div>
      </div>
    </div>
  )
}

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const { activeClient, setActiveClient } = useAuth()
  const router = useRouter()

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: ['client', clientId],
    queryFn: () => clientService.getById(clientId),
    enabled: !!clientId,
  })

  if (isLoading) {
    return <div className="p-10 text-sm text-gray-500 text-center">Loading client…</div>
  }
  if (!client) {
    return <div className="p-10 text-sm text-gray-500 text-center">Client not found.</div>
  }

  const isActive = activeClient?.id === client.id

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/clients')}
          className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-900 mb-3"
        >
          <ArrowLeft size={14} /> Back to clients
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)' }}>
              {client.businessName[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.businessName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {client.tradingName ? `Trading as ${client.tradingName} · ` : ''}Onboarded {fmtDate(client.onboardedAt)}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setActiveClient(client); router.push('/dashboard') }}
            className={`inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-semibold rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {isActive ? 'Currently selected — open dashboard' : 'Work on this client'}
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-2">
          <InfoRow icon={<User size={15} />}  label="Owner"          value={client.ownerFullName} />
          <InfoRow icon={<Mail size={15} />}  label="Owner email"    value={client.ownerEmail} />
          <InfoRow icon={<Phone size={15} />} label="Owner phone"    value={client.ownerPhone} />
          <InfoRow icon={<MapPin size={15} />} label="Address"
            value={[client.businessAddress, client.businessPostcode].filter(Boolean).join(', ')} />
          <InfoRow icon={<Store size={15} />} label="Local authority" value={client.localAuthority} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-2">
          <InfoRow icon={<FileText size={15} />}    label="VAT registration" value={client.vatRegistrationNumber} />
          <InfoRow icon={<ShieldCheck size={15} />} label="AWRS URN"         value={client.awrsUrn} />
          <InfoRow icon={<FileText size={15} />}    label="Client type"      value={client.clientType} />
          <InfoRow icon={<FileText size={15} />}    label="Monthly fee"      value={fmtFee(client.monthlyFee)} />
          <InfoRow icon={<CheckCircle size={15} />} label="Status"           value={client.isActive ? 'Active' : 'Inactive'} />
        </div>
      </div>
    </div>
  )
}
