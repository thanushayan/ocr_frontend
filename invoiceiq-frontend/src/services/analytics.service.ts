import api from '../lib/axios'

// The backend exposes raw data (dashboard monthly breakdown + paged invoices)
// rather than pre-aggregated analytics endpoints, so aggregates are computed here.

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

export const analyticsService = {
  // Monthly spend for a year → [{ month, amount }]
  async getSpendTrend(clientId: string, year?: number) {
    const y = year ?? new Date().getFullYear()
    const invoices = await fetchAllInvoices(clientId)
    const byMonth = new Array(12).fill(0)
    for (const inv of invoices) {
      const d = new Date(inv.createdAt)
      if (d.getFullYear() === y) byMonth[d.getMonth()] += inv.totalAmount ?? 0
    }
    return MONTH_LABELS.map((m, i) => ({ month: m, amount: byMonth[i] }))
  },

  // Spend per vendor for a year/month → [{ vendorName, amount }]
  async getVendorSpend(clientId: string, year?: number, month?: number) {
    const invoices = await fetchAllInvoices(clientId)
    const totals = new Map<string, number>()
    for (const inv of invoices) {
      const d = new Date(inv.createdAt)
      if (year && d.getFullYear() !== year) continue
      if (month && d.getMonth() + 1 !== month) continue
      const key = inv.vendorName ?? 'Unassigned'
      totals.set(key, (totals.get(key) ?? 0) + (inv.totalAmount ?? 0))
    }
    return [...totals.entries()]
      .map(([vendorName, amount]) => ({ vendorName, amount }))
      .sort((a, b) => b.amount - a.amount)
  },

  // Spend per currency → [{ currency, amount }]
  async getCurrencyBreakdown(clientId: string, year?: number, month?: number) {
    const invoices = await fetchAllInvoices(clientId)
    const totals = new Map<string, number>()
    for (const inv of invoices) {
      const d = new Date(inv.createdAt)
      if (year && d.getFullYear() !== year) continue
      if (month && d.getMonth() + 1 !== month) continue
      const key = inv.currency ?? 'GBP'
      totals.set(key, (totals.get(key) ?? 0) + (inv.totalAmount ?? 0))
    }
    return [...totals.entries()].map(([currency, amount]) => ({ currency, amount }))
  },

  // No budget data in the backend — charts show their empty state
  async getBudgetVsActual(_clientId: string): Promise<never[]> {
    return []
  },

  // Current vs previous year per month → [{ month, '<prev>': n, '<curr>': n }]
  async getYearOverYear(clientId: string) {
    const curr = new Date().getFullYear()
    const prev = curr - 1
    const invoices = await fetchAllInvoices(clientId)
    const currTotals = new Array(12).fill(0)
    const prevTotals = new Array(12).fill(0)
    for (const inv of invoices) {
      const d = new Date(inv.createdAt)
      if (d.getFullYear() === curr) currTotals[d.getMonth()] += inv.totalAmount ?? 0
      if (d.getFullYear() === prev) prevTotals[d.getMonth()] += inv.totalAmount ?? 0
    }
    return MONTH_LABELS.map((m, i) => ({
      month: m,
      [String(prev)]: prevTotals[i],
      [String(curr)]: currTotals[i],
    }))
  },
}
