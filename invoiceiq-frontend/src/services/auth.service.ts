import api from '../lib/axios'
import { LoginRequest, RegisterRequest, AuthResponse, User, UpdateProfileRequest } from '../types/auth.types'

export const authService = {
  async login(body: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', body)
    return data
  },
  async register(body: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/register', body)
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
    await api.post('/api/auth/logout-all')
  },
}