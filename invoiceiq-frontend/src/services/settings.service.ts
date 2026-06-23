import api from '../lib/axios'

export const settingsService = {
  // General (read-only — no update endpoint)
  getCompany: (companyId: string) =>
    api.get(`/api/companies/${companyId}`).then(r => r.data),

  // Currency
  getCurrencyRates: (companyId: string) =>
    api.get(`/api/companies/${companyId}/currency/rates`).then(r => r.data),

  getBaseCurrency: (companyId: string) =>
    api.get(`/api/companies/${companyId}/currency/base`).then(r => r.data),

  updateBaseCurrency: (companyId: string, currency: string) =>
    api.put(`/api/companies/${companyId}/currency/base`, { currency }).then(r => r.data),

  // Language
  getLanguage: (companyId: string) =>
    api.get(`/api/i18n/companies/${companyId}/language`).then(r => r.data),

  updateLanguage: (companyId: string, languageCode: string) =>
    api.put(`/api/i18n/companies/${companyId}/language`, { languageCode }).then(r => r.data),

  // Xero
  getXeroConnection: (companyId: string) =>
    api.get(`/api/xero/${companyId}/connection`).then(r => r.data).catch(() => null),

  syncXero: (companyId: string) =>
    api.post(`/api/xero/${companyId}/sync`, { invoiceIds: [] }).then(r => r.data),

  disconnectXero: (companyId: string) =>
    api.delete(`/api/xero/${companyId}/disconnect`).then(r => r.data),

  // API Keys
  getApiKeys: (companyId: string) =>
    api.get(`/api/companies/${companyId}/api-keys`).then(r => r.data),

  createApiKey: (companyId: string, name: string) =>
    api.post(`/api/companies/${companyId}/api-keys`, { name }).then(r => r.data),

  revokeApiKey: (companyId: string, keyId: string) =>
    api.delete(`/api/companies/${companyId}/api-keys/${keyId}`),
}