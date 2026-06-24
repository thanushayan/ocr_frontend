'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authService } from '../../services/auth.service' // adjust path to your tree

// Per-user two-factor authentication — wired to /api/auth/2fa/* (email code flow)
export function TwoFactorAuthRow() {
  const qc = useQueryClient()

  // 1) Current state: is 2FA on for this user?
  const { data, isLoading } = useQuery({
    queryKey: ['twoFactorStatus'],
    queryFn: () => authService.getTwoFactorStatus(),
  })
  const enabled = !!data?.twoFactorEnabled

  // local UI state: are we mid-flow, and what code did the user type?
  const [mode, setMode] = useState<'enable' | 'disable' | null>(null)
  const [code, setCode] = useState('')

  // 2) Ask the backend to email a code (start of either flow)
  const sendCode = useMutation({
    mutationFn: (intent: 'enable' | 'disable') =>
      intent === 'enable' ? authService.sendEnableCode() : authService.sendDisableCode(),
    onSuccess: (msg, intent) => {
      setMode(intent)
      setCode('')
      toast.success(msg || 'Verification code sent to your email.')
    },
    onError: () => toast.error('Could not send the verification code. Try again.'),
  })

  // 3) Submit the code to actually enable/disable, then refresh status
  const confirm = useMutation({
    mutationFn: () =>
      mode === 'enable'
        ? authService.enableTwoFactor(code.trim())
        : authService.disableTwoFactor(code.trim()),
    onSuccess: (msg) => {
      toast.success(msg || (mode === 'enable' ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.'))
      setMode(null)
      setCode('')
      qc.invalidateQueries({ queryKey: ['twoFactorStatus'] })
    },
    onError: () => toast.error('That code was invalid or expired.'),
  })

  return (
    <div className="py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            Two-factor authentication
            {!isLoading && (
              <span className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-bold border ${enabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                {enabled ? 'Enabled' : 'Disabled'}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Require a one-time code sent to your email when signing in to your account.
          </div>
        </div>

        {mode === null && (
          <button
            onClick={() => sendCode.mutate(enabled ? 'disable' : 'enable')}
            disabled={isLoading || sendCode.isPending}
            className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
              enabled
                ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {sendCode.isPending
              ? <><span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Sending…</>
              : enabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        )}
      </div>

      {mode !== null && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-3">
          <div className="text-xs text-gray-500">
            Enter the 6-digit code we just emailed you to{' '}
            <span className="font-semibold text-gray-700">{mode === 'enable' ? 'enable' : 'disable'}</span> two-factor authentication.
          </div>
          <div className="flex items-center gap-2.5">
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              autoFocus
              className="h-10 w-36 px-3 border border-gray-200 rounded-lg text-sm font-mono tracking-[0.3em] bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={() => confirm.mutate()}
              disabled={code.length !== 6 || confirm.isPending}
              className="inline-flex items-center gap-2 h-10 px-4 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {confirm.isPending
                ? <><span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Confirming…</>
                : 'Confirm'}
            </button>
            <button onClick={() => { setMode(null); setCode('') }} className="h-10 px-3 text-sm font-semibold text-gray-500 hover:text-gray-700">
              Cancel
            </button>
            <button onClick={() => sendCode.mutate(mode)} disabled={sendCode.isPending} className="h-10 px-3 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50">
              Resend
            </button>
          </div>
        </div>
      )}
    </div>
  )
}