export type InvoiceStatus =
  | 'Uploaded'
  | 'OcrProcessing'
  | 'OcrComplete'
  | 'PendingReview'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'Paid'

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
  taxRate?: number
}

export interface Invoice {
  id: string
  companyId: string
  fileName: string
  fileUrl: string
  fileType: string
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  totalAmount?: number
  taxAmount?: number
  subTotal?: number
  currency?: string
  extractedVendorName?: string
  vendorName?: string
  vendorId?: string
  expenseCategoryName?: string
  expenseCategoryId?: string
  notes?: string
  status: InvoiceStatus
  uploadedByName: string
  createdAt: string
  updatedAt: string
  items: InvoiceItem[]
}

export interface InvoiceListItem {
  id: string
  fileName: string
  invoiceNumber?: string
  totalAmount?: number
  currency?: string
  status: InvoiceStatus
  vendorName?: string
  createdAt: string
}

export interface PagedInvoices {
  items: InvoiceListItem[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface InvoiceListParams {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  sortBy?: string
  sortDir?: string
  vendorId?: string
}

export interface CreateInvoiceRequest {
  fileName: string
  fileUrl?: string
  fileType?: string
  vendorId?: string
  expenseCategoryId?: string
  notes?: string
}

export interface UpdateInvoiceRequest {
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  totalAmount?: number
  taxAmount?: number
  subTotal?: number
  currency?: string
  vendorId?: string
  expenseCategoryId?: string
  notes?: string
  status?: InvoiceStatus
}