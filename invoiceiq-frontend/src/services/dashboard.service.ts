import  api  from '../lib/axios'
import { DashboardData } from '../types/dashboard.types'

export const dashboardService = {
  async getDashboard(clientId: string): Promise<DashboardData> {
    const { data } = await api.get<DashboardData>(
      `/api/clients/${clientId}/dashboard`
    )
    return data
  },
}