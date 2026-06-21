'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Check, X, Clock, AlertTriangle, Eye,
  CheckCircle, XCircle, ExternalLink
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import api from '../../../lib/axios'

// ── API types ──
interface ApprovalInstance {
  instanceId: string
  invoiceId: string
  invoiceNumber?: string
  vendorName?: string
  totalAmount?: number
  currency?: string
  submittedByName?: string
  submittedAt?: string
  currentStep?: number
  totalSteps?: number
  workflowName?: string
  stepLabels?: string[]
  daysPending?: number
}

interface CompletedApproval {
  instanceId: string
  invoiceId: string
  invoiceNumber?: string
  vendorName?: string
  totalAmount?: number
  currency?: string
  decision: 'approved' | 'rejected'
  decidedByName?: string
  decidedAt?: string
  workflowName?: string
  reason?: string
}

// ── Dummy fallbacks (API empty ஆனா காட்டு) ──
const DUMMY_QUEUE = [
  { instanceId:'d1', invoiceId:'inv1', invoiceNumber:'INV-2026-1041', vendorName:'Acme Cloud Services',   totalAmount:4280,  currency:'GBP', submittedByName:'Maya Chen',   submittedAt:'2026-06-15', currentStep:2, totalSteps:3, workflowName:'Standard approval',  stepLabels:['Upload','Finance review','Director sign-off'], daysPending:2 },
  { instanceId:'d2', invoiceId:'inv2', invoiceNumber:'INV-2026-1036', vendorName:'FinOps Advisory Group', totalAmount:21780, currency:'GBP', submittedByName:'Avery Stone', submittedAt:'2026-06-12', currentStep:1, totalSteps:3, workflowName:'High-value review',  stepLabels:['Finance review','CFO approval','Board sign-off'], daysPending:5 },
  { instanceId:'d3', invoiceId:'inv3', invoiceNumber:'INV-2026-1031', vendorName:'Orbit Analytics Ltd',   totalAmount:8650,  currency:'GBP', submittedByName:'Sam Patel',   submittedAt:'2026-06-16', currentStep:2, totalSteps:2, workflowName:'Compliance review', stepLabels:['Compliance check','Final approval'], daysPending:1 },
]

const DUMMY_COMPLETED = [
  { instanceId:'c1', invoiceId:'inv4', invoiceNumber:'INV-2026-1030', vendorName:'Data Processing Inc.',   totalAmount:1950, currency:'GBP', decision:'approved' as const, decidedByName:'Maya Chen', decidedAt:'2026-06-15', workflowName:'Standard approval' },
  { instanceId:'c2', invoiceId:'inv5', invoiceNumber:'INV-2026-1025', vendorName:'Northstar Supplies Ltd', totalAmount:3240, currency:'GBP', decision:'rejected' as const, decidedByName:'Sam Patel',  decidedAt:'2026-06-14', workflowName:'Standard approval', reason:'Duplicate invoice' },
]

// ── Helpers ──
function fmtAmount(n?: number, currency?: string) {
  if (!n) return '—'
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency ?? 'GBP' }).format(n) }
  catch { return `£${n.toLocaleString()}` }
}

function daysSince(dateStr?: string) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── UI Components (unchanged) ──

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-blue-500', 'bg-teal-500', 'bg-purple-500', 'bg-indigo-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

