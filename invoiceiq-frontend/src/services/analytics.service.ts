import api from '../lib/axios'

export const analyticsService = {
  getSpendTrend: (companyId: string, year?: number) =>
    api.get(`/api/companies/${companyId}/reports/spend-trend`, { params: { year } }).then(r => r.data),

  getVendorSpend: (companyId: string, year?: number, month?: number) =>
    api.get(`/api/companies/${companyId}/reports/vendor-spend`, { params: { year, month } }).then(r => r.data),

  getCurrencyBreakdown: (companyId: string, year?: number, month?: number) =>
    api.get(`/api/companies/${companyId}/reports/currency-breakdown`, { params: { year, month } }).then(r => r.data),

  getBudgetVsActual: (companyId: string) =>
    api.get(`/api/companies/${companyId}/reports/budget-vs-actual`).then(r => r.data),

  getYearOverYear: (companyId: string) =>
    api.get(`/api/companies/${companyId}/reports/year-over-year`).then(r => r.data),
}