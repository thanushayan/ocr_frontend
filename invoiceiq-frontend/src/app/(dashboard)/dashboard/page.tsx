'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { DashboardData } from '../../../types/dashboard.types'

// Dummy fallback data
const dummyKpis = {
  totalInvoices: 1284,
  pendingApproval: 47,
  approved: 1102,
  rejected: 135,
  totalSpend: 284750.00,
}

const spendTrendData = [
  { month: 'Jan', amount: 45000 },
  { month: 'Feb', amount: 52000 },
  { month: 'Mar', amount: 38000 },
  { month: 'Apr', amount: 61000 },
  { month: 'May', amount: 55000 },
  { month: 'Jun', amount: 67000 },
  { month: 'Jul', amount: 72000 },
  { month: 'Aug', amount: 58000 },
  { month: 'Sep', amount: 69000 },
  { month: 'Oct', amount: 74000 },
  { month: 'Nov', amount: 82000 },
  { month: 'Dec', amount: 79000 },
]

const dummyRecentInvoices = [
  { id: 'INV-2024-001', vendor: 'Acme Corp', amount: 12500.00, date: '2024-01-15', status: 'pending' },
  { id: 'INV-2024-002', vendor: 'Tech Solutions Ltd', amount: 8750.50, date: '2024-01-14', status: 'approved' },
  { id: 'INV-2024-003', vendor: 'Global Supplies', amount: 3200.00, date: '2024-01-13', status: 'rejected' },
  { id: 'INV-2024-004', vendor: 'Office Pro', amount: 1850.75, date: '2024-01-12', status: 'approved' },
  { id: 'INV-2024-005', vendor: 'Marketing Plus', amount: 22000.00, date: '2024-01-11', status: 'pending' },
]

const dummyPendingApprovals = [
  { id: 'INV-2024-006', vendor: 'Cloud Services Inc', amount: 15000.00, daysWaiting: 3 },
  { id: 'INV-2024-007', vendor: 'Design Studio', amount: 4500.00, daysWaiting: 1 },
  { id: 'INV-2024-008', vendor: 'Logistics Co', amount: 9800.00, daysWaiting: 5 },
]

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
  const { companyId } = useAuth()

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard', companyId],
    queryFn: () => dashboardService.getDashboard(companyId!),
    enabled: !!companyId,
  })

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  // API → UI mapping with dummy fallback
  const kpis = {
    totalInvoices:   data?.totalInvoices   ?? dummyKpis.totalInvoices,
    pendingApproval: data?.pendingInvoices  ?? dummyKpis.pendingApproval,
    approved:        data?.approvedInvoices ?? dummyKpis.approved,
    rejected:        data?.failedInvoices   ?? dummyKpis.rejected,
    totalSpend:      data?.totalSpend       ?? dummyKpis.totalSpend,
  }

  const chartData = data?.monthlyBreakdown?.map(m => ({
    month: m.monthName,
    amount: m.totalAmount,
  })) ?? spendTrendData

  const statusData = [
    { name: 'Approved', value: kpis.approved, color: '#10b981' },
    { name: 'Pending',  value: kpis.pendingApproval, color: '#f59e0b' },
    { name: 'Rejected', value: kpis.rejected, color: '#ef4444' },
  ]

  const invoices = data?.recentInvoices?.map(inv => ({
    id:     inv.id,
    vendor: inv.vendorName ?? '—',
    amount: inv.totalAmount ?? 0,
    date:   inv.createdAt.split('T')[0],
    status: inv.status,
  })) ?? dummyRecentInvoices

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
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-blue-600">{inv.id}</td>
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
            {dummyPendingApprovals.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-blue-600">{item.id}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.vendor}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 shrink-0">{formatCurrency(item.amount)}</p>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs text-amber-600">Waiting {item.daysWaiting} day{item.daysWaiting > 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg py-1.5 font-medium transition-colors">
                    Approve
                  </button>
                  <button className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded-lg py-1.5 font-medium transition-colors">
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