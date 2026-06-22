'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import vendorApi from '../../../lib/vendorApi'

export default function AcceptInvitePage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  const valid = password.length >= 8 && password === confirm

  const submit = async () => {
    if (!valid || !token) return
    setLoading(true)
    setError('')
    try {
      // POST /api/vendor-portal/auth/accept-invite
      await vendorApi.post('/api/vendor-portal/auth/accept-invite', { token, password })
      setDone(true)
      setTimeout(() => router.push('/vendor-portal/login'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Invalid or expired invitation link.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Invalid invitation link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {done ? (
          <div className="text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 grid place-items-center text-3xl">✓</div>
            <div className="text-xl font-bold text-gray-900">Password set!</div>
            <p className="text-sm text-gray-500">Redirecting to login…</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 grid place-items-center text-2xl mb-4">🔐</div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Set your password</h1>
              <p className="text-sm text-gray-500">Create a password to activate your vendor portal account.</p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600">New password</label>
                <div className="flex items-center h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 gap-2">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="flex-1 border-none outline-none bg-transparent text-sm text-gray-900"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="text-gray-400 text-sm">
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-600">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="h-11 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-900 outline-none"
                />
                {confirm && password !== confirm && (
                  <span className="text-xs text-red-500">Passwords do not match.</span>
                )}
              </div>

              <button
                onClick={submit}
                disabled={!valid || loading}
                className="h-12 w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold mt-2"
              >
                {loading ? 'Activating…' : 'Activate account →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}