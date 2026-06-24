'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../hooks/useAuth'
import { analyticsService } from '../../../services/analytics.service'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, BarChart2, PieChart as PieIcon, Users, Calendar } from 'lucide-react'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe']
const CHART_COLORS = { primary: '#6366f1', secondary: '#8b5cf6', muted: '#e0e7ff' }

function fmt(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `£${(n / 1_000).toFixed(1)}K`
  return `£${n.toFixed(0)}`
}

function KpiCard({ label, value, sub, trend, icon: Icon }: {
  label: string; value: string; sub?: string
  trend?: { value: number; label: string }
  icon: React.ElementType
}) {
  const up = (trend?.value ?? 0) >= 0
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500">{label}</span>
        <span className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  )
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function ChartSkeleton({ h = 260 }: { h?: number }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg`} style={{ height: h }} />
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-bold" style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { companyId } = useAuth()
  const [year, setYear]   = useState(CURRENT_YEAR)
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const { data: spendTrend, isLoading: l1 } = useQuery({
    queryKey: ['analytics-spend-trend', companyId, year],
    queryFn: () => analyticsService.getSpendTrend(companyId!, year),
    enabled: !!companyId,
  })

  const { data: vendorSpend, isLoading: l2 } = useQuery({
    queryKey: ['analytics-vendor-spend', companyId, year, month],
    queryFn: () => analyticsService.getVendorSpend(companyId!, year, month),
    enabled: !!companyId,
  })

  const { data: currencyBreakdown, isLoading: l3 } = useQuery({
    queryKey: ['analytics-currency', companyId, year, month],
    queryFn: () => analyticsService.getCurrencyBreakdown(companyId!, year, month),
    enabled: !!companyId,
  })

  const { data: budgetVsActual, isLoading: l4 } = useQuery({
    queryKey: ['analytics-budget', companyId],
    queryFn: () => analyticsService.getBudgetVsActual(companyId!),
    enabled: !!companyId,
  })

  const { data: yoy, isLoading: l5 } = useQuery({
    queryKey: ['analytics-yoy', companyId],
    queryFn: () => analyticsService.getYearOverYear(companyId!),
    enabled: !!companyId,
  })

  // Normalise data — backend may return arrays or wrapped objects
  const trendData: any[]    = Array.isArray(spendTrend) ? spendTrend : (spendTrend?.data ?? [])
  const vendorData: any[]   = Array.isArray(vendorSpend) ? vendorSpend : (vendorSpend?.data ?? [])
  const currencyData: any[] = Array.isArray(currencyBreakdown) ? currencyBreakdown : (currencyBreakdown?.data ?? [])
  const budgetData: any[]   = Array.isArray(budgetVsActual) ? budgetVsActual : (budgetVsActual?.data ?? [])
  const yoyData: any[]      = Array.isArray(yoy) ? yoy : (yoy?.data ?? [])

  // KPIs derived from trend data
  const totalSpend   = trendData.reduce((s, d) => s + (d.amount ?? d.spend ?? d.total ?? 0), 0)
  const avgMonthly   = trendData.length ? totalSpend / trendData.length : 0
  const topVendor    = vendorData[0]
  const totalVendors = vendorData.length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Spend insights and trends for your company</p>
        </div>

        {/* Year / Month filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 h-9 bg-white">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 h-9 bg-white">
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Spend"
          value={fmt(totalSpend)}
          sub={`${year}`}
          trend={{ value: 12, label: 'vs last year' }}
          icon={TrendingUp}
        />
        <KpiCard
          label="Avg Monthly Spend"
          value={fmt(avgMonthly)}
          sub="per month"
          icon={BarChart2}
        />
        <KpiCard
          label="Top Vendor"
          value={topVendor?.vendor ?? topVendor?.vendorName ?? '—'}
          sub={topVendor ? fmt(topVendor.amount ?? topVendor.total ?? 0) : undefined}
          icon={Users}
        />
        <KpiCard
          label="Active Vendors"
          value={String(totalVendors)}
          sub={`${MONTHS[month - 1]} ${year}`}
          icon={PieIcon}
        />
      </div>

      {/* Spend Trend — full width */}
      <SectionCard
        title={`Monthly Spend Trend — ${year}`}
        action={
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
            {YEARS.map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${year === y ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {y}
              </button>
            ))}
          </div>
        }
      >
        {l1 ? <ChartSkeleton /> : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={Object.keys(trendData[0] ?? { amount: 0 }).find(k => k !== 'month') ?? 'amount'}
                name="Spend"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                fill="url(#spendGrad)"
                dot={false}
                activeDot={{ r: 4, fill: CHART_COLORS.primary }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Row: Vendor Spend + Currency Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Vendors */}
        <SectionCard title={`Top Vendors — ${MONTHS[month - 1]} ${year}`}>
          {l2 ? <ChartSkeleton /> : vendorData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vendorData.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey={Object.keys(vendorData[0] ?? { vendorName: '' }).find(k => k.toLowerCase().includes('vendor') || k.toLowerCase().includes('name')) ?? 'vendorName'}
                  tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey={Object.keys(vendorData[0] ?? { amount: 0 }).find(k => k === 'amount' || k === 'total' || k === 'spend') ?? 'amount'}
                  name="Spend"
                  fill={CHART_COLORS.primary}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Currency Breakdown */}
        <SectionCard title={`Currency Breakdown — ${MONTHS[month - 1]} ${year}`}>
          {l3 ? <ChartSkeleton /> : currencyData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">No data</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie
                    data={currencyData}
                    dataKey={Object.keys(currencyData[0] ?? { amount: 0 }).find(k => k === 'amount' || k === 'total' || k === 'spend') ?? 'amount'}
                    nameKey={Object.keys(currencyData[0] ?? { currency: '' }).find(k => k.toLowerCase().includes('currency') || k.toLowerCase().includes('code')) ?? 'currency'}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    paddingAngle={3}
                  >
                    {currencyData.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {currencyData.slice(0, 5).map((d: any, i: number) => {
                  const nameKey = Object.keys(d).find(k => k.toLowerCase().includes('currency') || k.toLowerCase().includes('code')) ?? 'currency'
                  const valKey  = Object.keys(d).find(k => k === 'amount' || k === 'total' || k === 'spend') ?? 'amount'
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-600 flex-1 truncate">{d[nameKey]}</span>
                      <span className="text-xs font-bold text-gray-800">{fmt(d[valKey] ?? 0)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Row: Budget vs Actual + YoY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Budget vs Actual */}
        <SectionCard title="Budget vs Actual">
          {l4 ? <ChartSkeleton /> : budgetData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey={Object.keys(budgetData[0] ?? { name: '' }).find(k => k === 'name' || k === 'vendor' || k === 'category' || k === 'label') ?? 'name'} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="budget"  name="Budget" fill={CHART_COLORS.muted}    radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual"  name="Actual" fill={CHART_COLORS.primary}  radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Year over Year */}
        <SectionCard title="Year-over-Year Comparison">
          {l5 ? <ChartSkeleton /> : yoyData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={yoyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey={String(CURRENT_YEAR - 1)} name={String(CURRENT_YEAR - 1)} fill={CHART_COLORS.muted}      radius={[4, 4, 0, 0]} />
                <Bar dataKey={String(CURRENT_YEAR)}     name={String(CURRENT_YEAR)}     fill={CHART_COLORS.primary}    radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

      </div>
    </div>
  )
}