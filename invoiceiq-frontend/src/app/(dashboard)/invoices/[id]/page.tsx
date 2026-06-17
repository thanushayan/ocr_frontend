'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Check, X, Download, ChevronDown,
  ZoomIn, ZoomOut, Maximize, Info, MessageSquare,
  History, CreditCard, Layers, Edit2, Plus, AlertCircle
} from 'lucide-react'

// ── Line items தரவு ──
const LINE_ITEMS = [
  { desc: 'OCR Capture Platform — Annual licence', qty: 1,  unit: 14400.00, conf: 88 },
  { desc: 'Compliance Monitoring Add-on',          qty: 3,  unit: 1500.00,  conf: 72 },
  { desc: 'Implementation & onboarding',           qty: 1,  unit: 2530.00,  conf: 99 },
  { desc: 'Priority support SLA (12 months)',      qty: 1,  unit: 1800.00,  conf: 95 },
]

// ── Comments தரவு ──
const COMMENTS = [
  { user: 'Maya Chen',   initials: 'MC', color: 'bg-blue-500',  time: 'Today, 09:14', text: 'VAT number verified against HMRC register. Looks good.' },
  { user: 'Avery Stone', initials: 'AS', color: 'bg-teal-500',  time: 'Today, 10:41', text: 'Line item 2 qty should be 3, not 1 — the contract specifies 3 user licences. @Maya Chen can you confirm before we approve?' },
  { user: 'Maya Chen',   initials: 'MC', color: 'bg-blue-500',  time: 'Today, 11:05', text: 'Confirmed, updating now. OCR misread the quantity — confidence was only 72%.' },
]

// ── Activity தரவு ──
const ACTIVITY = [
  { icon: '📤', label: 'Invoice uploaded',              who: 'Maya Chen',  time: '17 Jun, 08:52', note: null },
  { icon: '🔍', label: 'OCR processing completed',      who: 'System',     time: '17 Jun, 08:53', note: '97.6% overall confidence' },
  { icon: '✅', label: 'Sent for approval',             who: 'Maya Chen',  time: '17 Jun, 09:10', note: null },
  { icon: '✏️', label: 'Field edited: Quantity (line 2)',who: 'Maya Chen',  time: '17 Jun, 11:06', note: '1 → 3' },
  { icon: '🔔', label: 'Approval reminder sent',        who: 'System',     time: '17 Jun, 13:00', note: 'Sent to Avery Stone' },
]

// ── Payments தரவு ──
const PAYMENTS = [
  { date: '01 Jun 2026', method: 'BACS transfer', ref: 'PAY-2026-0441', amount: 10000.00, status: 'Cleared' },
  { date: '15 Jun 2026', method: 'BACS transfer', ref: 'PAY-2026-0512', amount: 10000.00, status: 'Cleared' },
]

// ── Versions தரவு ──
const VERSIONS = [
  { v: 'v3', date: '17 Jun 2026, 11:06', by: 'Maya Chen',    note: 'Field edit: qty line 2 corrected', current: true  },
  { v: 'v2', date: '17 Jun 2026, 08:53', by: 'System (OCR)', note: 'OCR extraction applied',           current: false },
  { v: 'v1', date: '17 Jun 2026, 08:52', by: 'Maya Chen',    note: 'Original upload',                  current: false },
]

// ── Helper: பணம் format ──
const fmt = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── Helper: confidence color ──
function confColor(c: number) {
  if (c > 90) return 'bg-emerald-500'
  if (c >= 70) return 'bg-amber-500'
  return 'bg-red-500'
}

