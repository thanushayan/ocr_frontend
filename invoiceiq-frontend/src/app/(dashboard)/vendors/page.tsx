'use client'

import React, { useState, useEffect } from 'react'
import {
  Search, Plus, X, Eye, Send, Check,
  Store, CheckCircle, ExternalLink, CreditCard,
  Info, SlidersHorizontal, ChevronDown
} from 'lucide-react'

// ── Vendor type ──
interface Vendor {
  id: number
  name: string
  email: string
  phone: string
  address: string
  taxId: string
  invoices: number
  spend: string
  lastInvoice: string
  portal: boolean
  status: 'Active' | 'Inactive'
}

// ── டம்மி vendor தரவு ──
const INIT_VENDORS: Vendor[] = [
  { id: 1, name: 'Northstar Supplies Ltd',    email: 'accounts@northstar-supplies.ie', phone: '+353 1 234 5678',  address: '14 Commerce St, Dublin 2',     taxId: 'IE6388047V',  invoices: 48, spend: '£437,820', lastInvoice: '17 Jun 2026', portal: true,  status: 'Active'   },
  { id: 2, name: 'Acme Cloud Services',       email: 'billing@acme-cloud.io',          phone: '+44 20 7946 0123', address: '22 Silicon Way, London EC2',   taxId: 'GB291472621', invoices: 12, spend: '£51,360',  lastInvoice: '17 Jun 2026', portal: false, status: 'Active'   },
  { id: 3, name: 'Blue River Logistics',      email: 'invoices@blueriver.co.uk',       phone: '+44 141 628 4400', address: '45 Freight Rd, Glasgow G2',   taxId: 'GB482910632', invoices: 31, spend: '£198,450', lastInvoice: '16 Jun 2026', portal: true,  status: 'Active'   },
  { id: 4, name: 'FinOps Advisory Group',     email: 'finance@finops-advisory.com',    phone: '+353 1 667 3200',  address: '7 Merrion Row, Dublin 4',     taxId: 'IE5291847C',  invoices: 8,  spend: '£174,240', lastInvoice: '14 Jun 2026', portal: false, status: 'Active'   },
  { id: 5, name: 'Orbit Analytics Ltd',       email: 'ap@orbitanalytics.io',           phone: '+44 20 3058 1100', address: '90 City Rd, London EC1Y',     taxId: 'GB103847261', invoices: 5,  spend: '£43,250',  lastInvoice: '02 May 2026', portal: false, status: 'Inactive' },
  { id: 6, name: 'Evergreen Office Supplies', email: 'orders@evergreen-office.co.uk',  phone: '+44 161 488 7700', address: '120 King St, Manchester M2',  taxId: 'GB718294031', invoices: 22, spend: '£29,860',  lastInvoice: '15 Jun 2026', portal: true,  status: 'Active'   },
]

// ── Initials Avatar ──
function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  // பெயரை வைத்து consistent color தேர்வு
  const colors = ['bg-blue-500', 'bg-teal-500', 'bg-purple-500', 'bg-indigo-500', 'bg-rose-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

// ── Portal badge ──
function PortalBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-bold border ${
      enabled
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : 'bg-gray-100 border-gray-300 text-gray-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

// ── Status badge ──
function StatusBadge({ status }: { status: string }) {
  const active = status === 'Active'
  return (
    <span className={`inline-flex items-center h-5.5 px-2 rounded-full text-xs font-bold border ${
      active
        ? 'bg-blue-50 border-blue-200 text-blue-700'
        : 'bg-gray-100 border-gray-200 text-gray-400'
    }`}>
      {status}
    </span>
  )
}

// ── Toast notification ──
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 bg-gray-900 rounded-xl shadow-2xl text-white text-sm font-semibold z-50 whitespace-nowrap animate-in slide-in-from-bottom-2">
      <Check className="w-4 h-4 text-emerald-400" />
      {msg}
    </div>
  )
}

