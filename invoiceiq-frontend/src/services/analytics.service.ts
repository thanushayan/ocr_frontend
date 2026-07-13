import api from '../lib/axios'

export const analyticsService = {
  getSpendTrend: (clientId: string, year?: number) =>
    api.get(`/api/clients/${clientId}/reports/spend-trend`, { params: { year } }).then(r => r.data),

  getVendorSpend: (clientId: string, year?: number, month?: number) =>
    api.get(`/api/clients/${clientId}/reports/vendor-spend`, { params: { year, month } }).then(r => r.data),

  getCurrencyBreakdown: (clientId: string, year?: number, month?: number) =>
    api.get(`/api/clients/${clientId}/reports/currency-breakdown`, { params: { year, month } }).then(r => r.data),

  getBudgetVsActual: (clientId: string) =>
    api.get(`/api/clients/${clientId}/reports/budget-vs-actual`).then(r => r.data),

  getYearOverYear: (clientId: string) =>
    api.get(`/api/clients/${clientId}/reports/year-over-year`).then(r => r.data),
}