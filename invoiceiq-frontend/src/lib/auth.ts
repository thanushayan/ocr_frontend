import Cookies from 'js-cookie'

const TOKEN_KEY = 'iq_token'
const REFRESH_KEY = 'iq_refresh'
const USER_KEY = 'iq_user'

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
  clearAll() {
    Cookies.remove(TOKEN_KEY)
    Cookies.remove(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },
  isLoggedIn(): boolean {
    return !!Cookies.get(TOKEN_KEY)
  },
}