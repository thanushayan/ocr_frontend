'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, X, Loader2, Wine, Send, CheckCircle } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { alcoholDutyService } from '../../../services/offLicence.service'

interface DutyRate {
  id?: string
  category?: string
  description?: string
  abvBand?: string
  ratePerLitre?: number
  rate?: number
}

interface DutyPeriod {
  id: string
  quarterLabel?: string
  periodFrom?: string
  periodTo?: string
  totalDuty?: number
  status?: string
  submittedAt?: string
}

function fmt(n?: number) {
  if (n == null) return '—'
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n) }
  catch { return `£${n}` }
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function SubmittedBadge({ status }: { status?: string }) {
  const submitted = (status ?? '').toLowerCase() === 'submitted'
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-bold border ${
      submitted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${submitted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {submitted ? 'Submitted' : (status ?? 'Draft')}
    </span>
  )
}

function CalculateModal({ onClose, onCalculate, pending }: {
  onClose: () => void
  onCalculate: (body: { periodFrom: string; periodTo: string; quarterLabel?: string }) => void
  pending: boolean
}) {
  const [from, setFrom]   = useState('')
  const [to, setTo]       = useState('')
  const [label, setLabel] = useState('')
  const valid = from && to

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Wine className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Calculate duty period</p>
              <p className="text-xs text-gray-400">Duty is calculated from invoices in the date range</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-600">From<span className="text-red-500 ml-0.5">*</span></label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-gray-50 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-600">To<span className="text-red-500 ml-0.5">*</span></label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-gray-50 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-600">Quarter label</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Q1 2026"
              className="h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-gray-50 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all" />
          </div>
        </div>
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            disabled={!valid || pending}
            onClick={() => valid && onCalculate({ periodFrom: from, periodTo: to, quarterLabel: label || undefined })}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {pending ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculating…</> : 'Calculate'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AlcoholDutyPage() {
  const { activeClient, hasActiveClient } = useAuth()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: periods = [], isLoading } = useQuery<DutyPeriod[]>({
    queryKey: ['alcohol-duty', activeClient?.id],
    queryFn: () => alcoholDutyService.getPeriods(),
    enabled: hasActiveClient,
  })

  const { data: rates = [] } = useQuery<DutyRate[]>({
    queryKey: ['alcohol-duty-rates'],
    queryFn: () => alcoholDutyService.getRates(),
  })

  const calculateMutation = useMutation({
    mutationFn: (body: { periodFrom: string; periodTo: string; quarterLabel?: string }) =>
      alcoholDutyService.calculate(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alcohol-duty', activeClient?.id] })
      setShowModal(false)
      toast.success('Duty period calculated')
    },
    onError: () => toast.error('Failed to calculate duty period'),
  })

  const submitMutation = useMutation({
    mutationFn: (periodId: string) => alcoholDutyService.submit(periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alcohol-duty', activeClient?.id] })
      toast.success('Duty period submitted')
    },
    onError: () => toast.error('Failed to submit duty period'),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alcohol Duty</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeClient ? <>Viewing: <span className="font-semibold text-gray-700">{activeClient.businessName}</span> — </> : null}
            HMRC alcohol duty periods and rates.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Calculate New Period
        </button>
      </div>

      {/* Duty periods */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <p className="text-sm font-bold text-gray-900">Duty periods</p>
        </div>
        {isLoading ? (
          <div className="p-10 text-sm text-gray-500 text-center">Loading periods…</div>
        ) : periods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Wine className="w-7 h-7 text-gray-300" />
            <p className="text-sm text-gray-500">No duty periods yet. Calculate your first period.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Quarter</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Period</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Total duty</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {periods.map(p => {
                const submitted = (p.status ?? '').toLowerCase() === 'submitted'
                return (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-bold text-gray-900">{p.quarterLabel ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{fmtDate(p.periodFrom)} → {fmtDate(p.periodTo)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{fmt(p.totalDuty)}</td>
                    <td className="px-5 py-3.5"><SubmittedBadge status={p.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      {submitted ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                          <CheckCircle size={14} /> Done
                        </span>
                      ) : (
                        <button
                          onClick={() => submitMutation.mutate(p.id)}
                          disabled={submitMutation.isPending}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40"
                        >
                          <Send size={13} /> Submit
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* HMRC rates */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <p className="text-sm font-bold text-gray-900">HMRC duty rates</p>
          <p className="text-xs text-gray-400 mt-0.5">Current alcohol duty rates by category</p>
        </div>
        {rates.length === 0 ? (
          <div className="p-8 text-sm text-gray-400 text-center">No rates available.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Category</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">ABV band</th>
                <th className="text-right text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Rate</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r, i) => (
                <tr key={r.id ?? i} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-3 text-sm text-gray-800">{r.category ?? r.description ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.abvBand ?? '—'}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(r.ratePerLitre ?? r.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <CalculateModal
          onClose={() => setShowModal(false)}
          onCalculate={(body) => calculateMutation.mutate(body)}
          pending={calculateMutation.isPending}
        />
      )}
    </div>
  )
}
