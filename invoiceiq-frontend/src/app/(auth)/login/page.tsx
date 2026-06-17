'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../hooks/useAuth'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, ScanText, Mail, Lock, ShieldCheck, ArrowLeft } from 'lucide-react'

// படிவம் சரிபார்க்கும் விதிகள்
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
})
type LoginFormData = z.infer<typeof loginSchema>

// இரண்டு-படி சரிபார்ப்பு விதிகள்
const twoFactorSchema = z.object({
  code: z.string().min(6, 'Enter 6 digit code').max(6, 'Only 6 digits allowed'),
})
type TwoFactorFormData = z.infer<typeof twoFactorSchema>

// Google Icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3-2.33z"/>
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
  </svg>
)

// Microsoft Icon
const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#F25022" d="M0 0h8.5v8.5H0z"/>
    <path fill="#7FBA00" d="M9.5 0H18v8.5H9.5z"/>
    <path fill="#00A4EF" d="M0 9.5h8.5V18H0z"/>
    <path fill="#FFB900" d="M9.5 9.5H18V18H9.5z"/>
  </svg>
)

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  // படிவ நிலைகள்
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [twoFactorEmail, setTwoFactorEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [activeOtpIndex, setActiveOtpIndex] = useState(0)

  // உள்நுழைவு படிவம்
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // OTP digit change handler
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value.slice(-1)
    setOtpDigits(newDigits)
    if (value && index < 5) setActiveOtpIndex(index + 1)
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      setActiveOtpIndex(index - 1)
    }
  }

  // உள்நுழைவு submit
  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setLoginError('')
    try {
      const result = await login(data)
      if (result.requiresTwoFactor) {
        // இரண்டு-படி சரிபார்ப்பு தேவை
        setRequiresTwoFactor(true)
        setTwoFactorEmail(result.email ?? data.email)
        return
      }
      toast.success('Welcome back! Login successful')
      router.push('/dashboard')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      setLoginError(err?.response?.data?.message ?? 'Incorrect email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // இரண்டு-படி சரிபார்ப்பு submit
  const onTwoFactorSubmit = async () => {
    const code = otpDigits.join('')
    if (code.length < 6) {
      toast.error('Enter the complete 6-digit code')
      return
    }
    setIsLoading(true)
    try {
      const { authService } = await import('../../../services/auth.service')
      const { authLib } = await import('../../../lib/auth')
      const res = await authService.verifyTwoFactor({ email: twoFactorEmail, code })
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

  // Background gradient
  const bgStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(150deg, #1E3A5F 0%, #284B7A 48%, #3B82F6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px',
    position: 'relative',
  }

  // இரண்டு-படி சரிபார்ப்பு திரை
  if (requiresTwoFactor) {
    return (
      <div style={bgStyle}>
        <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">

          {/* Logo */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)', boxShadow: '0 6px 16px rgba(26,86,219,.4)' }}>
                <ScanText size={20} />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-gray-900">
                Invoice<span className="text-blue-600">IQ</span>
              </span>
            </div>
            <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Smart Invoice Processing</span>
          </div>

          {/* Shield icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <ShieldCheck size={28} className="text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Two-factor authentication</h1>
            <p className="text-sm text-gray-500">
              Enter the 6-digit code from your authenticator app for{' '}
              <strong className="text-gray-700">{twoFactorEmail}</strong>
            </p>
          </div>

          {/* OTP boxes */}
          <div className="flex gap-2 justify-center mb-6">
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                value={digit}
                autoFocus={i === activeOtpIndex}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onFocus={() => setActiveOtpIndex(i)}
                className={`w-12 h-16 text-center text-2xl font-bold font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  i === activeOtpIndex ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]' : digit ? 'border-gray-400' : 'border-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            onClick={onTwoFactorSubmit}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'Verify & continue'}
          </button>

          {/* Resend + Back */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Didn&apos;t get a code?{' '}
            <button className="text-blue-600 font-bold hover:underline">Resend code</button>
            <span className="text-gray-300"> · </span>
            <span className="text-gray-400">00:27</span>
          </p>
          <div className="border-t border-gray-100 mt-5 pt-4 text-center">
            <button
              onClick={() => setRequiresTwoFactor(false)}
              className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={14} /> Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  // உள்நுழைவு திரை
  return (
    <div style={bgStyle}>
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)', boxShadow: '0 6px 16px rgba(26,86,219,.4)' }}>
              <ScanText size={20} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-gray-900">
              Invoice<span className="text-blue-600">IQ</span>
            </span>
          </div>
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">Smart Invoice Processing</span>
        </div>

        {/* Error banner */}
        {loginError && (
          <div className="flex items-center gap-2 px-3 py-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-500 text-sm font-semibold">{loginError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onLoginSubmit)} className="flex flex-col gap-4">

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">Email</label>
            <div className={`flex items-center gap-2 h-11 px-3 border rounded-lg bg-gray-50 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}>
              <Mail size={16} className={errors.email ? 'text-red-400' : 'text-gray-400'} />
              <input
                {...register('email')}
                type="email"
                placeholder="finance@company.com"
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
              />
            </div>
            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-600">Password</label>
              <a href="/forgot-password" className="text-sm font-bold text-blue-600 hover:text-blue-800">Forgot password?</a>
            </div>
            <div className={`flex items-center gap-2 h-11 px-3 border rounded-lg bg-gray-50 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
              errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}>
              <Lock size={16} className={errors.password ? 'text-red-400' : 'text-gray-400'} />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600" />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
          </div>

          {/* Sign in button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* OAuth */}
        <div className="flex flex-col gap-2">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google`}
            className="flex items-center justify-center gap-2 h-11 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-semibold text-gray-700"
          >
            <GoogleIcon /> Continue with Google
          </a>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/microsoft`}
            className="flex items-center justify-center gap-2 h-11 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-semibold text-gray-700"
          >
            <MicrosoftIcon /> Continue with Microsoft
          </a>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-blue-600 font-bold hover:underline">Register</a>
        </p>
      </div>
    </div>
  )
}