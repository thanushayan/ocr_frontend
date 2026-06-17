'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Check, X, Clock, AlertTriangle, Eye,
  CheckCircle, XCircle, Workflow, ExternalLink
} from 'lucide-react'

// ── Types ──
interface QueueItem {
  id: number
  invNum: string
  vendor: string
  amount: string
  rawAmount: number
  submittedBy: string
  submittedDate: string
  daysPending: number
  step: number
  totalSteps: number
  workflow: string
  stepLabels: string[]
}

interface CompletedItem {
  id: number
  invNum: string
  vendor: string
  amount: string
  decision: 'approved' | 'rejected'
  decidedBy: string
  decidedDate: string
  workflow: string
  reason?: string
}

// ── டம்மி தரவு ──
const INIT_QUEUE: QueueItem[] = [
  { id:1, invNum:'INV-2026-1041', vendor:'Acme Cloud Services',   amount:'£4,280.00',  rawAmount:4280,
    submittedBy:'Maya Chen',   submittedDate:'15 Jun 2026', daysPending:2, step:2, totalSteps:3,
    workflow:'Standard approval',  stepLabels:['Upload','Finance review','Director sign-off'] },
  { id:2, invNum:'INV-2026-1036', vendor:'FinOps Advisory Group', amount:'£21,780.00', rawAmount:21780,
    submittedBy:'Avery Stone', submittedDate:'12 Jun 2026', daysPending:5, step:1, totalSteps:3,
    workflow:'High-value review',  stepLabels:['Finance review','CFO approval','Board sign-off'] },
  { id:3, invNum:'INV-2026-1031', vendor:'Orbit Analytics Ltd',   amount:'£8,650.00',  rawAmount:8650,
    submittedBy:'Sam Patel',   submittedDate:'16 Jun 2026', daysPending:1, step:2, totalSteps:2,
    workflow:'Compliance review',  stepLabels:['Compliance check','Final approval'] },
  { id:4, invNum:'INV-2026-1028', vendor:'Blue River Logistics',  amount:'£14,920.00', rawAmount:14920,
    submittedBy:'Maya Chen',   submittedDate:'13 Jun 2026', daysPending:4, step:3, totalSteps:3,
    workflow:'Standard approval',  stepLabels:['Upload','Finance review','Director sign-off'] },
]

const COMPLETED: CompletedItem[] = [
  { id:101, invNum:'INV-2026-1030', vendor:'Data Processing Inc.',   amount:'£1,950.00', decision:'approved', decidedBy:'Maya Chen', decidedDate:'15 Jun 2026', workflow:'Standard approval' },
  { id:102, invNum:'INV-2026-1025', vendor:'Northstar Supplies Ltd', amount:'£3,240.00', decision:'rejected', decidedBy:'Sam Patel',  decidedDate:'14 Jun 2026', workflow:'Standard approval', reason:'Duplicate invoice — matches INV-2026-1022' },
  { id:103, invNum:'INV-2026-1022', vendor:'Orbit Analytics Ltd',    amount:'£8,200.00', decision:'approved', decidedBy:'Maya Chen', decidedDate:'13 Jun 2026', workflow:'High-value review' },
]

// ── Initials Avatar ──
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

// ── Days pending badge ──
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

