'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileText, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { vatReturnService } from '../../../services/offLicence.service'

interface VatReturn {
  id: string
  periodKey?: string
  periodFrom?: string
  periodTo?: string
  status?: string           // Draft | ReadyToSubmit | Submitted | Accepted
  vatDueSales?: number
  vatDueAcquisitions?: number
  totalVatDue?: number
  vatReclaimedCurrPeriod?: number
  netVatDue?: number
  totalValueSalesExVAT?: number
  totalValuePurchasesExVAT?: number
  totalValueGoodsSuppliedExVAT?: number
  totalAcquisitionsExVAT?: number
}

const MTD_BOXES: Array<{ box: number; label: string; key: keyof VatReturn }> = [
  { box: 1, label: 'VAT due on sales',            key: 'vatDueSales' },
  { box: 2, label: 'VAT due on acquisitions',     key: 'vatDueAcquisitions' },
  { box: 3, label: 'Total VAT due',               key: 'totalVatDue' },
  { box: 4, label: 'VAT reclaimed on purchases',  key: 'vatReclaimedCurrPeriod' },
  { box: 5, label: 'Net VAT due',                 key: 'netVatDue' },
  { box: 6, label: 'Total sales (ex VAT)',        key: 'totalValueSalesExVAT' },
  { box: 7, label: 'Total purchases (ex VAT)',    key: 'totalValuePurchasesExVAT' },
  { box: 8, label: 'Goods supplied to EU (ex VAT)', key: 'totalValueGoodsSuppliedExVAT' },
  { box: 9, label: 'Acquisitions from EU (ex VAT)', key: 'totalAcquisitionsExVAT' },
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
  const { activeClient, hasActiveClient } = useAuth()
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: returns = [], isLoading } = useQuery<VatReturn[]>({
    queryKey: ['vat-returns', activeClient?.id],
    queryFn: () => vatReturnService.getAll(),
    enabled: hasActiveClient,
  })

  const submitMutation = useMutation({
    mutationFn: (returnId: string) => vatReturnService.submit(returnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vat-returns', activeClient?.id] })
      toast.success('VAT return submitted to HMRC')
    },
    onError: () => toast.error('Failed to submit VAT return'),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">VAT Returns</h1>
        <p className="text-sm text-gray-500 mt-1">
          {activeClient ? <>Viewing: <span className="font-semibold text-gray-700">{activeClient.businessName}</span> — </> : null}
          Making Tax Digital VAT returns.
        </p>
      </div>

      {/* Returns list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-sm text-gray-500 text-center">Loading VAT returns…</div>
        ) : returns.length === 0 ? (
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
                      <FileText className="w-4.5 h-4.5 text-blue-600" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900">
                        {r.periodKey ?? `${fmtDate(r.periodFrom)} → ${fmtDate(r.periodTo)}`}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Net VAT due: <span className="font-semibold text-gray-600">{fmt(r.netVatDue)}</span>
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
                            <div className="text-lg font-bold text-gray-900 mt-2">{fmt(r[key] as number | undefined)}</div>
                          </div>
                        ))}
                      </div>
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
