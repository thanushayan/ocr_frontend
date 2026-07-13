import api from '../lib/axios'
import {
  Invoice, PagedInvoices, InvoiceListParams,
  CreateInvoiceRequest, UpdateInvoiceRequest,
  DuplicateCheckRequest, DuplicateCheckResult,
  FileUploadResponse, UploadInvoiceResponse,
  OcrResult, InvoiceComment,
} from '../types/invoice.types'

export const invoiceService = {
  // ── Invoices (scoped to the active client / off-licence shop) ─────────────
  async list(clientId: string, params?: InvoiceListParams): Promise<PagedInvoices> {
    const { data } = await api.get<PagedInvoices>(`/api/clients/${clientId}/invoices`, { params })
    return data
  },
  async getById(clientId: string, invoiceId: string): Promise<Invoice> {
    const { data } = await api.get<Invoice>(`/api/clients/${clientId}/invoices/${invoiceId}`)
    return data
  },
  async create(clientId: string, body: CreateInvoiceRequest): Promise<Invoice> {
    const { data } = await api.post<Invoice>(`/api/clients/${clientId}/invoices`, body)
    return data
  },
  async update(clientId: string, invoiceId: string, body: UpdateInvoiceRequest): Promise<Invoice> {
    const { data } = await api.patch<Invoice>(`/api/clients/${clientId}/invoices/${invoiceId}`, body)
    return data
  },
  async checkDuplicate(clientId: string, body: DuplicateCheckRequest): Promise<DuplicateCheckResult> {
    const { data } = await api.post<DuplicateCheckResult>(`/api/clients/${clientId}/invoices/check-duplicate`, body)
    return data
  },

  // ── Upload (multipart/form-data) ───────────────────────────────────────────
  async upload(
    clientId: string,
    file: File,
    extra?: { vendorId?: string; expenseCategoryId?: string; notes?: string }
  ): Promise<UploadInvoiceResponse> {
    const form = new FormData()
    form.append('file', file)
    if (extra?.vendorId) form.append('vendorId', extra.vendorId)
    if (extra?.expenseCategoryId) form.append('expenseCategoryId', extra.expenseCategoryId)
    if (extra?.notes) form.append('notes', extra.notes)
    const { data } = await api.post<UploadInvoiceResponse>(
      `/api/clients/${clientId}/upload`, form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },
  async uploadFileOnly(clientId: string, file: File): Promise<FileUploadResponse> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<FileUploadResponse>(
      `/api/clients/${clientId}/upload/file-only`, form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  // ── OCR (single processing endpoint; corrections are invoice PATCHes) ──────
  async triggerOcr(invoiceId: string): Promise<OcrResult> {
    const { data } = await api.post<OcrResult>(`/api/invoices/${invoiceId}/ocr`)
    return data
  },

  // ── Comments ────────────────────────────────────────────────────────────────
  async getComments(invoiceId: string): Promise<InvoiceComment[]> {
    const { data } = await api.get<InvoiceComment[]>(`/api/invoices/${invoiceId}/comments`)
    return data
  },
  async addComment(invoiceId: string, content: string): Promise<InvoiceComment> {
    const { data } = await api.post<InvoiceComment>(`/api/invoices/${invoiceId}/comments`, { content })
    return data
  },
  async resolveComment(invoiceId: string, commentId: string): Promise<void> {
    await api.post(`/api/invoices/${invoiceId}/comments/${commentId}/resolve`)
  },
  async deleteComment(invoiceId: string, commentId: string): Promise<void> {
    await api.delete(`/api/invoices/${invoiceId}/comments/${commentId}`)
  },

  // ── Invoice items ───────────────────────────────────────────────────────────
  async addItem(invoiceId: string, body: { description: string; quantity: number; unitPrice: number; taxRate?: number }) {
    const { data } = await api.post(`/api/invoices/${invoiceId}/items`, body)
    return data
  },
  async updateItem(itemId: string, body: { description?: string; quantity?: number; unitPrice?: number; taxRate?: number }) {
    const { data } = await api.patch(`/api/items/${itemId}`, body)
    return data
  },
  async deleteItem(itemId: string): Promise<void> {
    await api.delete(`/api/items/${itemId}`)
  },
}

// ── Bulk OCR jobs ─────────────────────────────────────────────────────────────
export const bulkOcrService = {
  queue: (clientId: string, invoiceIds: string[]) =>
    api.post(`/api/clients/${clientId}/bulk-ocr`, { invoiceIds }).then(r => r.data),

  getAll: (clientId: string) =>
    api.get(`/api/clients/${clientId}/bulk-ocr`).then(r => r.data),

  getJob: (clientId: string, jobId: string) =>
    api.get(`/api/clients/${clientId}/bulk-ocr/${jobId}`).then(r => r.data),

  cancel: (clientId: string, jobId: string) =>
    api.post(`/api/clients/${clientId}/bulk-ocr/${jobId}/cancel`).then(r => r.data),
}
