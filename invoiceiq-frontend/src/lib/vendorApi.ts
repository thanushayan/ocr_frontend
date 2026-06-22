import axios from 'axios'

const vendorApi = axios.create({
  baseURL: 'https://localhost:7007',
})

vendorApi.interceptors.request.use(config => {
  const token = localStorage.getItem('vendorToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

vendorApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vendorToken')
      window.location.href = '/vendor-portal/login'
    }
    return Promise.reject(err)
  }
)

export default vendorApi