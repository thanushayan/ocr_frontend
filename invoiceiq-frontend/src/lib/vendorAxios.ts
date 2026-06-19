import axios from 'axios'
import Cookies from 'js-cookie'

// Vendor portal-க்கு தனி axios instance — different JWT cookie
const vendorApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

vendorApi.interceptors.request.use((config) => {
  const token = Cookies.get('vendorAccessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

vendorApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('vendorAccessToken')
      window.location.href = '/vendor/login'
    }
    return Promise.reject(error)
  }
)

export default vendorApi