'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  FileText, Clock, CheckCircle,
  TrendingUp, AlertCircle, ChevronRight, Eye
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '../../../hooks/useAuth'
import { dashboardService } from '../../../services/dashboard.service'
import { approvalsService } from '../../../services/approvals.service'
import { toast } from 'sonner'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending:    { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Pending' },
    approved:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved' },
    rejected:   { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Rejected' },
    processing: { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Processing' },
    failed:     { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Failed' },
  }
  const s = map[status.toLowerCase()] ?? map['pending']
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

function KpiCard({
  title, value, icon: Icon, color, subtitle
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  subtitle?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { activeClient } = useAuth()
  const clientId = activeClient?.id

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', clientId],
    queryFn: () => dashboardService.getDashboard(activeClient!.id),
    enabled: !!activeClient?.id,
  })

  const queryClient = useQueryClient()

  // Pending approvals (GET /api/approvals/pending)
  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['approvals-pending'],
    queryFn: () => approvalsService.getPending() as Promise<Array<{
      id: string; invoiceId: string; invoiceNumber?: string
      workflowName: string; currentStep: number; createdAt: string
    }>>,
    enabled: !!clientId,
  })

  const actMutation = useMutation({
    mutationFn: ({ instanceId, action }: { instanceId: string; action: 'Approved' | 'Rejected' }) =>
      approvalsService.act(instanceId, action),
    onSuccess: (_, vars) => {
      toast.success(vars.action === 'Approved' ? 'Invoice approved' : 'Invoice rejected')
      queryClient.invalidateQueries({ queryKey: ['approvals-pending'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', clientId] })
    },
    onError: () => toast.error('Action failed'),
  })

  const baseCurrency = activeClient?.baseCurrency ?? 'GBP'
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: baseCurrency }).format(amount)

  const daysWaiting = (d: string) =>
    Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000))

  // API → UI mapping (real data only)
  const kpis = {
    totalInvoices:   data?.totalInvoices    ?? 0,
    pendingApproval: data?.pendingInvoices  ?? 0,
    approved:        data?.approvedInvoices ?? 0,
    rejected:        data?.failedInvoices   ?? 0,
    totalSpend:      data?.totalSpend       ?? 0,
  }

  const chartData = data?.monthlyBreakdown?.map(m => ({
    month: m.monthName,
    amount: m.totalAmount,
  })) ?? []

  const statusData = [
    { name: 'Approved', value: kpis.approved, color: '#10b981' },
    { name: 'Pending',  value: kpis.pendingApproval, color: '#f59e0b' },
    { name: 'Rejected', value: kpis.rejected, color: '#ef4444' },
  ]

  const invoices = data?.recentInvoices?.map(inv => ({
    id:     inv.id,
    num:    (inv as { invoiceNumber?: string }).invoiceNumber ?? inv.id.slice(0, 8),
    vendor: inv.vendorName ?? '—',
    amount: inv.totalAmount ?? 0,
    date:   inv.createdAt.split('T')[0],
    status: inv.status,
  })) ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* பக்கம் தலைப்பு */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {activeClient && (
          <p className="text-sm text-blue-600 font-medium mt-0.5">
            📍 {activeClient.businessName} · {activeClient.businessPostcode}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with your invoices.</p>
      </div>

      {/* KPI அட்டைகள் */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Invoices"
          value={kpis.totalInvoices.toLocaleString()}
          icon={FileText}
          color="bg-blue-500"
          subtitle="All time"
        />
        <KpiCard
          title="Pending Approval"
          value={kpis.pendingApproval}
          icon={Clock}
          color="bg-amber-500"
          subtitle="Requires action"
        />
        <KpiCard
          title="Approved"
          value={kpis.approved.toLocaleString()}
          icon={CheckCircle}
          color="bg-emerald-500"
          subtitle="This year"
        />
        <KpiCard
          title="Total Spend"
          value={formatCurrency(kpis.totalSpend)}
          icon={TrendingUp}
          color="bg-purple-500"
          subtitle="This year"
        />
      </div>

      {/* விளக்கப்படங்கள் வரிசை */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Spend Trend Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Spend Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Spend']} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#spendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Donut */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Invoice Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices + Pending Approvals */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Invoices Table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Invoices</h2>
            <Link href="/invoices" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Invoice</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Vendor</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">No invoices yet — upload your first invoice.</td></tr>
                )}
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-blue-600">{inv.num}</td>
                    <td className="px-6 py-4 text-gray-700">{inv.vendor}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{formatCurrency(inv.amount)}</td>
                    <td className="px-6 py-4 text-gray-500">{inv.date}</td>
                    <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                    <td className="px-6 py-4">
                      <Link href={`/invoices/${inv.id}`} className="text-gray-400 hover:text-blue-600">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Pending Approvals</h2>
            <Link href="/approvals" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingApprovals.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-400">Nothing waiting for approval. 🎉</div>
            )}
            {pendingApprovals.slice(0, 5).map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/invoices/${item.invoiceId}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {item.invoiceNumber ?? item.invoiceId.slice(0, 8)}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{item.workflowName} · step {item.currentStep}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs text-amber-600">
                    Waiting {daysWaiting(item.createdAt)} day{daysWaiting(item.createdAt) === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => actMutation.mutate({ instanceId: item.id, action: 'Approved' })}
                    disabled={actMutation.isPending}
                    className="flex-1 text-xs bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 rounded-lg py-1.5 font-medium transition-colors">
                    Approve
                  </button>
                  <button
                    onClick={() => actMutation.mutate({ instanceId: item.id, action: 'Rejected' })}
                    disabled={actMutation.isPending}
                    className="flex-1 text-xs bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 rounded-lg py-1.5 font-medium transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}