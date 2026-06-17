export interface User {
  id: string
  fullName: string
  email: string
  companyId: string
  role: string
  preferredLanguage: string
  twoFactorEnabled: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  companyName: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: User
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  email: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface TwoFactorVerifyRequest {
  email: string
  code: string
}

export interface TwoFactorResponse {
  requiresTwoFactor: boolean
  token?: string
  refreshToken?: string
  user?: User
}