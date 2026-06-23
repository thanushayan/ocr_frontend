'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import vendorApi from '../../../lib/vendorApi'

export default function AcceptInvitePage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [showCf,   setShowCf]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)

  const valid = password.length >= 8 && password === confirm

  const pwStrength = password.length === 0 ? 0
    : password.length < 8 ? 1
    : /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 3
    : 2

  const strengthLabel = ['', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981']

  const submit = async () => {
    if (!valid || !token) return
    setLoading(true)
    setError('')
    try {
      await vendorApi.post('/api/vendor-portal/auth/accept-invite', { token, password })
      setDone(true)
      setTimeout(() => router.push('/vendor-portal/login'), 2500)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Invalid or expired invitation link.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#f5f7fa' }}>
        <div className="bg-white rounded-2xl shadow-xl px-10 py-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 grid place-items-center text-2xl mx-auto mb-4">⚠️</div>
          <div className="text-lg font-bold text-gray-900 mb-2">Invalid invitation link</div>
          <p className="text-sm text-gray-500">This link is missing required parameters. Please use the link from your invitation email.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f7fa' }}>

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[44%] min-h-screen p-12"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-xl grid place-items-center text-white text-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}
          >📄</span>
          <span className="text-[22px] font-extrabold tracking-tight text-white">
            Invoice<span style={{ color: '#60a5fa' }}>IQ</span>
          </span>
        </div>

        {/* Centre copy */}
        <div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 grid place-items-center text-3xl mb-8">🔐</div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Activate your<br />vendor account
          </h2>
          <p className="text-blue-200 text-base leading-relaxed mb-10">
            Set a strong password to secure your vendor portal account and start submitting invoices.
          </p>

          {/* Trust bullets */}
          {[
            { icon: '🔒', text: 'End-to-end encrypted access' },
            { icon: '✅', text: 'One-time setup — quick & easy' },
            { icon: '📤', text: 'Submit invoices securely' },
          ].map(b => (
            <div key={b.text} className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 grid place-items-center text-base">{b.icon}</span>
              <span className="text-sm text-blue-100">{b.text}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-blue-300/60">© 2026 InvoiceIQ. All rights reserved.</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">

          {done ? (
            /* ── Success state ── */
            <div className="bg-white rounded-2xl shadow-xl p-10 text-center flex flex-col items-center gap-4">
              <div
                className="w-20 h-20 rounded-full grid place-items-center text-4xl mb-2"
                style={{ background: '#f0fdf4', border: '2px solid #86efac' }}
              >✓</div>
              <div className="text-2xl font-extrabold text-gray-900">Account activated!</div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your password has been set. Redirecting you to the login page…
              </p>
              <div className="flex gap-1 mt-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : (
            /* ── Form ── */
            <div className="bg-white rounded-2xl shadow-xl p-10">
              {/* Mobile logo */}
              <div className="flex items-center gap-2 mb-6 lg:hidden">
                <span className="w-8 h-8 rounded-lg grid place-items-center text-white text-base"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>📄</span>
                <span className="text-lg font-extrabold text-gray-900">
                  Invoice<span className="text-blue-600">IQ</span>
                </span>
              </div>

              <div className="mb-7">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1.5">Set your password</h1>
                <p className="text-sm text-gray-500">Create a secure password to activate your vendor portal account.</p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-600">
                  <span>⚠️</span> {error}
                </div>
              )}

              <div className="flex flex-col gap-5">
                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">New password</label>
                  <div className="flex items-center h-12 px-3.5 border border-gray-200 rounded-xl bg-gray-50 gap-2 focus-within:border-blue-500 transition-colors">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submit()}
                      placeholder="Min. 8 characters"
                      className="flex-1 border-none outline-none bg-transparent text-sm text-gray-900 placeholder-gray-400"
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="text-gray-400 hover:text-gray-600 text-base leading-none">
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1 flex-1">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all"
                            style={{ background: i <= pwStrength ? strengthColor[pwStrength] : '#e5e7eb' }} />
                        ))}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: strengthColor[pwStrength] }}>
                        {strengthLabel[pwStrength]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Confirm password</label>
                  <div className="flex items-center h-12 px-3.5 border border-gray-200 rounded-xl bg-gray-50 gap-2 focus-within:border-blue-500 transition-colors">
                    <input
                      type={showCf ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submit()}
                      placeholder="Re-enter password"
                      className="flex-1 border-none outline-none bg-transparent text-sm text-gray-900 placeholder-gray-400"
                    />
                    <button type="button" onClick={() => setShowCf(v => !v)}
                      className="text-gray-400 hover:text-gray-600 text-base leading-none">
                      {showCf ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {confirm && password !== confirm && (
                    <span className="text-xs text-red-500 mt-0.5">Passwords do not match.</span>
                  )}
                  {confirm && password === confirm && confirm.length > 0 && (
                    <span className="text-xs text-green-600 mt-0.5">✓ Passwords match</span>
                  )}
                </div>

                {/* Submit */}
                <button
                  onClick={submit}
                  disabled={!valid || loading}
                  className="h-12 w-full rounded-xl text-white text-sm font-bold mt-1 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{
                    background: valid && !loading
                      ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)'
                      : '#93c5fd',
                    boxShadow: valid && !loading ? '0 4px 14px rgba(59,130,246,.35)' : 'none',
                  }}
                >
                  {loading
                    ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Activating…</>
                    : 'Activate account →'
                  }
                </button>

                {/* Back to login */}
                <p className="text-xs text-center text-gray-400">
                  Already have an account?{' '}
                  <a href="/vendor-portal/login" className="text-blue-600 font-semibold hover:underline">Sign in</a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}