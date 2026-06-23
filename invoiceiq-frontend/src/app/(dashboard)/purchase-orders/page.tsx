'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '../../../lib/axios'
import { useAuth } from '../../../hooks/useAuth'


interface PoItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  unit?: string
}

interface PurchaseOrder {
  id: string
  poNumber: string
  description?: string
  status: string
  totalAmount: number
  currency: string
  vendorId?: string
  vendorName?: string
  issuedDate?: string
  expectedDeliveryDate?: string
  createdAt: string
  items: PoItem[]
  matchCount: number
}

const STATUS_META: Record<string, { fg: string; bg: string; bd: string }> = {
  Draft:     { fg: '#6b7280', bg: '#f9fafb', bd: '#e5e7eb' },
  Open:      { fg: '#2563eb', bg: '#eff6ff', bd: '#bfdbfe' },
  Closed:    { fg: '#16a34a', bg: '#f0fdf4', bd: '#86efac' },
  Cancelled: { fg: '#dc2626', bg: '#fff1f2', bd: '#fca5a5' },
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.Open
  return (
    <span style={{ color: m.fg, background: m.bg, border: `1px solid ${m.bd}` }}
      className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-bold whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.fg }} />
      {status}
    </span>
  )
}

function fmt(n: number, currency = 'GBP') {
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n) }
  catch { return `£${n.toLocaleString()}` }
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Create PO Modal ───────────────────────────────────────────────────────────
interface LineItem { description: string; quantity: string; unitPrice: string; unit: string }

