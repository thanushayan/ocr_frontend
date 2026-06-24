import api from '../lib/axios'
import {
  Invoice, PagedInvoices, InvoiceListParams,
  CreateInvoiceRequest, UpdateInvoiceRequest,
  DuplicateCheckRequest, DuplicateCheckResult,
  FileUploadResponse, UploadInvoiceResponse,
  OcrResult, OcrConfidenceReport, SubmitOcrCorrectionRequest,
  OcrFieldCorrection, SetConfidenceThresholdRequest, CompanyConfidenceReport,
} from '../types/invoice.types'

export const invoiceService = {
  // ── Invoices ────────────────────────────────────────────────────────────────
  async list(companyId: string, params?: InvoiceListParams): Promise<PagedInvoices> {
    const { data } = await api.get<PagedInvoices>(`/api/companies/${companyId}/invoices`, { params })
    return data
  },
  async getById(companyId: string, invoiceId: string): Promise<Invoice> {
    const { data } = await api.get<Invoice>(`/api/companies/${companyId}/invoices/${invoiceId}`)
    return data
  },
  async create(companyId: string, body: CreateInvoiceRequest): Promise<Invoice> {
    const { data } = await api.post<Invoice>(`/api/companies/${companyId}/invoices`, body)
    return data
  },
  async update(companyId: string, invoiceId: string, body: UpdateInvoiceRequest): Promise<Invoice> {
    const { data } = await api.patch<Invoice>(`/api/companies/${companyId}/invoices/${invoiceId}`, body)
    return data
  },
  async checkDuplicate(companyId: string, body: DuplicateCheckRequest): Promise<DuplicateCheckResult> {
    const { data } = await api.post<DuplicateCheckResult>(`/api/companies/${companyId}/invoices/check-duplicate`, body)
    return data
  },

  // ── Upload (multipart/form-data) ───────────────────────────────────────────
  async upload(
    companyId: string,
    file: File,
    extra?: { vendorId?: string; expenseCategoryId?: string; notes?: string }
  ): Promise<UploadInvoiceResponse> {
    const form = new FormData()
    form.append('file', file)
    if (extra?.vendorId) form.append('vendorId', extra.vendorId)
    if (extra?.expenseCategoryId) form.append('expenseCategoryId', extra.expenseCategoryId)
    if (extra?.notes) form.append('notes', extra.notes)
    const { data } = await api.post<UploadInvoiceResponse>(
      `/api/companies/${companyId}/upload`, form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },
  async uploadFileOnly(companyId: string, file: File): Promise<FileUploadResponse> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<FileUploadResponse>(
      `/api/companies/${companyId}/upload/file-only`, form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data
  },

  // ── OCR ─────────────────────────────────────────────────────────────────────
  async triggerOcr(invoiceId: string): Promise<OcrResult> {
    const { data } = await api.post<OcrResult>(`/api/invoices/${invoiceId}/ocr`)
    return data
  },
  async getOcrConfidence(invoiceId: string): Promise<OcrConfidenceReport> {
    const { data } = await api.get<OcrConfidenceReport>(`/api/invoices/${invoiceId}/ocr/confidence`)
    return data
  },
  async submitOcrCorrections(invoiceId: string, body: SubmitOcrCorrectionRequest): Promise<OcrFieldCorrection> {
    const { data } = await api.post<OcrFieldCorrection>(`/api/invoices/${invoiceId}/ocr/corrections`, body)
    return data
  },
  async getOcrCorrections(invoiceId: string): Promise<OcrFieldCorrection[]> {
    const { data } = await api.get<OcrFieldCorrection[]>(`/api/invoices/${invoiceId}/ocr/corrections`)
    return data
  },
  async approveOcr(invoiceId: string): Promise<void> {
    await api.post(`/api/invoices/${invoiceId}/ocr/approve`)
  },

  // ── OCR confidence (company-wide) ───────────────────────────────────────────
  async getCompanyConfidenceReport(companyId: string): Promise<CompanyConfidenceReport> {
    const { data } = await api.get<CompanyConfidenceReport>(`/api/companies/${companyId}/ocr/confidence-report`)
    return data
  },
  async setConfidenceThreshold(companyId: string, body: SetConfidenceThresholdRequest): Promise<CompanyConfidenceReport> {
    const { data } = await api.put<CompanyConfidenceReport>(`/api/companies/${companyId}/ocr/confidence-threshold`, body)
    return data
  },
}