// Updated User (Accountant profile from /api/auth/me)
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
  // NEW fields for accountant
  practiceAddress?: string
  practicePostcode?: string
  icaewNumber?: string
  aatNumber?: string
  mtdAgentReference?: string
  vatAgentCode?: string
  plan?: string                // 'Starter' | 'Pro' | 'Unlimited'
  subscriptionStatus?: string
  trialEndsAt?: string
  maxClients?: number
  totalClients?: number
  // Keep for backward compat
  companyId?: string
  companyName?: string
  role?: string
}

// Updated AuthResponse — backend now returns accountantId not userId/companyId
export interface AuthResponse {
  token: string
  refreshToken?: string
  fullName: string
  email: string
  accountantId: string     // NEW — was userId
  expiresAt: string
  plan: string             // NEW — 'Starter' | 'Pro' | 'Unlimited'
  // Keep for backward compat during transition:
  userId?: string
  companyId?: string
}

export interface LoginRequest {
  email: string
  password: string
}

// Updated RegisterRequest — remove companyName, add phone
export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  phone?: string             // NEW optional
  // companyName removed — accountant registers without company
}

// PUT /api/auth/me — fields the backend accepts
export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
  practiceAddress?: string
  practicePostcode?: string
  icaewNumber?: string
  aatNumber?: string
  mtdAgentReference?: string
  vatAgentCode?: string
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
  accountantId: string
  code: string
}
