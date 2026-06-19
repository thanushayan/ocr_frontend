import api from '../lib/axios'

export interface Member {
  userId: string
  fullName: string
  email: string
  role: string
  joinedAt: string
}

export const memberService = {
  async list(companyId: string): Promise<Member[]> {
    const { data } = await api.get<Member[]>(
      `/api/companies/${companyId}/members`
    )
    return data
  },

  async invite(companyId: string, email: string, role: string): Promise<Member> {
    const { data } = await api.post<Member>(
      `/api/companies/${companyId}/members`, { email, role }
    )
    return data
  },

  async remove(companyId: string, userId: string): Promise<void> {
    await api.delete(`/api/companies/${companyId}/members/${userId}`)
  },

  async assignRole(companyId: string, userId: string, role: string): Promise<void> {
    await api.post(
      `/api/companies/${companyId}/members/${userId}/role`, { role }
    )
  },
}