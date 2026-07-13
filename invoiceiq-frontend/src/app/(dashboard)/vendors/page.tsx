'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, X, Eye, Send, Check,
  Store, CheckCircle, ExternalLink, CreditCard,
  Info, SlidersHorizontal, ChevronDown
} from 'lucide-react'
import { vendorService } from '../../../services/vendor.service'
import { Vendor, CreateVendorRequest } from '../../../types/vendor.types'

function fmt(n?: number, currency?: string) {
  if (!n) return '—'
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency ?? 'GBP', maximumFractionDigits: 0 }).format(n)
  } catch { return `£${n.toLocaleString()}` }
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-blue-500', 'bg-teal-500', 'bg-purple-500', 'bg-indigo-500', 'bg-rose-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

function PortalBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-bold border ${
      enabled ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-300 text-gray-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center h-6 px-2 rounded-full text-xs font-bold border ${
      active ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-400'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 bg-gray-900 rounded-xl shadow-2xl text-white text-sm font-semibold z-50 whitespace-nowrap">
      <Check className="w-4 h-4 text-emerald-400" /> {msg}
    </div>
  )
}

function FormField({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`h-10 px-3 border rounded-lg text-sm text-gray-800 bg-gray-50 outline-none transition-all ${
          focused ? 'border-blue-500 ring-2 ring-blue-100 bg-white' : 'border-gray-300'
        }`}
      />
    </div>
  )
}

