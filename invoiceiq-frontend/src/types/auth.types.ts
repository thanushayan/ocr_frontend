export interface User {
  id: string
  fullName: string
  email: string
  isActive: boolean
  createdAt: string
  avatarUrl?: string
  phone?: string
  jobTitle?: string
  preferredLanguage: string
  twoFactorEnabled: boolean
  twoFactorMethod?: string
  lastLoginAt?: string
  companyId?: string
  companyName?: string
  role?: string
}

export interface AuthResponse {
  token: string
  refreshToken?: string
  fullName: string
  email: string
  userId: string
  expiresAt: string
  companyId?: string
  companyName?: string
  role?: string
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

export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
  jobTitle?: string
  preferredLanguage?: string
  avatarUrl?: string
}