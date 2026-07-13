import api from '../lib/axios'

export const purchaseOrderService = {
  async list(clientId: string) {
    const { data } = await api.get(`/api/clients/${clientId}/purchase-orders`)
    return data
  },

  async getById(clientId: string, poId: string) {
    const { data } = await api.get(`/api/clients/${clientId}/purchase-orders/${poId}`)
    return data
  },

  async create(clientId: string, body: any) {
    const { data } = await api.post(`/api/clients/${clientId}/purchase-orders`, body)
    return data
  },

  async update(clientId: string, poId: string, body: any) {
    const { data } = await api.put(`/api/clients/${clientId}/purchase-orders/${poId}`, body)
    return data
  },

  async remove(clientId: string, poId: string) {
    const { data } = await api.delete(`/api/clients/${clientId}/purchase-orders/${poId}`)
    return data
  },

  async getMatches(clientId: string, poId: string) {
    const { data } = await api.get(`/api/clients/${clientId}/purchase-orders/${poId}/matches`)
    return data
  },

  async reviewMatch(clientId: string, matchId: string, action: string) {
    const { data } = await api.post(`/api/clients/${clientId}/po-matches/${matchId}/review`, { action })
    return data
  },
}