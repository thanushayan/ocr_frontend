import api from '../lib/axios'
import type { Client, CreateClientRequest, ClientDashboard, PremisesLicence, AwrsCompliance, ComplianceAlert } from '../types/client.types'

export const clientService = {
  // List all accountant's clients
  async getAll(): Promise<Client[]> {
    const { data } = await api.get<Client[]>('/api/clients')
    return data
  },

  // Create new client
  async create(body: CreateClientRequest): Promise<Client> {
    const { data } = await api.post<Client>('/api/clients', body)
    return data
  },

  // Get single client
  async get(clientId: string): Promise<Client> {
    const { data } = await api.get<Client>(`/api/clients/${clientId}`)
    return data
  },

  // Update client
  async update(clientId: string, body: Partial<CreateClientRequest>): Promise<Client> {
    const { data } = await api.put<Client>(`/api/clients/${clientId}`, body)
    return data
  },

  // Delete client
  async delete(clientId: string): Promise<void> {
    await api.delete(`/api/clients/${clientId}`)
  },

  // Dashboard for one client
  async getDashboard(clientId: string): Promise<ClientDashboard> {
    const { data } = await api.get<ClientDashboard>(`/api/clients/${clientId}/dashboard`)
    return data
  },

  // Accountant-level dashboard (all clients overview)
  async getAccountantDashboard(): Promise<{ totalClients: number; alerts: number; vatDue: number; pendingInvoices: number }> {
    const { data } = await api.get('/api/accountant/dashboard')
    return data
  },

  // Compliance alerts for client
  async getAlerts(clientId: string): Promise<ComplianceAlert[]> {
    const { data } = await api.get<ComplianceAlert[]>(`/api/clients/${clientId}/alerts`)
    return data
  },

  // All alerts across all clients
  async getAllAlerts(): Promise<ComplianceAlert[]> {
    const { data } = await api.get<ComplianceAlert[]>('/api/accountant/compliance-alerts')
    return data
  },

  // Premises licence
  async getPremisesLicence(clientId: string): Promise<PremisesLicence> {
    const { data } = await api.get<PremisesLicence>(`/api/clients/${clientId}/premises-licence`)
    return data
  },
  async updatePremisesLicence(clientId: string, body: Partial<PremisesLicence>): Promise<PremisesLicence> {
    const { data } = await api.put<PremisesLicence>(`/api/clients/${clientId}/premises-licence`, body)
    return data
  },

  // AWRS
  async getAwrs(clientId: string): Promise<AwrsCompliance> {
    const { data } = await api.get<AwrsCompliance>(`/api/clients/${clientId}/awrs`)
    return data
  },
  async updateAwrs(clientId: string, body: Partial<AwrsCompliance>): Promise<AwrsCompliance> {
    const { data } = await api.put<AwrsCompliance>(`/api/clients/${clientId}/awrs`, body)
    return data
  },

  // Portal users (shop owner access)
  async getPortalUsers(clientId: string) {
    const { data } = await api.get(`/api/clients/${clientId}/portal-users`)
    return data
  },
  async invitePortalUser(clientId: string, body: { fullName: string; email: string }) {
    const { data } = await api.post(`/api/clients/${clientId}/portal-users`, body)
    return data
  },

  // Notes
  async getNotes(clientId: string) {
    const { data } = await api.get(`/api/clients/${clientId}/notes`)
    return data
  },
  async addNote(clientId: string, noteText: string, noteType?: string) {
    const { data } = await api.post(`/api/clients/${clientId}/notes`, { noteText, noteType })
    return data
  },

  // Tasks
  async getTasks(clientId: string) {
    const { data } = await api.get(`/api/clients/${clientId}/tasks`)
    return data
  },
  async createTask(clientId: string, body: { title: string; description?: string; priority?: string; dueDate?: string }) {
    const { data } = await api.post(`/api/clients/${clientId}/tasks`, body)
    return data
  },
  async updateTask(clientId: string, taskId: string, body: { status?: string; priority?: string }) {
    const { data } = await api.patch(`/api/clients/${clientId}/tasks/${taskId}`, body)
    return data
  },
}
