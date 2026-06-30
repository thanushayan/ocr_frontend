export interface Vendor {
  id: string
  name: string
  contactEmail?: string
  phone?: string
  address?: string
  vatNumber?: string
  createdAt: string
  // Optional enrichment fields — populated by the extended list endpoint
  // (invoice count, spend, portal/active state). Safe to be absent.
  invoiceCount?: number
  totalSpend?: number
  currency?: string
  lastInvoiceDate?: string
  portalEnabled?: boolean
  isActive?: boolean
}

export interface CreateVendorRequest {
  name: string
  contactEmail?: string
  phone?: string
  address?: string
  vatNumber?: string
}

// ── Vendor portal management ────────────────────────────────────────────────
export interface InviteVendorPortalRequest {
  email: string
  fullName: string
}

export interface UpdateVendorPortalAccessRequest {
  isActive: boolean
}

export interface VendorPortalUser {
  id: string
  vendorId: string
  companyId: string
  email: string
  fullName: string
  isActive: boolean
  isEmailVerified: boolean
  inviteAcceptedAt?: string
  lastLoginAt?: string
  createdAt: string
}