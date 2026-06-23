import api from '../lib/axios'

export const approvalsService = {
  getPending: () =>
    api.get('/api/approvals/pending').then(r => r.data),

  act: (instanceId: string, action: 'Approved' | 'Rejected', comment?: string) =>
    api.post(`/api/approvals/${instanceId}/act`, { action, comment }).then(r => r.data),

  cancel: (instanceId: string) =>
    api.post(`/api/approvals/${instanceId}/cancel`).then(r => r.data),

  getByInvoice: (invoiceId: string) =>
    api.get(`/api/invoices/${invoiceId}/approval`).then(r => r.data),

  start: (invoiceId: string, templateId?: string) =>
    api.post(`/api/invoices/${invoiceId}/approval/start`, { workflowTemplateId: templateId ?? null }).then(r => r.data),

  getTemplates: (companyId: string) =>
    api.get(`/api/companies/${companyId}/workflow-templates`).then(r => r.data),
}