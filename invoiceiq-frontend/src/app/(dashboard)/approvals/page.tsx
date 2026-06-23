'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../hooks/useAuth'
import { approvalsService } from '../../../services/approvals.service'
import {
  CheckCircle, XCircle, Clock, AlertCircle, ChevronRight,
  Search, Filter, X, Check, FileText,
} from 'lucide-react'

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'

interface ActionModal {
  instanceId: string
  invoiceNumber: string
  action: 'Approved' | 'Rejected'
}

export default function ApprovalsPage() {
  const { companyId } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<FilterStatus>('pending')
  const [actionModal, setActionModal] = useState<ActionModal | null>(null)
  const [comment, setComment]       = useState('')

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['approvals-pending'],
    queryFn: () => approvalsService.getPending(),
  })

  const actMutation = useMutation({
    mutationFn: ({ instanceId, action, comment }: { instanceId: string; action: 'Approved' | 'Rejected'; comment?: string }) =>
      approvalsService.act(instanceId, action, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals-pending'] })
      setActionModal(null)
      setComment('')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (instanceId: string) => approvalsService.cancel(instanceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals-pending'] }),
  })

  // KPIs
  const totalPending  = pending.filter((a: any) => a.status === 'InProgress' || a.status === 'Pending').length
  const totalApproved = pending.filter((a: any) => a.status === 'Approved').length
  const totalRejected = pending.filter((a: any) => a.status === 'Rejected').length

  // Filter + search
  const filtered = pending.filter((a: any) => {
    const matchSearch = !search ||
      a.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      a.workflowName?.toLowerCase().includes(search.toLowerCase()) ||
      a.startedByName?.toLowerCase().includes(search.toLowerCase())

    const matchFilter =
      filter === 'all'      ? true :
      filter === 'pending'  ? (a.status === 'InProgress' || a.status === 'Pending') :
      filter === 'approved' ? a.status === 'Approved' :
      filter === 'rejected' ? a.status === 'Rejected' : true

    return matchSearch && matchFilter
  })

  const statusBadge = (status: string) => {
    switch (status) {
      case 'InProgress':
      case 'Pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> Pending</span>
      case 'Approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"><Check className="w-3 h-3" /> Approved</span>
      case 'Rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200"><X className="w-3 h-3" /> Rejected</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Review and action invoices waiting for your approval.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Awaiting approval', value: totalPending,  icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-50'  },
          { label: 'Approved',          value: totalApproved, icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Rejected',          value: totalRejected, icon: XCircle,     color: 'text-red-600',    bg: 'bg-red-50'    },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search invoices…"
              className="w-full pl-9 pr-3 h-9 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoice</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Workflow</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Step</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Submitted by</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="py-4 px-4"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <FileText className="w-8 h-8" />
                      <p className="text-sm font-medium">No approvals found</p>
                      <p className="text-xs">
                        {filter === 'pending' ? 'No invoices are waiting for your approval.' : 'Try changing the filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((a: any) => {
                const isPending = a.status === 'InProgress' || a.status === 'Pending'
                return (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{a.invoiceNumber || 'No number'}</p>
                          <p className="text-xs text-gray-400">ID: {a.invoiceId?.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{a.workflowName || '—'}</td>
                    <td className="py-4 px-4 text-gray-500">Step {a.currentStep ?? 1}</td>
                    <td className="py-4 px-4 text-gray-700">{a.startedByName || '—'}</td>
                    <td className="py-4 px-4 text-gray-500 text-xs">
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="py-4 px-4">{statusBadge(a.status)}</td>
                    <td className="py-4 px-4">
                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActionModal({ instanceId: a.id, invoiceNumber: a.invoiceNumber || 'this invoice', action: 'Approved' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setActionModal({ instanceId: a.id, invoiceNumber: a.invoiceNumber || 'this invoice', action: 'Rejected' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-medium rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {a.completedAt ? new Date(a.completedAt).toLocaleDateString('en-GB') : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {actionModal.action === 'Approved'
                  ? <CheckCircle className="w-5 h-5 text-green-600" />
                  : <XCircle className="w-5 h-5 text-red-600" />
                }
                <h3 className="text-base font-semibold text-gray-900">
                  {actionModal.action === 'Approved' ? 'Approve Invoice' : 'Reject Invoice'}
                </h3>
              </div>
              <button onClick={() => { setActionModal(null); setComment('') }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className={`flex items-start gap-3 p-3.5 rounded-lg ${actionModal.action === 'Approved' ? 'bg-green-50' : 'bg-red-50'}`}>
                <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${actionModal.action === 'Approved' ? 'text-green-600' : 'text-red-600'}`} />
                <p className={`text-sm ${actionModal.action === 'Approved' ? 'text-green-700' : 'text-red-700'}`}>
                  You are about to <strong>{actionModal.action === 'Approved' ? 'approve' : 'reject'}</strong> invoice <strong>{actionModal.invoiceNumber}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  placeholder="Add a note for your decision…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 resize-none"
                />
              </div>

              {actMutation.isError && (
                <p className="text-sm text-red-600">
                  {(actMutation.error as any)?.response?.data?.error ?? 'Failed to submit action.'}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => { setActionModal(null); setComment('') }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => actMutation.mutate({ instanceId: actionModal.instanceId, action: actionModal.action, comment: comment || undefined })}
                  disabled={actMutation.isPending}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors ${actionModal.action === 'Approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {actMutation.isPending ? 'Submitting…' : actionModal.action === 'Approved' ? 'Confirm Approve' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}