function CreatePoModal({ companyId, onClose, onSuccess }: {
  companyId: string; onClose: () => void; onSuccess: () => void
}) {
  const [form, setForm] = useState({
    poNumber: '', description: '', currency: 'GBP',
    issuedDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
  })
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: '1', unitPrice: '', unit: '' }
  ])

  const setF = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const setItem = (i: number, k: keyof LineItem) => (v: string) =>
    setItems(arr => arr.map((it, idx) => idx === i ? { ...it, [k]: v } : it))

  const addItem = () => setItems(arr => [...arr, { description: '', quantity: '1', unitPrice: '', unit: '' }])
  const removeItem = (i: number) => setItems(arr => arr.filter((_, idx) => idx !== i))

  const total = items.reduce((s, it) => {
    const q = parseFloat(it.quantity) || 0
    const p = parseFloat(it.unitPrice) || 0
    return s + q * p
  }, 0)

  const valid = !!(form.poNumber.trim()) && items.every(it => !!(it.description.trim()) && !!(it.quantity) && !!(it.unitPrice))

  const mutation = useMutation({
    mutationFn: () => api.post(`/api/companies/${companyId}/purchase-orders`, {
      poNumber: form.poNumber,
      description: form.description || undefined,
      currency: form.currency,
      issuedDate: form.issuedDate || undefined,
      expectedDeliveryDate: form.expectedDeliveryDate || undefined,
      items: items.map(it => ({
        description: it.description,
        quantity: parseFloat(it.quantity),
        unitPrice: parseFloat(it.unitPrice),
        unit: it.unit || undefined,
      })),
    }),
    onSuccess: () => { onClose(); onSuccess() },
  })

  const CURRENCIES = ['GBP', 'EUR', 'USD', 'CAD', 'AUD']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(15,25,45,.5)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-[640px] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 grid place-items-center text-xl">📋</span>
            <div>
              <div className="text-base font-bold text-gray-900">Create Purchase Order</div>
              <div className="text-xs text-gray-400 mt-0.5">Add line items and assign to vendor</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 grid place-items-center text-gray-500 hover:bg-gray-100">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {/* PO details */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">PO Number *</label>
              <input value={form.poNumber} onChange={e => setF('poNumber')(e.target.value)}
                placeholder="PO-2026-001"
                className="h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Currency</label>
              <select value={form.currency} onChange={e => setF('currency')(e.target.value)}
                className="h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none">
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Description <span className="text-gray-400 font-normal">optional</span></label>
            <input value={form.description} onChange={e => setF('description')(e.target.value)}
              placeholder="Brief description of this PO"
              className="h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Issue date</label>
              <input type="date" value={form.issuedDate} onChange={e => setF('issuedDate')(e.target.value)}
                className="h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Expected delivery</label>
              <input type="date" value={form.expectedDeliveryDate} onChange={e => setF('expectedDeliveryDate')(e.target.value)}
                className="h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-600">Line items *</label>
              <button onClick={addItem}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700">+ Add item</button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-gray-400 font-semibold">Description</th>
                    <th className="text-left px-3 py-2 text-gray-400 font-semibold w-16">Qty</th>
                    <th className="text-left px-3 py-2 text-gray-400 font-semibold w-24">Unit price</th>
                    <th className="text-right px-3 py-2 text-gray-400 font-semibold w-20">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        <input value={it.description} onChange={e => setItem(i, 'description')(e.target.value)}
                          placeholder="Item description"
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500 bg-white" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={it.quantity} onChange={e => setItem(i, 'quantity')(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500 bg-white" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={it.unitPrice} onChange={e => setItem(i, 'unitPrice')(e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500 bg-white" />
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono font-bold text-gray-700">
                        {fmt((parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), form.currency)}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500">✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-gray-500 text-right">Total</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">{fmt(total, form.currency)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {mutation.isError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              ⚠️ {(mutation.error as any)?.response?.data?.error ?? 'Failed to create PO.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-400">Total: <strong className="text-gray-700">{fmt(total, form.currency)}</strong></span>
          <div className="flex gap-2.5">
            <button onClick={onClose} className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                       <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending
                ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Creating…</>
                : '📋 Create PO'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Open', 'Draft', 'Closed', 'Cancelled']

export default function PurchaseOrdersPage() {
  const { companyId } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { data: pos = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', companyId],
    queryFn: async () => {
      const res = await api.get(`/api/companies/${companyId}/purchase-orders`)
      return res.data
    },
    enabled: !!companyId,
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = pos
    .filter(p => filter === 'All' || p.status === filter)
    .filter(p =>
      !search ||
      p.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    )

  const stats = {
    total:      pos.length,
    open:       pos.filter(p => p.status === 'Open').length,
    totalValue: pos.reduce((s, p) => s + p.totalAmount, 0),
    matched:    pos.reduce((s, p) => s + p.matchCount, 0),
  }

  return (
    <div className="flex-1 bg-[#f5f7fa] min-h-screen">
      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 bg-gray-900 text-white rounded-2xl shadow-xl text-sm font-semibold z-[200] whitespace-nowrap">
          <span className="text-green-400">✓</span> {toast}
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-8 py-8">

        {/* Header */}
        <div className="flex justify-between items-start mb-7 flex-wrap gap-3">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900 mb-1">Purchase Orders</h1>
            <p className="text-sm text-gray-500">Create and manage POs — auto-matched with incoming invoices</p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ boxShadow: '0 2px 10px rgba(26,86,219,.22)' }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">
            + Create PO
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          {[
            { label: 'Total POs',    value: stats.total,           icon: '📋', fg: '#2563eb', bg: '#eff6ff' },
            { label: 'Open',         value: stats.open,            icon: '🟢', fg: '#16a34a', bg: '#f0fdf4' },
            { label: 'Total value',  value: fmt(stats.totalValue), icon: '💰', fg: '#0f766e', bg: '#f0fdfa' },
            { label: 'Matched invoices', value: stats.matched,     icon: '🔗', fg: '#7c3aed', bg: '#f5f3ff' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-5"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-gray-500">{c.label}</span>
                <span className="w-9 h-9 rounded-xl grid place-items-center text-lg"
                  style={{ background: c.bg }}>{c.icon}</span>
              </div>
              <div className="text-[28px] font-extrabold text-gray-900 tabular-nums leading-none">{c.value}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[220px] h-10 px-3.5 bg-white border border-gray-200 rounded-xl">
            <span className="text-gray-400 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search PO number, vendor…"
              className="flex-1 border-none outline-none text-sm text-gray-900 bg-transparent placeholder-gray-400" />
          </div>
          <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1 border border-gray-200">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: filter === f ? '#fff' : 'transparent',
                  color: filter === f ? '#111827' : '#6b7280',
                  boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 grid place-items-center text-3xl mx-auto mb-3">📋</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">
                {search || filter !== 'All' ? 'No POs match your filter' : 'No purchase orders yet'}
              </div>
              <div className="text-xs text-gray-400 mb-4">
                {search || filter !== 'All' ? 'Try adjusting your search.' : 'Create your first PO to get started.'}
              </div>
              {!search && filter === 'All' && (
                <button onClick={() => setShowModal(true)}
                  className="h-9 px-5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">
                  + Create PO
                </button>
              )}
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['PO Number', 'Vendor', 'Description', 'Amount', 'Status', 'Issued', 'Matched', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-200 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((po, i) => (
                  <tr key={po.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/purchase-orders/${po.id}`)}>
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900 text-xs">{po.poNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{po.vendorName ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 max-w-[180px] truncate">{po.description ?? '—'}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900 text-sm">{fmt(po.totalAmount, po.currency)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={po.status} /></td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">{fmtDate(po.issuedDate)}</td>
                    <td className="px-5 py-3.5">
                      {po.matchCount > 0 ? (
                        <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700">
                          🔗 {po.matchCount}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-gray-300 text-sm">→</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-xs text-gray-400">Showing {filtered.length} of {pos.length} purchase orders</span>
          </div>
        </div>
      </div>

      {showModal && companyId && (
        <CreatePoModal
          companyId={companyId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders', companyId] })
            showToast('Purchase order created.')
          }}
        />
      )}
    </div>
  )
}