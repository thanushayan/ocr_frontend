import api from '../lib/axios'

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  status: string
  failureCount: number
  lastTriggeredAt?: string
  createdAt: string
}

export interface WebhookCreated {
  endpoint: Webhook
  secret: string   // shown once — the user must store it
}

export interface WebhookDelivery {
  id: string
  webhookEndpointId: string
  eventType: string
  status: string
  httpStatusCode?: number
  errorMessage?: string
  attemptCount: number
  createdAt: string
  deliveredAt?: string
}

// Available event types (see backend webhook dispatcher)
export const WEBHOOK_EVENTS = [
  'invoice.created',
  'invoice.approved',
  'invoice.rejected',
  'invoice.ocr_completed',
]

export const webhookService = {
  async list(clientId: string): Promise<Webhook[]> {
    const { data } = await api.get<Webhook[]>(`/api/clients/${clientId}/webhooks`)
    return data
  },

  async create(clientId: string, body: { name: string; url: string; events: string[] }): Promise<WebhookCreated> {
    const { data } = await api.post<WebhookCreated>(`/api/clients/${clientId}/webhooks`, body)
    return data
  },

  async update(clientId: string, webhookId: string, body: { name?: string; url?: string; events?: string[]; status?: string }): Promise<Webhook> {
    const { data } = await api.put<Webhook>(`/api/clients/${clientId}/webhooks/${webhookId}`, body)
    return data
  },

  async remove(clientId: string, webhookId: string): Promise<void> {
    await api.delete(`/api/clients/${clientId}/webhooks/${webhookId}`)
  },

  async test(clientId: string, webhookId: string, eventType = 'invoice.created') {
    const { data } = await api.post(`/api/clients/${clientId}/webhooks/${webhookId}/test`, { eventType })
    return data
  },

  async deliveries(clientId: string, webhookId: string): Promise<WebhookDelivery[]> {
    const { data } = await api.get<WebhookDelivery[]>(`/api/clients/${clientId}/webhooks/${webhookId}/deliveries`)
    return data
  },
}
