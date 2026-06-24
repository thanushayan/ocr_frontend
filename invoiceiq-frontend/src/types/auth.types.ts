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
// ── Token refresh / revoke ──────────────────────────────────────────────────
export interface RefreshTokenRequest {
  token: string
}

export interface RefreshResponse {
  token: string
  refreshToken: string
  expiresAt?: string
}

// ── Two-factor authentication ───────────────────────────────────────────────
// GET /api/auth/2fa/status → { twoFactorEnabled }
export interface TwoFactorStatus {
  twoFactorEnabled: boolean
}

// Body for enable / disable — the 6-digit code emailed to the user
export interface TwoFactorCodeRequest {
  code: string
}

// Body for the anonymous login-time verification (POST /api/auth/2fa/verify)
export interface TwoFactorVerifyRequest {
  userId: string
  code: string
}