function AddVendorModal({ onClose, onSave }: { onClose: () => void; onSave: (body: CreateVendorRequest) => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', taxId: '' })
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.name.trim() && form.email.trim()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-[520px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Add vendor</p>
              <p className="text-xs text-gray-400">Create a new vendor record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Vendor name"   value={form.name}    onChange={set('name')}    placeholder="Northstar Supplies Ltd" required />
            <FormField label="Contact email" value={form.email}   onChange={set('email')}   placeholder="accounts@vendor.com"   required type="email" />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Phone number"  value={form.phone}   onChange={set('phone')}   placeholder="+44 20 7946 0000" type="tel" />
            <FormField label="Tax / VAT ID"  value={form.taxId}   onChange={set('taxId')}   placeholder="GB123456789" />
          </div>
          <FormField label="Registered address" value={form.address} onChange={set('address')} placeholder="14 Commerce St, London EC2A" />
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-600">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            A vendor portal invitation can be sent after the record is saved.
          </div>
        </div>
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() => {
              if (valid) {
                onSave({
                  name: form.name,
                  contactEmail: form.email,
                  phone: form.phone,
                  address: form.address,
                  vatNumber: form.taxId,
                })
                onClose()
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Save vendor
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VendorsPage() {
  const queryClient   = useQueryClient()

  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showModal, setShowModal]     = useState(false)
  const [toast, setToast]             = useState<string | null>(null)
  const [invited, setInvited]         = useState<Set<string>>(new Set())

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ['vendors'],
    queryFn:  () => vendorService.list(),
  })

  const createMutation = useMutation({
    mutationFn: (body: CreateVendorRequest) => vendorService.create(body),
    onSuccess: (v) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      setToast(`${v.name} added successfully.`)
    },
  })

  const inviteMutation = useMutation({
    mutationFn: (v: Vendor) =>
      vendorService.invite(v.id, { email: v.contactEmail ?? '', fullName: v.name }),
    onSuccess: (_, v) => {
      setInvited((s) => { const n = new Set(s); n.add(v.id); return n })
      setToast(`Invitation sent to ${v.contactEmail ?? 'vendor'}`)
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })

  const portalAccessMutation = useMutation({
    mutationFn: (vars: { vendorId: string; isActive: boolean }) =>
      vendorService.updatePortalAccess(vars.vendorId, { isActive: vars.isActive }),
    onSuccess: (_, vars) => {
      setToast(vars.isActive ? 'Portal access enabled.' : 'Portal access disabled.')
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })

  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase()
    const matchQ = !q || v.name.toLowerCase().includes(q) || (v.contactEmail ?? '').toLowerCase().includes(q)
    const isActive = v.isActive ?? true
    const matchS = statusFilter === 'All' || (statusFilter === 'Active' ? isActive : !isActive)
    return matchQ && matchS
  })

  const activeCount = vendors.filter(v => v.isActive ?? true).length
  const portalCount = vendors.filter(v => v.portalEnabled).length
  const totalSpend  = vendors.reduce((s, v) => s + (v.totalSpend ?? 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? 'Loading…' : `${vendors.length} vendors · ${activeCount} active · ${portalCount} with portal access`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add vendor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5">
        {[
          { label: 'Total vendors',   value: vendors.length, Icon: Store,        bg: 'bg-blue-50',    text: 'text-blue-600'    },
          { label: 'Active vendors',  value: activeCount,    Icon: CheckCircle,  bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { label: 'Portal enabled',  value: portalCount,    Icon: ExternalLink, bg: 'bg-teal-50',    text: 'text-teal-600'    },
          { label: 'Total spend YTD', value: fmt(totalSpend), Icon: CreditCard,  bg: 'bg-blue-50',    text: 'text-blue-600'    },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl px-4 py-4 flex items-center gap-3.5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.Icon className={`w-5 h-5 ${s.text}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 tabular-nums">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex items-center flex-1 max-w-96">
          <Search className="absolute left-3 w-4 h-4 text-gray-400" />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name or email…"
            className="w-full pl-9 pr-8 h-10 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative flex items-center h-10 pl-3 pr-8 bg-white border border-gray-300 rounded-lg">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 mr-2" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none border-none outline-none bg-transparent text-sm font-semibold text-gray-800 cursor-pointer">
            <option>All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <ChevronDown className="absolute right-2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {(search || statusFilter !== 'All') && (
          <button onClick={() => { setSearch(''); setStatusFilter('All') }}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
            <X className="w-4 h-4" /> Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-gray-400">{filtered.length} of {vendors.length} vendors</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Search className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-base font-bold text-gray-800 mb-1">No vendors found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {[['Vendor',false],['Contact email',false],['Invoices',true],['Total spend',true],['Last invoice',false],['Status',false],['Portal access',false],['Actions',true]].map(([label, right]) => (
                  <th key={label as string} className={`px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((v) => {
                const isActive = v.isActive ?? true
                const portalOn = v.portalEnabled ?? false
                const alreadyInvited = invited.has(v.id)
                return (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={v.name} />
                        <div>
                          <p className="font-bold text-gray-900">{v.name}</p>
                          <p className="text-xs font-mono text-gray-400 mt-0.5">{v.vatNumber ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {v.contactEmail
                        ? <a href={`mailto:${v.contactEmail}`} className="text-sm text-blue-600 hover:underline">{v.contactEmail}</a>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-900 tabular-nums">
                      {v.invoiceCount ?? 0}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-900 tabular-nums">
                      {fmt(v.totalSpend, v.currency)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {fmtDate(v.lastInvoiceDate)}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge active={isActive} /></td>
                    <td className="px-4 py-3.5"><PortalBadge enabled={portalOn} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View vendor">
                          <Eye className="w-4 h-4" />
                        </button>
                        {!portalOn && (
                          <button
                            onClick={() => inviteMutation.mutate(v)}
                            disabled={alreadyInvited || inviteMutation.isPending || !v.contactEmail}
                            title={!v.contactEmail ? 'Add a contact email before inviting' : undefined}
                            className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-60 ${
                              alreadyInvited
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {alreadyInvited ? <><Check className="w-3 h-3" /> Invited</> : <><Send className="w-3 h-3" /> Invite</>}
                          </button>
                        )}
                        {portalOn && (
                          <>
                            <span className="inline-flex items-center h-7 px-2.5 rounded-lg bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-700">
                              Portal active
                            </span>
                            <button
                              onClick={() => portalAccessMutation.mutate({ vendorId: v.id, isActive: false })}
                              disabled={portalAccessMutation.isPending}
                              className="inline-flex items-center h-7 px-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-60"
                              title="Disable portal access"
                            >
                              Disable
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddVendorModal onClose={() => setShowModal(false)} onSave={(body) => createMutation.mutate(body)} />
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}