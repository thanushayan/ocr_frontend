import { AxiosError } from 'axios'

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response?.data?.message) return error.response.data.message
    if (!error.response) return 'Network error. Check your connection.'
    switch (error.response.status) {
      case 400: return 'Invalid input. Please check your details.'
      case 401: return 'Session expired. Please login again.'
      case 403: return 'You do not have permission to do this.'
      case 404: return 'Not found.'
      case 409: return 'This record already exists.'
      case 429: return 'Too many requests. Please wait.'
      case 500: return 'Server error. Please try again later.'
    }
  }
  return 'Something went wrong. Please try again.'
}