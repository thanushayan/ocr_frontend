import api from '../lib/axios'
import { Vendor, CreateVendorRequest } from '../types/vendor.types'

// Vendors are accountant-level in the new architecture — no client scoping.
// The backend exposes list + create only (no portal invite endpoints).
export const vendorService = {
  async list(): Promise<Vendor[]> {
    const { data } = await api.get<Vendor[]>('/api/vendors')
    return data
  },

  async create(body: CreateVendorRequest): Promise<Vendor> {
    const { data } = await api.post<Vendor>('/api/vendors', body)
    return data
  },
}
