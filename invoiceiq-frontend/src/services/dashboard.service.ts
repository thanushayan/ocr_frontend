import api from '../lib/axios'
import { DashboardData } from '../types/dashboard.types'

export const dashboardService = {
  async get(companyId: string): Promise<DashboardData> {
    const { data } = await api.get<DashboardData>(
      `/api/companies/${companyId}/dashboard`
    )
    return data
  },
}