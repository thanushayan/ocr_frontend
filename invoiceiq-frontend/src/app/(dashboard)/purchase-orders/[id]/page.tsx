'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Check, X, Trash2, Link2, Package,
  Calendar, Store, CreditCard, AlertCircle, Bot, User, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../../../hooks/useAuth'
import { purchaseOrderService } from '../../../../services/purchaseOrder.service'

interface PoItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  unit?: string
}

interface PurchaseOrder {
  id: string
  poNumber: string
  description?: string
  status: string
  totalAmount: number
  currency: string
  vendorId?: string
  vendorName?: string
  issuedDate?: string
  expectedDeliveryDate?: string
  createdAt: string
  items: PoItem[]
  matchCount: number
}

interface PoMatch {
  id: string
  invoiceId: string
  invoiceNumber?: string
  purchaseOrderId: string
  poNumber: string
  status: string
  isAutoMatched: boolean
  matchConfidence: number
  matchReason?: string
  dismissReason?: string
  matchedAt: string
}

const STATUS_STYLES: Record<string, { dot: string; bg: string; border: string; text: string }> = {
  Draft:     { dot: 'bg-gray-400',    bg: 'bg-gray-50',    border: 'border-gray-200',    text: 'text-gray-600'    },
  Open:      { dot: 'bg-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700'    },
  Closed:    { dot: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  Cancelled: { dot: 'bg-red-500',     bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700'     },
}

const MATCH_STYLES: Record<string, { dot: string; bg: string; border: string; text: string }> = {
  Pending:   { dot: 'bg-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700'   },
  Confirmed: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  Dismissed: { dot: 'bg-red-500',     bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700'     },
}

function StatusBadge({ status, styles }: { status: string; styles: Record<string, { dot: string; bg: string; border: string; text: string }> }) {
  const s = styles[status] ?? Object.values(styles)[0]
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-bold border ${s.bg} ${s.border} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}

function fmt(n: number, currency = 'GBP') {
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n) }
  catch { return `£${n.toLocaleString()}` }
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PurchaseOrderDetailPage() {
  const { activeClientId: clientId } = useAuth()
  const router = useRouter()
  const params = useParams()
  const poId = params.id as string
  const queryClient = useQueryClient()
  const [toast, setToast] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const { data: po, isLoading } = useQuery<PurchaseOrder>({
    queryKey: ['purchase-order', clientId, poId],
    queryFn: () => purchaseOrderService.getById(clientId!, poId),
    enabled: !!clientId && !!poId,
  })

  const { data: matches = [] } = useQuery<PoMatch[]>({
    queryKey: ['po-matches', clientId, poId],
    queryFn: () => purchaseOrderService.getMatches(clientId!, poId),
    enabled: !!clientId && !!poId,
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => purchaseOrderService.update(clientId!, poId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', clientId, poId] })
      showToast('Status updated.')
    },
  })

    const deleteMutation = useMutation({
    mutationFn: () => purchaseOrderService.remove(clientId!, poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', clientId] })
      router.push('/purchase-orders')
    },
  })
  const reviewMutation = useMutation({
    mutationFn: ({ matchId, action }: { matchId: string; action: string }) =>
      purchaseOrderService.reviewMatch(clientId!, matchId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['po-matches', clientId, poId] })
      showToast('Match reviewed.')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!po) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-semibold text-gray-700">Purchase order not found.</p>
        <button onClick={() => router.push('/purchase-orders')}
          className="mt-3 text-sm font-semibold text-blue-600 hover:underline">← Back to list</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-2xl text-sm font-semibold z-[200]">
          <Check className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}

      {/* Back */}
      <button onClick={() => router.push('/purchase-orders')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to purchase orders
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{po.poNumber}</h1>
          <StatusBadge status={po.status} styles={STATUS_STYLES} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {po.status === 'Open' && (
            <button onClick={() => statusMutation.mutate('Closed')} disabled={statusMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
              <Check className="w-4 h-4" /> Close PO
            </button>
          )}
          {po.status !== 'Cancelled' && po.status !== 'Closed' && (
            <button onClick={() => statusMutation.mutate('Cancelled')} disabled={statusMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-lg transition-colors">
              <X className="w-4 h-4" /> Cancel PO
            </button>
          )}
          <button onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-semibold rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total amount', value: fmt(po.totalAmount, po.currency), icon: CreditCard, color: 'bg-blue-500' },
          { label: 'Vendor',       value: po.vendorName ?? '—',             icon: Store,      color: 'bg-emerald-500' },
          { label: 'Issued',       value: fmtDate(po.issuedDate),           icon: Calendar,   color: 'bg-amber-500' },
          { label: 'Expected',     value: fmtDate(po.expectedDeliveryDate), icon: Package,    color: 'bg-purple-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3">
            <div className={`p-2.5 rounded-lg ${c.color}`}><c.icon className="w-5 h-5 text-white" /></div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-base font-bold text-gray-900 mt-0.5 truncate">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      {po.description && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Description</p>
          <p className="text-sm text-gray-700">{po.description}</p>
        </div>
      )}

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Line items</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Description</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Qty</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Unit price</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {po.items.map(it => (
              <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-700">{it.description}{it.unit ? <span className="text-gray-400"> ({it.unit})</span> : ''}</td>
                <td className="px-6 py-4 text-right font-mono text-gray-600">{it.quantity}</td>
                <td className="px-6 py-4 text-right font-mono text-gray-600">{fmt(it.unitPrice, po.currency)}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">{fmt(it.totalPrice, po.currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td colSpan={3} className="px-6 py-3.5 text-sm font-semibold text-gray-500 text-right">Total</td>
              <td className="px-6 py-3.5 text-right font-mono font-bold text-gray-900 text-base">{fmt(po.totalAmount, po.currency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Matched invoices */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-purple-500" /> Matched invoices
          </h2>
          <span className="text-xs text-gray-400">{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
        </div>
        {matches.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No invoices matched to this PO yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Invoice #', 'Type', 'Confidence', 'Status', 'Matched', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matches.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <button onClick={() => router.push(`/invoices/${m.invoiceId}`)}
                      className="font-mono font-medium text-blue-600 hover:underline inline-flex items-center gap-1">
                      {m.invoiceNumber ?? m.invoiceId.slice(0, 8)} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                      {m.isAutoMatched ? <><Bot className="w-3.5 h-3.5" /> Auto</> : <><User className="w-3.5 h-3.5" /> Manual</>}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-xs"
                      style={{ color: m.matchConfidence >= 0.9 ? '#10b981' : m.matchConfidence >= 0.7 ? '#f59e0b' : '#ef4444' }}>
                      {Math.round(m.matchConfidence * 100)}%
                    </span>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={m.status} styles={MATCH_STYLES} /></td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{fmtDate(m.matchedAt)}</td>
                  <td className="px-6 py-4">
                    {m.status === 'Pending' ? (
                      <div className="flex gap-2">
                        <button onClick={() => reviewMutation.mutate({ matchId: m.id, action: 'Confirm' })}
                          className="inline-flex items-center gap-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg px-2.5 py-1.5 font-medium transition-colors">
                          <Check className="w-3.5 h-3.5" /> Confirm
                        </button>
                        <button onClick={() => reviewMutation.mutate({ matchId: m.id, action: 'Dismiss' })}
                          className="inline-flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-2.5 py-1.5 font-medium transition-colors">
                          <X className="w-3.5 h-3.5" /> Dismiss
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(false) }}>
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Delete purchase order?</h3>
            <p className="text-sm text-gray-500 mb-5">
              <strong className="font-mono">{po.poNumber}</strong> will be permanently deleted. This cannot be undone.
            </p>
            {deleteMutation.isError && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-4">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {(deleteMutation.error as any)?.response?.data?.error ?? 'Cannot delete this PO.'}
              </div>
            )}
            <div className="flex gap-2.5 justify-end">
              <button onClick={() => setConfirmDelete(false)}
                className="h-10 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
                className="h-10 px-5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}