import vendorApi from '../lib/vendorAxios'
import Cookies from 'js-cookie'

export const vendorPortalService = {
  async login(email: string, password: string) {
    const { data } = await vendorApi.post('/api/vendor-portal/login', { email, password })
    Cookies.set('vendorAccessToken', data.token, { expires: 1 })
    return data
  },

  async acceptInvite(token: string, password: string) {
    const { data } = await vendorApi.post('/api/vendor-portal/accept-invite', { token, password })
    Cookies.set('vendorAccessToken', data.token, { expires: 1 })
    return data
  },

  async getMe() {
    const { data } = await vendorApi.get('/api/vendor-portal/me')
    return data
  },

  async getInvoices() {
    const { data } = await vendorApi.get('/api/vendor-portal/invoices')
    return data
  },

  async getInvoiceById(invoiceId: string) {
    const { data } = await vendorApi.get(`/api/vendor-portal/invoices/${invoiceId}`)
    return data
  },

  async submitInvoice(body: {
    fileName: string
    invoiceNumber?: string
    totalAmount?: number
    currency?: string
    invoiceDate?: string
  }) {
    const { data } = await vendorApi.post('/api/vendor-portal/invoices', body)
    return data
  },

  logout() {
    Cookies.remove('vendorAccessToken')
  },
}