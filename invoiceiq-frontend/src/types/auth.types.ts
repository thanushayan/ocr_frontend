// ── Accountant (the logged-in user) ─────────────────────────────────────────
export interface AccountantProfile {
  id: string
  fullName: string
  email: string
  phone?: string
  practiceAddress?: string
  icaewNumber?: string
  aatnumber?: string
  mtdAgentReference?: string
  twoFactorEnabled: boolean
  lastLoginAt?: string
  totalClients: number
  plan: string
  subscriptionStatus: string
  trialEndsAt?: string
  maxClients: number
}

// App-wide user shape — the accountant profile plus optional presentation
// fields still used by profile/settings screens.
export interface User extends AccountantProfile {
  isActive?: boolean
  createdAt?: string
  avatarUrl?: string
  jobTitle?: string
  preferredLanguage?: string
  twoFactorMethod?: string
  role?: string
}

export interface AuthResponse {
  token: string
  refreshToken?: string
  accountantId: string
  fullName: string
  email: string
  plan: string           // 'Starter' | 'Pro' | 'Unlimited'
  expiresAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  phone?: string
}

export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
  jobTitle?: string
  preferredLanguage?: string
  avatarUrl?: string
  practiceAddress?: string
  icaewNumber?: string
  aatnumber?: string
  mtdAgentReference?: string
}

// ── Client (off-licence shop managed by the accountant) ─────────────────────
export interface Client {
  id: string
  accountantId: string
  businessName: string
  tradingName?: string
  clientType: string
  ownerFullName?: string
  ownerEmail?: string
  ownerPhone?: string
  businessAddress?: string
  businessPostcode?: string
  localAuthority?: string
  vatRegistrationNumber?: string
  awrsUrn?: string
  monthlyFee: number
  isActive: boolean
  onboardedAt: string
}

export interface ClientSummary {
  clientId: string
  businessName: string
  pendingInvoices: number
  vatReturnDue?: string
  premisesLicenceExpiry?: string
  complianceAlerts: number
  lastActivityAt?: string
}

export interface CreateClientRequest {
  businessName: string
  tradingName?: string
  clientType?: string
  ownerFullName?: string
  ownerEmail?: string
  ownerPhone?: string
  businessAddress?: string
  businessPostcode?: string
  localAuthority?: string
  vatRegistrationNumber?: string
  awrsUrn?: string
  monthlyFee?: number
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
