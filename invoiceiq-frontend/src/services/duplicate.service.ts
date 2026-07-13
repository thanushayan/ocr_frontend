import api from '../lib/axios'

export interface DuplicateFlag {
  id: string
  invoiceId: string
  invoiceNumber?: string
  invoiceFileName?: string
  duplicateOfInvoiceId: string
  duplicateOfInvoiceNumber?: string
  duplicateOfInvoiceFileName?: string
  matchReason: string
  matchScore: number
  status: string            // 'Pending' | 'Confirmed' | 'Dismissed'
  reviewNote?: string
  detectedAt: string
  reviewedAt?: string
}

export const duplicateService = {
  async getAll(clientId: string): Promise<DuplicateFlag[]> {
    const { data } = await api.get<DuplicateFlag[]>(`/api/clients/${clientId}/duplicates`)
    return data
  },

  async getForInvoice(clientId: string, invoiceId: string): Promise<DuplicateFlag[]> {
    const { data } = await api.get<DuplicateFlag[]>(`/api/clients/${clientId}/duplicates/invoice/${invoiceId}`)
    return data
  },

  async review(clientId: string, flagId: string, action: 'Confirmed' | 'Dismissed', note?: string): Promise<DuplicateFlag> {
    const { data } = await api.post<DuplicateFlag>(`/api/clients/${clientId}/duplicates/${flagId}/review`, { action, note })
    return data
  },
}
