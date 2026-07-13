import axios from 'axios'
import { authLib } from './auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = authLib.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []
const flush = (error: unknown, token: string | null = null) => {
  queue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(error)))
  queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config
    if (error.response?.status !== 401 || orig._retry) return Promise.reject(error)

    if (isRefreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject })).then(
        (token) => { orig.headers.Authorization = `Bearer ${token}`; return api(orig) }
      )
    }

    orig._retry = true
    isRefreshing = true
    const refreshToken = authLib.getRefreshToken()

    if (!refreshToken) {
      authLib.clearAll()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
        { refreshToken }
      )
      authLib.setTokens(data.token, data.refreshToken)
      orig.headers.Authorization = `Bearer ${data.token}`
      flush(null, data.token)
      return api(orig)
    } catch (e) {
      flush(e)
      authLib.clearAll()
      window.location.href = '/login'
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  }
)

export default api

// Helper: build client-scoped URL using active client from localStorage
export function clientUrl(path: string): string {
  if (typeof window === 'undefined') return path
  const raw = localStorage.getItem('iq_client')
  if (!raw) throw new Error('No active client selected')
  const client = JSON.parse(raw)
  return `/api/clients/${client.id}${path}`
}