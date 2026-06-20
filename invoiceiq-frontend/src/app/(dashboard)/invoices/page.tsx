'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Upload, Eye, Download, Trash2,
  ChevronLeft, ChevronRight, AlertCircle,
  Check, Filter, Calendar, Store, CreditCard, X
} from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { invoiceService } from '../../../services/invoice.service'
import { PagedInvoices } from '../../../types/invoice.types'

// Dummy fallback data
const DUMMY_ROWS = [
  { num: 'INV-2026-1042', vendor: 'Northstar Supplies',   amount: '£18,420.00', status: 'Processing',  due: '24 Jun 2026', uploaded: '17 Jun 2026', overdue: false },
  { num: 'INV-2026-1041', vendor: 'Acme Cloud Services',  amount: '£4,280.00',  status: 'Pending',     due: '20 Jun 2026', uploaded: '17 Jun 2026', overdue: false },
  { num: 'INV-2026-1040', vendor: 'Blue River Logistics', amount: '£7,120.00',  status: 'Rejected',    due: '12 Jun 2026', uploaded: '16 Jun 2026', overdue: true  },
  { num: 'INV-2026-1039', vendor: 'Data Processing Inc.', amount: '£1,950.00',  status: 'Approved',    due: '28 Jun 2026', uploaded: '16 Jun 2026', overdue: false },
  { num: 'INV-2026-1038', vendor: 'Harbour Facilities',   amount: '£11,340.00', status: 'Pending',     due: '10 Jun 2026', uploaded: '15 Jun 2026', overdue: true  },
  { num: 'INV-2026-1037', vendor: 'Orbit Analytics',      amount: '£8,650.00',  status: 'Paid',        due: '05 Jun 2026', uploaded: '14 Jun 2026', overdue: false },
  { num: 'INV-2026-1036', vendor: 'FinOps Advisory',      amount: '£21,780.00', status: 'Approved',    due: '30 Jun 2026', uploaded: '14 Jun 2026', overdue: false },
  { num: 'INV-2026-1035', vendor: 'Evergreen Office',     amount: '£2,180.00',  status: 'Paid',        due: '02 Jun 2026', uploaded: '13 Jun 2026', overdue: false },
]

