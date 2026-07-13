import api from '../lib/axios'
import type { AlcoholDutyPeriod, AlcoholDutyRate } from '../types/client.types'

export const alcoholDutyService = {
  async getPeriods(clientId: string): Promise<AlcoholDutyPeriod[]> {
    const { data } = await api.get<AlcoholDutyPeriod[]>(`/api/clients/${clientId}/alcohol-duty`)
    return data
  },

  async calculate(clientId: string, body: { periodFrom: string; periodTo: string; quarterLabel?: string }): Promise<AlcoholDutyPeriod> {
    const { data } = await api.post<AlcoholDutyPeriod>(`/api/clients/${clientId}/alcohol-duty/calculate`, body)
    return data
  },

  async getPeriod(clientId: string, periodId: string): Promise<AlcoholDutyPeriod> {
    const { data } = await api.get<AlcoholDutyPeriod>(`/api/clients/${clientId}/alcohol-duty/${periodId}`)
    return data
  },

  async submit(clientId: string, periodId: string): Promise<AlcoholDutyPeriod> {
    const { data } = await api.post<AlcoholDutyPeriod>(`/api/clients/${clientId}/alcohol-duty/${periodId}/submit`)
    return data
  },

  async getRates(): Promise<AlcoholDutyRate[]> {
    const { data } = await api.get<AlcoholDutyRate[]>('/api/alcohol-duty-rates')
    return data
  },
}
