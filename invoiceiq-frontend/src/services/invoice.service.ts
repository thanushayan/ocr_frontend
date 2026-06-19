import api from '../lib/axios'
import {
  Invoice, PagedInvoices, InvoiceListParams,
  CreateInvoiceRequest, UpdateInvoiceRequest,
} from '../types/invoice.types'

export const invoiceService = {
  async list(companyId: string, params?: InvoiceListParams): Promise<PagedInvoices> {
    const { data } = await api.get<PagedInvoices>(
      `/api/companies/${companyId}/invoices`, { params }
    )
    return data
  },

  async getById(companyId: string, invoiceId: string): Promise<Invoice> {
    const { data } = await api.get<Invoice>(
      `/api/companies/${companyId}/invoices/${invoiceId}`
    )
    return data
  },

  async create(companyId: string, body: CreateInvoiceRequest): Promise<Invoice> {
    const { data } = await api.post<Invoice>(
      `/api/companies/${companyId}/invoices`, body
    )
    return data
  },

  async update(companyId: string, invoiceId: string, body: UpdateInvoiceRequest): Promise<Invoice> {
    const { data } = await api.patch<Invoice>(
      `/api/companies/${companyId}/invoices/${invoiceId}`, body
    )
    return data
  },

  async upload(
    companyId: string,
    file: File,
    extra?: { vendorId?: string; expenseCategoryId?: string; notes?: string }
  ) {
    const form = new FormData()
    form.append('file', file)
    if (extra?.vendorId) form.append('vendorId', extra.vendorId)
    if (extra?.expenseCategoryId) form.append('expenseCategoryId', extra.expenseCategoryId)
    if (extra?.notes) form.append('notes', extra.notes)

    const { data } = await api.post(
      `/api/companies/${companyId}/upload`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  async triggerOcr(invoiceId: string): Promise<void> {
    await api.post(`/api/invoices/${invoiceId}/ocr`)
  },

  async getOcrConfidence(invoiceId: string) {
    const { data } = await api.get(`/api/invoices/${invoiceId}/ocr/confidence`)
    return data
  },

  async submitOcrCorrections(invoiceId: string, corrections: object) {
    const { data } = await api.post(
      `/api/invoices/${invoiceId}/ocr/corrections`, corrections
    )
    return data
  },

  async approveOcr(invoiceId: string): Promise<void> {
    await api.post(`/api/invoices/${invoiceId}/ocr/approve`)
  },
}