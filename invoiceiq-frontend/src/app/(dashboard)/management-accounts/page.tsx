'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BookOpen, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { managementAccountService } from '../../../services/managementAccount.service'
import type { ManagementAccount } from '../../../types/client.types'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(n?: number) {
  if (n == null) return '—'
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n) }
  catch { return `£${n}` }
}

const STATUS_STYLE: Record<string, string> = {
  Draft:        'bg-gray-100 border-gray-300 text-gray-500',
  Prepared:     'bg-amber-50 border-amber-200 text-amber-700',
  SentToClient: 'bg-blue-50 border-blue-200 text-blue-700',
  Approved:     'bg-emerald-50 border-emerald-200 text-emerald-700',
}

function MaStatusBadge({ status }: { status?: string }) {
  const s = status ?? 'Draft'
  return (
    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-bold border ${STATUS_STYLE[s] ?? STATUS_STYLE.Draft}`}>
      {s === 'SentToClient' ? 'Sent to client' : s}
    </span>
  )
}

function BreakdownRow({ label, value, bold = false }: { label: string; value?: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${bold ? 'border-t border-gray-200 mt-1 pt-2.5' : ''}`}>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{fmt(value)}</span>
    </div>
  )
}

export default function ManagementAccountsPage() {
  const { activeClient } = useAuth()
  const queryClient = useQueryClient()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: accounts = [], isLoading } = useQuery<ManagementAccount[]>({
    queryKey: ['management-accounts', activeClient?.id, year],
    queryFn: () => managementAccountService.getAll(activeClient!.id, year),
    enabled: !!activeClient?.id,
  })

  const sendMutation = useMutation({
    mutationFn: (maId: string) => managementAccountService.sendToClient(activeClient!.id, maId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-accounts', activeClient?.id, year] })
      toast.success('Management accounts emailed to the shop owner')
    },
    onError: () => toast.error('Failed to send management accounts'),
  })

  const years = [currentYear, currentYear - 1, currentYear - 2]

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Management Accounts</h1>
          {activeClient && (
            <p className="text-sm text-blue-600 font-medium mt-0.5">
              📍 {activeClient.businessName} · {activeClient.businessPostcode}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">Monthly P&amp;L with revenue and cost breakdown.</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`h-8 px-3 rounded-md text-sm font-semibold transition-colors ${
                year === y ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly P&L list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <BookOpen className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-500">No management accounts for {year}.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {accounts.map(ma => {
              const isOpen = expanded === ma.id
              const label = `${MONTH_NAMES[(ma.month ?? 1) - 1]} ${ma.year}`
              const profit = ma.netProfitAfterTax ?? 0
              return (
                <div key={ma.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : ma.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <BookOpen size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{label}</span>
                        <MaStatusBadge status={ma.status} />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Revenue {fmt(ma.totalRevenue)} · Gross profit {fmt(ma.grossProfit)} ({ma.grossMarginPercent?.toFixed(1) ?? '—'}%)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {fmt(ma.netProfitAfterTax)}
                      </div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Net profit</div>
                    </div>
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); sendMutation.mutate(ma.id) }}
                      className="inline-flex items-center gap-1.5 h-8 px-3 border border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send size={13} />}
                      {ma.sentToClientAt ? 'Resend to Client' : 'Send to Client'}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg px-4 py-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Revenue breakdown</p>
                        <BreakdownRow label="Alcohol sales" value={ma.alcoholSalesRevenue} />
                        <BreakdownRow label="Tobacco sales" value={ma.tobaccoSalesRevenue} />
                        <BreakdownRow label="Grocery sales" value={ma.grocerySalesRevenue} />
                        <BreakdownRow label="Lottery commission" value={ma.lotteryCommission} />
                        <BreakdownRow label="Other revenue" value={ma.otherRevenue} />
                        <BreakdownRow label="Total revenue" value={ma.totalRevenue} bold />
                      </div>
                      <div className="border border-gray-200 rounded-lg px-4 py-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Costs &amp; profit</p>
                        <BreakdownRow label="Cost of goods" value={ma.totalCostOfGoods} />
                        <BreakdownRow label="Gross profit" value={ma.grossProfit} />
                        <BreakdownRow label="Overheads" value={ma.totalOverheads} />
                        <BreakdownRow label="Profit before tax" value={ma.netProfitBeforeTax} />
                        <BreakdownRow label="Tax provision" value={ma.taxProvision} />
                        <BreakdownRow label="Net profit after tax" value={ma.netProfitAfterTax} bold />
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
