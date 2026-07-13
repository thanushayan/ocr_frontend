import Cookies from 'js-cookie'
import type { Client } from '../types/auth.types'

const TOKEN_KEY = 'iq_token'
const REFRESH_KEY = 'iq_refresh'
const USER_KEY = 'iq_user'
const ACTIVE_CLIENT_KEY = 'iq_active_client'

export const authLib = {
  setTokens(token: string, refreshToken: string) {
    Cookies.set(TOKEN_KEY, token, { expires: 1, secure: true, sameSite: 'strict' })
    Cookies.set(REFRESH_KEY, refreshToken, { expires: 7, secure: true, sameSite: 'strict' })
  },
  getToken(): string | undefined {
    return Cookies.get(TOKEN_KEY)
  },
  getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_KEY)
  },
  setUser(user: object) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  getUser<T>(): T | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  },

  // ── Active client (selected off-licence shop) ─────────────────────────────
  setActiveClient(client: Client) {
    localStorage.setItem(ACTIVE_CLIENT_KEY, JSON.stringify(client))
  },
  getActiveClient(): Client | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(ACTIVE_CLIENT_KEY)
    return raw ? (JSON.parse(raw) as Client) : null
  },
  getActiveClientId(): string | null {
    return this.getActiveClient()?.id ?? null
  },
  clearActiveClient() {
    localStorage.removeItem(ACTIVE_CLIENT_KEY)
  },

  clearAll() {
    Cookies.remove(TOKEN_KEY)
    Cookies.remove(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(ACTIVE_CLIENT_KEY)
  },
  isLoggedIn(): boolean {
    return !!Cookies.get(TOKEN_KEY)
  },
}
