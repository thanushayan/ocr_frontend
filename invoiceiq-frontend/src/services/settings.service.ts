import api from '../lib/axios'

const LANGUAGE_KEY = 'iq_language'

export const settingsService = {
  // General — client record (read via ClientController)
  getCompany: (clientId: string) =>
    api.get(`/api/clients/${clientId}`).then(r => r.data),

  // Currency
  getCurrencyRates: (clientId: string) =>
    api.get(`/api/clients/${clientId}/currency/rates`).then(r => r.data),

  getBaseCurrency: (clientId: string) =>
    api.get(`/api/clients/${clientId}/currency/base`).then(r => r.data),

  updateBaseCurrency: (clientId: string, currency: string) =>
    api.put(`/api/clients/${clientId}/currency/base`, { currency }).then(r => r.data),

  // Language — no backend endpoint; preference is stored locally
  getLanguage: async (_clientId: string): Promise<{ languageCode: string }> => {
    const code = typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_KEY) : null
    return { languageCode: code ?? 'en' }
  },

  updateLanguage: async (_clientId: string, languageCode: string): Promise<{ languageCode: string }> => {
    if (typeof window !== 'undefined') localStorage.setItem(LANGUAGE_KEY, languageCode)
    return { languageCode }
  },

  // Xero
  getXeroConnection: (clientId: string) =>
    api.get(`/api/xero/${clientId}/connection`).then(r => r.data).catch(() => null),

  syncXero: (clientId: string) =>
    api.post(`/api/xero/${clientId}/sync`, { invoiceIds: [] }).then(r => r.data),

  disconnectXero: (clientId: string) =>
    api.delete(`/api/xero/${clientId}/disconnect`).then(r => r.data),

  // API Keys — accountant-level in the backend (no client scoping)
  getApiKeys: () =>
    api.get('/api/api-keys').then(r => r.data),

  createApiKey: (name: string) =>
    api.post('/api/api-keys', { name }).then(r => r.data),

  revokeApiKey: (keyId: string) =>
    api.delete(`/api/api-keys/${keyId}`),
}
