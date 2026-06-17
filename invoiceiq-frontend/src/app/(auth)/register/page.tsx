'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../hooks/useAuth'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, ScanText, Mail, Lock, User, Building2, LockKeyhole, CheckCircle } from 'lucide-react'

// படிவம் சரிபார்க்கும் விதிகள்
const registerSchema = z.object({
  fullName:        z.string().min(1, 'Full name is required.'),
  email:           z.string().min(1, 'Email is required.').email('Enter a valid email address.'),
  password:        z.string().min(8, 'Use 8+ characters with a number and symbol.').regex(/[0-9]/, 'Use 8+ characters with a number and symbol.').regex(/[^a-zA-Z0-9]/, 'Use 8+ characters with a number and symbol.'),
  confirmPassword: z.string().min(1, 'Please confirm your password.'),
  companyName:     z.string().min(1, 'Company name is required.'),
  agreeTerms:      z.boolean().refine(v => v === true, 'You must accept the Terms to continue.'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

// Google + Microsoft icons
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3-2.33z"/>
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
  </svg>
)

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#F25022" d="M0 0h8.5v8.5H0z"/>
    <path fill="#7FBA00" d="M9.5 0H18v8.5H9.5z"/>
    <path fill="#00A4EF" d="M0 9.5h8.5V18H0z"/>
    <path fill="#FFB900" d="M9.5 9.5H18V18H9.5z"/>
  </svg>
)

// கடவுச்சொல் வலிமை கணக்கிடும் function
function getPasswordStrength(password: string): { level: 'weak' | 'medium' | 'strong'; bars: number } {
  if (!password) return { level: 'weak', bars: 0 }
  let score = 0
  if (password.length >= 8)   score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  if (score === 1) return { level: 'weak',   bars: 1 }
  if (score === 2) return { level: 'medium', bars: 2 }
  return { level: 'strong', bars: 3 }
}

const strengthColor = { weak: '#EF4444', medium: '#F59E0B', strong: '#10B981' }
const strengthLabel = { weak: 'Weak', medium: 'Medium', strong: 'Strong' }

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const router = useRouter()

  // படிவ நிலைகள்
  const [isLoading, setIsLoading]       = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [passwordValue, setPasswordValue] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // கடவுச்சொல் வலிமை நிலை
  const strength = getPasswordStrength(passwordValue)

  // படிவம் சமர்பிக்கும்போது
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await registerUser({
        fullName:    data.fullName,
        email:       data.email,
        password:    data.password,
        companyName: data.companyName,
      })
      toast.success('Account created! Welcome to InvoiceIQ')
      router.push('/dashboard')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message ?? 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Input field helper — border + icon color
  const fieldClass = (hasError: boolean, isValid: boolean) =>
    `flex items-center gap-2 h-11 px-3 border rounded-lg bg-gray-50 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
      hasError ? 'border-red-400 bg-red-50' : isValid ? 'border-green-400' : 'border-gray-300'
    }`

  const iconColor = (hasError: boolean, isValid: boolean) =>
    hasError ? 'text-red-400' : isValid ? 'text-green-500' : 'text-gray-400'

  const allFilled = watch('fullName') && watch('email') && watch('password') && watch('confirmPassword') && watch('companyName')

  return (
    <div
      className="min-h-screen flex items-start justify-center py-10 px-7"
      style={{ background: 'linear-gradient(150deg, #1E3A5F 0%, #284B7A 48%, #3B82F6 100%)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-lg">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-5">
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

        {/* Heading */}
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500">Start processing invoices with OCR in minutes.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">Full name</label>
            <div className={fieldClass(!!errors.fullName, !errors.fullName && !!watch('fullName'))}>
              <User size={16} className={iconColor(!!errors.fullName, !errors.fullName && !!watch('fullName'))} />
              <input
                {...register('fullName')}
                type="text"
                placeholder="Jane Doe"
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
              />
              {!errors.fullName && watch('fullName') && <CheckCircle size={16} className="text-green-500 shrink-0" />}
            </div>
            {errors.fullName && <span className="text-xs text-red-500 flex items-center gap-1">⚠ {errors.fullName.message}</span>}
          </div>

          {/* Work Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">Work email</label>
            <div className={fieldClass(!!errors.email, !errors.email && !!watch('email'))}>
              <Mail size={16} className={iconColor(!!errors.email, !errors.email && !!watch('email'))} />
              <input
                {...register('email')}
                type="email"
                placeholder="jane@company.com"
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
              />
              {!errors.email && watch('email') && <CheckCircle size={16} className="text-green-500 shrink-0" />}
            </div>
            {errors.email && <span className="text-xs text-red-500 flex items-center gap-1">⚠ {errors.email.message}</span>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">Password</label>
            <div className={fieldClass(!!errors.password, !errors.password && !!passwordValue)}>
              <Lock size={16} className={iconColor(!!errors.password, !errors.password && !!passwordValue)} />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                onChange={(e) => setPasswordValue(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 shrink-0">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* கடவுச்சொல் வலிமை பட்டை */}
            {passwordValue && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 flex-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="flex-1 h-1.5 rounded-full transition-all"
                      style={{ background: i < strength.bars ? strengthColor[strength.level] : '#E5E7EB' }}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold w-12 text-right" style={{ color: strengthColor[strength.level] }}>
                  {strengthLabel[strength.level]}
                </span>
              </div>
            )}

            {errors.password
              ? <span className="text-xs text-red-500 flex items-center gap-1">⚠ {errors.password.message}</span>
              : <span className="text-xs text-gray-400">Use 8+ characters with a number and symbol.</span>
            }
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">Confirm password</label>
            <div className={fieldClass(!!errors.confirmPassword, !errors.confirmPassword && !!watch('confirmPassword'))}>
              <LockKeyhole size={16} className={iconColor(!!errors.confirmPassword, !errors.confirmPassword && !!watch('confirmPassword'))} />
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 hover:text-gray-600 shrink-0">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {!errors.confirmPassword && watch('confirmPassword') && <CheckCircle size={16} className="text-green-500 shrink-0" />}
            </div>
            {errors.confirmPassword && <span className="text-xs text-red-500 flex items-center gap-1">⚠ {errors.confirmPassword.message}</span>}
          </div>

          {/* Company Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-600">Company name</label>
            <div className={fieldClass(!!errors.companyName, !errors.companyName && !!watch('companyName'))}>
              <Building2 size={16} className={iconColor(!!errors.companyName, !errors.companyName && !!watch('companyName'))} />
              <input
                {...register('companyName')}
                type="text"
                placeholder="Acme Ltd"
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
              />
              {!errors.companyName && watch('companyName') && <CheckCircle size={16} className="text-green-500 shrink-0" />}
            </div>
            {errors.companyName && <span className="text-xs text-red-500 flex items-center gap-1">⚠ {errors.companyName.message}</span>}
          </div>

          {/* Terms checkbox */}
          <div className="flex flex-col gap-1">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                {...register('agreeTerms')}
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-blue-600"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-blue-600 font-bold hover:underline">Terms</a>
                {' '}&amp;{' '}
                <a href="#" className="text-blue-600 font-bold hover:underline">Privacy Policy</a>
              </span>
            </label>
            {errors.agreeTerms && (
              <span className="text-xs text-red-500 flex items-center gap-1 ml-6">
                ⚠ {errors.agreeTerms.message}
              </span>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-1"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* OAuth — side by side */}
        <div className="flex gap-2">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/google`}
            className="flex-1 flex items-center justify-center gap-2 h-11 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-semibold text-gray-700"
          >
            <GoogleIcon /> Google
          </a>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/microsoft`}
            className="flex-1 flex items-center justify-center gap-2 h-11 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-semibold text-gray-700"
          >
            <MicrosoftIcon /> Microsoft
          </a>
        </div>

        {/* Sign in link */}
        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 font-bold hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}