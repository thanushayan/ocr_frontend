'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileText, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { vatReturnService } from '../../../services/vatReturn.service'
import type { VatReturn } from '../../../types/client.types'

const MTD_BOXES: Array<{ box: number; label: string; key: keyof VatReturn }> = [
  { box: 1, label: 'VAT due on sales',              key: 'box1_VatOnSales' },
  { box: 2, label: 'VAT due on acquisitions',       key: 'box2_VatOnAcquisitions' },
  { box: 3, label: 'Total VAT due',                 key: 'box3_TotalVatDue' },
  { box: 4, label: 'VAT reclaimed on purchases',    key: 'box4_VatReclaimed' },
  { box: 5, label: 'Net VAT payable',               key: 'box5_NetVatPayable' },
  { box: 6, label: 'Net sales value (ex VAT)',      key: 'box6_NetSalesValue' },
  { box: 7, label: 'Net purchases value (ex VAT)',  key: 'box7_NetPurchasesValue' },
  { box: 8, label: 'Net EU supplies (ex VAT)',      key: 'box8_NetEuSupplies' },
  { box: 9, label: 'Net EU acquisitions (ex VAT)',  key: 'box9_NetEuAcquisitions' },
]

function fmt(n?: number) {
  if (n == null) return '—'
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n) }
  catch { return `£${n}` }
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_STYLE: Record<string, string> = {
  Draft:         'bg-gray-100 border-gray-300 text-gray-500',
  ReadyToSubmit: 'bg-amber-50 border-amber-200 text-amber-700',
  Submitted:     'bg-blue-50 border-blue-200 text-blue-700',
  Accepted:      'bg-emerald-50 border-emerald-200 text-emerald-700',
}

function VatStatusBadge({ status }: { status?: string }) {
  const s = status ?? 'Draft'
  return (
    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-bold border ${STATUS_STYLE[s] ?? STATUS_STYLE.Draft}`}>
      {s === 'ReadyToSubmit' ? 'Ready to submit' : s}
    </span>
  )
}

export default function VatReturnsPage() {
  const { activeClient } = useAuth()
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: returns = [], isLoading } = useQuery<VatReturn[]>({
    queryKey: ['vat-returns', activeClient?.id],
    queryFn: () => vatReturnService.getAll(activeClient!.id),
    enabled: !!activeClient?.id,
  })

  const submitMutation = useMutation({
    mutationFn: (returnId: string) => vatReturnService.submit(activeClient!.id, returnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vat-returns', activeClient?.id] })
      toast.success('VAT return submitted to HMRC')
    },
    onError: () => toast.error('Failed to submit VAT return'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">VAT Returns</h1>
        {activeClient && (
          <p className="text-sm text-blue-600 font-medium mt-0.5">
            📍 {activeClient.businessName} · {activeClient.businessPostcode}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">Making Tax Digital VAT returns.</p>
      </div>

      {/* Returns list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {returns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <FileText className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-500">No VAT returns yet for this client.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {returns.map(r => {
              const isOpen = expanded === r.id
              return (
                <div key={r.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900">
                        {r.periodKey ?? `${fmtDate(r.periodFrom)} → ${fmtDate(r.periodTo)}`}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Net VAT payable: <span className="font-semibold text-gray-600">{fmt(r.box5_NetVatPayable)}</span>
                        {r.paymentDueDate ? ` · Due ${fmtDate(r.paymentDueDate)}` : ''}
                      </div>
                    </div>
                    <VatStatusBadge status={r.status} />
                    {r.status === 'ReadyToSubmit' && (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); submitMutation.mutate(r.id) }}
                        className="inline-flex items-center gap-1.5 h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        {submitMutation.isPending
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Send size={13} />} Submit to HMRC
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  {/* 9 MTD boxes */}
                  {isOpen && (
                    <div className="px-5 pb-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {MTD_BOXES.map(({ box, label, key }) => (
                          <div key={box} className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50/50">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-blue-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                                {box}
                              </span>
                              <span className="text-xs font-semibold text-gray-500">{label}</span>
                            </div>
                            <div className="text-lg font-bold text-gray-900 mt-2">{fmt(r[key] as number)}</div>
                          </div>
                        ))}
                      </div>
                      {r.hmrcReceiptId && (
                        <p className="text-xs text-gray-400 mt-3">HMRC receipt: {r.hmrcReceiptId}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