function DaysBadge({ days }: { days: number }) {
  const over = days > 3
  const warn = days >= 2
  return (
    <span className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-bold border whitespace-nowrap ${
      over ? 'bg-red-50 border-red-200 text-red-600' :
      warn ? 'bg-amber-50 border-amber-200 text-amber-600' :
             'bg-gray-100 border-gray-200 text-gray-400'
    }`}>
      {over && <AlertTriangle className="w-3 h-3" />}
      {days} day{days !== 1 ? 's' : ''} pending
    </span>
  )
}

function StepIndicator({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  return (
    <div>
      <div className="flex items-center">
        {Array.from({ length: total }, (_, i) => {
          const done   = i < step - 1
          const active = i === step - 1
          return (
            <React.Fragment key={i}>
              <div className={`relative w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 text-xs font-bold transition-all ${
                done   ? 'bg-blue-600 border-blue-600 text-white' :
                active ? 'bg-blue-600 border-blue-400 text-white ring-2 ring-blue-100' :
                         'bg-gray-100 border-gray-300 text-gray-400'
              }`}>
                {done ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
              </div>
              {i < total - 1 && (
                <div className={`flex-1 h-0.5 min-w-4 transition-all ${i < step - 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
      <div className="flex mt-1.5">
        {labels.map((l, i) => (
          <div key={l} className={`text-xs truncate pr-1 ${i < step ? 'text-blue-600 font-semibold' : 'text-gray-400'} ${i === step - 1 ? 'font-bold' : ''}`}
            style={{ flex: i < labels.length - 1 ? '1 0 0' : '0 0 auto' }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}

function ApprovalCard({ item, removing, onApprove, onReject }: {
  item: ApprovalInstance; removing: boolean
  onApprove: (item: ApprovalInstance) => void
  onReject:  (item: ApprovalInstance) => void
}) {
  const days = item.daysPending ?? daysSince(item.submittedAt)
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-px transition-all ${removing ? 'opacity-0 scale-95 duration-200' : ''}`}>
      <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400 flex-shrink-0" />
      <div className="flex justify-between items-start gap-3 px-5 pt-4 pb-3.5">
        <div>
          <p className="text-xs font-mono font-bold text-gray-900">{item.invoiceNumber ?? item.invoiceId}</p>
          <p className="text-sm font-semibold text-gray-600 mt-0.5">{item.vendorName ?? '—'}</p>
        </div>
        <DaysBadge days={days} />
      </div>
      <div className="px-5 pb-4">
        <p className="text-3xl font-black text-gray-900 tracking-tight tabular-nums leading-none">
          {fmtAmount(item.totalAmount, item.currency)}
        </p>
        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
          <span className="inline-block w-3 h-3 border border-gray-300 rounded-sm" />
          {item.workflowName ?? 'Standard approval'}
        </p>
      </div>
      <div className="px-5 py-4 border-t border-b border-gray-100">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approval progress</span>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            Step {item.currentStep ?? 1} of {item.totalSteps ?? 1}
          </span>
        </div>
        <StepIndicator
          step={item.currentStep ?? 1}
          total={item.totalSteps ?? 1}
          labels={item.stepLabels ?? ['Review']}
        />
      </div>
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
        <Avatar name={item.submittedByName ?? 'User'} />
        <div>
          <p className="text-sm font-semibold text-gray-800">{item.submittedByName ?? '—'}</p>
          <p className="text-xs text-gray-400">Submitted {fmtDate(item.submittedAt)}</p>
        </div>
      </div>
      <div className="flex gap-2 px-5 py-3.5">
        <button onClick={() => onApprove(item)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors">
          <Check className="w-4 h-4" /> Approve
        </button>
        <button onClick={() => onReject(item)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 bg-red-50 hover:bg-red-100 border border-red-300 text-red-600 text-sm font-semibold rounded-lg transition-colors">
          <X className="w-4 h-4" /> Reject
        </button>
        <Link href={`/invoices/${item.invoiceId}`}
          className="inline-flex items-center gap-1 h-9 px-3 border border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-600 rounded-lg transition-colors whitespace-nowrap">
          <ExternalLink className="w-3.5 h-3.5" /> View
        </Link>
      </div>
    </div>
  )
}

function CompletedCard({ item }: { item: CompletedApproval }) {
  const approved = item.decision === 'approved'
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden opacity-90">
      <div className={`h-1 flex-shrink-0 ${approved ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <div className="flex items-center gap-3.5 px-5 py-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${approved ? 'bg-emerald-50' : 'bg-red-50'}`}>
          {approved ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-bold text-gray-900">{item.invoiceNumber ?? item.invoiceId}</span>
            <span className="text-sm text-gray-500">{item.vendorName ?? '—'}</span>
            <span className="ml-auto text-sm font-bold text-gray-900 tabular-nums">{fmtAmount(item.totalAmount, item.currency)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${approved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {approved ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              {approved ? 'Approved' : 'Rejected'}
            </span>
            <span className="text-xs text-gray-400">by {item.decidedByName ?? '—'} · {fmtDate(item.decidedAt)}</span>
            {item.reason && <span className="text-xs text-red-500 italic">"{item.reason}"</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function ApproveModal({ item, onClose, onConfirm, loading }: {
  item: ApprovalInstance; onClose: () => void; loading: boolean
  onConfirm: (notes: string) => void
}) {
  const [notes, setNotes] = useState('')
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Approve invoice</p>
              <p className="text-xs text-gray-400">This will advance to the next approval step</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 pt-5 grid grid-cols-3 gap-3">
          {[['Invoice', item.invoiceNumber ?? item.invoiceId, true], ['Vendor', item.vendorName ?? '—', false], ['Amount', fmtAmount(item.totalAmount, item.currency), true]].map(([k, v, mono]) => (
            <div key={k as string} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-1">{k}</p>
              <p className={`text-sm font-bold text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{v}</p>
            </div>
          ))}
        </div>
        <div className="px-6 py-5">
          <label className="text-sm font-semibold text-gray-600">Notes <span className="font-normal text-gray-400">optional</span></label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add a comment for the audit trail…" rows={3}
            className="mt-1.5 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50 outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={() => onConfirm(notes)} disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
            {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Check className="w-4 h-4" />}
            Confirm approval
          </button>
        </div>
      </div>
    </div>
  )
}

function RejectModal({ item, onClose, onConfirm, loading }: {
  item: ApprovalInstance; onClose: () => void; loading: boolean
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const hasReason = reason.trim().length > 0
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Reject invoice</p>
              <p className="text-xs text-gray-400">This will be returned to the submitter</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 pt-5 grid grid-cols-3 gap-3">
          {[['Invoice', item.invoiceNumber ?? item.invoiceId, true], ['Vendor', item.vendorName ?? '—', false], ['Amount', fmtAmount(item.totalAmount, item.currency), true]].map(([k, v, mono]) => (
            <div key={k as string} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-1">{k}</p>
              <p className={`text-sm font-bold text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{v}</p>
            </div>
          ))}
        </div>
        <div className="px-6 py-5">
          <label className="text-sm font-semibold text-gray-600">Rejection reason <span className="text-red-500">*</span></label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this invoice is being rejected…" rows={4}
            className={`mt-1.5 w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50 outline-none resize-none transition-all ${hasReason ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100' : 'border-red-300 ring-2 ring-red-50'}`} />
          {!hasReason && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> A reason is required to reject an invoice.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
          <button disabled={!hasReason || loading} onClick={() => onConfirm(reason)}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors">
            {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <X className="w-4 h-4" />}
            Confirm rejection
          </button>
        </div>
      </div>
    </div>
  )
}

function Toast({ msg, tone, onDone }: { msg: string; tone: 'success' | 'danger'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3400); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 bg-gray-900 rounded-xl shadow-2xl text-white text-sm font-semibold z-[200] whitespace-nowrap">
      {tone === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
      {msg}
    </div>
  )
}

// ════════════════════════════════════════
// Main Page
// ════════════════════════════════════════
type TabType = 'My queue' | 'All pending' | 'Completed'

export default function ApprovalsPage() {
  const { companyId } = useAuth()
  const queryClient = useQueryClient()

  const [tab, setTab]                     = useState<TabType>('My queue')
  const [approveTarget, setApproveTarget] = useState<ApprovalInstance | null>(null)
  const [rejectTarget,  setRejectTarget]  = useState<ApprovalInstance | null>(null)
  const [removingId,    setRemovingId]    = useState<string | null>(null)
  const [toast, setToast]                 = useState<{ msg: string; tone: 'success' | 'danger' } | null>(null)

  // GET /api/approvals/pending — pending queue
  const { data: pendingData, isLoading } = useQuery({
    queryKey: ['approvals-pending'],
    queryFn: () => api.get('/api/approvals/pending').then(r => r.data),
    enabled: !!companyId,
  })

  const queue: ApprovalInstance[] = pendingData?.length > 0 ? pendingData : DUMMY_QUEUE

  // POST /api/approvals/{instanceId}/act — approve or reject
  const actMutation = useMutation({
    mutationFn: ({ instanceId, action, notes }: { instanceId: string; action: 'approve' | 'reject'; notes?: string }) =>
      api.post(`/api/approvals/${instanceId}/act`, { action, notes }),
    onSuccess: (_, { instanceId, action }) => {
      // Animate card out then refresh
      setRemovingId(instanceId)
      setTimeout(() => {
        setRemovingId(null)
        queryClient.invalidateQueries({ queryKey: ['approvals-pending'] })
      }, 220)
      const item = queue.find(x => x.instanceId === instanceId)
      const invNum = item?.invoiceNumber ?? instanceId
      setToast({
        msg:  `${invNum} ${action === 'approve' ? 'approved' : 'rejected'}.`,
        tone: action === 'approve' ? 'success' : 'danger',
      })
    },
  })

  const handleApprove = (notes: string) => {
    if (!approveTarget) return
    actMutation.mutate({ instanceId: approveTarget.instanceId, action: 'approve', notes })
    setApproveTarget(null)
  }

  const handleReject = (reason: string) => {
    if (!rejectTarget) return
    actMutation.mutate({ instanceId: rejectTarget.instanceId, action: 'reject', notes: reason })
    setRejectTarget(null)
  }

  const slaBreaches = queue.filter(x => (x.daysPending ?? daysSince(x.submittedAt)) > 3).length
  const avgWait     = queue.length ? (queue.reduce((s, x) => s + (x.daysPending ?? daysSince(x.submittedAt)), 0) / queue.length).toFixed(1) : '0'
  const totalAmount = queue.reduce((s, x) => s + (x.totalAmount ?? 0), 0).toLocaleString('en-GB')

  const TABS: TabType[] = ['My queue', 'All pending', 'Completed']

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Review and action invoices awaiting your approval</p>
        </div>
        <div className="flex gap-1 bg-gray-100 border border-gray-200 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
              {t === 'My queue' && queue.length > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab !== 'Completed' && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700">
            <Clock className="w-3.5 h-3.5" /> {queue.length} in queue
          </span>
          {slaBreaches > 0 && (
            <span className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-700">
              <AlertTriangle className="w-3.5 h-3.5" /> {slaBreaches} over SLA (&gt;3 days)
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold bg-gray-100 border border-gray-200 text-gray-500">
            <Clock className="w-3.5 h-3.5" /> Avg. wait: {avgWait} days
          </span>
          <span className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold bg-gray-100 border border-gray-200 text-gray-500">
            Total pending: £{totalAmount}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : tab === 'Completed' ? (
        <div className="space-y-3 max-w-3xl">
          <p className="text-sm text-gray-400">Showing recently completed approvals</p>
          {DUMMY_COMPLETED.map(c => <CompletedCard key={c.instanceId} item={c} />)}
        </div>
      ) : queue.length === 0 ? (
        <div className="max-w-sm border-2 border-dashed border-gray-200 rounded-2xl bg-white py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-gray-800 mb-1">All caught up</p>
          <p className="text-sm text-gray-400">No invoices pending your approval right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {queue.map(item => (
            <ApprovalCard
              key={item.instanceId}
              item={item}
              removing={removingId === item.instanceId}
              onApprove={setApproveTarget}
              onReject={setRejectTarget}
            />
          ))}
        </div>
      )}

      {approveTarget && (
        <ApproveModal item={approveTarget} onClose={() => setApproveTarget(null)} onConfirm={handleApprove} loading={actMutation.isPending} />
      )}
      {rejectTarget && (
        <RejectModal item={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleReject} loading={actMutation.isPending} />
      )}

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  )
}