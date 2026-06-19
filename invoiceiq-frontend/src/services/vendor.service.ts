import api from '../lib/axios'
import { Vendor, CreateVendorRequest } from '../types/vendor.types'

export const vendorService = {
  async list(companyId: string): Promise<Vendor[]> {
    const { data } = await api.get<Vendor[]>(
      `/api/companies/${companyId}/vendors`
    )
    return data
  },

  async create(companyId: string, body: CreateVendorRequest): Promise<Vendor> {
    const { data } = await api.post<Vendor>(
      `/api/companies/${companyId}/vendors`, body
    )
    return data
  },
}