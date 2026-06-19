export interface Vendor {
  id: string
  name: string
  contactEmail?: string
  phone?: string
  address?: string
  vatNumber?: string
  createdAt: string
}

export interface CreateVendorRequest {
  name: string
  contactEmail?: string
  phone?: string
  address?: string
  vatNumber?: string
}