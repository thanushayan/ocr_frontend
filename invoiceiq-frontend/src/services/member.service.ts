import api from '../lib/axios'

export interface Member {
  userId: string
  fullName: string
  email: string
  role: string
  joinedAt: string
}

// Practice team members are accountant-level in the new architecture.
export const memberService = {
  async list(): Promise<Member[]> {
    const { data } = await api.get<Member[]>('/api/accountant/members')
    return data
  },

  async invite(email: string, role: string): Promise<Member> {
    const { data } = await api.post<Member>('/api/accountant/members', { email, role })
    return data
  },

  async remove(userId: string): Promise<void> {
    await api.delete(`/api/accountant/members/${userId}`)
  },

  async assignRole(userId: string, role: string): Promise<void> {
    await api.post(`/api/accountant/members/${userId}/role`, { role })
  },
}
