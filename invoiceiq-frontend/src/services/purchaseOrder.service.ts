import api from '../lib/axios'

export const purchaseOrderService = {
  async list(companyId: string) {
    const { data } = await api.get(`/api/companies/${companyId}/purchase-orders`)
    return data
  },

  async getById(companyId: string, poId: string) {
    const { data } = await api.get(`/api/companies/${companyId}/purchase-orders/${poId}`)
    return data
  },

  async create(companyId: string, body: any) {
    const { data } = await api.post(`/api/companies/${companyId}/purchase-orders`, body)
    return data
  },

  async update(companyId: string, poId: string, body: any) {
    const { data } = await api.put(`/api/companies/${companyId}/purchase-orders/${poId}`, body)
    return data
  },

  async remove(companyId: string, poId: string) {
    const { data } = await api.delete(`/api/companies/${companyId}/purchase-orders/${poId}`)
    return data
  },

  async getMatches(companyId: string, poId: string) {
    const { data } = await api.get(`/api/companies/${companyId}/purchase-orders/${poId}/matches`)
    return data
  },

  async reviewMatch(companyId: string, matchId: string, action: string) {
    const { data } = await api.post(`/api/companies/${companyId}/po-matches/${matchId}/review`, { action })
    return data
  },
}