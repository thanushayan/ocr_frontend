import api from '../lib/axios'

export const settingsService = {
  // General (read-only — no update endpoint)
  getCompany: (clientId: string) =>
    api.get(`/api/clients/${clientId}`).then(r => r.data),

  // Currency
  getCurrencyRates: (clientId: string) =>
    api.get(`/api/clients/${clientId}/currency/rates`).then(r => r.data),

  getBaseCurrency: (clientId: string) =>
    api.get(`/api/clients/${clientId}/currency/base`).then(r => r.data),

  updateBaseCurrency: (clientId: string, currency: string) =>
    api.put(`/api/clients/${clientId}/currency/base`, { currency }).then(r => r.data),

  // Language
  getLanguage: (clientId: string) =>
    api.get(`/api/i18n/clients/${clientId}/language`).then(r => r.data),

  updateLanguage: (clientId: string, languageCode: string) =>
    api.put(`/api/i18n/clients/${clientId}/language`, { languageCode }).then(r => r.data),

  // Xero
  getXeroConnection: (clientId: string) =>
    api.get(`/api/xero/${clientId}/connection`).then(r => r.data).catch(() => null),

  syncXero: (clientId: string) =>
    api.post(`/api/xero/${clientId}/sync`, { invoiceIds: [] }).then(r => r.data),

  disconnectXero: (clientId: string) =>
    api.delete(`/api/xero/${clientId}/disconnect`).then(r => r.data),

  // API Keys
  getApiKeys: (clientId: string) =>
    api.get(`/api/clients/${clientId}/api-keys`).then(r => r.data),

  createApiKey: (clientId: string, name: string) =>
    api.post(`/api/clients/${clientId}/api-keys`, { name }).then(r => r.data),

  revokeApiKey: (clientId: string, keyId: string) =>
    api.delete(`/api/clients/${clientId}/api-keys/${keyId}`),
}