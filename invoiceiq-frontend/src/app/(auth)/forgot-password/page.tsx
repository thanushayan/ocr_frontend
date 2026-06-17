'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '../../../services/auth.service'
import { toast } from 'sonner'
import {
  ScanText, Mail, Lock, Eye, EyeOff, ArrowLeft,
  Send, CheckCircle, Loader2, ExternalLink
} from 'lucide-react'

// ── Schemas ───────────────────────────────────────────────────────────────────

// மின்னஞ்சல் சரிபார்ப்பு
const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required.').email('Enter a valid email address.'),
})
type ForgotFormData = z.infer<typeof forgotSchema>

// புதிய கடவுச்சொல் சரிபார்ப்பு
const resetSchema = z.object({
  password: z
    .string()
    .min(8, 'Use 8+ characters with a number and symbol.')
    .regex(/[0-9]/, 'Use 8+ characters with a number and symbol.')
    .regex(/[^a-zA-Z0-9]/, 'Use 8+ characters with a number and symbol.'),
  confirmPassword: z.string().min(1, 'Please confirm your password.'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})
type ResetFormData = z.infer<typeof resetSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

// கடவுச்சொல் வலிமை கணக்கிடும்
function getStrength(pw: string): { bars: number; color: string; label: string } {
  if (!pw) return { bars: 0, color: '#E5E7EB', label: '' }
  let score = 0
  if (pw.length >= 8)          score++
  if (/[0-9]/.test(pw))        score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (score === 1) return { bars: 1, color: '#EF4444', label: 'Weak'   }
  if (score === 2) return { bars: 2, color: '#F59E0B', label: 'Medium' }
  return                       { bars: 3, color: '#10B981', label: 'Strong' }
}

// Logo component
function Logo() {
  return (
    <div className="flex justify-center mb-5">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)', boxShadow: '0 6px 16px rgba(26,86,219,.4)' }}
        >
          <ScanText size={20} />
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-gray-900">
          Invoice<span className="text-blue-600">IQ</span>
        </span>
      </div>
    </div>
  )
}