// ── Form field component ──
function FormField({
  label, value, onChange, placeholder, type = 'text', required = false
}: {
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
        type={type}
        value={value}
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

// ── Add Vendor Modal ──
function AddVendorModal({
  onClose, onSave
}: {
  onClose: () => void
  onSave: (v: Vendor) => void
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', taxId: '' })
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.name.trim() && form.email.trim()

  const save = () => {
    if (!valid) return
    onSave({
      ...form,
      id: Date.now(),
      invoices: 0,
      spend: '£0',
      lastInvoice: '—',
      portal: false,
      status: 'Active',
    })
    onClose()
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-[520px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal header */}
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

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Vendor name"    value={form.name}    onChange={set('name')}    placeholder="Northstar Supplies Ltd" required />
            <FormField label="Contact email"  value={form.email}   onChange={set('email')}   placeholder="accounts@vendor.com"   required type="email" />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Phone number"   value={form.phone}   onChange={set('phone')}   placeholder="+44 20 7946 0000"      type="tel" />
            <FormField label="Tax / VAT ID"   value={form.taxId}   onChange={set('taxId')}   placeholder="GB123456789" />
          </div>
          <FormField   label="Registered address" value={form.address} onChange={set('address')} placeholder="14 Commerce St, London EC2A" />

          {/* Info banner */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-600">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            A vendor portal invitation can be sent after the record is saved.
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={save}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Save vendor
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// Main Page
// ════════════════════════════════════════
export default function VendorsPage() {
  const [vendors, setVendors]         = useState<Vendor[]>(INIT_VENDORS)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showModal, setShowModal]     = useState(false)
  const [toast, setToast]             = useState<string | null>(null)
  const [invited, setInvited]         = useState<Set<number>>(new Set())

  // தேடல் + filter
  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase()
    const matchQ = !q || v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q)
    const matchS = statusFilter === 'All' || v.status === statusFilter
    return matchQ && matchS
  })

  // புதிய vendor சேர்
  const addVendor = (v: Vendor) => {
    setVendors((vs) => [...vs, v])
    setToast(`${v.name} added successfully.`)
  }

  // Portal invite அனுப்பு
  const invite = (v: Vendor) => {
    setInvited((s) => { const n = new Set(s); n.add(v.id); return n })
    setToast(`Invitation sent to ${v.email}`)
  }

  // Status toggle
  const toggleStatus = (id: number) => {
    setVendors((vs) =>
      vs.map((v) => v.id === id ? { ...v, status: v.status === 'Active' ? 'Inactive' : 'Active' } : v)
    )
  }

  // Stats
  const activeCount  = vendors.filter((v) => v.status === 'Active').length
  const portalCount  = vendors.filter((v) => v.portal).length

  return (
    <div className="space-y-5">
      {/* பக்கம் தலைப்பு */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">
            {vendors.length} vendors · {activeCount} active · {portalCount} with portal access
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add vendor
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3.5">
        {[
          { label: 'Total vendors',   value: vendors.length, Icon: Store,         bg: 'bg-blue-50',    text: 'text-blue-600'    },
          { label: 'Active vendors',  value: activeCount,    Icon: CheckCircle,   bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { label: 'Portal enabled',  value: portalCount,    Icon: ExternalLink,  bg: 'bg-teal-50',    text: 'text-teal-600'    },
          { label: 'Total spend YTD', value: '£934,980',     Icon: CreditCard,    bg: 'bg-blue-50',    text: 'text-blue-600'    },
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

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search input */}
        <div className="relative flex items-center flex-1 max-w-96">
          <Search className="absolute left-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
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

        {/* Status filter */}
        <div className="relative flex items-center h-10 pl-3 pr-8 bg-white border border-gray-300 rounded-lg">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 mr-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none border-none outline-none bg-transparent text-sm font-semibold text-gray-800 cursor-pointer"
          >
            <option>All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <ChevronDown className="absolute right-2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Clear filters */}
        {(search || statusFilter !== 'All') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('All') }}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <X className="w-4 h-4" /> Clear filters
          </button>
        )}

        {/* Result count */}
        <span className="ml-auto text-sm text-gray-400">
          {filtered.length} of {vendors.length} vendors
        </span>
      </div>

      {/* Vendor table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          /* Empty state */
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
                {[
                  ['Vendor', false],
                  ['Contact email', false],
                  ['Invoices', true],
                  ['Total spend', true],
                  ['Last invoice', false],
                  ['Status', false],
                  ['Portal access', false],
                  ['Actions', true],
                ].map(([label, right]) => (
                  <th
                    key={label as string}
                    className={`px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  {/* Vendor name + tax ID */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={v.name} />
                      <div>
                        <p className="font-bold text-gray-900">{v.name}</p>
                        <p className="text-xs font-mono text-gray-400 mt-0.5">{v.taxId}</p>
                      </div>
                    </div>
                  </td>
                  {/* Email */}
                  <td className="px-4 py-3.5">
                    <a href={`mailto:${v.email}`} className="text-sm text-blue-600 hover:underline">
                      {v.email}
                    </a>
                  </td>
                  {/* Invoices count */}
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-900 tabular-nums">
                    {v.invoices}
                  </td>
                  {/* Total spend */}
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-900 tabular-nums">
                    {v.spend}
                  </td>
                  {/* Last invoice */}
                  <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                    {v.lastInvoice}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge status={v.status} />
                  </td>
                  {/* Portal badge */}
                  <td className="px-4 py-3.5">
                    <PortalBadge enabled={v.portal} />
                  </td>
                  {/* Action buttons */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View */}
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View vendor">
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* Invite (portal இல்லன்னா மட்டும்) */}
                      {!v.portal && (
                        <button
                          onClick={() => invite(v)}
                          className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                            invited.has(v.id)
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {invited.has(v.id)
                            ? <><Check className="w-3 h-3" /> Invited</>
                            : <><Send className="w-3 h-3" /> Invite</>
                          }
                        </button>
                      )}
                      {/* Portal active tag */}
                      {v.portal && (
                        <span className="inline-flex items-center h-7 px-2.5 rounded-lg bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-700">
                          Portal active
                        </span>
                      )}
                      {/* Enable / Disable */}
                      <button
                        onClick={() => toggleStatus(v.id)}
                        className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border text-xs font-semibold transition-colors bg-white hover:bg-gray-50 ${
                          v.status === 'Active'
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {v.status === 'Active' ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Vendor Modal */}
      {showModal && (
        <AddVendorModal onClose={() => setShowModal(false)} onSave={addVendor} />
      )}

      {/* Toast notification */}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}