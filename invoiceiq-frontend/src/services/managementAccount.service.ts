import api from '../lib/axios'
import type { ManagementAccount } from '../types/client.types'

export const managementAccountService = {
  async getAll(clientId: string, year?: number): Promise<ManagementAccount[]> {
    const { data } = await api.get<ManagementAccount[]>(
      `/api/clients/${clientId}/management-accounts`,
      { params: year ? { year } : undefined }
    )
    return data
  },

  async create(clientId: string, body: Partial<ManagementAccount>): Promise<ManagementAccount> {
    const { data } = await api.post<ManagementAccount>(`/api/clients/${clientId}/management-accounts`, body)
    return data
  },

  async get(clientId: string, maId: string): Promise<ManagementAccount> {
    const { data } = await api.get<ManagementAccount>(`/api/clients/${clientId}/management-accounts/${maId}`)
    return data
  },

  async update(clientId: string, maId: string, body: Partial<ManagementAccount>): Promise<ManagementAccount> {
    const { data } = await api.put<ManagementAccount>(`/api/clients/${clientId}/management-accounts/${maId}`, body)
    return data
  },

  async sendToClient(clientId: string, maId: string): Promise<ManagementAccount> {
    const { data } = await api.post<ManagementAccount>(`/api/clients/${clientId}/management-accounts/${maId}/send`)
    return data
  },
}
