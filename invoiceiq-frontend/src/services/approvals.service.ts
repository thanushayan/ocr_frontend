import api from '../lib/axios'

export interface WorkflowStep {
  stepName: string
  stepOrder: number
  assignedUserId?: string
  requiredRole?: 'Admin' | 'Owner'
  timeoutHours?: number
  isOptional?: boolean
}

export interface CreateWorkflowTemplateRequest {
  name: string
  description?: string
  amountThreshold?: number
  isDefault?: boolean
  steps: WorkflowStep[]
}

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

  getTemplates: (clientId: string) =>
    api.get(`/api/clients/${clientId}/workflow-templates`).then(r => r.data),

  createTemplate: (clientId: string, body: CreateWorkflowTemplateRequest) =>
    api.post(`/api/clients/${clientId}/workflow-templates`, body).then(r => r.data),

  deleteTemplate: (templateId: string) =>
    api.delete(`/api/workflow-templates/${templateId}`).then(r => r.data),

  // Start an approval; if the client has no workflow template yet, create a
  // sensible single-step default and retry so the flow never dead-ends.
  async startWithDefault(clientId: string, invoiceId: string) {
    try {
      return await this.start(invoiceId)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string; message?: string } } }
      const msg = `${e?.response?.data?.error ?? ''} ${e?.response?.data?.message ?? ''}`.toLowerCase()
      if (!msg.includes('template')) throw err

      await this.createTemplate(clientId, {
        name: 'Standard approval',
        description: 'Default single-step approval (auto-created)',
        isDefault: true,
        steps: [
          { stepName: 'Accountant review', stepOrder: 1, requiredRole: 'Owner', timeoutHours: 48 },
        ],
      })
      return await this.start(invoiceId)
    }
  },
}