// ── Confidence dot component ──
function ConfDot({ c }: { c: number }) {
  return (
    <span
      title={`${c}% confidence`}
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${confColor(c)}`}
    />
  )
}

// ── Inline edit field ──
function FieldRow({
  label, value, confidence, mono = false
}: {
  label: string
  value: string
  confidence?: number
  mono?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  return (
    <div className="group flex items-center gap-2.5 py-2.5 border-b border-gray-100">
      {/* Label */}
      <span className="w-32 flex-shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      {/* Value அல்லது Input */}
      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
          className={`flex-1 border border-blue-400 rounded px-2 py-0.5 text-sm outline-none ring-2 ring-blue-100 ${mono ? 'font-mono' : ''}`}
        />
      ) : (
        <span className={`flex-1 text-sm text-gray-800 ${mono ? 'font-mono font-semibold text-xs' : ''}`}>
          {val}
        </span>
      )}
      {/* Confidence dot */}
      {confidence && <ConfDot c={confidence} />}
      {/* Edit button - hover-ல மட்டும் காட்டு */}
      <button
        onClick={() => setEditing((e) => !e)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-400 hover:text-blue-600"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── Initials Avatar ──
function Avatar({ name, color = 'bg-blue-500' }: { name: string; color?: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

// ════════════════════════════════════════
// TAB 1: Details
// ════════════════════════════════════════
function TabDetails() {
  const subtotal = LINE_ITEMS.reduce((s, r) => s + r.qty * r.unit, 0)
  const tax = subtotal * 0.2
  const total = subtotal + tax

  return (
    <div className="p-5 space-y-4">
      {/* Vendor section */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-300 mb-2">Vendor</p>
        <FieldRow label="Name"       value="Northstar Supplies Ltd"          confidence={88} />
        <FieldRow label="Email"      value="accounts@northstar-supplies.ie"  confidence={91} />
        <FieldRow label="VAT number" value="IE6388047V"                      confidence={76} mono />
      </div>

      {/* Invoice details section */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-300 mb-2">Invoice details</p>
        <FieldRow label="Invoice No."    value="INV-2024-0892" confidence={95} mono />
        <FieldRow label="Invoice date"   value="12 Jun 2026"   confidence={99} />
        <FieldRow label="Due date"       value="26 Jun 2026"   confidence={97} />
        <FieldRow label="Payment terms"  value="Net 14"        confidence={84} />
      </div>

      {/* Line items table */}
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
                <th className="text-right px-3 py-2 text-gray-400 uppercase tracking-wider font-semibold">Conf.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {LINE_ITEMS.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-gray-600">{r.desc}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">{r.qty}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(r.unit)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold">{fmt(r.qty * r.unit)}</td>
                  <td className="px-3 py-2 text-right"><ConfDot c={r.conf} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Totals */}
          <div className="bg-gray-50 border-t border-gray-200 px-3 py-2.5 space-y-1.5">
            {[
              ['Subtotal',     fmt(subtotal), false],
              ['VAT (20%)',    fmt(tax),      false],
              ['Total (GBP)',  fmt(total),    true ],
            ].map(([label, value, bold]) => (
              <div key={label as string} className="flex justify-between text-xs">
                <span className="text-gray-400">{label}</span>
                <span className={`font-mono ${bold ? 'font-bold text-sm text-gray-900' : 'font-semibold text-gray-700'}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
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
      {/* Comment list */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {COMMENTS.map((c, i) => (
          <div key={i} className="flex gap-3">
            <Avatar name={c.user} color={colors[i]} />
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-sm font-bold text-gray-900">{c.user}</span>
                <span className="text-xs text-gray-400">{c.time}</span>
              </div>
              {/* Comment bubble */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-600 leading-relaxed">
                {/* @mention-ஐ blue color-ல காட்டு */}
                {c.text.split(/(@\w+\s\w+)/g).map((part, pi) =>
                  part.startsWith('@') ? (
                    <span key={pi} className="text-blue-600 font-semibold">{part}</span>
                  ) : (
                    <span key={pi}>{part}</span>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment input */}
      <div className="border-t border-gray-100 p-4 flex gap-3 items-end">
        <Avatar name="Maya Chen" />
        <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
          <textarea
            placeholder="Add a comment… Use @ to mention a team member"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border-none outline-none resize-none px-3 py-2.5 text-sm text-gray-800 bg-gray-50 min-h-[68px] placeholder-gray-400"
          />
          <div className="flex justify-end p-2 bg-gray-50 border-t border-gray-100">
            <button
              disabled={!text.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Post comment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// TAB 3: Activity Timeline
// ════════════════════════════════════════
function TabActivity() {
  return (
    <div className="p-5">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[14px] top-5 bottom-2 w-0.5 bg-gray-200" />
        <div className="space-y-0">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex gap-4 pb-6 relative">
              {/* Icon circle */}
              <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center flex-shrink-0 z-10 text-sm">
                {a.icon}
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                {a.note && (
                  <p className="text-xs font-mono text-gray-400 mt-0.5">{a.note}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {a.who} · {a.time}
                </p>
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
function TabPayments() {
  const subtotal = LINE_ITEMS.reduce((s, r) => s + r.qty * r.unit, 0)
  const total = subtotal * 1.2
  const paid = PAYMENTS.reduce((s, p) => s + p.amount, 0)
  const remaining = total - paid

  return (
    <div className="p-5 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Invoice total', value: fmt(total),     color: 'text-gray-900' },
          { label: 'Paid to date',  value: fmt(paid),      color: 'text-emerald-600' },
          { label: 'Remaining',     value: fmt(remaining), color: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1.5">{item.label}</p>
            <p className={`text-sm font-bold font-mono ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Payments table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Date', 'Method', 'Reference', 'Amount', 'Status'].map((h, i) => (
                <th key={h} className={`px-3.5 py-2.5 text-gray-400 uppercase tracking-wider font-semibold ${i === 3 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
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
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record payment button */}
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
        <div
          key={i}
          className={`flex items-center gap-3.5 p-4 border rounded-lg ${
            ver.current
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          {/* Version badge */}
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-xs font-black ${
            ver.current ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {ver.v}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">{ver.note}</span>
              {ver.current && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  Current
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{ver.by} · {ver.date}</p>
          </div>
          {!ver.current && (
            <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Restore
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════
// Document Viewer (Invoice PDF simulation)
// ════════════════════════════════════════
function DocumentViewer() {
  const [zoom, setZoom] = useState(100)
  const [overlay, setOverlay] = useState(false)

  const subtotal = LINE_ITEMS.reduce((s, r) => s + r.qty * r.unit, 0)
  const tax = subtotal * 0.2
  const total = subtotal + tax

  // OCR overlay fields
  const ocrFields = [
    { label: 'Invoice No.', conf: 95, x: '62%', y: '27%' },
    { label: 'Total',       conf: 99, x: '74%', y: '88%' },
    { label: 'Vendor',      conf: 88, x: '14%', y: '14%' },
    { label: 'Qty (ln 2)',  conf: 72, x: '52%', y: '58%' },
  ]

  function ocrBg(c: number) {
    if (c > 90) return 'bg-emerald-100 border-emerald-500 text-emerald-700'
    if (c >= 70) return 'bg-amber-100 border-amber-500 text-amber-700'
    return 'bg-red-100 border-red-500 text-red-700'
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Document</span>
        <div className="ml-auto flex items-center gap-2">
          {/* OCR overlay toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-gray-600">
            <button
              onClick={() => setOverlay((v) => !v)}
              className={`w-[18px] h-[18px] rounded flex items-center justify-center border-[1.5px] transition-colors ${
                overlay ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'
              }`}
            >
              {overlay && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </button>
            OCR overlay
          </label>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          {/* Zoom controls */}
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
          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document area */}
      <div className="flex-1 overflow-auto flex justify-center p-6">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="relative w-[520px] flex-shrink-0"
        >
          {/* White invoice paper */}
          <div className="bg-white rounded-lg shadow-xl px-10 py-10">
            {/* Invoice header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-lg font-black text-gray-900">Northstar Supplies Ltd</p>
                <p className="text-xs text-gray-400 mt-1">14 Commerce St, Dublin 2, Ireland</p>
                <p className="text-xs text-gray-400">VAT IE6388047V</p>
                <p className="text-xs text-gray-400">accounts@northstar-supplies.ie</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-blue-700 tracking-tight">INVOICE</p>
                <p className="text-sm font-bold font-mono text-gray-800 mt-1">INV-2024-0892</p>
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-gray-50 rounded-lg px-4 py-3.5 mb-7 text-xs">
              {[
                ['Invoice date', '12 Jun 2026'],
                ['Due date',     '26 Jun 2026'],
                ['Bill to',      'Northstar Finance Ltd'],
                ['Payment terms','Net 14'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
            </div>

            {/* Line items table */}
            <table className="w-full text-xs mb-4 border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {['Description', 'Qty', 'Unit price', 'Total'].map((h, i) => (
                    <th key={h} className={`pb-2 text-gray-400 uppercase tracking-wider font-semibold text-xs ${i > 0 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LINE_ITEMS.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2.5 text-gray-600">{r.desc}</td>
                    <td className="py-2.5 text-right font-mono font-semibold">{r.qty}</td>
                    <td className="py-2.5 text-right font-mono">{fmt(r.unit)}</td>
                    <td className="py-2.5 text-right font-mono font-bold">{fmt(r.qty * r.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex flex-col items-end gap-1.5 text-xs">
              {[
                ['Subtotal',    fmt(subtotal), false],
                ['VAT (20%)',   fmt(tax),      false],
              ].map(([k, v]) => (
                <div key={k as string} className="flex gap-14">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-mono font-semibold w-24 text-right">{v}</span>
                </div>
              ))}
              <div className="flex gap-14 border-t border-gray-200 pt-2 mt-1">
                <span className="font-black">Total (GBP)</span>
                <span className="font-mono font-black text-base w-24 text-right">{fmt(total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-7 pt-5 border-t border-gray-100 text-xs text-gray-300 leading-relaxed">
              Payment: Bank of Ireland · Sort code 90-00-12 · Account 12345678<br />
              Thank you for your business.
            </div>
          </div>

          {/* OCR Overlay - checkbox true-ஆனா மட்டும் காட்டு */}
          {overlay && ocrFields.map((f) => (
            <div
              key={f.label}
              style={{ position: 'absolute', left: f.x, top: f.y }}
              className={`px-2 py-0.5 rounded border text-xs font-mono font-bold pointer-events-none ${ocrBg(f.conf)}`}
            >
              {f.label} {f.conf}%
            </div>
          ))}
        </div>
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
  { id: 'activity', label: 'Activity', Icon: History,       count: 5    },
  { id: 'payments', label: 'Payments', Icon: CreditCard,    count: null },
  { id: 'versions', label: 'Versions', Icon: Layers,        count: null },
]

function RightPanel() {
  const [activeTab, setActiveTab] = useState('details')
  const [tags, setTags] = useState(['Q2 2026', 'Northstar', 'Software licence', 'Compliance'])

  // Active tab content render
  const tabContent: Record<string, React.ReactNode> = {
    details:  <TabDetails />,
    comments: <TabComments />,
    activity: <TabActivity />,
    payments: <TabPayments />,
    versions: <TabVersions />,
  }

  // Comments tab-ல flex column வேணும், மற்றவை scroll
  const isComments = activeTab === 'comments'

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 flex-shrink-0 overflow-x-auto">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.Icon className="w-4 h-4" />
              {tab.label}
              {tab.count != null && (
                <span className={`min-w-[18px] h-4.5 px-1 rounded-full text-xs font-black flex items-center justify-center ${
                  active ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className={`flex-1 overflow-hidden ${isComments ? 'flex flex-col' : 'overflow-y-auto'}`}>
        {tabContent[activeTab]}
      </div>

      {/* Tags section */}
      <div className="border-t border-gray-100 px-5 py-3.5 flex flex-wrap items-center gap-2 flex-shrink-0">
        <span className="text-xs font-black uppercase tracking-widest text-gray-300 mr-1">Tags</span>
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-gray-100 border border-gray-300 text-xs font-semibold text-gray-600"
          >
            {tag}
            <button
              onClick={() => setTags((t) => t.filter((x) => x !== tag))}
              className="text-gray-400 hover:text-gray-700 ml-0.5"
            >
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
  // URL-லிருந்து invoice id எடு → /invoices/INV-2024-0892
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  return (
    <div className="flex flex-col h-full -m-7">
      {/* Page header bar */}
      <div className="flex items-center gap-3.5 px-7 py-4 bg-white border-b border-gray-200 flex-shrink-0 flex-wrap">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <span className="text-gray-200">|</span>
        {/* Invoice number */}
        <span className="text-base font-bold text-gray-900">{invoiceId || 'INV-2024-0892'}</span>
        {/* Status badge */}
        <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending approval
        </span>
        {/* Action buttons */}
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

      {/* Main content: Document + Right Panel */}
      <div className="flex-1 overflow-hidden grid grid-cols-[6fr_4fr] gap-5 p-5">
        <DocumentViewer />
        <RightPanel />
      </div>
    </div>
  )
}