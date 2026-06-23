import api from '../lib/axios'

export const reportsService = {
  async spendTrend(companyId: string, year?: number) {
    const { data } = await api.get(`/api/companies/${companyId}/reports/spend-trend`, { params: { year } })
    return data
  },
  async vendorSpend(companyId: string, year?: number, month?: number) {
    const { data } = await api.get(`/api/companies/${companyId}/reports/vendor-spend`, { params: { year, month } })
    return data
  },
  async currencyBreakdown(companyId: string, year?: number, month?: number) {
    const { data } = await api.get(`/api/companies/${companyId}/reports/currency-breakdown`, { params: { year, month } })
    return data
  },
  async yearOverYear(companyId: string) {
    const { data } = await api.get(`/api/companies/${companyId}/reports/year-over-year`)
    return data
  },
  exportUrl(companyId: string, type: 'invoices' | 'spend-by-vendor' | 'monthly') {
    return `/api/companies/${companyId}/reports/${type}.csv`
  },
}