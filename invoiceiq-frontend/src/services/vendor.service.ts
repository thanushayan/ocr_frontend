import api from '../lib/axios'
import {
  Vendor, CreateVendorRequest,
  InviteVendorPortalRequest, UpdateVendorPortalAccessRequest, VendorPortalUser,
} from '../types/vendor.types'

// Vendors are accountant-level in the new architecture — no client scoping.
export const vendorService = {
  async list(): Promise<Vendor[]> {
    const { data } = await api.get<Vendor[]>('/api/vendors')
    return data
  },

  async create(body: CreateVendorRequest): Promise<Vendor> {
    const { data } = await api.post<Vendor>('/api/vendors', body)
    return data
  },

  // Invite a vendor to the self-service portal (requires email + full name).
  async invite(
    vendorId: string,
    body: InviteVendorPortalRequest
  ): Promise<VendorPortalUser> {
    const { data } = await api.post<VendorPortalUser>(
      `/api/vendors/${vendorId}/invite`, body
    )
    return data
  },

  // Enable / disable a vendor's portal access.
  async updatePortalAccess(
    vendorId: string,
    body: UpdateVendorPortalAccessRequest
  ): Promise<VendorPortalUser> {
    const { data } = await api.patch<VendorPortalUser>(
      `/api/vendors/${vendorId}/portal-access`, body
    )
    return data
  },
}
