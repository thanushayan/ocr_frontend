import api from '../lib/axios'
import Cookies from 'js-cookie'
import { LoginRequest, RegisterRequest, AuthResponse, User, UpdateProfileRequest } from '../types/auth.types'

function saveTokens(data: AuthResponse) {
  Cookies.set('accessToken', data.token, { expires: 1 })
  if (data.refreshToken) Cookies.set('refreshToken', data.refreshToken, { expires: 7 })
  if (data.companyId) Cookies.set('companyId', data.companyId, { expires: 1 })
}

export const authService = {
  async login(body: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', body)
    saveTokens(data)
    return data
  },

  async register(body: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/register', body)
    saveTokens(data)
    return data
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/api/auth/me')
    return data
  },

  async updateProfile(body: UpdateProfileRequest): Promise<User> {
    const { data } = await api.patch<User>('/api/auth/me', body)
    return data
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/auth/forgot-password', { email })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/reset-password', { token, newPassword })
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/change-password', { currentPassword, newPassword })
  },

  async logout(): Promise<void> {
    try { await api.post('/api/auth/logout-all') } finally {
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
      Cookies.remove('companyId')
    }
  },
}