import api from '../lib/axios'

// Aggregates are computed from the invoice list — the backend's reporting
// controller serves CSV exports (used via exportUrl below) rather than JSON.

interface InvoiceRow {
  id: string
  totalAmount?: number
  currency?: string
  vendorName?: string
  status?: string
  createdAt: string
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

async function fetchAllInvoices(clientId: string): Promise<InvoiceRow[]> {
  const { data } = await api.get(`/api/clients/${clientId}/invoices`, {
    params: { page: 1, pageSize: 500, sortBy: 'createdAt', sortDir: 'desc' },
  })
  return data?.items ?? []
}

export const reportsService = {
  async spendTrend(clientId: string, year?: number) {
    const y = year ?? new Date().getFullYear()
    const invoices = await fetchAllInvoices(clientId)
    const amounts = new Array(12).fill(0)
    const counts = new Array(12).fill(0)
    for (const inv of invoices) {
      const d = new Date(inv.createdAt)
      if (d.getFullYear() !== y) continue
      amounts[d.getMonth()] += inv.totalAmount ?? 0
      counts[d.getMonth()] += 1
    }
    return {
      baseCurrency: invoices[0]?.currency ?? 'GBP',
      months: MONTH_LABELS.map((m, i) => ({
        year: y,
        month: i + 1,
        monthLabel: m,
        totalConverted: amounts[i],
        totalOriginal: amounts[i],
        invoiceCount: counts[i],
      })),
    }
  },

  async vendorSpend(clientId: string, year?: number) {
    const invoices = await fetchAllInvoices(clientId)
    const agg = new Map<string, { total: number; count: number; currency: string }>()
    for (const inv of invoices) {
      if (year && new Date(inv.createdAt).getFullYear() !== year) continue
      const key = inv.vendorName ?? 'Unassigned'
      const e = agg.get(key) ?? { total: 0, count: 0, currency: inv.currency ?? 'GBP' }
      e.total += inv.totalAmount ?? 0
      e.count += 1
      agg.set(key, e)
    }
    return {
      baseCurrency: invoices[0]?.currency ?? 'GBP',
      vendors: [...agg.entries()]
        .map(([vendorName, e]) => ({
          vendorId: vendorName,
          vendorName,
          totalConverted: e.total,
          invoiceCount: e.count,
          topCurrency: e.currency,
        }))
        .sort((a, b) => b.totalConverted - a.totalConverted),
    }
  },

  async currencyBreakdown(clientId: string, year?: number) {
    const invoices = await fetchAllInvoices(clientId)
    const totals = new Map<string, number>()
    for (const inv of invoices) {
      if (year && new Date(inv.createdAt).getFullYear() !== year) continue
      const key = inv.currency ?? 'GBP'
      totals.set(key, (totals.get(key) ?? 0) + (inv.totalAmount ?? 0))
    }
    const currencies = [...totals.entries()].map(([currency, totalConvertedAmount]) => ({
      currency,
      totalConvertedAmount,
      totalOriginalAmount: totalConvertedAmount,
      invoiceCount: invoices.filter(i => (i.currency ?? 'GBP') === currency).length,
      averageRate: 1,
    }))
    return {
      baseCurrency: invoices[0]?.currency ?? 'GBP',
      grandTotal: currencies.reduce((s2, c) => s2 + c.totalConvertedAmount, 0),
      currencies,
    }
  },

  async yearOverYear(clientId: string) {
    const currentYear = new Date().getFullYear()
    const previousYear = currentYear - 1
    const invoices = await fetchAllInvoices(clientId)
    const curr = new Array(12).fill(0)
    const prev = new Array(12).fill(0)
    for (const inv of invoices) {
      const d = new Date(inv.createdAt)
      if (d.getFullYear() === currentYear) curr[d.getMonth()] += inv.totalAmount ?? 0
      if (d.getFullYear() === previousYear) prev[d.getMonth()] += inv.totalAmount ?? 0
    }
    const currentYearTotal = curr.reduce((a, b) => a + b, 0)
    const previousYearTotal = prev.reduce((a, b) => a + b, 0)
    return {
      baseCurrency: invoices[0]?.currency ?? 'GBP',
      currentYear,
      previousYear,
      currentYearTotal,
      previousYearTotal,
      changePercent: previousYearTotal ? ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100 : 0,
      months: MONTH_LABELS.map((m, i) => ({
        month: i + 1,
        monthLabel: m,
        currentYear: curr[i],
        previousYear: prev[i],
        changePercent: prev[i] ? ((curr[i] - prev[i]) / prev[i]) * 100 : 0,
      })),
    }
  },

  // CSV exports — these routes exist on the backend as-is
  exportUrl(clientId: string, type: 'invoices' | 'spend-by-vendor' | 'monthly') {
    return `/api/clients/${clientId}/reports/${type}.csv`
  },
}