// Back to login link
function BackLink({ onClick }: { onClick?: () => void }) {
  return (
    <div className="text-center mt-5">
      <a
        href={onClick ? '#' : '/login'}
        onClick={onClick}
        className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={14} /> Back to login
      </a>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // URL-இல் token இருந்தா reset mode, இல்லன்னா forgot mode
  const token        = searchParams.get('token')
  const emailParam   = searchParams.get('email')

  const [isLoading,      setIsLoading]      = useState(false)
  const [sentEmail,      setSentEmail]       = useState('')
  const [showSuccess,    setShowSuccess]     = useState(false)
  const [resetSuccess,   setResetSuccess]    = useState(false)
  const [countdown,      setCountdown]       = useState(3)
  const [showPassword,   setShowPassword]    = useState(false)
  const [showConfirm,    setShowConfirm]     = useState(false)
  const [passwordValue,  setPasswordValue]   = useState('')

  // Forgot password form
  const {
    register: registerForgot,
    handleSubmit: handleForgot,
    formState: { errors: forgotErrors },
  } = useForm<ForgotFormData>({ resolver: zodResolver(forgotSchema) })

  // Reset password form
  const {
    register: registerReset,
    handleSubmit: handleReset,
    formState: { errors: resetErrors },
    watch,
  } = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) })

  // Reset success-ஆனா 3 நொடியில் login-க்கு redirect
  useEffect(() => {
    if (!resetSuccess) return
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); router.push('/login'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [resetSuccess, router])

  const strength = getStrength(passwordValue)

  // ── Forgot submit ──────────────────────────────────────────────────────────
  const onForgotSubmit = async (data: ForgotFormData) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword({ email: data.email })
      setSentEmail(data.email)
      setShowSuccess(true)
    } catch {
      toast.error('Failed to send reset link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Reset submit ───────────────────────────────────────────────────────────
  const onResetSubmit = async (data: ResetFormData) => {
    if (!token || !emailParam) {
      toast.error('Invalid reset link. Please request a new one.')
      return
    }
    setIsLoading(true)
    try {
      await authService.resetPassword({
        token,
        email:       emailParam,
        newPassword: data.password,
      })
      setResetSuccess(true)
    } catch {
      toast.error('Reset failed. The link may have expired.')
    } finally {
      setIsLoading(false)
    }
  }

  // Background
  const bg: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(150deg, #1E3A5F 0%, #284B7A 48%, #3B82F6 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px',
  }

  // ── A2: Email sent success ─────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <div style={bg}>
        <div className="bg-white rounded-2xl shadow-2xl p-9 w-full max-w-md">
          <Logo />

          {/* Success medallion */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-sm text-gray-500">
              We&apos;ve sent a reset link to{' '}
              <strong className="text-gray-700">{sentEmail}</strong>.
              It expires in 30 minutes.
            </p>
          </div>

          {/* Success banner */}
          <div className="flex items-center gap-2 px-3 py-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <CheckCircle size={16} className="text-green-500 shrink-0" />
            <span className="text-sm text-gray-700">Reset link sent successfully.</span>
          </div>

          {/* Open email app button */}
          <a
            href="mailto:"
            className="w-full flex items-center justify-center gap-2 h-11 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            <ExternalLink size={16} /> Open email app
          </a>

          <p className="text-center text-sm text-gray-500 mt-4">
            Didn&apos;t receive it?{' '}
            <button
              onClick={() => setShowSuccess(false)}
              className="text-blue-600 font-bold hover:underline"
            >
              Resend link
            </button>
          </p>

          <BackLink />
        </div>
      </div>
    )
  }

  // ── B2: Reset success ──────────────────────────────────────────────────────
  if (resetSuccess) {
    return (
      <div style={bg}>
        <div className="bg-white rounded-2xl shadow-2xl p-9 w-full max-w-md">
          <Logo />

          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Password reset</h1>
            <p className="text-sm text-gray-500">
              Your password has been updated. You can now sign in with your new credentials.
            </p>
          </div>

          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Continue to login →
          </button>

          {/* Countdown */}
          <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            Redirecting to login in {countdown}s…
          </p>
        </div>
      </div>
    )
  }

  // ── B1: Reset password form (token in URL) ─────────────────────────────────
  if (token && emailParam) {
    return (
      <div style={bg}>
        <div className="bg-white rounded-2xl shadow-2xl p-9 w-full max-w-md">
          <Logo />

          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Lock size={28} className="text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Set new password</h1>
            <p className="text-sm text-gray-500">Choose a strong password you haven&apos;t used before.</p>
          </div>

          <form onSubmit={handleReset(onResetSubmit)} className="flex flex-col gap-4">

            {/* New password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600">New password</label>
              <div className={`flex items-center gap-2 h-11 px-3 border rounded-lg bg-gray-50 transition-all focus-within:ring-2 focus-within:ring-blue-500 ${
                resetErrors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}>
                <Lock size={16} className={resetErrors.password ? 'text-red-400' : 'text-gray-400'} />
                <input
                  {...registerReset('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  onChange={e => setPasswordValue(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength bar */}
              {passwordValue && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="flex-1 h-1.5 rounded-full transition-all"
                        style={{ background: i < strength.bars ? strength.color : '#E5E7EB' }} />
                    ))}
                  </div>
                  <span className="text-xs font-bold w-12 text-right" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}

              {resetErrors.password
                ? <span className="text-xs text-red-500">⚠ {resetErrors.password.message}</span>
                : <span className="text-xs text-gray-400">Use 8+ characters with a number and symbol.</span>
              }
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600">Confirm password</label>
              <div className={`flex items-center gap-2 h-11 px-3 border rounded-lg bg-gray-50 transition-all focus-within:ring-2 focus-within:ring-blue-500 ${
                resetErrors.confirmPassword ? 'border-red-400 bg-red-50' : watch('confirmPassword') ? 'border-green-400' : 'border-gray-300'
              }`}>
                <Lock size={16} className={resetErrors.confirmPassword ? 'text-red-400' : 'text-gray-400'} />
                <input
                  {...registerReset('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {!resetErrors.confirmPassword && watch('confirmPassword') && (
                  <CheckCircle size={16} className="text-green-500 shrink-0" />
                )}
              </div>
              {resetErrors.confirmPassword && (
                <span className="text-xs text-red-500">⚠ {resetErrors.confirmPassword.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</> : 'Reset password'}
            </button>
          </form>

          <BackLink />
        </div>
      </div>
    )
  }

  // ── A1: Forgot password form (default) ────────────────────────────────────
  return (
    <div style={bg}>
      <div className="bg-white rounded-2xl shadow-2xl p-9 w-full max-w-md">
        <Logo />

        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <Lock size={28} className="text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Forgot password?</h1>
          <p className="text-sm text-gray-500">Enter your email and we&apos;ll send a reset link.</p>
        </div>

        <form onSubmit={handleForgot(onForgotSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">Work email</label>
            <div className={`flex items-center gap-2 h-11 px-3 border rounded-lg bg-gray-50 transition-all focus-within:ring-2 focus-within:ring-blue-500 ${
              forgotErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}>
              <Mail size={16} className={forgotErrors.email ? 'text-red-400' : 'text-gray-400'} />
              <input
                {...registerForgot('email')}
                type="email"
                placeholder="finance@company.com"
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
              />
            </div>
            {forgotErrors.email && (
              <span className="text-xs text-red-500">⚠ {forgotErrors.email.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              : <><Send size={16} /> Send reset link</>
            }
          </button>
        </form>

        <BackLink />
      </div>
    </div>
  )
}