const STATUS_STYLES: Record<string, { dot: string; bg: string; border: string; text: string }> = {
  Pending:         { dot: 'bg-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700'   },
  PendingReview:   { dot: 'bg-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700'   },
  PendingApproval: { dot: 'bg-orange-500',  bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700'  },
  Approved:        { dot: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  Rejected:        { dot: 'bg-red-500',     bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700'     },
  Processing:      { dot: 'bg-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700'    },
  OcrProcessing:   { dot: 'bg-blue-500',    bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700'    },
  OcrComplete:     { dot: 'bg-cyan-500',    bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-700'    },
  Uploaded:        { dot: 'bg-gray-400',    bg: 'bg-gray-50',    border: 'border-gray-200',    text: 'text-gray-600'    },
  Paid:            { dot: 'bg-purple-500',  bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700'  },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES['Pending']
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-bold border ${s.bg} ${s.border} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  )
}

function Checkbox({ checked, indeterminate, onClick }: { checked: boolean; indeterminate?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-[18px] h-[18px] flex-shrink-0 rounded flex items-center justify-center border-[1.5px] transition-colors ${
        checked || indeterminate ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400 hover:border-blue-400'
      }`}
    >
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      {!checked && indeterminate && <span className="w-2.5 h-0.5 bg-white rounded" />}
    </button>
  )
}

function FilterSelect({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="relative flex items-center h-9 pl-3 bg-white border border-gray-300 rounded-lg">
      <Icon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
      <select className="appearance-none border-none outline-none bg-transparent pr-8 h-full text-sm font-semibold text-gray-800 cursor-pointer">
        {children}
      </select>
      <ChevronRight className="absolute right-2 w-4 h-4 text-gray-400 pointer-events-none rotate-90" />
    </div>
  )
}

function formatAmount(amount?: number, currency?: string) {
  if (!amount) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency ?? 'GBP',
  }).format(amount)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function InvoicesPage() {
  const router = useRouter()
  const { companyId } = useAuth()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const PAGE_SIZE = 20

  const { data, isLoading } = useQuery<PagedInvoices>({
    queryKey: ['invoices', companyId, page, search],
    queryFn: () => invoiceService.list(companyId!, { page, pageSize: PAGE_SIZE, search }),
    enabled: !!companyId,
  })

  // API data → table rows, dummy fallback
  const rows = data?.items?.map(inv => ({
    num:      inv.invoiceNumber ?? inv.id,
    vendor:   inv.vendorName   ?? '—',
    amount:   formatAmount(inv.totalAmount, inv.currency),
    status:   inv.status,
    due:      '—',
    uploaded: formatDate(inv.createdAt),
    overdue:  false,
  })) ?? DUMMY_ROWS

  const totalCount = data?.totalCount ?? 143
  const totalPages = data?.totalPages ?? 8

  const allOn  = selected.size === rows.length && rows.length > 0
  const someOn = selected.size > 0 && !allOn

  const toggle    = (num: string) => setSelected(prev => { const n = new Set(prev); n.has(num) ? n.delete(num) : n.add(num); return n })
  const toggleAll = () => setSelected(allOn ? new Set() : new Set(rows.map(r => r.num)))

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? 'Loading…' : `${totalCount} invoices across your workspace`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center w-80">
            <Search className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendor, invoice #, amount…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 h-10 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload invoice
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="border-t border-gray-200 pt-4 flex items-center gap-2.5 flex-wrap">
        <FilterSelect icon={Filter}>
          <option>All statuses</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Processing</option>
          <option>Paid</option>
        </FilterSelect>
        <FilterSelect icon={Calendar}>
          <option>Last 30 days</option>
          <option>This month</option>
          <option>This quarter</option>
          <option>Custom range…</option>
        </FilterSelect>
        <FilterSelect icon={Store}>
          <option>All vendors</option>
        </FilterSelect>
        <FilterSelect icon={CreditCard}>
          <option>Any amount</option>
          <option>£0 – £5,000</option>
          <option>£5,000 – £20,000</option>
          <option>£20,000+</option>
        </FilterSelect>
        <button
          onClick={() => { setSelected(new Set()); setSearch(''); setPage(1) }}
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 ml-1"
        >
          <X className="w-4 h-4" /> Clear filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-11 px-4 py-3">
                  <Checkbox checked={allOn} indeterminate={someOn} onClick={toggleAll} />
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Invoice #</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Vendor</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Due date</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Uploaded</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isSelected = selected.has(row.num)
                  return (
                    <tr key={row.num} className={`transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <Checkbox checked={isSelected} onClick={() => toggle(row.num)} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900 whitespace-nowrap">{row.num}</td>
                      <td className="px-4 py-3 font-semibold text-gray-600">{row.vendor}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">{row.amount}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className={`px-4 py-3 text-sm whitespace-nowrap ${row.overdue ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        {row.overdue && <AlertCircle className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}
                        {row.due}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{row.uploaded}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => router.push(`/invoices/${row.num}`)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100">
          <span className="text-sm text-gray-400">
            Showing <strong className="text-gray-700">{((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalCount)}</strong> of <strong className="text-gray-700">{totalCount}</strong> results
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="inline-flex items-center gap-1 h-8 px-3 text-sm font-semibold border border-gray-200 rounded-lg text-gray-400 disabled:opacity-40 hover:enabled:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-sm font-bold rounded-lg transition-colors ${
                  page === p
                    ? 'bg-blue-50 border border-blue-600 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100 border border-transparent'
                }`}
              >
                {p}
              </button>
            ))}
            {totalPages > 4 && (
              <>
                <span className="text-gray-300 px-1">…</span>
                <button onClick={() => setPage(totalPages)} className="w-8 h-8 text-sm font-bold rounded-lg text-gray-500 hover:bg-gray-100 border border-transparent">
                  {totalPages}
                </button>
              </>
            )}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="inline-flex items-center gap-1 h-8 px-3 text-sm font-semibold border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 hover:enabled:bg-gray-50 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="sticky bottom-0 flex items-center gap-4 px-4 py-3 bg-gray-900 rounded-xl shadow-2xl">
          <span className="flex items-center gap-2 text-sm font-bold text-white">
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-blue-500 text-white text-xs font-black rounded-full">
              {selected.size}
            </span>
            selected
          </span>
          <button onClick={() => setSelected(new Set())} className="text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors">
            Clear
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 h-8 px-3 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors">
              <Check className="w-4 h-4" /> Approve selected
            </button>
            <button className="inline-flex items-center gap-1.5 h-8 px-3 bg-transparent hover:bg-white/10 border border-white/20 text-white text-sm font-semibold rounded-lg transition-colors">
              <Download className="w-4 h-4" /> Export selected
            </button>
            <button className="inline-flex items-center gap-1.5 h-8 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" /> Delete selected
            </button>
          </div>
        </div>
      )}
    </div>
  )
}