import api from '../lib/axios'
import {
  Vendor, CreateVendorRequest,
  InviteVendorPortalRequest, UpdateVendorPortalAccessRequest, VendorPortalUser,
} from '../types/vendor.types'

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

  // Invite a vendor to the self-service portal (requires email + full name).
  async invite(
    companyId: string,
    vendorId: string,
    body: InviteVendorPortalRequest
  ): Promise<VendorPortalUser> {
    const { data } = await api.post<VendorPortalUser>(
      `/api/companies/${companyId}/vendors/${vendorId}/invite`, body
    )
    return data
  },

  // Enable / disable a vendor's portal access.
  async updatePortalAccess(
    companyId: string,
    vendorId: string,
    body: UpdateVendorPortalAccessRequest
  ): Promise<VendorPortalUser> {
    const { data } = await api.patch<VendorPortalUser>(
      `/api/companies/${companyId}/vendors/${vendorId}/portal-access`, body
    )
    return data
  },
}