import api from '../lib/axios'

export const approvalService = {
  async getPending() {
    const { data } = await api.get('/api/approvals/pending')
    return data
  },

  async act(instanceId: string, action: 'Approve' | 'Reject', comment?: string) {
    const { data } = await api.post(
      `/api/approvals/${instanceId}/act`, { action, comment }
    )
    return data
  },

  async cancel(instanceId: string): Promise<void> {
    await api.post(`/api/approvals/${instanceId}/cancel`)
  },
}