import api from '../lib/axios'
import type { Client, CreateClientRequest } from '../types/auth.types'

export const clientService = {
  // ── Clients (off-licence shops) ──────────────────────────────────────────
  async list(): Promise<Client[]> {
    const { data } = await api.get<Client[]>('/api/clients')
    return data
  },

  async create(body: CreateClientRequest): Promise<Client> {
    const { data } = await api.post<Client>('/api/clients', body)
    return data
  },

  async getById(clientId: string): Promise<Client> {
    const { data } = await api.get<Client>(`/api/clients/${clientId}`)
    return data
  },

  async update(clientId: string, body: Partial<Client>): Promise<Client> {
    const { data } = await api.put<Client>(`/api/clients/${clientId}`, body)
    return data
  },

  async remove(clientId: string): Promise<void> {
    await api.delete(`/api/clients/${clientId}`)
  },

  // ── Dashboards ───────────────────────────────────────────────────────────
  getDashboard: (clientId: string) =>
    api.get(`/api/clients/${clientId}/dashboard`).then(r => r.data),

  getAccountantDashboard: () =>
    api.get('/api/accountant/dashboard').then(r => r.data),

  // ── Compliance alerts ────────────────────────────────────────────────────
  getAlerts: (clientId: string) =>
    api.get(`/api/clients/${clientId}/alerts`).then(r => r.data),

  getAllAlerts: () =>
    api.get('/api/accountant/compliance-alerts').then(r => r.data),

  // ── Premises licence ─────────────────────────────────────────────────────
  getPremisesLicence: (clientId: string) =>
    api.get(`/api/clients/${clientId}/premises-licence`).then(r => r.data),

  updatePremisesLicence: (clientId: string, body: object) =>
    api.put(`/api/clients/${clientId}/premises-licence`, body).then(r => r.data),

  // ── AWRS ─────────────────────────────────────────────────────────────────
  getAwrs: (clientId: string) =>
    api.get(`/api/clients/${clientId}/awrs`).then(r => r.data),

  updateAwrs: (clientId: string, body: object) =>
    api.put(`/api/clients/${clientId}/awrs`, body).then(r => r.data),

  // ── Notes ────────────────────────────────────────────────────────────────
  getNotes: (clientId: string) =>
    api.get(`/api/clients/${clientId}/notes`).then(r => r.data),

  addNote: (clientId: string, noteText: string, noteType?: string) =>
    api.post(`/api/clients/${clientId}/notes`, { noteText, noteType }).then(r => r.data),

  // ── Tasks ────────────────────────────────────────────────────────────────
  getTasks: (clientId: string) =>
    api.get(`/api/clients/${clientId}/tasks`).then(r => r.data),

  createTask: (clientId: string, body: object) =>
    api.post(`/api/clients/${clientId}/tasks`, body).then(r => r.data),

  updateTask: (clientId: string, taskId: string, body: object) =>
    api.patch(`/api/clients/${clientId}/tasks/${taskId}`, body).then(r => r.data),

  // ── Portal users (shop owner access) ─────────────────────────────────────
  getPortalUsers: (clientId: string) =>
    api.get(`/api/clients/${clientId}/portal-users`).then(r => r.data),

  invitePortalUser: (clientId: string, body: { fullName: string; email: string }) =>
    api.post(`/api/clients/${clientId}/portal-users`, body).then(r => r.data),
}
