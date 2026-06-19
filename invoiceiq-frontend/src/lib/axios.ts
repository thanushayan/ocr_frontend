import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ─── REQUEST: every request-க்கும் token attach ───────────
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── RESPONSE: 401 வந்தா auto refresh ────────────────────
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
        (token) => {
          orig.headers.Authorization = `Bearer ${token}`
          return api(orig)
        }
      )
    }

    orig._retry = true
    isRefreshing = true
    const refreshToken = Cookies.get('refreshToken')

    if (!refreshToken) {
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      // backend field name "token" — not "refreshToken"
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
        { token: refreshToken }
      )
      const newToken = data.token
      Cookies.set('accessToken', newToken, { expires: 1 })
      orig.headers.Authorization = `Bearer ${newToken}`
      flush(null, newToken)
      return api(orig)
    } catch (e) {
      flush(e)
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
      window.location.href = '/login'
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  }
)

export default api