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
  clientId: string
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

// PATCH /api/clients/{clientId}/invoices/{id} — fields the backend accepts
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
}

// ── Duplicate detection ─────────────────────────────────────────────────────
export interface DuplicateCheckRequest {
  invoiceNumber?: string
  totalAmount?: number
  vendorId?: string
  invoiceDate?: string
  fileName?: string
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  reason?: string
  existingInvoiceId?: string
  existingInvoiceNumber?: string
  existingCreatedAt?: string
}

// ── File upload ─────────────────────────────────────────────────────────────
export interface FileUploadResponse {
  fileName: string
  fileUrl: string
  fileType: string
  fileSizeBytes: number
}

// POST /upload returns the created invoice plus the stored file
export interface UploadInvoiceResponse {
  invoice: Invoice
  file: FileUploadResponse
}

// ── OCR ─────────────────────────────────────────────────────────────────────
export interface OcrResult {
  invoiceId: string
  invoiceNumber?: string
  invoiceDate?: string
  totalAmount?: number
  taxAmount?: number
  currency?: string
  vendorName?: string
  provider: string
  success: boolean
}

// ── Comments ────────────────────────────────────────────────────────────────
export interface CommentAuthor {
  id: string
  fullName: string
  email: string
}

export interface InvoiceComment {
  id: string
  invoiceId: string
  content: string
  isResolved: boolean
  resolvedAt?: string
  author?: CommentAuthor
  createdAt?: string
}