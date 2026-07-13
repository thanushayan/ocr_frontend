'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Check, X, Download, ChevronDown,
  ZoomIn, ZoomOut, Maximize, Info, MessageSquare,
  History, CreditCard, Layers, Edit2, Plus, AlertCircle
} from 'lucide-react'
import { useAuth } from '../../../../hooks/useAuth'
import { invoiceService } from '../../../../services/invoice.service'

const BACKEND_URL = 'https://localhost:7007'

// ── Dummy fallbacks ──
const LINE_ITEMS = [
  { desc: 'OCR Capture Platform — Annual licence', qty: 1, unit: 14400.00, conf: 88 },
  { desc: 'Compliance Monitoring Add-on',          qty: 3, unit: 1500.00,  conf: 72 },
  { desc: 'Implementation & onboarding',           qty: 1, unit: 2530.00,  conf: 99 },
  { desc: 'Priority support SLA (12 months)',      qty: 1, unit: 1800.00,  conf: 95 },
]

const COMMENTS = [
  { user: 'Maya Chen',   color: 'bg-blue-500',  time: 'Today, 09:14', text: 'VAT number verified against HMRC register. Looks good.' },
  { user: 'Avery Stone', color: 'bg-teal-500',  time: 'Today, 10:41', text: 'Line item 2 qty should be 3, not 1. @Maya Chen can you confirm?' },
  { user: 'Maya Chen',   color: 'bg-blue-500',  time: 'Today, 11:05', text: 'Confirmed, updating now. OCR misread the quantity — confidence was only 72%.' },
]

const ACTIVITY = [
  { icon: '📤', label: 'Invoice uploaded',         who: 'Maya Chen', time: '17 Jun, 08:52', note: null },
  { icon: '🔍', label: 'OCR processing completed', who: 'System',    time: '17 Jun, 08:53', note: '97.6% overall confidence' },
  { icon: '✅', label: 'Sent for approval',        who: 'Maya Chen', time: '17 Jun, 09:10', note: null },
]

const PAYMENTS = [
  { date: '01 Jun 2026', method: 'BACS transfer', ref: 'PAY-2026-0441', amount: 10000.00, status: 'Cleared' },
  { date: '15 Jun 2026', method: 'BACS transfer', ref: 'PAY-2026-0512', amount: 10000.00, status: 'Cleared' },
]

const VERSIONS = [
  { v: 'v2', date: '17 Jun 2026, 08:53', by: 'System (OCR)', note: 'OCR extraction applied', current: true  },
  { v: 'v1', date: '17 Jun 2026, 08:52', by: 'Maya Chen',    note: 'Original upload',        current: false },
]

