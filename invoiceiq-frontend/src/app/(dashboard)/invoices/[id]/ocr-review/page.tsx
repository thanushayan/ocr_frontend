'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Check, CheckCheck, AlertTriangle,
  AlertCircle, RotateCcw, ArrowRight, CheckCircle
} from 'lucide-react'

// ── OCR field type ──
interface OcrField {
  id: string
  label: string
  value: string
  ocr: string
  conf: number
  mono?: boolean
  box: { top: string; left: string; width: string; height: string }
}

// ── Field தரவு (lowest confidence first) ──
const INIT_FIELDS: OcrField[] = [
  { id:'po_ref',       label:'PO reference',   value:'PO-2026-0047',                conf:48, mono:true,  ocr:'P0-2026-O047',                  box:{top:'26.8%',left:'54%',  width:'39%',height:'3.8%'} },
  { id:'line2_qty',    label:'Line 2 qty',      value:'3',                           conf:62, mono:true,  ocr:'1',                             box:{top:'55.2%',left:'57.5%',width:'7%', height:'3.5%'} },
  { id:'tax',          label:'Tax amount',      value:'£4,386.00',                   conf:72, mono:true,  ocr:'£4,386.00',                     box:{top:'81.5%',left:'56%',  width:'37%',height:'3.6%'} },
  { id:'vendor_email', label:'Vendor email',    value:'accounts@northstar-supplies.ie', conf:74, mono:false, ocr:'accounts@northstar-supplies.ie', box:{top:'12.5%',left:'5%',  width:'52%',height:'3.6%'} },
  { id:'currency',     label:'Currency',        value:'GBP',                         conf:85, mono:true,  ocr:'GBP',                           box:{top:'21.4%',left:'5%',  width:'12%',height:'3.6%'} },
  { id:'due_date',     label:'Due date',        value:'26 Jun 2026',                 conf:87, mono:false, ocr:'26 Jun 2026',                   box:{top:'21.4%',left:'62%', width:'32%',height:'3.6%'} },
  { id:'vendor_name',  label:'Vendor name',     value:'Northstar Supplies Ltd',      conf:91, mono:false, ocr:'Northstar Supplies Ltd',        box:{top:'5.6%', left:'5%',  width:'42%',height:'4.2%'} },
  { id:'invoice_num',  label:'Invoice number',  value:'INV-2024-0892',               conf:97, mono:true,  ocr:'INV-2024-0892',                 box:{top:'10.8%',left:'61%', width:'34%',height:'3.8%'} },
  { id:'invoice_date', label:'Invoice date',    value:'12 Jun 2026',                 conf:98, mono:false, ocr:'12 Jun 2026',                   box:{top:'21.4%',left:'25%', width:'25%',height:'3.6%'} },
  { id:'subtotal',     label:'Subtotal',        value:'£21,930.00',                  conf:99, mono:true,  ocr:'£21,930.00',                    box:{top:'77.2%',left:'56%',  width:'37%',height:'3.6%'} },
  { id:'total',        label:'Total amount',    value:'£26,316.00',                  conf:99, mono:true,  ocr:'£26,316.00',                    box:{top:'86.4%',left:'54%',  width:'39%',height:'4.4%'} },
]

// ── Confidence color helper ──
function confStyle(c: number) {
  if (c > 90) return { fg: '#16a34a', bg: 'rgba(22,163,74,0.13)',   bd: '#16a34a', label: 'High',   tw: 'text-emerald-600', bar: 'bg-emerald-500', pill: 'bg-emerald-50 border-emerald-200 text-emerald-700' }
  if (c >= 70) return { fg: '#d97706', bg: 'rgba(217,119,6,0.12)',  bd: '#d97706', label: 'Medium', tw: 'text-amber-600',   bar: 'bg-amber-500',   pill: 'bg-amber-50 border-amber-200 text-amber-700'         }
  return         { fg: '#dc2626', bg: 'rgba(220,38,38,0.13)',        bd: '#dc2626', label: 'Low',    tw: 'text-red-600',     bar: 'bg-red-500',     pill: 'bg-red-50 border-red-200 text-red-700'               }
}

// Line items for invoice doc
const LINE_ITEMS = [
  { desc: 'OCR Capture Platform — Annual licence', qty: 1, unit: 14400 },
  { desc: 'Compliance Monitoring Add-on',          qty: 3, unit: 1500  },
  { desc: 'Implementation & onboarding services',  qty: 1, unit: 2530  },
  { desc: 'Priority support SLA (12 months)',       qty: 1, unit: 1800  },
]
const fmt = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2 })
const subtotal = LINE_ITEMS.reduce((s, r) => s + r.qty * r.unit, 0)

