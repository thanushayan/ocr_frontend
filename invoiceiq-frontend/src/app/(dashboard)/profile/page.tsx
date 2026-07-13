'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../hooks/useAuth'
import api from '../../../lib/axios'
import { TwoFactorAuthRow } from '../../../components/security/TwoFactorAuthRow'

// ── Types ──────────────────────────────────────────────────────────────────────
interface UserProfile {
  userId: string
  fullName: string
  email: string
  role: string
  jobTitle?: string
  phone?: string
  twoFactorEnabled: boolean
}

type TabId = 'profile' | 'security' | 'prefs' | 'connected'

const SUBNAV: { id: TabId; label: string; icon: string }[] = [
  { id: 'profile',   label: 'Profile',             icon: '👤' },
  { id: 'security',  label: 'Security',             icon: '🔒' },
  { id: 'prefs',     label: 'Preferences',          icon: '⚙️' },
  { id: 'connected', label: 'Connected accounts',   icon: '🔗' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function initials(name: string) {
  return (name || '?').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function pwStrength(pw: string) {
  if (!pw) return null
  let s = 0
  if (pw.length >= 8)  s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  if (s <= 1) return { label: 'Weak',   color: '#ef4444', n: 1 }
  if (s <= 2) return { label: 'Medium', color: '#f59e0b', n: 2 }
  return            { label: 'Strong',  color: '#22c55e', n: 3 }
}

// ── Shared primitives ──────────────────────────────────────────────────────────
function SectionCard({
  title, desc, children, action,
}: {
  title: string; desc?: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white mb-5">
      <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50">
        <div>
          <div className="text-sm font-bold text-gray-900">{title}</div>
          {desc && <div className="text-xs text-gray-500 mt-1">{desc}</div>}
        </div>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text', readOnly = false, helper,
}: {
  label: string; value: string; onChange?: (v: string) => void
  placeholder?: string; type?: string; readOnly?: boolean; helper?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          border: `1px solid ${focused && !readOnly ? '#3b82f6' : '#d1d5db'}`,
          boxShadow: focused && !readOnly ? '0 0 0 3px rgba(59,130,246,.15)' : 'none',
          cursor: readOnly ? 'not-allowed' : 'text',
        }}
        className="h-11 px-3 rounded-xl text-sm outline-none transition-all bg-white text-gray-900 disabled:bg-gray-50"
      />
      {helper && <span className="text-xs text-gray-400">{helper}</span>}
    </div>
  )
}

function Toggle({
  label, desc, checked, onChange,
}: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        {desc && <div className="text-xs text-gray-500 mt-0.5">{desc}</div>}
      </div>
      <span
        onClick={() => onChange(!checked)}
        style={{ background: checked ? '#2563eb' : '#d1d5db' }}
        className="relative block w-11 h-6 rounded-full cursor-pointer transition-colors flex-shrink-0"
      >
        <span
          style={{ left: checked ? 21 : 3 }}
          className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all"
        />
      </span>
    </div>
  )
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 bg-gray-900 text-white rounded-2xl shadow-xl text-sm font-semibold z-[200] whitespace-nowrap">
      <span className="text-green-400">✓</span> {msg}
    </div>
  )
}

