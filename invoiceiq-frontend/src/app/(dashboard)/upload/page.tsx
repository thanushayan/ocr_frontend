'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, CloudUpload, FileText,
  CheckCircle, AlertTriangle, Info, Send, Save,
  Layers, Edit2, X, Check
} from 'lucide-react'

// ── OCR processing steps ──
const OCR_STEPS = [
  { msg: 'Uploading file…',                     pct: 15 },
  { msg: 'Processing with GCP Vision API…',     pct: 38 },
  { msg: 'Extracting structured fields…',       pct: 64 },
  { msg: 'Validating against vendor records…',  pct: 86 },
  { msg: 'Finalising results…',                 pct: 98 },
]

// ── OCR extracted fields ──
const OCR_FIELDS = [
  { label: 'Vendor name',    value: 'Northstar Supplies Ltd', confidence: 94, mono: false },
  { label: 'Invoice number', value: 'INV-2024-0892',          confidence: 97, mono: true  },
  { label: 'Invoice date',   value: '12 Jun 2026',            confidence: 99, mono: false },
  { label: 'Due date',       value: '26 Jun 2026',            confidence: 88, mono: false },
  { label: 'Currency',       value: 'GBP',                    confidence: 85, mono: false },
  { label: 'Subtotal',       value: '£21,930.00',             confidence: 99, mono: true  },
  { label: 'Tax (20%)',      value: '£4,386.00',              confidence: 72, mono: true  },
  { label: 'Total amount',   value: '£26,316.00',             confidence: 99, mono: true  },
  { label: 'PO reference',   value: 'PO-2026-0047',           confidence: 48, mono: true  },
]

