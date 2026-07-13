import api from '../lib/axios'

export const reportsService = {
  async spendTrend(clientId: string, year?: number) {
    const { data } = await api.get(`/api/clients/${clientId}/reports/spend-trend`, { params: { year } })
    return data
  },
  async vendorSpend(clientId: string, year?: number, month?: number) {
    const { data } = await api.get(`/api/clients/${clientId}/reports/vendor-spend`, { params: { year, month } })
    return data
  },
  async currencyBreakdown(clientId: string, year?: number, month?: number) {
    const { data } = await api.get(`/api/clients/${clientId}/reports/currency-breakdown`, { params: { year, month } })
    return data
  },
  async yearOverYear(clientId: string) {
    const { data } = await api.get(`/api/clients/${clientId}/reports/year-over-year`)
    return data
  },
  exportUrl(clientId: string, type: 'invoices' | 'spend-by-vendor' | 'monthly') {
    return `/api/clients/${clientId}/reports/${type}.csv`
  },
}