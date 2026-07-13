import axios from 'axios'
import api from '../lib/axios'
import {
  LoginRequest, RegisterRequest, AuthResponse, User, UpdateProfileRequest,
  RefreshResponse, TwoFactorStatus, TwoFactorVerifyRequest,
} from '../types/auth.types'

export const authService = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(body: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', body)
    return data
  },
  async register(body: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/register', body)
    return data
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/api/auth/me')
    return data
  },
  async updateProfile(body: UpdateProfileRequest): Promise<User> {
    const { data } = await api.put<User>('/api/auth/me', body)
    return data
  },

  // ── Password ──────────────────────────────────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/auth/forgot-password', { email })
  },
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/reset-password', { token, newPassword })
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/change-password', { currentPassword, newPassword })
  },

  // ── Tokens / sessions ───────────────────────────────────────────────────────
  // Uses a bare axios call (not the intercepted `api` instance) so a failing
  // refresh can't re-trigger the 401 refresh interceptor and loop.
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const { data } = await axios.post<RefreshResponse>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
      { refreshToken }
    )
    return data
  },
  async revoke(refreshToken: string): Promise<void> {
    await api.post('/api/auth/revoke', { token: refreshToken })
  },
  async logout(): Promise<void> {
    await api.post('/api/auth/logout-all')
  },

  // ── Two-factor authentication ───────────────────────────────────────────────
  async getTwoFactorStatus(): Promise<TwoFactorStatus> {
    const { data } = await api.get<TwoFactorStatus>('/api/auth/2fa/status')
    return data
  },
  async sendEnableCode(): Promise<string> {
    const { data } = await api.post<string>('/api/auth/2fa/send-enable-code')
    return data
  },
  async enableTwoFactor(code: string): Promise<string> {
    const { data } = await api.post<string>('/api/auth/2fa/enable', { code })
    return data
  },
  async sendDisableCode(): Promise<string> {
    const { data } = await api.post<string>('/api/auth/2fa/send-disable-code')
    return data
  },
  async disableTwoFactor(code: string): Promise<string> {
    const { data } = await api.post<string>('/api/auth/2fa/disable', { code })
    return data
  },
  async verifyTwoFactor(body: TwoFactorVerifyRequest): Promise<string> {
    const { data } = await api.post<string>('/api/auth/2fa/verify', body)
    return data
  },
}