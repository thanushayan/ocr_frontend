'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import vendorApi from '../../../lib/vendorApi'

interface VendorInvoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  amount: number
  currency: string
  status: string
  dueDate?: string
  notes?: string
  fileUrl?: string
}

interface VendorUser {
  id: string
  fullName: string
  email: string
  vendorId: string
  companyId: string
}

const STATUS_META: Record<string, { fg: string; bg: string; bd: string }> = {
  Pending:  { fg: '#d97706', bg: '#fffbeb', bd: '#fcd34d' },
  Approved: { fg: '#0f766e', bg: '#f0fdfa', bd: '#99f6e4' },
  Paid:     { fg: '#16a34a', bg: '#f0fdf4', bd: '#86efac' },
  Rejected: { fg: '#dc2626', bg: '#fff1f2', bd: '#fca5a5' },
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.Pending
  return (
    <span
      style={{ color: m.fg, background: m.bg, border: `1px solid ${m.bd}` }}
      className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-bold whitespace-nowrap"
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.fg }} />
      {status}
    </span>
  )
}

function fmt(n: number, currency = 'GBP') {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
  } catch { return `£${n.toLocaleString()}` }
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Submit Modal ───────────────────────────────────────────────────────────────
function SubmitModal({
  vendorUser, onClose, onSuccess,
}: {
  vendorUser: VendorUser; onClose: () => void; onSuccess: () => void
}) {
  const [form, setForm] = useState({ invoiceNumber: '', invoiceDate: new Date().toISOString().split('T')[0], amount: '', currency: 'GBP', notes: '' })
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.invoiceNumber.trim() && form.amount && file

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      fd.append('invoiceNumber', form.invoiceNumber)
      fd.append('invoiceDate', form.invoiceDate)
      fd.append('amount', form.amount)
      fd.append('currency', form.currency)
      fd.append('notes', form.notes)
      if (file) fd.append('file', file)
      // POST /api/vendor-portal/invoices/submit
      return vendorApi.post('/api/vendor-portal/invoices/submit', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => { onClose(); onSuccess() },
  })

  const CURRENCIES = ['GBP', 'EUR', 'USD', 'CAD', 'AUD']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(15,25,45,.5)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-[580px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center text-xl">📤</span>
            <div>
              <div className="text-base font-bold text-gray-900">Submit new invoice</div>
              <div className="text-xs text-gray-400 mt-0.5">Secure upload · encrypted</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 grid place-items-center text-gray-500 hover:bg-gray-100">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Invoice number *</label>
              <input value={form.invoiceNumber} onChange={e => set('invoiceNumber')(e.target.value)}
                placeholder="INV-2026-1234"
                className="h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Invoice date *</label>
              <input type="date" value={form.invoiceDate} onChange={e => set('invoiceDate')(e.target.value)}
                className="h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Amount *</label>
            <div className="flex gap-2.5">
              <select value={form.currency} onChange={e => set('currency')(e.target.value)}
                className="w-24 h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold text-gray-700 outline-none">
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="number" value={form.amount} onChange={e => set('amount')(e.target.value)}
                placeholder="0.00"
                className="flex-1 h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>

          {/* File upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Invoice file *</label>
            {!file ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
                onClick={() => fileRef.current?.click()}
                style={{ borderColor: dragging ? '#3b82f6' : '#d1d5db', background: dragging ? '#eff6ff' : '#f9fafb' }}
                className="border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all"
              >
                <div className="text-3xl mb-2">☁️</div>
                <div className="text-sm font-semibold text-gray-700 mb-1">
                  Drop file here or <span className="text-blue-600">browse</span>
                </div>
                <div className="text-xs text-gray-400">PDF, JPG, PNG · max 10 MB</div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }} />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <span className="text-2xl">📄</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{file.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <span className="text-green-500">✓</span>
                <button onClick={() => setFile(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Notes <span className="text-gray-400 font-normal">optional</span></label>
            <textarea value={form.notes} onChange={e => set('notes')(e.target.value)}
              rows={3} placeholder="Add any notes…"
              className="px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-900 outline-none focus:border-blue-500 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-400 flex items-center gap-1.5">🔒 Encrypted · secure upload</span>
          <div className="flex gap-2.5">
            <button onClick={onClose} className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!valid || mutation.isPending}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending
                ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Submitting…</>
                : '📤 Submit invoice'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function VendorInvoicesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [vendorUser, setVendorUser] = useState<VendorUser | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [filter, setFilter]         = useState('All')
  const [toast, setToast]           = useState<string | null>(null)
  const [menuOpen, setMenuOpen]     = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('vendorUser')
    if (!raw) { router.push('/vendor-portal/login'); return }
    setVendorUser(JSON.parse(raw))
  }, [router])

  // GET /api/vendor-portal/invoices
  const { data: invoices = [], isLoading } = useQuery<VendorInvoice[]>({
    queryKey: ['vendorInvoices'],
    queryFn: async () => {
      const res = await vendorApi.get('/api/vendor-portal/invoices')
      return res.data
    },
    enabled: !!vendorUser,
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const logout = () => {
    localStorage.removeItem('vendorToken')
    localStorage.removeItem('vendorUser')
    router.push('/vendor-portal/login')
  }

  const filtered = filter === 'All' ? invoices : invoices.filter(i => i.status === filter)

  const stats = {
    total:       invoices.length,
    pending:     invoices.filter(i => i.status === 'Pending').length,
    paid:        invoices.filter(i => i.status === 'Approved' || i.status === 'Paid').length,
    outstanding: invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + i.amount, 0),
  }

  const initials = (name: string) => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

  if (!vendorUser) return null

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 bg-gray-900 text-white rounded-2xl shadow-xl text-sm font-semibold z-[200] whitespace-nowrap">
          <span className="text-green-400">✓</span> {toast}
        </div>
      )}

      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center px-10 gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg grid place-items-center text-white text-base"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>📄</span>
          <span className="text-[19px] font-extrabold tracking-tight text-gray-900">
            Invoice<span className="text-blue-600">IQ</span>
          </span>
          <span className="h-5 w-px bg-gray-200 mx-1" />
          <span className="text-sm font-semibold text-gray-500">Vendor Portal</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full bg-gray-50 ml-3">
          <span className="w-6 h-6 rounded-full grid place-items-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
            {initials(vendorUser.fullName)}
          </span>
          <span className="text-sm font-semibold text-gray-800">{vendorUser.fullName}</span>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setShowModal(true)}
          style={{ boxShadow: '0 2px 10px rgba(26,86,219,.22)' }}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
        >
          + Submit new invoice
        </button>

        {/* Avatar menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full bg-gray-50 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-xs font-bold">
              {initials(vendorUser.fullName)}
            </span>
            <span className="text-sm font-semibold text-gray-700">{vendorUser.fullName}</span>
            <span className="text-gray-400 text-xs">▼</span>
          </button>
          {menuOpen && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl p-1.5 z-20">
              {[
                { icon: '👤', label: 'My profile', action: () => setMenuOpen(false) },
                { icon: '❓', label: 'Help & support', action: () => setMenuOpen(false) },
                { icon: '🚪', label: 'Sign out', action: logout, danger: true },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-left hover:bg-gray-50 ${item.danger ? 'text-red-500' : 'text-gray-700'}`}>
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-10 py-9">
        {/* Heading + filter */}
        <div className="flex justify-between items-start mb-7 flex-wrap gap-3">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900 mb-1">My Invoices</h1>
            <p className="text-sm text-gray-500">All invoices submitted by {vendorUser.fullName}</p>
          </div>
          <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1 border border-gray-200">
            {['All', 'Pending', 'Approved', 'Paid', 'Rejected'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
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

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          {[
            { label: 'Total submitted',  value: stats.total,                          icon: '🧾', fg: '#2563eb', bg: '#eff6ff' },
            { label: 'Pending review',   value: stats.pending,                        icon: '⏳', fg: '#d97706', bg: '#fffbeb' },
            { label: 'Approved & paid',  value: stats.paid,                           icon: '✅', fg: '#16a34a', bg: '#f0fdf4' },
            { label: 'Outstanding',      value: fmt(stats.outstanding),               icon: '💳', fg: '#0f766e', bg: '#f0fdfa' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-5"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-gray-500">{c.label}</span>
                <span className="w-9 h-9 rounded-xl grid place-items-center text-lg"
                  style={{ background: c.bg, color: c.fg }}>{c.icon}</span>
              </div>
              <div className="text-[28px] font-extrabold text-gray-900 tabular-nums leading-none mb-1">{c.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 grid place-items-center text-3xl mx-auto mb-3">🧾</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">No invoices found</div>
              <div className="text-xs text-gray-400">Try a different filter or submit your first invoice.</div>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['Invoice #', 'Submitted', 'Amount', 'Status', 'Due date', 'Download'].map((h, i) => (
                    <th key={h}
                      className="px-[18px] py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-200"
                      style={{ textAlign: i >= 2 && i !== 3 && i !== 4 ? 'right' : 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <tr key={inv.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none' }}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-[18px] py-3.5 font-mono font-bold text-gray-900 text-xs tracking-wide">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-[18px] py-3.5 text-sm text-gray-500">{fmtDate(inv.invoiceDate)}</td>
                    <td className="px-[18px] py-3.5 text-right font-mono font-bold text-gray-900">
                      {fmt(inv.amount, inv.currency)}
                    </td>
                    <td className="px-[18px] py-3.5"><StatusBadge status={inv.status} /></td>
                    <td className="px-[18px] py-3.5 text-sm text-gray-500">{fmtDate(inv.dueDate)}</td>
                    <td className="px-[18px] py-3.5 text-right">
                      {inv.status !== 'Pending' && inv.fileUrl ? (
                        <a href={`https://localhost:7007${inv.fileUrl}`} target="_blank"
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 hover:bg-gray-100">
                          ⬇ PDF
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Footer */}
          <div className="px-[18px] py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-xs text-gray-400">Showing {filtered.length} of {invoices.length} invoices</span>
            <span className="text-xs text-gray-400 flex items-center gap-1">⏱ Last updated just now</span>
          </div>
        </div>

        {/* Help strip */}
        <div className="mt-5 flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-white border border-gray-200">
          <span className="text-gray-400">❓</span>
          <span className="text-sm text-gray-500">
            Questions about an invoice or payment?{' '}
            <a href="#" className="text-blue-600 font-semibold">Contact your account manager</a>
          </span>
        </div>
      </main>

      {showModal && vendorUser && (
        <SubmitModal
          vendorUser={vendorUser}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['vendorInvoices'] })
            showToast('Invoice submitted for review.')
          }}
        />
      )}
    </div>
  )
}