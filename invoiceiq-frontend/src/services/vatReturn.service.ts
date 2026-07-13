import api from '../lib/axios'
import type { VatReturn } from '../types/client.types'

export const vatReturnService = {
  async getAll(clientId: string): Promise<VatReturn[]> {
    const { data } = await api.get<VatReturn[]>(`/api/clients/${clientId}/vat-returns`)
    return data
  },

  async create(clientId: string, body: { periodFrom: string; periodTo: string; notes?: string }): Promise<VatReturn> {
    const { data } = await api.post<VatReturn>(`/api/clients/${clientId}/vat-returns`, body)
    return data
  },

  async get(clientId: string, returnId: string): Promise<VatReturn> {
    const { data } = await api.get<VatReturn>(`/api/clients/${clientId}/vat-returns/${returnId}`)
    return data
  },

  async update(clientId: string, returnId: string, body: Partial<VatReturn>): Promise<VatReturn> {
    const { data } = await api.put<VatReturn>(`/api/clients/${clientId}/vat-returns/${returnId}`, body)
    return data
  },

  async submit(clientId: string, returnId: string): Promise<VatReturn> {
    const { data } = await api.post<VatReturn>(`/api/clients/${clientId}/vat-returns/${returnId}/submit`)
    return data
  },
}