const STATUS_STYLES: Record<string, { dot: string; bg: string; border: string; text: string; label: string }> = {
  Pending:         { dot: 'bg-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   label: 'Pending approval' },
  PendingReview:   { dot: 'bg-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   label: 'Pending review'   },
  PendingApproval: { dot: 'bg-orange-500',  bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  label: 'Pending approval' },
  Approved:        { dot: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Approved'         },
  Rejected:        { dot: 'bg-red-500',     bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     label: 'Rejected'         },
  Processing:      { dot: 'bg-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    label: 'Processing'       },
  OcrProcessing:   { dot: 'bg-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    label: 'OCR Processing'   },
  OcrComplete:     { dot: 'bg-cyan-500',    bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-700',    label: 'OCR Complete'     },
  Uploaded:        { dot: 'bg-gray-400',    bg: 'bg-gray-50',    border: 'border-gray-200',    text: 'text-gray-600',    label: 'Uploaded'         },
  Reviewed:        { dot: 'bg-indigo-500',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  label: 'Reviewed'         },
  Paid:            { dot: 'bg-purple-500',  bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  label: 'Paid'             },
}

const fmt = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtAmount(n?: number | null, currency?: string | null) {
  if (!n) return '—'
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency ?? 'GBP' }).format(n)
  } catch {
    return `${currency ?? '£'}${n.toFixed(2)}`
  }
}

function confColor(c: number) {
  if (c > 90) return 'bg-emerald-500'
  if (c >= 70) return 'bg-amber-500'
  return 'bg-red-500'
}

function ConfDot({ c }: { c: number }) {
  return <span title={`${c}% confidence`} className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${confColor(c)}`} />
}

function FieldRow({ label, value, confidence, mono = false }: { label: string; value: string; confidence?: number; mono?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  // Sync when value prop changes (after data loads)
  React.useEffect(() => { setVal(value) }, [value])

  return (
    <div className="group flex items-center gap-2.5 py-2.5 border-b border-gray-100">
      <span className="w-32 flex-shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      {editing ? (
        <input
          autoFocus value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
          className={`flex-1 border border-blue-400 rounded px-2 py-0.5 text-sm outline-none ring-2 ring-blue-100 ${mono ? 'font-mono' : ''}`}
        />
      ) : (
        <span className={`flex-1 text-sm text-gray-800 ${mono ? 'font-mono font-semibold text-xs' : ''}`}>{val || '—'}</span>
      )}
      {confidence !== undefined && <ConfDot c={confidence} />}
      <button onClick={() => setEditing((e) => !e)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-400 hover:text-blue-600">
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function Avatar({ name, color = 'bg-blue-500' }: { name: string; color?: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

// ════════════════════════════════════════
// TAB 1: Details — real data
// ════════════════════════════════════════
function TabDetails({ invoice }: { invoice: any }) {
  const items = invoice?.items ?? LINE_ITEMS
  const subtotal = invoice?.subTotal ?? items.reduce((s: number, r: any) => s + (r.qty ?? 1) * (r.unit ?? r.unitPrice ?? 0), 0)
  const tax      = invoice?.taxAmount ?? subtotal * 0.2
  const total    = invoice?.totalAmount ?? subtotal + tax

  return (
    <div className="p-5 space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-300 mb-2">Vendor</p>
        <FieldRow label="Name"       value={invoice?.extractedVendorName ?? invoice?.vendorName ?? '—'} />
        <FieldRow label="VAT number" value={invoice?.vendorVatNumber ?? '—'} mono />
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-300 mb-2">Invoice details</p>
        <FieldRow label="Invoice No."   value={invoice?.invoiceNumber ?? '—'} mono />
        <FieldRow label="Invoice date"  value={fmtDate(invoice?.invoiceDate)} />
        <FieldRow label="Due date"      value={fmtDate(invoice?.dueDate)} />
        <FieldRow label="Currency"      value={invoice?.currency ?? 'GBP'} />
        <FieldRow label="File"          value={invoice?.fileName ?? '—'} />
        <FieldRow label="Status"        value={invoice?.status ?? '—'} />
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-300 mb-2">Amounts</p>
        <FieldRow label="Subtotal"  value={fmtAmount(invoice?.subTotal,    invoice?.currency)} />
        <FieldRow label="Tax / VAT" value={fmtAmount(invoice?.taxAmount,   invoice?.currency)} />
        <FieldRow label="Total"     value={fmtAmount(invoice?.totalAmount, invoice?.currency)} mono />
      </div>

      {items.length > 0 && (
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-300 mb-2">Line items</p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2 text-gray-400 uppercase tracking-wider font-semibold">Description</th>
                  <th className="text-right px-3 py-2 text-gray-400 uppercase tracking-wider font-semibold">Qty</th>
                  <th className="text-right px-3 py-2 text-gray-400 uppercase tracking-wider font-semibold">Unit</th>
                  <th className="text-right px-3 py-2 text-gray-400 uppercase tracking-wider font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((r: any, i: number) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gray-600">{r.description ?? r.desc}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">{r.quantity ?? r.qty ?? 1}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmtAmount(r.unitPrice ?? r.unit)}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{fmtAmount((r.quantity ?? r.qty ?? 1) * (r.unitPrice ?? r.unit ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-gray-50 border-t border-gray-200 px-3 py-2.5 space-y-1.5">
              {[
                ['Subtotal',    fmtAmount(subtotal, invoice?.currency), false],
                ['Tax / VAT',   fmtAmount(tax,      invoice?.currency), false],
                ['Total',       fmtAmount(total,    invoice?.currency), true ],
              ].map(([label, value, bold]) => (
                <div key={label as string} className="flex justify-between text-xs">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-mono ${bold ? 'font-bold text-sm text-gray-900' : 'font-semibold text-gray-700'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════
// TAB 2: Comments
// ════════════════════════════════════════
function TabComments() {
  const [text, setText] = useState('')
  const colors = ['bg-blue-500', 'bg-teal-500', 'bg-blue-500']
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {COMMENTS.map((c, i) => (
          <div key={i} className="flex gap-3">
            <Avatar name={c.user} color={colors[i]} />
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-sm font-bold text-gray-900">{c.user}</span>
                <span className="text-xs text-gray-400">{c.time}</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-600 leading-relaxed">
                {c.text.split(/(@\w+\s\w+)/g).map((part, pi) =>
                  part.startsWith('@')
                    ? <span key={pi} className="text-blue-600 font-semibold">{part}</span>
                    : <span key={pi}>{part}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 p-4 flex gap-3 items-end">
        <Avatar name="You" />
        <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
          <textarea
            placeholder="Add a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border-none outline-none resize-none px-3 py-2.5 text-sm text-gray-800 bg-gray-50 min-h-[68px] placeholder-gray-400"
          />
          <div className="flex justify-end p-2 bg-gray-50 border-t border-gray-100">
            <button disabled={!text.trim()} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors">
              Post comment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// TAB 3: Activity
// ════════════════════════════════════════
function TabActivity({ invoice }: { invoice: any }) {
  const activity = [
    { icon: '📤', label: 'Invoice uploaded',         who: invoice?.uploadedByName || 'User', time: fmtDate(invoice?.createdAt), note: null },
    { icon: '🔍', label: 'OCR processing completed', who: 'System',                          time: fmtDate(invoice?.updatedAt), note: invoice?.status },
    ...ACTIVITY.slice(2),
  ]
  return (
    <div className="p-5">
      <div className="relative">
        <div className="absolute left-[14px] top-5 bottom-2 w-0.5 bg-gray-200" />
        <div className="space-y-0">
          {activity.map((a, i) => (
            <div key={i} className="flex gap-4 pb-6 relative">
              <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center flex-shrink-0 z-10 text-sm">{a.icon}</div>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                {a.note && <p className="text-xs font-mono text-gray-400 mt-0.5">{a.note}</p>}
                <p className="text-xs text-gray-400 mt-1">{a.who} · {a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// TAB 4: Payments
// ════════════════════════════════════════
function TabPayments({ invoice }: { invoice: any }) {
  const total     = invoice?.totalAmount ?? 0
  const paid      = PAYMENTS.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, total - paid)
  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Invoice total', value: fmtAmount(total,     invoice?.currency), color: 'text-gray-900'    },
          { label: 'Paid to date',  value: fmtAmount(paid,      invoice?.currency), color: 'text-emerald-600' },
          { label: 'Remaining',     value: fmtAmount(remaining, invoice?.currency), color: 'text-amber-600'   },
        ].map((item) => (
          <div key={item.label} className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1.5">{item.label}</p>
            <p className={`text-sm font-bold font-mono ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Date', 'Method', 'Reference', 'Amount', 'Status'].map((h, i) => (
                <th key={h} className={`px-3.5 py-2.5 text-gray-400 uppercase tracking-wider font-semibold ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PAYMENTS.map((p, i) => (
              <tr key={i}>
                <td className="px-3.5 py-2.5 text-gray-600">{p.date}</td>
                <td className="px-3.5 py-2.5 text-gray-600">{p.method}</td>
                <td className="px-3.5 py-2.5 font-mono font-semibold text-gray-700">{p.ref}</td>
                <td className="px-3.5 py-2.5 text-right font-mono font-bold text-gray-900">{fmt(p.amount)}</td>
                <td className="px-3.5 py-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
        <Plus className="w-4 h-4" /> Record payment
      </button>
    </div>
  )
}

// ════════════════════════════════════════
// TAB 5: Versions
// ════════════════════════════════════════
function TabVersions() {
  return (
    <div className="p-5 space-y-3">
      {VERSIONS.map((ver, i) => (
        <div key={i} className={`flex items-center gap-3.5 p-4 border rounded-lg ${ver.current ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-xs font-black ${ver.current ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
            {ver.v}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">{ver.note}</span>
              {ver.current && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Current</span>}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{ver.by} · {ver.date}</p>
          </div>
          {!ver.current && (
            <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Restore</button>
          )}
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════
// Document Viewer — shows real uploaded image
// ════════════════════════════════════════
function DocumentViewer({ invoice, loading }: { invoice: any; loading: boolean }) {
  const [zoom, setZoom] = useState(100)

  const fileUrl = invoice?.fileUrl
    ? `${BACKEND_URL}${invoice.fileUrl}`
    : null

  const isPdf = invoice?.fileType?.toLowerCase() === 'pdf'

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Document</span>
        {invoice?.fileName && (
          <span className="text-xs text-gray-500 font-mono">{invoice.fileName}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.max(50, z - 10))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-gray-600 w-10 text-center tabular-nums">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom(100)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <Maximize className="w-4 h-4" />
          </button>
          {fileUrl && (
            <a href={fileUrl} download className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Document area */}
      <div className="flex-1 overflow-auto flex justify-center items-start p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : fileUrl ? (
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }} className="flex-shrink-0">
            {isPdf ? (
              <iframe src={fileUrl} className="w-[600px] h-[800px] rounded-lg shadow-xl bg-white" title="Invoice PDF" />
            ) : (
              <img
                src={fileUrl}
                alt="Invoice"
                className="rounded-lg shadow-xl bg-white max-w-[600px] w-full"
                style={{ display: 'block' }}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <AlertCircle className="w-10 h-10 text-gray-300" />
            <p className="text-sm font-semibold">No document available</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// Right Panel with 5 Tabs
// ════════════════════════════════════════
const TABS = [
  { id: 'details',  label: 'Details',  Icon: Info,          count: null },
  { id: 'comments', label: 'Comments', Icon: MessageSquare, count: 3    },
  { id: 'activity', label: 'Activity', Icon: History,       count: null },
  { id: 'payments', label: 'Payments', Icon: CreditCard,    count: null },
  { id: 'versions', label: 'Versions', Icon: Layers,        count: null },
]

function RightPanel({ invoice }: { invoice: any }) {
  const [activeTab, setActiveTab] = useState('details')
  const [tags, setTags] = useState(['Q2 2026', 'Software licence'])

  const tabContent: Record<string, React.ReactNode> = {
    details:  <TabDetails invoice={invoice} />,
    comments: <TabComments />,
    activity: <TabActivity invoice={invoice} />,
    payments: <TabPayments invoice={invoice} />,
    versions: <TabVersions />,
  }

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex border-b border-gray-200 flex-shrink-0 overflow-x-auto">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.Icon className="w-4 h-4" />
              {tab.label}
              {tab.count != null && (
                <span className={`min-w-[18px] px-1 rounded-full text-xs font-black flex items-center justify-center ${active ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className={`flex-1 overflow-hidden ${activeTab === 'comments' ? 'flex flex-col' : 'overflow-y-auto'}`}>
        {tabContent[activeTab]}
      </div>

      <div className="border-t border-gray-100 px-5 py-3.5 flex flex-wrap items-center gap-2 flex-shrink-0">
        <span className="text-xs font-black uppercase tracking-widest text-gray-300 mr-1">Tags</span>
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-gray-100 border border-gray-300 text-xs font-semibold text-gray-600">
            {tag}
            <button onClick={() => setTags((t) => t.filter((x) => x !== tag))} className="text-gray-400 hover:text-gray-700 ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <button className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full border border-dashed border-gray-300 text-xs font-bold text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
          <Plus className="w-3 h-3" /> Add tag
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// Main Page
// ════════════════════════════════════════
export default function InvoiceDetailPage() {
  const params   = useParams()
  const router   = useRouter()
  const { activeClientId: clientId } = useAuth()
  const invoiceId = params.id as string

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', clientId, invoiceId],
    queryFn:  () => invoiceService.getById(clientId!, invoiceId),
    enabled:  !!clientId && !!invoiceId,
  })

  const status   = invoice?.status ?? 'Pending'
  const statusS  = STATUS_STYLES[status] ?? STATUS_STYLES['Pending']
  const heading  = invoice?.invoiceNumber ?? invoiceId

  return (
    <div className="flex flex-col h-full -m-7">
      {/* Header */}
      <div className="flex items-center gap-3.5 px-7 py-4 bg-white border-b border-gray-200 flex-shrink-0 flex-wrap">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <span className="text-gray-200">|</span>
        <span className="text-base font-bold text-gray-900">
          {isLoading ? 'Loading…' : heading}
        </span>
        <span className={`inline-flex items-center gap-1.5 h-6 px-3 rounded-full border text-xs font-bold ${statusS.bg} ${statusS.border} ${statusS.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusS.dot}`} />
          {statusS.label}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Check className="w-4 h-4" /> Approve
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <X className="w-4 h-4" /> Reject
          </button>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Download
          </button>
          <button className="inline-flex items-center gap-1 h-8 px-3 border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-lg transition-colors">
            More <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden grid grid-cols-[6fr_4fr] gap-5 p-5">
        <DocumentViewer invoice={invoice} loading={isLoading} />
        <RightPanel invoice={invoice} />
      </div>
    </div>
  )
}