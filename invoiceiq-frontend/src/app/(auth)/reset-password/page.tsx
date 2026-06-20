'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '../../../services/auth.service'
import { toast } from 'sonner'
import { ScanText, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

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

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) })

useEffect(() => {
  if (!resetSuccess) return
  const t = setInterval(() => {
    setCountdown(c => c - 1)
  }, 1000)
  return () => clearInterval(t)
}, [resetSuccess])

useEffect(() => {
  if (countdown === 0) {
    router.push('/login')
  }
}, [countdown, router])

  const strength = getStrength(passwordValue)

  const bg: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(150deg, #1E3A5F 0%, #284B7A 48%, #3B82F6 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px',
  }

  // Token இல்லாம வந்தா — invalid link
  if (!token) {
    return (
      <div style={bg}>
        <div className="bg-white rounded-2xl shadow-2xl p-9 w-full max-w-md">
          <Logo />
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Lock size={28} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid reset link</h1>
            <p className="text-sm text-gray-500">This link is invalid or has expired. Please request a new one.</p>
          </div>
          <a
            href="/forgot-password"
            className="w-full flex items-center justify-center gap-2 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Request new link
          </a>
        </div>
      </div>
    )
  }

  // Reset success screen
  if (resetSuccess) {
    return (
      <div style={bg}>
        <div className="bg-white rounded-2xl shadow-2xl p-9 w-full max-w-md">
          <Logo />
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Password reset!</h1>
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
          <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            Redirecting in {countdown}s…
          </p>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true)
    try {
      await authService.resetPassword(token, data.password)
      setResetSuccess(true)
      toast.success('Password reset successful!')
    } catch {
      toast.error('Reset failed. The link may have expired.')
    } finally {
      setIsLoading(false)
    }
  }

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

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          {/* New password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">New password</label>
            <div className={`flex items-center gap-2 h-11 px-3 border rounded-lg bg-gray-50 transition-all focus-within:ring-2 focus-within:ring-blue-500 ${
              errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}>
              <Lock size={16} className={errors.password ? 'text-red-400' : 'text-gray-400'} />
              <input
                {...register('password')}
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

            {errors.password
              ? <span className="text-xs text-red-500">⚠ {errors.password.message}</span>
              : <span className="text-xs text-gray-400">Use 8+ characters with a number and symbol.</span>
            }
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">Confirm password</label>
            <div className={`flex items-center gap-2 h-11 px-3 border rounded-lg bg-gray-50 transition-all focus-within:ring-2 focus-within:ring-blue-500 ${
              errors.confirmPassword ? 'border-red-400 bg-red-50' : watch('confirmPassword') ? 'border-green-400' : 'border-gray-300'
            }`}>
              <Lock size={16} className={errors.confirmPassword ? 'text-red-400' : 'text-gray-400'} />
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {!errors.confirmPassword && watch('confirmPassword') && (
                <CheckCircle size={16} className="text-green-500 shrink-0" />
              )}
            </div>
            {errors.confirmPassword && (
              <span className="text-xs text-red-500">⚠ {errors.confirmPassword.message}</span>
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

        <div className="text-center mt-5">
          <a href="/login" className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900">
            <ArrowLeft size={14} /> Back to login
          </a>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'linear-gradient(150deg, #1E3A5F 0%, #284B7A 48%, #3B82F6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}