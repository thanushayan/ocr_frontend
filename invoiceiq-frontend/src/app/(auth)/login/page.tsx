'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../hooks/useAuth'
import { toast } from 'sonner'
import { Eye, EyeOff, FileText, Loader2 } from 'lucide-react'

// படிவம் சரிபார்க்கும் விதிகள்
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

// இரண்டு-படி சரிபார்ப்புக்கான விதிகள்
const twoFactorSchema = z.object({
  code: z.string().min(6, 'Enter the 6 digit code').max(6, 'Only 6 digits allowed'),
})

type TwoFactorFormData = z.infer<typeof twoFactorSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  // படிவ நிலைகள்
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [twoFactorEmail, setTwoFactorEmail] = useState('')

  // உள்நுழைவு படிவம்
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // இரண்டு-படி சரிபார்ப்பு படிவம்
  const {
    register: register2FA,
    handleSubmit: handleSubmit2FA,
    formState: { errors: errors2FA },
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
  })

  // உள்நுழைவு சமர்பிக்கும்போது
  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const result = await login(data)

      if (result.requiresTwoFactor) {
        // இரண்டு-படி சரிபார்ப்பு தேவை
        setRequiresTwoFactor(true)
        setTwoFactorEmail(result.email ?? data.email)
        toast.info('A two-factor code is in your authenticator app')
        return
      }

      // உள்நுழைவு வெற்றி - dashboard-க்கு செல்
      toast.success('Welcome back! Login successful')
      router.push('/dashboard')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message ?? 'Login failed. Please try again')
    } finally {
      setIsLoading(false)
    }
  }

  // இரண்டு-படி சரிபார்ப்பு சமர்பிக்கும்போது
  const onTwoFactorSubmit = async (data: TwoFactorFormData) => {
    setIsLoading(true)
    try {
      const { authService } = await import('../../../services/auth.service')
      const { authLib } = await import('../../../lib/auth')

      const res = await authService.verifyTwoFactor({
        email: twoFactorEmail,
        code: data.code,
      })

      authLib.setTokens(res.token, res.refreshToken)
      authLib.setUser(res.user)

      toast.success('Welcome back! Login successful')
      router.push('/dashboard')
    } catch {
      toast.error('Invalid code. Please try again')
    } finally {
      setIsLoading(false)
    }
  }

  // இரண்டு-படி சரிபார்ப்பு திரை
  if (requiresTwoFactor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#3B82F6] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          {/* லோகோ */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900">InvoiceIQ</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-500 text-center text-sm mb-8">
            Enter the 6-digit code from your authenticator app
          </p>

          <form onSubmit={handleSubmit2FA(onTwoFactorSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                {...register2FA('code')}
                type="text"
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors2FA.code && (
                <p className="text-red-500 text-sm mt-1">{errors2FA.code.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>

            <button
              type="button"
              onClick={() => setRequiresTwoFactor(false)}
              className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
            >
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  // உள்நுழைவு திரை
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#3B82F6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        {/* லோகோ மற்றும் தலைப்பு */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900">InvoiceIQ</span>
          </div>
          <p className="text-gray-500 text-sm">Smart Invoice Processing</p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Sign in to your account
        </h2>

        {/* உள்நுழைவு படிவம் */}
        <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">

          {/* மின்னஞ்சல் புலம் */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@company.com"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* கடவுச்சொல் புலம் */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12 ${
                  errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {/* கடவுச்சொல் காட்டு/மறை */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* சமர்பிக்கும் பொத்தான் */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* பிரிப்பு கோடு */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* OAuth பொத்தான்கள் */}
        <div className="space-y-3">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google`}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </a>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/microsoft`}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#F25022" d="M11.4 11.4H0V0h11.4z" />
              <path fill="#00A4EF" d="M24 11.4H12.6V0H24z" />
              <path fill="#7FBA00" d="M11.4 24H0V12.6h11.4z" />
              <path fill="#FFB900" d="M24 24H12.6V12.6H24z" />
            </svg>
            <span className="text-gray-700 font-medium">Continue with Microsoft</span>
          </a>
        </div>

        {/* பதிவு இணைப்பு */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
            Register now
          </a>
        </p>
      </div>
    </div>
  )
}