import api from '../lib/axios'
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  TwoFactorVerifyRequest,
  TwoFactorResponse,
  User,
} from '../types/auth.types'

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse | TwoFactorResponse> {
    const res = await api.post('/auth/login', data)
    return res.data
  },
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await api.post('/auth/register', data)
    return res.data
  },
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await api.post('/auth/forgot-password', data)
  },
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await api.post('/auth/reset-password', data)
  },
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.post('/auth/change-password', data)
  },
  async verifyTwoFactor(data: TwoFactorVerifyRequest): Promise<AuthResponse> {
    const res = await api.post('/auth/2fa/verify', data)
    return res.data
  },
  async getMe(): Promise<User> {
    const res = await api.get('/auth/me')
    return res.data
  },
  async logout(): Promise<void> {
    await api.post('/auth/logout-all')
  },
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const res = await api.post('/auth/refresh', { refreshToken })
    return res.data
  },
}