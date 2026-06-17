import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { authLib } from './auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:7007/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authLib.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token!)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      const refreshToken = authLib.getRefreshToken()
      if (!refreshToken) {
        authLib.clearAll()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:7007/api'}/auth/refresh`,
          { refreshToken }
        )
        authLib.setTokens(data.token, data.refreshToken)
        processQueue(null, data.token)
        originalRequest.headers.Authorization = `Bearer ${data.token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        authLib.clearAll()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api