// ── Tab 1: Profile ─────────────────────────────────────────────────────────────
function ProfileTab({
  profile, onSave,
}: {
  profile: UserProfile; onSave: (msg: string) => void
}) {
  const [name, setName]   = useState(profile.fullName ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [title, setTitle] = useState(profile.jobTitle ?? '')

  useEffect(() => {
    setName(profile.fullName ?? '')
    setPhone(profile.phone ?? '')
    setTitle(profile.jobTitle ?? '')
  }, [profile])

  // PUT /api/auth/me
  const mutation = useMutation({
    mutationFn: () => api.put('/api/auth/me', { fullName: name, phone, jobTitle: title }),
    onSuccess: () => onSave('Profile saved.'),
    onError: () => onSave('Failed to save profile.'),
  })

  return (
    <div>
      <SectionCard title="Personal information" desc="Your name, avatar, and contact details.">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6 pb-5 border-b border-gray-100">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 grid place-items-center border-[3px] border-blue-200">
              <span className="text-2xl font-extrabold text-white">{initials(name || profile.fullName)}</span>
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 text-white grid place-items-center border-2 border-white text-xs">
              📷
            </button>
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">{name || profile.fullName}</div>
            <div className="text-xs text-gray-500 mt-0.5">{profile.role} · InvoiceIQ</div>
            <div className="flex gap-2 mt-2.5">
              <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                ⬆ Upload photo
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WebP · max 5 MB</p>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name"     value={name}   onChange={setName}   placeholder="Your full name" />
          <Field label="Email address" value={profile.email} readOnly helper="Contact your Admin to change your email." />
          <Field label="Phone number"  value={phone}  onChange={setPhone}  type="tel" placeholder="+44 7700 900000" />
          <Field label="Job title"     value={title}  onChange={setTitle}  placeholder="Finance Admin" />
        </div>

        <div className="mt-5">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 h-10 px-5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            💾 {mutation.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </SectionCard>

      <SubscriptionCard />
    </div>
  )
}

// ── Subscription (GET /api/accountant/subscription) ───────────────────────────
interface Subscription {
  id: string
  planName: string
  maxClients: number
  monthlyPrice: number
  status: string
  trialEndsAt?: string
  currentPeriodEnd: string
}

function SubscriptionCard() {
  const { data: sub } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: () => api.get<Subscription>('/api/accountant/subscription').then(r => r.data),
  })

  if (!sub) return null

  const fmtGBP = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n)
  const fmtD = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const trialing = sub.status.toLowerCase() === 'trialing'

  return (
    <SectionCard title="Subscription" desc="Your InvoiceIQ plan and billing period.">
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)' }}>
            {sub.planName[0]?.toUpperCase() ?? 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{sub.planName} plan</span>
              <span className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-bold border ${
                trialing ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-green-50 border-green-200 text-green-700'
              }`}>
                {sub.status}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {fmtGBP(sub.monthlyPrice)}/month · up to {sub.maxClients} clients
            </div>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {trialing ? 'Trial ends' : 'Renews'}
          </div>
          <div className="text-sm font-bold text-gray-900 mt-0.5">
            {trialing ? fmtD(sub.trialEndsAt) : fmtD(sub.currentPeriodEnd)}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

// ── Tab 2: Security ────────────────────────────────────────────────────────────
function SecurityTab({
  profile, onSave,
}: {
  profile: UserProfile; onSave: (msg: string) => void
}) {
  const [cur,  setCur]  = useState('')
  const [pw1,  setPw1]  = useState('')
  const [pw2,  setPw2]  = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showPw1, setShowPw1] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const str = pwStrength(pw1)

  // POST /api/auth/change-password
  const changePwMutation = useMutation({
    mutationFn: () => api.post('/api/auth/change-password', { currentPassword: cur, newPassword: pw1 }),
    onSuccess: () => { setCur(''); setPw1(''); setPw2(''); onSave('Password updated.') },
    onError: () => onSave('Incorrect current password.'),
  })

  function PwField({
    label, val, setVal, show, setShow,
  }: {
    label: string; val: string; setVal: (v: string) => void; show: boolean; setShow: (v: boolean) => void
  }) {
    const [focused, setFocused] = useState(false)
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        <div
          style={{
            border: `1px solid ${focused ? '#3b82f6' : '#d1d5db'}`,
            boxShadow: focused ? '0 0 0 3px rgba(59,130,246,.15)' : 'none',
          }}
          className="flex items-center gap-2 h-11 px-3 rounded-xl bg-white"
        >
          <span className="text-gray-400 text-sm">🔒</span>
          <input
            type={show ? 'text' : 'password'}
            value={val}
            onChange={e => setVal(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="flex-1 border-none outline-none bg-transparent text-sm text-gray-900"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            {show ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Change Password */}
      <SectionCard title="Change password" desc="Use a strong password of at least 12 characters.">
        <div className="flex flex-col gap-3.5">
          <PwField label="Current password"     val={cur}  setVal={setCur}  show={showCur} setShow={setShowCur} />
          <PwField label="New password"         val={pw1}  setVal={setPw1}  show={showPw1} setShow={setShowPw1} />
          {pw1 && str && (
            <div className="flex items-center gap-2.5">
              <div className="flex-1 flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    style={{ background: i < str.n ? str.color : '#e5e7eb' }}
                    className="flex-1 h-1.5 rounded-full"
                  />
                ))}
              </div>
              <span className="text-xs font-bold w-12 text-right" style={{ color: str.color }}>
                {str.label}
              </span>
            </div>
          )}
          <PwField label="Confirm new password" val={pw2}  setVal={setPw2}  show={showPw2} setShow={setShowPw2} />
          {pw2 && pw1 !== pw2 && (
            <span className="text-xs text-red-500">⚠ Passwords do not match.</span>
          )}
        </div>
        <div className="mt-5">
          <button
            disabled={!cur || !pw1 || pw1 !== pw2 || changePwMutation.isPending}
            onClick={() => changePwMutation.mutate()}
            className="inline-flex items-center gap-2 h-10 px-5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            🔑 {changePwMutation.isPending ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </SectionCard>

      {/* 2FA */}
      <SectionCard
        title="Two-factor authentication"
        desc="Add an extra layer of security to your account."
        action={
          <span
            style={{
              color: profile.twoFactorEnabled ? '#16a34a' : '#9ca3af',
              background: profile.twoFactorEnabled ? '#f0fdf4' : '#f3f4f6',
              border: `1px solid ${profile.twoFactorEnabled ? '#86efac' : '#e5e7eb'}`,
            }}
            className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-bold"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: profile.twoFactorEnabled ? '#16a34a' : '#9ca3af' }}
            />
            {profile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </span>
        }
      >
        <TwoFactorAuthRow />
      </SectionCard>
    </div>
  )
}

// ── Tab 3: Preferences ─────────────────────────────────────────────────────────
function PrefsTab({ profile, onSave }: { profile: UserProfile; onSave: (msg: string) => void }) {
  const [lang, setLang] = useState('en-GB')
  const [tz,   setTz]   = useState('Europe/London')
  const [prefs, setPrefs] = useState({
    approved: true, rejected: true, reminder: true, weekly: false, mentions: true,
  })
  const set = (k: string) => (v: boolean) => setPrefs(p => ({ ...p, [k]: v }))

  function SelField({ label, value, onChange, helper, children }: {
    label: string; value: string; onChange: (v: string) => void; helper?: string; children: React.ReactNode
  }) {
    const [focused, setFocused] = useState(false)
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        <div
          style={{ border: `1px solid ${focused ? '#3b82f6' : '#d1d5db'}`, boxShadow: focused ? '0 0 0 3px rgba(59,130,246,.15)' : '' }}
          className="relative h-11 rounded-xl bg-white"
        >
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full h-full px-3 pr-9 border-none outline-none bg-transparent text-sm text-gray-900 cursor-pointer appearance-none"
          >
            {children}
          </select>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</span>
        </div>
        {helper && <span className="text-xs text-gray-400">{helper}</span>}
      </div>
    )
  }

  return (
    <div>
      <SectionCard title="Display preferences" desc="Controls how dates, times, and language are shown for your account only.">
        <div className="grid grid-cols-2 gap-4">
          <SelField label="Language" value={lang} onChange={setLang}>
            {[['en-GB','English (UK)'],['en-US','English (US)'],['fr-FR','Français'],['de-DE','Deutsch'],['es-ES','Español']].map(([v,l]) =>
              <option key={v} value={v}>{l}</option>
            )}
          </SelField>
          <SelField label="Timezone" value={tz} onChange={setTz} helper="Used for due dates and notification timing.">
            {['Europe/London','Europe/Dublin','Europe/Paris','America/New_York','America/Los_Angeles'].map(o =>
              <option key={o}>{o}</option>
            )}
          </SelField>
        </div>
        <div className="mt-5">
          <button
            onClick={() => onSave('Display preferences saved.')}
            className="inline-flex items-center gap-2 h-10 px-5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            💾 Save preferences
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Email notifications"
        desc={`Choose what activity triggers an email to ${profile.email}.`}
      >
        <Toggle label="Invoice approved"    desc="When an invoice you submitted is approved."           checked={prefs.approved}  onChange={set('approved')} />
        <Toggle label="Invoice rejected"    desc="When an invoice you submitted is rejected."           checked={prefs.rejected}  onChange={set('rejected')} />
        <Toggle label="Approval reminders"  desc="Daily nudge when invoices in your queue are overdue." checked={prefs.reminder}  onChange={set('reminder')} />
        <Toggle label="Weekly spend digest" desc="Every Monday: top vendors, counts, OCR stats."        checked={prefs.weekly}    onChange={set('weekly')} />
        <Toggle label="Mentions & comments" desc="When someone @mentions you in invoice comments."      checked={prefs.mentions}  onChange={set('mentions')} />
        <div className="mt-5">
          <button
            onClick={() => onSave('Notification preferences saved.')}
            className="inline-flex items-center gap-2 h-10 px-5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            💾 Save preferences
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Tab 4: Connected Accounts ──────────────────────────────────────────────────
function ConnectedTab({ onSave }: { onSave: (msg: string) => void }) {
  const [google,    setGoogle]    = useState(false)
  const [microsoft, setMicrosoft] = useState(false)

  const GoogleIcon = () => (
    <svg width="22" height="22" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  )
  const MsIcon = () => (
    <svg width="22" height="22" viewBox="0 0 18 18">
      <path fill="#F25022" d="M0 0h8.5v8.5H0z"/>
      <path fill="#7FBA00" d="M9.5 0H18v8.5H9.5z"/>
      <path fill="#00A4EF" d="M0 9.5h8.5V18H0z"/>
      <path fill="#FFB900" d="M9.5 9.5H18V18H9.5z"/>
    </svg>
  )

  const accounts = [
    { key: 'google', name: 'Google', email: 'user@gmail.com', icon: <GoogleIcon />, linked: google,
      toggle: () => { setGoogle(v => !v); onSave(google ? 'Google account unlinked.' : 'Google account linked.') } },
    { key: 'ms', name: 'Microsoft', email: 'user@outlook.com', icon: <MsIcon />, linked: microsoft,
      toggle: () => { setMicrosoft(v => !v); onSave(microsoft ? 'Microsoft account unlinked.' : 'Microsoft account linked.') } },
  ]

  return (
    <div>
      <SectionCard title="Connected accounts" desc="Link third-party accounts for quicker sign-in and integrations.">
        <div className="flex flex-col gap-3.5">
          {accounts.map(a => (
            <div
              key={a.key}
              style={{
                border: `1.5px solid ${a.linked ? '#86efac' : '#e5e7eb'}`,
                background: a.linked ? '#f0fdf4' : '#fff',
              }}
              className="flex items-center gap-4 px-4 py-4 rounded-2xl transition-all"
            >
              <span className="w-11 h-11 rounded-xl bg-white border border-gray-100 grid place-items-center flex-shrink-0 shadow-sm">
                {a.icon}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{a.name}</span>
                  <span
                    style={{
                      color: a.linked ? '#16a34a' : '#9ca3af',
                      background: a.linked ? '#f0fdf4' : '#f3f4f6',
                      border: `1px solid ${a.linked ? '#86efac' : '#e5e7eb'}`,
                    }}
                    className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.linked ? '#16a34a' : '#9ca3af' }} />
                    {a.linked ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {a.linked ? `Signed in as ${a.email}` : `Connect your ${a.name} account for single sign-on.`}
                </div>
              </div>
              <button
                onClick={a.toggle}
                style={{
                  border: `1.5px solid ${a.linked ? '#fca5a5' : '#d1d5db'}`,
                  background: a.linked ? '#fff1f2' : '#fff',
                  color: a.linked ? '#ef4444' : '#4b5563',
                }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold whitespace-nowrap"
              >
                {a.linked ? '🔗 Unlink' : '🔗 Connect'}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3.5 flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-gray-600">
          ℹ️ Linking an account doesn't grant it access to your InvoiceIQ data. It is only used for authentication.
        </div>
      </SectionCard>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [tab, setTab]   = useState<TabId>('profile')
  const [toast, setToast] = useState<string | null>(null)

  // GET /api/auth/me
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/api/auth/me')
      return res.data
    },
  })

  if (isLoading || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const CONTENT: Record<TabId, React.ReactNode> = {
    profile:   <ProfileTab   profile={profile} onSave={setToast} />,
    security:  <SecurityTab  profile={profile} onSave={setToast} />,
    prefs:     <PrefsTab     profile={profile} onSave={setToast} />,
    connected: <ConnectedTab onSave={setToast} />,
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sub-nav */}
      <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-100 p-6 overflow-y-auto">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-2 mb-6 pb-5 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 grid place-items-center">
            <span className="text-xl font-extrabold text-white">{initials(profile.fullName)}</span>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-gray-900">{profile.fullName}</div>
            <div className="text-xs text-gray-500 mt-0.5">{profile.role}</div>
          </div>
        </div>

        <div className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 px-2.5 mb-2">
          Account
        </div>

        {SUBNAV.map(item => {
          const on = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{ background: on ? '#eff6ff' : 'transparent', color: on ? '#1d4ed8' : '#6b7280' }}
              className="relative flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium mb-1 hover:bg-gray-50 transition-colors text-left"
            >
              {on && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-blue-600" />
              )}
              <span className="text-base">{item.icon}</span>
              <span className={on ? 'font-bold' : ''}>{item.label}</span>
            </button>
          )
        })}
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-9 bg-gray-50">
        <div className="max-w-[720px] mx-auto">
          {CONTENT[tab]}
        </div>
      </main>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}