// ════════════════════════════════════════
// Invoice Document with Bounding Boxes
// ════════════════════════════════════════
function InvoiceDoc({
  fields, activeId, onHover
}: {
  fields: OcrField[]
  activeId: string | null
  onHover: (id: string | null) => void
}) {
  return (
    <div className="relative">
      {/* White invoice paper */}
      <div className="bg-white rounded-lg shadow-xl px-9 py-9 relative">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-lg font-bold text-gray-900">Northstar Supplies Ltd</p>
            <p className="text-xs text-gray-400 mt-1">accounts@northstar-supplies.ie</p>
            <p className="text-xs text-gray-400">VAT IE6388047V · Dublin 2, Ireland</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-blue-700 tracking-tight">INVOICE</p>
            <p className="text-sm font-bold font-mono text-gray-900 mt-1.5">INV-2024-0892</p>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-gray-50 rounded-lg px-3.5 py-3 mb-5 text-xs">
          {[
            ['Invoice date', '12 Jun 2026'], ['Due date', '26 Jun 2026'],
            ['Bill to', 'Northstar Finance Ltd'], ['PO reference', 'PO-2026-0047'],
            ['Currency', 'GBP'], ['Payment terms', 'Net 14'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <span className="text-gray-400">{k}</span>
              <span className="font-semibold text-gray-800">{v}</span>
            </div>
          ))}
        </div>

        {/* Line items table */}
        <table className="w-full border-collapse mb-3 text-xs">
          <thead>
            <tr className="border-b-2 border-gray-200">
              {['Description', 'Qty', 'Unit price', 'Total'].map((h, i) => (
                <th key={h} className={`pb-1.5 font-bold text-gray-400 uppercase tracking-wider text-xs ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LINE_ITEMS.map((r, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-600">{r.desc}</td>
                <td className="py-2 text-right font-mono font-semibold">{r.qty}</td>
                <td className="py-2 text-right font-mono">{fmt(r.unit)}</td>
                <td className="py-2 text-right font-mono font-bold">{fmt(r.qty * r.unit)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex flex-col items-end gap-1 text-xs">
          <div className="flex gap-12"><span className="text-gray-400">Subtotal</span><span className="font-mono font-semibold w-24 text-right">{fmt(subtotal)}</span></div>
          <div className="flex gap-12"><span className="text-gray-400">VAT (20%)</span><span className="font-mono font-semibold w-24 text-right">{fmt(subtotal * 0.2)}</span></div>
          <div className="flex gap-12 border-t border-gray-200 pt-1.5 mt-1">
            <span className="font-black text-sm">Total (GBP)</span>
            <span className="font-mono font-black text-sm w-24 text-right">{fmt(subtotal * 1.2)}</span>
          </div>
        </div>

        <div className="mt-6 pt-3.5 border-t border-gray-100 text-xs text-gray-300 leading-relaxed">
          Bank of Ireland · Sort 90-00-12 · Acct 12345678 · Thank you for your business.
        </div>
      </div>

      {/* OCR Bounding boxes overlay */}
      {fields.map((f) => {
        const s = confStyle(f.conf)
        const isActive = f.id === activeId
        return (
          <div
            key={f.id}
            className="absolute rounded cursor-pointer transition-all duration-150 group"
            style={{
              top: f.box.top, left: f.box.left,
              width: f.box.width, height: f.box.height,
              border: `2px solid ${s.bd}`,
              background: isActive
                ? s.bg.replace('0.13', '0.25').replace('0.12', '0.22')
                : s.bg,
              boxShadow: isActive ? `0 0 0 3px ${s.bd}44` : 'none',
              transform: isActive ? 'scale(1.01)' : 'scale(1)',
            }}
            onMouseEnter={() => onHover(f.id)}
            onMouseLeave={() => onHover(null)}
          >
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <span style={{ color: s.fg === '#16a34a' ? '#4ade80' : s.fg === '#d97706' ? '#fbbf24' : '#f87171' }}>●</span>
              {' '}{f.label} · {f.conf}%
              {/* Arrow */}
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════
// Confidence Bar
// ════════════════════════════════════════
function ConfBar({ conf }: { conf: number }) {
  const s = confStyle(conf)
  return (
    <div className="flex items-center gap-2.5">
      {/* Progress bar */}
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${s.bar}`}
          style={{ width: `${conf}%` }}
        />
      </div>
      {/* Percentage */}
      <span className={`text-xs font-bold font-mono w-7 text-right tabular-nums ${s.tw}`}>{conf}%</span>
      {/* Badge */}
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${s.pill}`}>
        {s.label}
      </span>
    </div>
  )
}

// ════════════════════════════════════════
// Field Card (right panel)
// ════════════════════════════════════════
function FieldCard({
  field, isActive, isApproved, onHover, onUpdate
}: {
  field: OcrField
  isActive: boolean
  isApproved: boolean
  onHover: (id: string | null) => void
  onUpdate: (id: string, val: string) => void
}) {
  const [val, setVal]   = useState(field.value)
  const edited          = val !== field.ocr
  const low             = field.conf < 70
  const s               = confStyle(field.conf)

  return (
    <div
      className={`rounded-lg p-3.5 border cursor-pointer transition-all ${
        isApproved ? 'bg-emerald-50 border-emerald-200' :
        low        ? 'bg-red-50 border-red-200' :
        isActive   ? 'bg-blue-50 border-blue-300' :
                     'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      onMouseEnter={() => onHover(field.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Label row */}
      <div className="flex items-center gap-2 mb-2">
        {low && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
        <span className="text-sm font-bold text-gray-700 flex-1">{field.label}</span>
        {isApproved && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        )}
      </div>

      {/* Confidence bar */}
      <ConfBar conf={field.conf} />

      {/* Editable input */}
      <div className="mt-2.5">
        <input
          value={val}
          onChange={(e) => { setVal(e.target.value); onUpdate(field.id, e.target.value) }}
          className={`w-full h-9 px-2.5 border rounded-md text-sm outline-none transition-all ${
            field.mono ? 'font-mono font-semibold text-xs' : ''
          } ${
            low
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
          }`}
        />
        {/* Edited → show original OCR strikethrough */}
        {edited && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xs text-gray-400">Original OCR:</span>
            <span className={`text-xs line-through text-gray-300 ${field.mono ? 'font-mono' : ''}`}>
              {field.ocr}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// Main Page
// ════════════════════════════════════════
export default function OcrReviewPage() {
  const router    = useRouter()
  const params    = useParams()
  const invoiceId = params.id as string

  const [fields, setFields]   = useState<OcrField[]>(INIT_FIELDS)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [approved, setApproved] = useState<Set<string>>(new Set())

  // Confidence stats
  const lowCount  = fields.filter((f) => f.conf < 70).length
  const medCount  = fields.filter((f) => f.conf >= 70 && f.conf < 90).length
  const highCount = fields.filter((f) => f.conf >= 90).length
  const allApproved = approved.size === fields.length

  // Approve all high confidence fields
  const approveHigh = () => setApproved(new Set(fields.filter((f) => f.conf >= 90).map((f) => f.id)))

  // Approve all fields
  const approveAll = () => setApproved(new Set(fields.map((f) => f.id)))

  // Field value update
  const updateField = (id: string, val: string) => {
    setFields((fs) => fs.map((f) => f.id === id ? { ...f, value: val } : f))
  }

  return (
    // -m-7 → layout padding override பண்ணு (full height வேணும்)
    <div className="flex flex-col h-full -m-7">
      {/* ── Summary bar ── */}
      <div className="flex-shrink-0 flex items-center gap-4 px-5 py-3 border-b border-gray-200 bg-white flex-wrap">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to invoices
        </button>
        <span className="text-gray-200">|</span>

        {/* Title */}
        <span className="text-base font-bold text-gray-900">
          OCR Confidence Review —{' '}
          <span className="font-mono text-sm">{invoiceId || 'INV-2024-0892'}</span>
        </span>

        {/* Confidence pills */}
        <div className="flex gap-2">
          {lowCount > 0 && (
            <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-bold bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-3.5 h-3.5" /> {lowCount} low confidence
            </span>
          )}
          {medCount > 0 && (
            <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" /> {medCount} medium
            </span>
          )}
          {highCount > 0 && (
            <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle className="w-3.5 h-3.5" /> {highCount} high
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-400">
          {[
            { color: 'bg-emerald-500', label: '> 90% High' },
            { color: 'bg-amber-500',   label: '70–90% Medium' },
            { color: 'bg-red-500',     label: '< 70% Low' },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${l.color}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex-1 overflow-hidden grid grid-cols-[1fr_420px]">
        {/* Left: Document viewer */}
        <div className="bg-gray-100 border-r border-gray-200 overflow-auto p-7">
          <div className="max-w-[540px] mx-auto">
            <InvoiceDoc
              fields={fields}
              activeId={activeId}
              onHover={setActiveId}
            />
          </div>
        </div>

        {/* Right: Field review panel */}
        <div className="flex flex-col bg-white overflow-hidden">
          {/* Panel header */}
          <div className="px-4 py-3.5 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-900">Extracted fields</span>
              <span className="text-xs text-gray-400">Sorted lowest confidence first</span>
            </div>
            {/* Bulk approve buttons */}
            <div className="flex gap-2">
              <button
                onClick={approveHigh}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-600 rounded-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Approve high confidence
              </button>
              <button
                onClick={approveAll}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Approve all
              </button>
            </div>
          </div>

          {/* Field cards list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {fields.map((f) => (
              <FieldCard
                key={f.id}
                field={f}
                isActive={activeId === f.id}
                isApproved={approved.has(f.id)}
                onHover={setActiveId}
                onUpdate={updateField}
              />
            ))}
          </div>

          {/* Panel footer */}
          <div className="px-4 py-3.5 border-t border-gray-200 flex-shrink-0 space-y-2.5">
            {/* Status banner */}
            {allApproved ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700">
                <CheckCircle className="w-4 h-4" /> All fields approved. Ready to submit.
              </div>
            ) : lowCount > 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                Review {lowCount} low-confidence field{lowCount > 1 ? 's' : ''} before submitting.
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 border border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-600 rounded-lg transition-colors">
                <RotateCcw className="w-4 h-4" /> Re-run OCR
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                Submit corrections <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}