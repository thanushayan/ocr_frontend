'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, ArrowRight, CloudUpload, FileText,
  CheckCircle, AlertTriangle, Info, Send, Save,
  Layers, X, Check
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { invoiceService } from '../../../services/invoice.service'
import { DuplicateCheckResult } from '../../../types/invoice.types'

const OCR_STEPS = [
  { msg: 'Uploading file…',                    pct: 15 },
  { msg: 'Processing with GCP Vision API…',    pct: 38 },
  { msg: 'Extracting structured fields…',      pct: 64 },
  { msg: 'Validating against vendor records…', pct: 86 },
  { msg: 'Finalising results…',                pct: 98 },
]

const STEPS = ['Upload', 'OCR Processing', 'Review', 'Submit']

interface OcrField { label: string; value: string; confidence: number; mono?: boolean }
interface SummaryData {
  vendor: string; invoiceNumber: string; invoiceDate: string
  dueDate: string; subtotal: string; tax: string; total: string
}

const BACKEND_URL = 'https://localhost:7007'

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
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all ${
                done   ? 'bg-emerald-500 border-emerald-500 text-white' :
                active ? 'bg-blue-600 border-blue-600 text-white' :
                         'bg-white border-gray-300 text-gray-400'
              }`}>
                {done ? <Check className="w-4 h-4" strokeWidth={3} /> : n}
              </div>
              <span className={`text-xs font-semibold whitespace-nowrap ${
                active ? 'text-blue-700 font-bold' :
                done   ? 'text-gray-600' : 'text-gray-400'
              }`}>{label}</span>
            </div>
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
function StepUpload({ clientId, onNext }: { clientId?: string | null; onNext: (file: File) => void }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile]         = useState<File | null>(null)
  const [dup, setDup]           = useState<DuplicateCheckResult | null>(null)
  const [checking, setChecking] = useState(false)
  const inputRef                = useRef<HTMLInputElement>(null)

  // Best-effort duplicate check on file select — never blocks the upload.
  const pickFile = async (f: File) => {
    setFile(f)
    setDup(null)
    if (!clientId) return
    setChecking(true)
    try {
      const result = await invoiceService.checkDuplicate(clientId, { fileName: f.name })
      setDup(result.isDuplicate ? result : null)
    } catch {
      // ignore — a failed duplicate check must not stop the user uploading
    } finally {
      setChecking(false)
    }
  }

  const handleDragOver   = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave  = () => setDragging(false)
  const handleDrop       = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) pickFile(f)
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) pickFile(f)
  }

  const fileSize = file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : ''

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all ${
            dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.tiff" className="hidden" onChange={handleFileChange} />
          <div className={`rounded-full flex items-center justify-center mx-auto mb-5 ${dragging ? 'bg-blue-100' : 'bg-gray-100'}`} style={{ width: 72, height: 72 }}>
            <CloudUpload className={`w-9 h-9 ${dragging ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-2">
            Drop your invoice here <span className="text-blue-600">or click to browse</span>
          </p>
          <p className="text-sm text-gray-500 mb-5">Supports PDF, JPG, PNG, TIFF — maximum 10 MB</p>
          <div className="flex gap-2 justify-center">
            {['PDF', 'JPG', 'PNG', 'TIFF'].map((f) => (
              <span key={f} className="px-3 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-bold text-gray-600 tracking-wide">{f}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-2xl bg-white p-7 flex items-center gap-5">
          <div className="w-16 h-20 rounded-lg bg-blue-50 border-2 border-blue-200 flex flex-col items-center justify-center flex-shrink-0 relative">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="absolute bottom-1.5 text-[9px] font-black text-blue-700 tracking-widest">FILE</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 mb-1">{file.name}</p>
            <p className="text-xs text-gray-400 mb-3">{fileSize}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600">
              <CheckCircle className="w-4 h-4" /> Ready to process
            </span>
          </div>
          <button onClick={() => { setFile(null); setDup(null) }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <X className="w-4 h-4" /> Remove
          </button>
        </div>
      )}

      {checking && (
        <div className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg bg-white text-sm text-gray-500">
          <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
          Checking for duplicates…
        </div>
      )}

      {dup && (
        <div className="flex items-start gap-2.5 px-4 py-3 border border-amber-200 rounded-lg bg-amber-50 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Possible duplicate.</span>{' '}
            {dup.reason ?? 'A similar invoice already exists.'}
            {dup.existingInvoiceNumber && (
              <> (existing: <span className="font-mono">{dup.existingInvoiceNumber}</span>)</>
            )}
            <div className="text-xs text-amber-600 mt-0.5">You can still upload &amp; process it below.</div>
          </div>
        </div>
      )}

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

      <div className="flex justify-end pt-2">
        <button
          disabled={!file}
          onClick={() => file && onNext(file)}
          className="inline-flex items-center gap-2 h-11 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          Upload & Process OCR <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// STEP 2: OCR Processing
// ════════════════════════════════════════
function StepProcessing({ file, clientId, onNext }: {
  file: File
  clientId: string
  onNext: (invoiceId: string, fileUrl: string) => void
}) {
  const [stepIdx, setStepIdx] = useState(0)
  const [pct, setPct]         = useState(0)
  const [error, setError]     = useState('')

  useEffect(() => {
    let cancelled = false

    const animateTo = (from: number, to: number, cb: () => void) => {
      let cur = from
      const tick = setInterval(() => {
        cur = Math.min(cur + 2, to)
        setPct(cur)
        if (cur >= to) { clearInterval(tick); cb() }
      }, 30)
    }

    const run = async () => {
      try {
        animateTo(0, 15, () => {})
        const uploadResult = await invoiceService.upload(clientId, file)
        const invoiceId = uploadResult.invoice?.id
        const fileUrl   = uploadResult.invoice?.fileUrl ?? uploadResult.file?.fileUrl ?? ''
        if (!invoiceId) throw new Error('Upload failed — no invoice ID returned')

        setPct(38)
        setStepIdx(1)

        await invoiceService.triggerOcr(invoiceId)
        setStepIdx(2)

        animateTo(38, 98, () => {
          if (!cancelled) { setStepIdx(4); setTimeout(() => onNext(invoiceId, fileUrl), 800) }
        })
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } }
        setError(e?.response?.data?.message ?? 'Upload failed. Please try again.')
      }
    }

    run()
    return () => { cancelled = true }
  }, []) // eslint-disable-line

  const r = 52
  const circumference = 2 * Math.PI * r

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Upload failed</h2>
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <div className="relative w-32 h-32 mx-auto mb-8">
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle cx="60" cy="60" r={r} fill="none" stroke="#2563eb" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 0.15s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold font-mono text-blue-700 tabular-nums">{pct}%</span>
        </div>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Processing your invoice</h2>
      <p className="text-sm text-gray-500 mb-8 min-h-[20px]">{OCR_STEPS[Math.min(stepIdx, OCR_STEPS.length - 1)]?.msg}</p>
      <div className="flex flex-col gap-3 text-left max-w-md mx-auto">
        {OCR_STEPS.map((s, i) => {
          const done = i < stepIdx; const active = i === stepIdx
          return (
            <div key={i} className={`flex items-center gap-3.5 px-4 py-3 rounded-lg border transition-all ${
              active ? 'border-blue-200 bg-blue-50' : done ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                done ? 'bg-emerald-500' : active ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                {done   && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                {active && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/50 border-t-white animate-spin" />}
                {!done && !active && <span className="text-xs text-gray-400">·</span>}
              </div>
              <span className={`text-sm flex-1 ${active ? 'font-semibold text-blue-700' : done ? 'text-emerald-700' : 'text-gray-400'}`}>{s.msg}</span>
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
function ConfBadge({ c }: { c: number }) {
  const s = c > 90
    ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' }
    : c >= 70
    ? { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500'   }
    : { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500'     }
  const label = c > 90 ? 'High' : c >= 70 ? 'Medium' : 'Low'
  return (
    <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-full border text-xs font-bold ${s.bg} ${s.border} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {label} · {c}%
    </span>
  )
}

function EditableField({ label, value: initVal, confidence, mono = false }: {
  label: string; value: string; confidence: number; mono?: boolean
}) {
  const [val, setVal]         = useState(initVal)
  const [focused, setFocused] = useState(false)
  const low = confidence < 70
  return (
    <div className="group flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className={`text-sm font-semibold ${low ? 'text-red-600' : 'text-gray-600'}`}>
          {label}{low && <AlertTriangle className="inline w-3.5 h-3.5 ml-1 -mt-0.5" />}
        </label>
        <ConfBadge c={confidence} />
      </div>
      <input
        value={val} onChange={(e) => setVal(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className={`w-full h-10 px-3 border rounded-lg text-sm outline-none transition-all ${mono ? 'font-mono text-xs' : ''} ${
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

const fmtCurrency = (n?: number, currency = 'GBP') => {
  if (!n) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(n)
}
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const DUMMY_FIELDS: OcrField[] = [
  { label: 'Vendor name',    value: '—',   confidence: 90, mono: false },
  { label: 'Invoice number', value: '—',   confidence: 90, mono: true  },
  { label: 'Invoice date',   value: '—',   confidence: 90, mono: false },
  { label: 'Due date',       value: '—',   confidence: 90, mono: false },
  { label: 'Currency',       value: 'GBP', confidence: 90, mono: false },
  { label: 'Subtotal',       value: '—',   confidence: 90, mono: true  },
  { label: 'Tax',            value: '—',   confidence: 90, mono: true  },
  { label: 'Total amount',   value: '—',   confidence: 90, mono: true  },
]

function StepReview({ invoiceId, fileUrl, clientId, onNext, onBack }: {
  invoiceId: string
  fileUrl: string
  clientId: string
  onNext: (summary: SummaryData) => void
  onBack: () => void
}) {
  const [ocrFields, setOcrFields]     = useState<OcrField[]>(DUMMY_FIELDS)
  const [overallConf, setOverallConf] = useState(89)
  const [isLoading, setIsLoading]     = useState(true)
  const [imgError, setImgError]       = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try confidence endpoint first
        const conf = await invoiceService.getOcrConfidence(invoiceId)

        if (conf?.fields?.length) {
          // Use confidence fields if available
          setOcrFields(conf.fields.map((f: any) => ({
            label:      f.fieldName ?? f.label ?? 'Field',
            value:      String(f.value ?? f.extractedValue ?? '—'),
            confidence: Math.round((f.confidenceScore ?? f.confidence ?? 0.9) * 100),
            mono:       ['invoiceNumber', 'totalAmount', 'subTotal', 'taxAmount'].includes(f.fieldName),
          })))
          if (conf?.overallConfidence) setOverallConf(Math.round(conf.overallConfidence * 100))
        } else {
          // Fallback: get invoice data directly
          const inv = await invoiceService.getById(clientId, invoiceId)
          setOcrFields([
            { label: 'Vendor name',    value: (inv as any)?.extractedVendorName ?? (inv as any)?.vendorName ?? '—', confidence: 90, mono: false },
            { label: 'Invoice number', value: (inv as any)?.invoiceNumber ?? '—',  confidence: 90, mono: true  },
            { label: 'Invoice date',   value: fmtDate((inv as any)?.invoiceDate),  confidence: 90, mono: false },
            { label: 'Due date',       value: fmtDate((inv as any)?.dueDate),      confidence: 90, mono: false },
            { label: 'Currency',       value: (inv as any)?.currency ?? 'GBP',     confidence: 90, mono: false },
            { label: 'Subtotal',       value: fmtCurrency((inv as any)?.subTotal,    (inv as any)?.currency), confidence: 90, mono: true },
            { label: 'Tax',            value: fmtCurrency((inv as any)?.taxAmount,   (inv as any)?.currency), confidence: 90, mono: true },
            { label: 'Total amount',   value: fmtCurrency((inv as any)?.totalAmount, (inv as any)?.currency), confidence: 90, mono: true },
          ])
        }
      } catch {
        // keep dummy fields
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [invoiceId, clientId])

  const getField = (keyword: string) =>
    ocrFields.find(f => f.label.toLowerCase().includes(keyword.toLowerCase()))?.value ?? '—'

  const lowCount  = ocrFields.filter(f => f.confidence < 70).length
  const imageUrl  = fileUrl ? `${BACKEND_URL}${fileUrl}` : ''

  const handleNext = () => onNext({
    vendor:        getField('vendor'),
    invoiceNumber: getField('invoice number'),
    invoiceDate:   getField('invoice date'),
    dueDate:       getField('due date'),
    subtotal:      getField('subtotal'),
    tax:           getField('tax'),
    total:         getField('total'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Left: Actual uploaded invoice image */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-200">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Document preview</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <CheckCircle className="w-3.5 h-3.5" /> {overallConf}% overall confidence
          </span>
        </div>
        <div className="p-4 overflow-y-auto max-h-[540px]">
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt="Uploaded invoice"
              className="w-full rounded-lg shadow-md object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <FileText className="w-10 h-10 text-gray-300" />
              <span className="text-sm">Preview not available</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Editable OCR fields */}
      <div className="flex flex-col gap-3.5">
        {lowCount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm font-semibold text-amber-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {lowCount} field{lowCount > 1 ? 's' : ''} need review before submitting.
          </div>
        )}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {ocrFields.map((f) => (
            <EditableField key={f.label} {...f} />
          ))}
        </div>
        <div className="flex gap-2.5 pt-3 border-t border-gray-100">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handleNext}
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
function TagInput({ initial }: { initial: string[] }) {
  const [tags, setTags]   = useState(initial)
  const [input, setInput] = useState('')
  const addTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault(); setTags(t => [...t, input.trim()]); setInput('')
    }
  }
  return (
    <div className="flex flex-wrap gap-1.5 p-2.5 border border-gray-300 rounded-lg bg-gray-50 min-h-[44px] items-center">
      {tags.map((t, i) => (
        <span key={`${t}-${i}`} className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
          {t}
          <button onClick={() => setTags(ts => ts.filter((_, idx) => idx !== i))} className="text-blue-400 hover:text-blue-700">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={input} onChange={e => setInput(e.target.value)} onKeyDown={addTag}
        placeholder={tags.length ? 'Add tag…' : 'Q2 2026, compliance…'}
        className="border-none outline-none bg-transparent text-sm text-gray-800 min-w-[80px] flex-1"
      />
    </div>
  )
}

const MONO_KEYS = ['Subtotal', 'Tax', 'Total', 'Invoice #']

function StepSubmit({ invoiceId, summary, onBack }: {
  invoiceId: string; summary: SummaryData; onBack: () => void
}) {
  const router            = useRouter()
  const [loading, setLoading] = useState(false)

  const SUMMARY = [
    ['Vendor',       summary.vendor],
    ['Invoice #',    summary.invoiceNumber],
    ['Invoice date', summary.invoiceDate],
    ['Due date',     summary.dueDate],
    ['Subtotal',     summary.subtotal],
    ['Tax',          summary.tax],
    ['Total',        summary.total],
  ]

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await invoiceService.approveOcr(invoiceId)
      toast.success('Invoice submitted successfully!')
      router.push('/invoices')
    } catch {
      toast.error('Submit failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-200 bg-gray-50">
          <FileText className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-bold text-gray-800">Extracted invoice summary</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" /> OCR verified
          </span>
        </div>
        <div className="grid grid-cols-4">
          {SUMMARY.map(([k, v], i) => (
            <div key={`${k}-${i}`} className={`px-5 py-3.5 ${i % 4 < 3 ? 'border-r border-gray-200' : ''} ${i < 4 ? 'border-b border-gray-200' : ''}`}>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{k}</p>
              <p className={`text-sm font-semibold text-gray-900 ${MONO_KEYS.includes(k) ? 'font-mono' : ''}`}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-4">
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
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-600">Tags</label>
            <TagInput initial={['Q2 2026']} />
            <p className="text-xs text-gray-400">Press Enter or comma to add a tag.</p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-600">
            Notes <span className="font-normal text-gray-400">optional</span>
          </label>
          <textarea
            className="w-full min-h-[120px] border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-gray-50 outline-none resize-y focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Add any notes for the approver…"
          />
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-600">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            Approver will be notified by email once submitted.
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1" />
        <button className="inline-flex items-center gap-1.5 h-10 px-4 border border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-600 rounded-lg transition-colors">
          <Save className="w-4 h-4" /> Save as draft
        </button>
        <button
          onClick={handleSubmit} disabled={loading}
          className="inline-flex items-center gap-2 h-11 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
            : <><Send className="w-4 h-4" /> Save & submit invoice</>
          }
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// Main Page
// ════════════════════════════════════════
export default function UploadPage() {
  const { activeClient } = useAuth()
  const clientId = activeClient?.id
  const [step, setStep]           = useState(1)
  const [file, setFile]           = useState<File | null>(null)
  const [invoiceId, setInvoiceId] = useState<string>('')
  const [fileUrl, setFileUrl]     = useState<string>('')
  const [summary, setSummary]     = useState<SummaryData>({
    vendor: '—', invoiceNumber: '—', invoiceDate: '—',
    dueDate: '—', subtotal: '—', tax: '—', total: '—',
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3.5 pt-2 pb-0">
        <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Invoices
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-xl font-bold text-gray-900">Upload Invoice</h1>
      </div>

      <StepIndicator current={step} />

      {step === 1 && (
        <StepUpload clientId={clientId} onNext={(f) => { setFile(f); setStep(2) }} />
      )}
      {step === 2 && file && clientId && (
        <StepProcessing
          file={file} clientId={clientId}
          onNext={(id, url) => { setInvoiceId(id); setFileUrl(url); setStep(3) }}
        />
      )}
      {step === 3 && invoiceId && (
        <StepReview
          invoiceId={invoiceId}
          fileUrl={fileUrl}
          clientId={clientId!}
          onNext={(s) => { setSummary(s); setStep(4) }}
          onBack={() => setStep(1)}
        />
      )}
      {step === 4 && invoiceId && (
        <StepSubmit invoiceId={invoiceId} summary={summary} onBack={() => setStep(3)} />
      )}
    </div>
  )
}