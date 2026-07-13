'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BookOpen, Send, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { managementAccountService } from '../../../services/offLicence.service'

interface ManagementAccount {
  id: string
  year?: number
  month?: number
  monthLabel?: string
  // Revenue breakdown
  alcoholRevenue?: number
  tobaccoRevenue?: number
  groceryRevenue?: number
  lotteryRevenue?: number
  otherRevenue?: number
  totalRevenue?: number
  // Costs
  costOfGoods?: number
  wages?: number
  rent?: number
  utilities?: number
  otherCosts?: number
  totalCosts?: number
  // Result
  netProfit?: number
  sentAt?: string
  status?: string
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(n?: number) {
  if (n == null) return '—'
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n) }
  catch { return `£${n}` }
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
  const { activeClient, hasActiveClient } = useAuth()
  const queryClient = useQueryClient()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: accounts = [], isLoading } = useQuery<ManagementAccount[]>({
    queryKey: ['management-accounts', activeClient?.id, year],
    queryFn: () => managementAccountService.getAll(year),
    enabled: hasActiveClient,
  })

  const sendMutation = useMutation({
    mutationFn: (maId: string) => managementAccountService.sendToClient(maId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-accounts', activeClient?.id, year] })
      toast.success('Management accounts emailed to the shop owner')
    },
    onError: () => toast.error('Failed to send management accounts'),
  })

  const years = [currentYear, currentYear - 1, currentYear - 2]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Management Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeClient ? <>Viewing: <span className="font-semibold text-gray-700">{activeClient.businessName}</span> — </> : null}
            Monthly P&amp;L with revenue and cost breakdown.
          </p>
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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-sm text-gray-500 text-center">Loading management accounts…</div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2">
            <BookOpen className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-500">No management accounts for {year}.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {accounts.map(ma => {
              const isOpen = expanded === ma.id
              const label = ma.monthLabel ?? (ma.month ? `${MONTH_NAMES[ma.month - 1]} ${ma.year ?? year}` : '—')
              const profit = ma.netProfit ?? 0
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
                      <div className="text-sm font-bold text-gray-900">{label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Revenue {fmt(ma.totalRevenue)} · Costs {fmt(ma.totalCosts)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {fmt(ma.netProfit)}
                      </div>
                      <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Net profit</div>
                    </div>
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); sendMutation.mutate(ma.id) }}
                      className="inline-flex items-center gap-1.5 h-8 px-3 border border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send size={13} />}
                      {ma.sentAt ? 'Resend to Client' : 'Send to Client'}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg px-4 py-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Revenue breakdown</p>
                        <BreakdownRow label="Alcohol" value={ma.alcoholRevenue} />
                        <BreakdownRow label="Tobacco" value={ma.tobaccoRevenue} />
                        <BreakdownRow label="Grocery" value={ma.groceryRevenue} />
                        <BreakdownRow label="Lottery" value={ma.lotteryRevenue} />
                        <BreakdownRow label="Other" value={ma.otherRevenue} />
                        <BreakdownRow label="Total revenue" value={ma.totalRevenue} bold />
                      </div>
                      <div className="border border-gray-200 rounded-lg px-4 py-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cost breakdown</p>
                        <BreakdownRow label="Cost of goods" value={ma.costOfGoods} />
                        <BreakdownRow label="Wages" value={ma.wages} />
                        <BreakdownRow label="Rent" value={ma.rent} />
                        <BreakdownRow label="Utilities" value={ma.utilities} />
                        <BreakdownRow label="Other" value={ma.otherCosts} />
                        <BreakdownRow label="Total costs" value={ma.totalCosts} bold />
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
