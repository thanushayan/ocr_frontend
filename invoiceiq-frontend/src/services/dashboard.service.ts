import api from '../lib/axios'
import type { ClientDashboard } from '../types/client.types'

export const dashboardService = {
  // Client-specific dashboard (was company dashboard)
  async getDashboard(clientId: string): Promise<ClientDashboard> {
    const { data } = await api.get<ClientDashboard>(`/api/clients/${clientId}/dashboard`)
    return data
  },

  // Accountant-level overview (new)
  async getAccountantOverview() {
    const { data } = await api.get('/api/accountant/dashboard')
    return data
  },
}