// ── Step indicator ──
const STEPS = ['Upload', 'OCR Processing', 'Review', 'Submit']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 py-8">
      {STEPS.map((label, i) => {
        const n = i + 1
        const done   = n < current
        const active = n === current
        return (
          <React.Fragment key={n}>
            <div className="flex flex-col items-center gap-2">
              {/* Circle */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all ${
                done   ? 'bg-emerald-500 border-emerald-500 text-white' :
                active ? 'bg-blue-600 border-blue-600 text-white' :
                         'bg-white border-gray-300 text-gray-400'
              }`}>
                {done ? <Check className="w-4 h-4" strokeWidth={3} /> : n}
              </div>
              {/* Label */}
              <span className={`text-xs font-semibold whitespace-nowrap ${
                active ? 'text-blue-700 font-bold' :
                done   ? 'text-gray-600' :
                         'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className={`w-24 h-0.5 mx-2 mb-6 rounded transition-all ${done ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ════════════════════════════════════════
// STEP 1: Upload
// ════════════════════════════════════════
interface FileInfo {
  name: string
  size: string
}

function StepUpload({ onNext }: { onNext: () => void }) {
  const [dragging, setDragging]   = useState(false)
  const [file, setFile]           = useState<FileInfo | null>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile({ name: f.name, size: `${(f.size / 1024 / 1024).toFixed(1)} MB` })
  }

  // File input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile({ name: f.name, size: `${(f.size / 1024 / 1024).toFixed(1)} MB` })
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.tiff"
            className="hidden"
            onChange={handleFileChange}
          />
          {/* Icon */}
          <div className={`w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-5 ${
            dragging ? 'bg-blue-100' : 'bg-gray-100'
          }`}
            style={{ width: 72, height: 72 }}
          >
            <CloudUpload className={`w-9 h-9 ${dragging ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-2">
            Drop your invoice here{' '}
            <span className="text-blue-600">or click to browse</span>
          </p>
          <p className="text-sm text-gray-500 mb-5">
            Supports PDF, JPG, PNG, TIFF — maximum 10 MB
          </p>
          {/* File type chips */}
          <div className="flex gap-2 justify-center">
            {['PDF', 'JPG', 'PNG', 'TIFF'].map((f) => (
              <span key={f} className="px-3 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-bold text-gray-600 tracking-wide">
                {f}
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* File selected state */
        <div className="border border-gray-200 rounded-2xl bg-white p-7 flex items-center gap-5">
          {/* PDF icon */}
          <div className="w-16 h-20 rounded-lg bg-blue-50 border-2 border-blue-200 flex flex-col items-center justify-center flex-shrink-0 relative">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="absolute bottom-1.5 text-[9px] font-black text-blue-700 tracking-widest">PDF</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 mb-1">{file.name}</p>
            <p className="text-xs text-gray-400 mb-3">{file.size} · PDF Document</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600">
              <CheckCircle className="w-4 h-4" /> Ready to process
            </span>
          </div>
          <button
            onClick={() => setFile(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" /> Remove
          </button>
        </div>
      )}

      {/* Bulk upload hint */}
      <div className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-lg bg-white">
        <Layers className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <div className="flex-1 text-sm">
          <span className="font-semibold text-gray-700">Need to upload multiple invoices?</span>
          <span className="text-gray-400"> Use bulk OCR to process up to 500 at once.</span>
        </div>
        <button className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
          Bulk upload <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Next button */}
      <div className="flex justify-end pt-2">
        <button
          disabled={!file}
          onClick={onNext}
          className="inline-flex items-center gap-2 h-11 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          Upload & Process OCR <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// STEP 2: OCR Processing (auto-advance)
// ════════════════════════════════════════
function StepProcessing({ onNext }: { onNext: () => void }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [pct, setPct]         = useState(0)

  // OCR steps-ஐ auto animate பண்ணு
  useEffect(() => {
    let si = 0
    const advance = () => {
      if (si >= OCR_STEPS.length) { setTimeout(onNext, 800); return }
      setStepIdx(si)
      const target = OCR_STEPS[si].pct
      const prev   = si === 0 ? 0 : OCR_STEPS[si - 1].pct
      let cur = prev
      const tick = setInterval(() => {
        cur = Math.min(cur + 2, target)
        setPct(cur)
        if (cur >= target) { clearInterval(tick); si++; setTimeout(advance, 500) }
      }, 30)
    }
    advance()
  }, []) // eslint-disable-line

  const current = OCR_STEPS[Math.min(stepIdx, OCR_STEPS.length - 1)]
  // SVG circle circumference
  const r = 52
  const circumference = 2 * Math.PI * r

  return (
    <div className="text-center py-12">
      {/* Circular progress */}
      <div className="relative w-32 h-32 mx-auto mb-8">
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={r}
            fill="none" stroke="#2563eb" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 0.15s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold font-mono text-blue-700 tabular-nums">{pct}%</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">Processing your invoice</h2>
      <p className="text-sm text-gray-500 mb-8 min-h-[20px]">{current?.msg}</p>

      {/* Step log */}
      <div className="flex flex-col gap-3 text-left max-w-md mx-auto">
        {OCR_STEPS.map((s, i) => {
          const done   = i < stepIdx
          const active = i === stepIdx
          return (
            <div
              key={i}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-lg border transition-all ${
                active ? 'border-blue-200 bg-blue-50' :
                done   ? 'border-emerald-200 bg-emerald-50' :
                         'border-gray-200 bg-white'
              }`}
            >
              {/* Status icon */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                done   ? 'bg-emerald-500' :
                active ? 'bg-blue-600' :
                         'bg-gray-200'
              }`}>
                {done   && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                {active && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/50 border-t-white animate-spin" />}
                {!done && !active && <span className="text-xs text-gray-400">·</span>}
              </div>
              <span className={`text-sm flex-1 ${
                active ? 'font-semibold text-blue-700' :
                done   ? 'text-emerald-700' :
                         'text-gray-400'
              }`}>
                {s.msg}
              </span>
              {done && <span className="text-xs font-bold text-emerald-600">Done</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// STEP 3: Review
// ════════════════════════════════════════

// Confidence badge
function ConfBadge({ c }: { c: number }) {
  const s = c > 90
    ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'High' }
    : c >= 70
    ? { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Medium' }
    : { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500',     label: 'Low' }
  return (
    <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-full border text-xs font-bold ${s.bg} ${s.border} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label} · {c}%
    </span>
  )
}

// Editable field with confidence
function EditableField({
  label, value: initVal, confidence, mono = false
}: {
  label: string; value: string; confidence: number; mono?: boolean
}) {
  const [val, setVal]       = useState(initVal)
  const [focused, setFocused] = useState(false)
  const low = confidence < 70

  return (
    <div className="group flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className={`text-sm font-semibold ${low ? 'text-red-600' : 'text-gray-600'}`}>
          {label}
          {low && <AlertTriangle className="inline w-3.5 h-3.5 ml-1 -mt-0.5" />}
        </label>
        <ConfBadge c={confidence} />
      </div>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full h-10 px-3 border rounded-lg text-sm outline-none transition-all ${
          mono ? 'font-mono text-xs' : ''
        } ${
          focused ? 'border-blue-500 ring-2 ring-blue-100 bg-white' :
          low     ? 'border-red-400 bg-red-50 ring-2 ring-red-50' :
                    'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      />
      {low && !focused && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Low confidence — please verify this field manually.
        </p>
      )}
    </div>
  )
}

// Line items for document preview
const PREVIEW_ITEMS = [
  { desc: 'OCR Platform licence (annual)', qty: 1, unit: 14400 },
  { desc: 'Compliance add-on (×3 users)',  qty: 3, unit: 1500  },
  { desc: 'Implementation & onboarding',   qty: 1, unit: 2530  },
  { desc: 'Priority support SLA',          qty: 1, unit: 1500  },
]
const fmtGBP = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2 })

function StepReview({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const subtotal = PREVIEW_ITEMS.reduce((s, r) => s + r.qty * r.unit, 0)

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Left: Document preview */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-200">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Document preview</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <CheckCircle className="w-3.5 h-3.5" /> 89% overall confidence
          </span>
        </div>
        <div className="p-5 overflow-y-auto max-h-[540px]">
          <div className="bg-white rounded-lg shadow-md px-7 py-7 text-xs">
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-sm font-bold text-gray-900">Northstar Supplies Ltd</p>
                <p className="text-gray-400 mt-1">VAT IE6388047V</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-blue-700">INVOICE</p>
                <p className="font-mono font-bold text-gray-800 mt-1">INV-2024-0892</p>
              </div>
            </div>
            {/* Meta */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-gray-50 rounded-lg px-3 py-2.5 mb-4">
              {[['Invoice date','12 Jun 2026'],['Due date','26 Jun 2026'],['Bill to','Northstar Finance Ltd'],['Terms','Net 14']].map(([k,v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-semibold text-gray-700">{v}</span>
                </div>
              ))}
            </div>
            {/* Line items */}
            <table className="w-full border-collapse mb-3">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Description','Qty','Unit','Total'].map((h, i) => (
                    <th key={h} className={`pb-2 text-gray-400 uppercase tracking-wider font-semibold ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PREVIEW_ITEMS.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 text-gray-600">{r.desc}</td>
                    <td className="py-2 text-right font-mono font-semibold">{r.qty}</td>
                    <td className="py-2 text-right font-mono">{fmtGBP(r.unit)}</td>
                    <td className="py-2 text-right font-mono font-bold">{fmtGBP(r.qty * r.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Totals */}
            {[['Subtotal', fmtGBP(subtotal), false], ['VAT (20%)', fmtGBP(subtotal * 0.2), false], ['Total', fmtGBP(subtotal * 1.2), true]].map(([k, v, bold], i) => (
              <div key={k as string} className={`flex justify-end gap-10 py-1 ${i === 2 ? 'border-t border-gray-200 mt-1 pt-2' : ''}`}>
                <span className={bold ? 'font-bold text-gray-900' : 'text-gray-400'}>{k}</span>
                <span className={`font-mono w-20 text-right ${bold ? 'font-black text-sm' : 'font-semibold'}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Editable fields */}
      <div className="flex flex-col gap-3.5">
        {/* Warning banner */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm font-semibold text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> 2 fields need review before submitting.
        </div>

        {/* Fields list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {OCR_FIELDS.map((f) => (
            <EditableField key={f.label} {...f} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-3 border-t border-gray-100">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={onNext}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Confirm & continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// STEP 4: Submit
// ════════════════════════════════════════

// Tag input component
function TagInput({ initial }: { initial: string[] }) {
  const [tags, setTags] = useState(initial)
  const [input, setInput] = useState('')

  const addTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      setTags((t) => [...t, input.trim()])
      setInput('')
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2.5 border border-gray-300 rounded-lg bg-gray-50 min-h-[44px] items-center">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
          {t}
          <button onClick={() => setTags((ts) => ts.filter((x) => x !== t))} className="text-blue-400 hover:text-blue-700">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={addTag}
        placeholder={tags.length ? 'Add tag…' : 'Q2 2026, compliance…'}
        className="border-none outline-none bg-transparent text-sm text-gray-800 min-w-[80px] flex-1"
      />
    </div>
  )
}

const SUMMARY = [
  ['Vendor',       'Northstar Supplies Ltd'],
  ['Invoice #',    'INV-2024-0892'],
  ['Invoice date', '12 Jun 2026'],
  ['Due date',     '26 Jun 2026'],
  ['Subtotal',     '£21,930.00'],
  ['Tax',          '£4,386.00'],
  ['Total',        '£26,316.00'],
]
const MONO_KEYS = ['Subtotal', 'Tax', 'Total', 'Invoice #']

function StepSubmit({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-200 bg-gray-50">
          <FileText className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-bold text-gray-800">Extracted invoice summary</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" /> OCR verified
          </span>
        </div>
        {/* Summary grid */}
        <div className="grid grid-cols-4">
          {SUMMARY.map(([k, v], i) => (
            <div
              key={k}
              className={`px-5 py-3.5 ${i % 4 < 3 ? 'border-r border-gray-200' : ''} ${i < 4 ? 'border-b border-gray-200' : ''}`}
            >
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{k}</p>
              <p className={`text-sm font-semibold text-gray-900 ${MONO_KEYS.includes(k) ? 'font-mono' : ''}`}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow + metadata */}
      <div className="grid grid-cols-2 gap-5">
        {/* Left: workflow + tags */}
        <div className="space-y-4">
          {/* Workflow select */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-600">Assign to approval workflow</label>
            <div className="relative flex items-center h-11 border border-gray-300 rounded-lg bg-gray-50 pl-3">
              <select className="flex-1 border-none outline-none bg-transparent text-sm font-semibold text-gray-800 appearance-none pr-8 h-full cursor-pointer">
                <option>Standard approval workflow</option>
                <option>High-value review (&gt;£10,000)</option>
                <option>Compliance & exception review</option>
                <option>Auto-approve (pre-approved vendor)</option>
              </select>
              <ArrowRight className="absolute right-3 w-4 h-4 text-gray-400 pointer-events-none rotate-90" />
            </div>
            <p className="text-xs text-gray-400">Invoice exceeds £10,000 — high-value workflow recommended.</p>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-600">Tags</label>
            <TagInput initial={['Q2 2026', 'Northstar', 'Software']} />
            <p className="text-xs text-gray-400">Press Enter or comma to add a tag.</p>
          </div>
        </div>

        {/* Right: Notes */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-600">
            Notes <span className="font-normal text-gray-400">optional</span>
          </label>
          <textarea
            className="w-full min-h-[120px] border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-gray-50 outline-none resize-y focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            defaultValue="VAT number verified against HMRC register. Line 2 quantity corrected from OCR output (1→3 user licences per contract)."
          />
          {/* Info banner */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-600">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            Approver will be notified by email once submitted.
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1" />
        <button className="inline-flex items-center gap-1.5 h-10 px-4 border border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-600 rounded-lg transition-colors">
          <Save className="w-4 h-4" /> Save as draft
        </button>
        <button className="inline-flex items-center gap-2 h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          <Send className="w-4 h-4" /> Save & submit invoice
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// Main Page
// ════════════════════════════════════════
export default function UploadPage() {
  // தற்போதைய wizard step
  const [step, setStep] = useState(1)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3.5 pt-2 pb-0">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Invoices
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-xl font-bold text-gray-900">Upload Invoice</h1>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Step content */}
      {step === 1 && <StepUpload     onNext={() => setStep(2)} />}
      {step === 2 && <StepProcessing onNext={() => setStep(3)} />}
      {step === 3 && <StepReview     onNext={() => setStep(4)} onBack={() => setStep(1)} />}
      {step === 4 && <StepSubmit     onBack={() => setStep(3)} />}
    </div>
  )
}