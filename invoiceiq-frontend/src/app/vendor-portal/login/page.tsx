'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import vendorApi from '../../../lib/vendorApi'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  )
}

function LightField({
  label, type = 'text', value, onChange, placeholder, trailing,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; trailing?: React.ReactNode
}) {
  const [focus, setFocus] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <div
        style={{
          border: `1.5px solid ${focus ? '#3b82f6' : '#e5e7eb'}`,
          boxShadow: focus ? '0 0 0 3px rgba(26,86,219,.09)' : 'none',
          background: focus ? '#fff' : '#f9fafb',
        }}
        className="flex items-center h-12 px-3.5 gap-2.5 rounded-xl transition-all"
      >
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          className="flex-1 border-none outline-none bg-transparent text-sm text-gray-900"
        />
        {trailing}
      </div>
    </div>
  )
}

function SuccessState({ vendorName }: { vendorName: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-6">
      <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 grid place-items-center text-green-500 text-4xl"
        style={{ boxShadow: '0 0 0 6px rgba(22,163,74,.08)' }}>
        ✓
      </div>
      <div>
        <div className="text-xl font-extrabold text-gray-900 mb-1">Welcome back</div>
        <div className="text-sm text-gray-500">{vendorName} · Redirecting you now…</div>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
        <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
        Loading your dashboard…
      </div>
    </div>
  )
}

export default function VendorLoginPage() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [vendorName, setVendorName] = useState('')

  const submit = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      // POST /api/vendor-portal/auth/login
      const res = await vendorApi.post('/api/vendor-portal/login', { email, password })
      localStorage.setItem('vendorToken', res.data.token)
      localStorage.setItem('vendorUser', JSON.stringify(res.data.user))
      setVendorName(res.data.user.fullName)
      setSuccess(true)
      setTimeout(() => router.push('/vendor-portal/invoices'), 1800)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: '1fr 1fr' }}>
      {/* ── Left panel ── */}
      <div
        className="flex flex-col p-[52px_60px] relative overflow-hidden"
        style={{ background: 'linear-gradient(158deg,#0d2540 0%,#16334f 50%,#1b4268 100%)' }}
      >
        {/* Decorative rings */}
        <div className="absolute w-[560px] h-[560px] rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(255,255,255,.05)', top: -160, right: -220 }} />
        <div className="absolute w-[340px] h-[340px] rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(255,255,255,.04)', bottom: -80, left: -100 }} />
        <div className="absolute w-[260px] h-[260px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(29,158,117,.16),transparent 70%)', bottom: 120, right: 20 }} />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-16">
          <span className="w-10 h-10 rounded-xl grid place-items-center text-white text-xl"
            style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.2)' }}>
            📄
          </span>
          <span className="text-[21px] font-extrabold tracking-tight text-white">
            Invoice<span style={{ color: '#5dd6b0' }}>IQ</span>
          </span>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-[11px] font-bold uppercase tracking-widest mb-5 w-fit"
            style={{ background: 'rgba(93,214,176,.15)', border: '1px solid rgba(93,214,176,.3)', color: '#5dd6b0' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#5dd6b0' }} />
            Vendor self-service portal
          </div>

          <h1 className="text-[36px] font-extrabold leading-tight tracking-tight text-white mb-4 max-w-[360px]">
            Manage your invoices with us.
          </h1>
          <p className="text-[15px] leading-relaxed mb-11 max-w-[380px]"
            style={{ color: 'rgba(255,255,255,.55)' }}>
            One secure place to view invoice history, submit new invoices, and track payment status — no emails required.
          </p>

          {/* Feature bullets */}
          <div className="flex flex-col gap-5">
            {[
              { icon: '🧾', title: 'View your invoice history', desc: 'See all submitted invoices and track their status through the approval pipeline.' },
              { icon: '☁️', title: 'Submit invoices directly', desc: 'Upload PDF invoices or enter details manually — without back-and-forth email.' },
              { icon: '💳', title: 'Track payment status', desc: 'Know when payments are scheduled, in progress, or cleared to your account.' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-4">
                <span className="w-11 h-11 flex-shrink-0 rounded-xl grid place-items-center text-xl"
                  style={{ background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.12)' }}>
                  {f.icon}
                </span>
                <div>
                  <div className="text-sm font-bold text-white mb-1">{f.title}</div>
                  <div className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,.45)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-5 text-xs flex items-center gap-1.5"
          style={{ borderTop: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.3)' }}>
          🔒 Secured by InvoiceIQ · TLS 1.3 encrypted · SOC 2 Type II certified
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="bg-white flex items-center justify-center p-12">
        <div className="w-full max-w-[400px]">
          {success ? (
            <SuccessState vendorName={vendorName} />
          ) : (
            <div className="flex flex-col">
              {/* Chip */}
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 border border-blue-200 text-blue-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  Vendor portal
                </span>
              </div>

              <h1 className="text-[26px] font-extrabold tracking-tight text-gray-900 mb-1.5">
                Sign in to Vendor Portal
              </h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-7">
                Access your invoices and payment records.
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3.5 mb-4">
                <LightField
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@yourcompany.com"
                />
                <LightField
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  placeholder="Your password"
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  }
                />
              </div>

              <div className="text-right mb-5">
                <a href="#" className="text-sm font-semibold text-blue-600">Forgot password?</a>
              </div>

              <button
                onClick={submit}
                disabled={!email || !password || loading}
                style={{ boxShadow: '0 3px 14px rgba(26,86,219,.26)' }}
                className="flex items-center justify-center gap-2 h-12 w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold transition-colors"
              >
                {loading
                  ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Signing in…</>
                  : 'Sign in →'
                }
              </button>

              <div className="flex items-center gap-3 my-5">
                <span className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or</span>
                <span className="flex-1 h-px bg-gray-100" />
              </div>

              <button className="flex items-center justify-center gap-2.5 h-11 w-full rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <GoogleIcon /> Continue with Google
              </button>

              <div className="mt-7 px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-2">
                <span className="text-gray-400 text-sm mt-0.5 flex-shrink-0">ℹ️</span>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Don't have access?{' '}
                  <a href="#" className="text-blue-600 font-bold">Contact your account manager</a>{' '}
                  to request a vendor portal invitation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}