// ── Step indicator with labels ──
function StepIndicator({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  return (
    <div>
      {/* Circles + connectors */}
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
      {/* Labels */}
      <div className="flex mt-1.5">
        {labels.map((l, i) => (
          <div
            key={l}
            className={`text-xs truncate pr-1 ${
              i < step ? 'text-blue-600 font-semibold' : 'text-gray-400'
            } ${i === step - 1 ? 'font-bold' : ''}`}
            style={{ flex: i < labels.length - 1 ? '1 0 0' : '0 0 auto' }}
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Approval Card ──
function ApprovalCard({
  item, removing, onApprove, onReject
}: {
  item: QueueItem
  removing: boolean
  onApprove: (item: QueueItem) => void
  onReject: (item: QueueItem) => void
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-px transition-all ${
      removing ? 'opacity-0 scale-95 transition-all duration-200' : ''
    }`}>
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400 flex-shrink-0" />

      {/* Invoice + vendor + days */}
      <div className="flex justify-between items-start gap-3 px-5 pt-4 pb-3.5">
        <div>
          <p className="text-xs font-mono font-bold text-gray-900">{item.invNum}</p>
          <p className="text-sm font-semibold text-gray-600 mt-0.5">{item.vendor}</p>
        </div>
        <DaysBadge days={item.daysPending} />
      </div>

      {/* Amount + workflow */}
      <div className="px-5 pb-4">
        <p className="text-3xl font-black text-gray-900 tracking-tight tabular-nums leading-none">
          {item.amount}
        </p>
        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
          <span className="inline-block w-3 h-3 border border-gray-300 rounded-sm" />
          {item.workflow}
        </p>
      </div>

      {/* Step indicator */}
      <div className="px-5 py-4 border-t border-b border-gray-100">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approval progress</span>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            Step {item.step} of {item.totalSteps}
          </span>
        </div>
        <StepIndicator step={item.step} total={item.totalSteps} labels={item.stepLabels} />
      </div>

      {/* Submitted by */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
        <Avatar name={item.submittedBy} />
        <div>
          <p className="text-sm font-semibold text-gray-800">{item.submittedBy}</p>
          <p className="text-xs text-gray-400">Submitted {item.submittedDate}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-5 py-3.5">
        <button
          onClick={() => onApprove(item)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Check className="w-4 h-4" /> Approve
        </button>
        <button
          onClick={() => onReject(item)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 bg-red-50 hover:bg-red-100 border border-red-300 text-red-600 text-sm font-semibold rounded-lg transition-colors"
        >
          <X className="w-4 h-4" /> Reject
        </button>
        <Link
          href={`/invoices/${item.invNum}`}
          className="inline-flex items-center gap-1 h-9 px-3 border border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-600 rounded-lg transition-colors whitespace-nowrap"
        >
          <ExternalLink className="w-3.5 h-3.5" /> View
        </Link>
      </div>
    </div>
  )
}

// ── Completed Card ──
function CompletedCard({ item }: { item: CompletedItem }) {
  const approved = item.decision === 'approved'
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden opacity-90">
      <div className={`h-1 flex-shrink-0 ${approved ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <div className="flex items-center gap-3.5 px-5 py-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          approved ? 'bg-emerald-50' : 'bg-red-50'
        }`}>
          {approved
            ? <CheckCircle className="w-5 h-5 text-emerald-500" />
            : <XCircle className="w-5 h-5 text-red-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-bold text-gray-900">{item.invNum}</span>
            <span className="text-sm text-gray-500">{item.vendor}</span>
            <span className="ml-auto text-sm font-bold text-gray-900 tabular-nums">{item.amount}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
              approved
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {approved ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              {approved ? 'Approved' : 'Rejected'}
            </span>
            <span className="text-xs text-gray-400">by {item.decidedBy} · {item.decidedDate}</span>
            {item.reason && (
              <span className="text-xs text-red-500 italic">"{item.reason}"</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Approve Modal ──
function ApproveModal({
  item, onClose, onConfirm
}: {
  item: QueueItem
  onClose: () => void
  onConfirm: (item: QueueItem, notes: string) => void
}) {
  const [notes, setNotes] = useState('')
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
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
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info tiles */}
        <div className="px-6 pt-5 grid grid-cols-3 gap-3">
          {[['Invoice', item.invNum, true], ['Vendor', item.vendor, false], ['Amount', item.amount, true]].map(([k, v, mono]) => (
            <div key={k as string} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-1">{k}</p>
              <p className={`text-sm font-bold text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{v}</p>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="px-6 py-5">
          <label className="text-sm font-semibold text-gray-600">
            Notes <span className="font-normal text-gray-400">optional</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a comment for the audit trail…"
            rows={3}
            className="mt-1.5 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50 outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(item, notes)}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" /> Confirm approval
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Reject Modal ──
function RejectModal({
  item, onClose, onConfirm
}: {
  item: QueueItem
  onClose: () => void
  onConfirm: (item: QueueItem, reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const hasReason = reason.trim().length > 0

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
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
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info tiles */}
        <div className="px-6 pt-5 grid grid-cols-3 gap-3">
          {[['Invoice', item.invNum, true], ['Vendor', item.vendor, false], ['Amount', item.amount, true]].map(([k, v, mono]) => (
            <div key={k as string} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <p className="text-xs text-gray-400 mb-1">{k}</p>
              <p className={`text-sm font-bold text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>{v}</p>
            </div>
          ))}
        </div>

        {/* Reason (required) */}
        <div className="px-6 py-5">
          <label className="text-sm font-semibold text-gray-600">
            Rejection reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this invoice is being rejected…"
            rows={4}
            className={`mt-1.5 w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50 outline-none resize-none transition-all ${
              hasReason
                ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                : 'border-red-300 ring-2 ring-red-50'
            }`}
          />
          {!hasReason && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> A reason is required to reject an invoice.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            disabled={!hasReason}
            onClick={() => onConfirm(item, reason)}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <X className="w-4 h-4" /> Confirm rejection
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ──
function Toast({ msg, tone, onDone }: { msg: string; tone: 'success' | 'danger'; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3400); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 bg-gray-900 rounded-xl shadow-2xl text-white text-sm font-semibold z-[200] whitespace-nowrap">
      {tone === 'success'
        ? <CheckCircle className="w-4 h-4 text-emerald-400" />
        : <XCircle className="w-4 h-4 text-red-400" />
      }
      {msg}
    </div>
  )
}

// ════════════════════════════════════════
// Main Page
// ════════════════════════════════════════
type TabType = 'My queue' | 'All pending' | 'Completed'

export default function ApprovalsPage() {
  const [tab, setTab]           = useState<TabType>('My queue')
  const [queue, setQueue]       = useState<QueueItem[]>(INIT_QUEUE)
  const [approveTarget, setApproveTarget] = useState<QueueItem | null>(null)
  const [rejectTarget,  setRejectTarget]  = useState<QueueItem | null>(null)
  const [removingId,    setRemovingId]    = useState<number | null>(null)
  const [toast, setToast]       = useState<{ msg: string; tone: 'success' | 'danger' } | null>(null)

  // Card-ஐ animate பண்ணி remove பண்ணு
  const removeCard = (id: number, msg: string, tone: 'success' | 'danger') => {
    setRemovingId(id)
    setTimeout(() => { setQueue((q) => q.filter((x) => x.id !== id)); setRemovingId(null) }, 220)
    setToast({ msg, tone })
  }

  const handleApprove = (item: QueueItem, notes: string) => {
    setApproveTarget(null)
    removeCard(item.id, `${item.invNum} approved.`, 'success')
  }

  const handleReject = (item: QueueItem, reason: string) => {
    setRejectTarget(null)
    removeCard(item.id, `${item.invNum} rejected.`, 'danger')
  }

  // Stats கணக்கீடு
  const slaBreaches = queue.filter((x) => x.daysPending > 3).length
  const avgWait     = queue.length ? (queue.reduce((s, x) => s + x.daysPending, 0) / queue.length).toFixed(1) : '0'
  const totalAmount = queue.reduce((s, x) => s + x.rawAmount, 0).toLocaleString('en-GB')

  const TABS: TabType[] = ['My queue', 'All pending', 'Completed']

  return (
    <div className="space-y-5">
      {/* Page header + tabs */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Review and action invoices awaiting your approval</p>
        </div>
        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 border border-gray-200 p-1 rounded-xl">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
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

      {/* Stats pills (pending tabs மட்டும்) */}
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

      {/* Content */}
      {tab === 'Completed' ? (
        <div className="space-y-3 max-w-3xl">
          <p className="text-sm text-gray-400">Showing recently completed approvals</p>
          {COMPLETED.map((c) => <CompletedCard key={c.id} item={c} />)}
        </div>
      ) : queue.length === 0 ? (
        /* Empty state */
        <div className="max-w-sm border-2 border-dashed border-gray-200 rounded-2xl bg-white py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-gray-800 mb-1">All caught up</p>
          <p className="text-sm text-gray-400">No invoices pending your approval right now.</p>
        </div>
      ) : (
        /* Cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
          {queue.map((item) => (
            <ApprovalCard
              key={item.id}
              item={item}
              removing={removingId === item.id}
              onApprove={setApproveTarget}
              onReject={setRejectTarget}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {approveTarget && (
        <ApproveModal
          item={approveTarget}
          onClose={() => setApproveTarget(null)}
          onConfirm={handleApprove}
        />
      )}
      {rejectTarget && (
        <RejectModal
          item={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
        />
      )}

      {/* Toast */}
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  )
}