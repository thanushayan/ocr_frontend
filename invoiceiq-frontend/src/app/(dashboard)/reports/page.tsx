'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Download, Store, Coins, Calendar, FileText,
} from 'lucide-react'
import api from '../../../lib/axios'
import { reportsService } from '../../../services/reports.service'
import { useAuth } from '../../../hooks/useAuth'

interface SpendTrendItem { year: number; month: number; monthLabel: string; totalConverted: number; totalOriginal: number; invoiceCount: number }
interface SpendTrend { baseCurrency: string; months: SpendTrendItem[] }
interface VendorSpendItem { vendorId: string; vendorName: string; totalConverted: number; invoiceCount: number; topCurrency: string }
interface VendorSpend { baseCurrency: string; vendors: VendorSpendItem[] }
interface CurrencyItem { currency: string; invoiceCount: number; totalOriginalAmount: number; totalConvertedAmount: number; averageRate: number }
interface CurrencyBreakdown { baseCurrency: string; grandTotal: number; currencies: CurrencyItem[] }
interface YoyMonth { month: number; monthLabel: string; currentYear: number; previousYear: number; changePercent: number }
interface Yoy { baseCurrency: string; currentYear: number; previousYear: number; currentYearTotal: number; previousYearTotal: number; changePercent: number; months: YoyMonth[] }

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899']

function fmt(n: number, currency = 'GBP') {
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n) }
  catch { return `£${n.toLocaleString()}` }
}

export default function ReportsPage() {
  const { activeClientId: clientId } = useAuth()
  const year = new Date().getFullYear()

  const { data: trend } = useQuery<SpendTrend>({
    queryKey: ['report-spend-trend', clientId, year],
    queryFn: () => reportsService.spendTrend(clientId!, year),
    enabled: !!clientId,
  })

  const { data: vendorSpend } = useQuery<VendorSpend>({
    queryKey: ['report-vendor-spend', clientId, year],
    queryFn: () => reportsService.vendorSpend(clientId!, year),
    enabled: !!clientId,
  })

  const { data: currency } = useQuery<CurrencyBreakdown>({
    queryKey: ['report-currency', clientId, year],
    queryFn: () => reportsService.currencyBreakdown(clientId!, year),
    enabled: !!clientId,
  })

  const { data: yoy } = useQuery<Yoy>({
    queryKey: ['report-yoy', clientId],
    queryFn: () => reportsService.yearOverYear(clientId!),
    enabled: !!clientId,
  })

  const base = trend?.baseCurrency ?? 'GBP'

  // CSV download via axios (auth header) → blob
  const downloadCsv = async (type: 'invoices' | 'spend-by-vendor' | 'monthly') => {
    const res = await api.get(reportsService.exportUrl(clientId!, type), { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}-${year}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const trendData = trend?.months?.map(m => ({ month: m.monthLabel, amount: m.totalConverted, count: m.invoiceCount })) ?? []
  const topVendors = vendorSpend?.vendors?.slice(0, 8).map(v => ({ name: v.vendorName, amount: v.totalConverted })) ?? []
  const currencyData = currency?.currencies?.map(c => ({ name: c.currency, value: c.totalConvertedAmount })) ?? []
  const yoyData = yoy?.months?.map(m => ({ month: m.monthLabel, [String(yoy.currentYear)]: m.currentYear, [String(yoy.previousYear)]: m.previousYear })) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Spend trends, vendor breakdown and exports — {year}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => downloadCsv('invoices')}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Invoices CSV
          </button>
          <button onClick={() => downloadCsv('spend-by-vendor')}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Vendor CSV
          </button>
          <button onClick={() => downloadCsv('monthly')}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            <Download className="w-4 h-4" /> Monthly CSV
          </button>
        </div>
      </div>

      {/* YoY KPI cards */}
      {yoy && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"><Calendar className="w-4 h-4" /> {yoy.currentYear} total</div>
            <p className="text-2xl font-bold text-gray-900">{fmt(yoy.currentYearTotal, base)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"><Calendar className="w-4 h-4" /> {yoy.previousYear} total</div>
            <p className="text-2xl font-bold text-gray-900">{fmt(yoy.previousYearTotal, base)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">YoY change</div>
            <p className={`text-2xl font-bold flex items-center gap-1.5 ${yoy.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {yoy.changePercent >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {Math.abs(yoy.changePercent).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Spend trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Spend trend ({year})</h2>
        {trendData.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-sm text-gray-400">No data for {year}</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmt(v, base)} />
              <Tooltip formatter={(v) => [fmt(Number(v), base), 'Spend']} />
              <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fill="url(#spend)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top vendors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><Store className="w-4 h-4 text-emerald-500" /> Top vendors by spend</h2>
          {topVendors.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-sm text-gray-400">No vendor data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topVendors} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v, base)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v) => [fmt(Number(v), base), 'Spend']} />
                <Bar dataKey="amount" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Currency breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2"><Coins className="w-4 h-4 text-amber-500" /> Currency breakdown</h2>
          {currencyData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-sm text-gray-400">No currency data</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={currencyData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {currencyData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(Number(v), base)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Year over year */}
      {yoyData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-500" /> Year over year ({yoy?.previousYear} vs {yoy?.currentYear})
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={yoyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => fmt(v, base)} />
              <Tooltip formatter={(v) => fmt(Number(v), base)} />
              <Legend />
              <Bar dataKey={String(yoy?.previousYear)} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey={String(yoy?.currentYear)} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Vendor table */}
      {vendorSpend && vendorSpend.vendors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> Vendor spend detail</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Vendor', 'Invoices', 'Top currency', 'Total'].map((h, i) => (
                  <th key={h} className={`text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendorSpend.vendors.map(v => (
                <tr key={v.vendorId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-700">{v.vendorName}</td>
                  <td className="px-6 py-4 text-gray-500">{v.invoiceCount}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{v.topCurrency}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">{fmt(v.totalConverted, base)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}