'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../hooks/useAuth'
import api from '../../../lib/axios'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Member {
  userId: string
  fullName: string
  email: string
  role: string
  status?: string
  joinedAt: string
  isYou?: boolean
}

// ── Role meta ──────────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { fg: string; bg: string; bd: string; icon: string; desc: string }> = {
  Admin:   { fg:'#1d4ed8', bg:'#eff6ff', bd:'#bfdbfe', icon:'🛡️', desc:'Full access — settings, billing, team, all invoices.' },
  Manager: { fg:'#0f766e', bg:'#f0fdfa', bd:'#99f6e4', icon:'⚙️', desc:'Upload & manage invoices, run approvals, view reports.' },
  Owner:   { fg:'#7e22ce', bg:'#faf5ff', bd:'#e9d5ff', icon:'👑', desc:'Workspace owner with full administrative control.' },
  Viewer:  { fg:'#4b5563', bg:'#f9fafb', bd:'#d1d5db', icon:'👁️', desc:'Read-only access to invoices and reports.' },
}

function initials(name: string) {
  return (name || '?')
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ── Role Badge ─────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const m = ROLE_META[role] ?? ROLE_META.Viewer
  return (
    <span
      style={{ color: m.fg, background: m.bg, border: `1px solid ${m.bd}` }}
      className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-bold whitespace-nowrap"
    >
      <span className="text-[11px]">{m.icon}</span> {role}
    </span>
  )
}

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const active = status === 'Active'
  return (
    <span
      className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-xs font-bold whitespace-nowrap"
      style={{
        color: active ? '#16a34a' : '#d97706',
        background: active ? '#f0fdf4' : '#fffbeb',
        border: `1px ${active ? 'solid' : 'dashed'} ${active ? '#86efac' : '#fcd34d'}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: active ? '#16a34a' : '#d97706' }}
      />
      {status}
    </span>
  )
}

// ── Role Picker ────────────────────────────────────────────────────────────────
function RolePicker({ value, onChange }: { value: string; onChange: (r: string) => void }) {
  const roles = Object.entries(ROLE_META).filter(([r]) => r !== 'Owner')
  return (
    <div className="flex flex-col gap-2.5">
      {roles.map(([role, meta]) => {
        const on = value === role
        return (
          <label
            key={role}
            onClick={() => onChange(role)}
            style={{
              border: `1.5px solid ${on ? meta.bd : '#e5e7eb'}`,
              background: on ? meta.bg : '#fff',
            }}
            className="flex items-center gap-3.5 p-3 rounded-xl cursor-pointer transition-all"
          >
            <span
              style={{
                background: on ? meta.bg : '#f3f4f6',
                color: on ? meta.fg : '#9ca3af',
                border: `1px solid ${on ? meta.bd : '#e5e7eb'}`,
              }}
              className="w-9 h-9 rounded-lg grid place-items-center text-base flex-shrink-0"
            >
              {meta.icon}
            </span>
            <div className="flex-1">
              <div
                style={{ color: on ? meta.fg : '#111827' }}
                className="text-sm font-bold"
              >
                {role}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{meta.desc}</div>
            </div>
            <span
              style={{ border: `2px solid ${on ? meta.fg : '#9ca3af'}` }}
              className="w-[18px] h-[18px] rounded-full grid place-items-center flex-shrink-0"
            >
              {on && (
                <span
                  className="w-[9px] h-[9px] rounded-full"
                  style={{ background: meta.fg }}
                />
              )}
            </span>
          </label>
        )
      })}
    </div>
  )
}

// ── Invite Modal ───────────────────────────────────────────────────────────────
function InviteModal({
  onClose,
  onInvite,
  loading,
}: {
  onClose: () => void
  onInvite: (email: string, role: string) => void
  loading: boolean
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Manager')
  const [focused, setFocused] = useState(false)
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      style={{ background: 'rgba(19,23,34,.55)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-[520px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 grid place-items-center text-lg">
              👤
            </span>
            <div>
              <div className="text-base font-bold text-gray-900">Invite team member</div>
              <div className="text-xs text-gray-400 mt-0.5">
                They'll receive an email invite to join your workspace
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-400"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">
              Email address <span className="text-red-500">*</span>
            </label>
            <div
              style={{
                border: `1px solid ${focused ? '#3b82f6' : email && !valid ? '#ef4444' : '#d1d5db'}`,
                boxShadow: focused ? '0 0 0 3px rgba(59,130,246,.15)' : '',
              }}
              className="flex items-center gap-2 h-11 px-3 bg-gray-50 rounded-xl"
            >
              <span className="text-gray-400 text-sm">✉️</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="colleague@company.com"
                className="flex-1 border-none outline-none bg-transparent text-sm text-gray-900"
              />
            </div>
            {email && !valid && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                ⚠ Enter a valid email address.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Role</label>
            <RolePicker value={role} onChange={setRole} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            disabled={!valid || loading}
            onClick={() => { if (valid) onInvite(email.trim(), role) }}
            className="h-10 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            ✉ {loading ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Change Role Modal ──────────────────────────────────────────────────────────
function ChangeRoleModal({
  member,
  onClose,
  onSave,
  loading,
}: {
  member: Member
  onClose: () => void
  onSave: (userId: string, role: string) => void
  loading: boolean
}) {
  const [role, setRole] = useState(member.role)

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      style={{ background: 'rgba(19,23,34,.55)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-sm font-bold flex-shrink-0">
              {initials(member.fullName || member.email)}
            </div>
            <div>
              <div className="text-base font-bold text-gray-900">
                {member.fullName || member.email}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">Change role for this member</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-400"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-600">New role</label>
          <RolePicker value={role} onChange={setRole} />
        </div>

        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            disabled={role === member.role || loading}
            onClick={() => onSave(member.userId, role)}
            className="h-10 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            💾 {loading ? 'Saving…' : 'Save role'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useState(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  })
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 bg-gray-900 text-white rounded-2xl shadow-xl text-sm font-semibold z-[200] whitespace-nowrap">
      <span className="text-green-400">✓</span> {msg}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const { companyId, user } = useAuth()
  const queryClient = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [roleTarget, setRoleTarget] = useState<Member | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  // GET /api/companies/{companyId}/members
  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['members', companyId],
    queryFn: async () => {
      const res = await api.get(`/api/companies/${companyId}/members`)
      return (res.data as Member[]).map(m => ({
        ...m,
        status: m.status ?? 'Active',
        isYou: m.email === user?.email,
      }))
    },
    enabled: !!companyId,
  })

  // POST /api/companies/{companyId}/members/invite
  const inviteMutation = useMutation({
    mutationFn: (body: { email: string; role: string }) =>
      api.post(`/api/companies/${companyId}/members/invite`, body),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['members', companyId] })
      setShowInvite(false)
      showToast(`Invite sent to ${vars.email}`)
    },
    onError: () => showToast('Failed to send invitation'),
  })

  // PATCH /api/companies/{companyId}/members/{userId}
  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/api/companies/${companyId}/members/${userId}`, { role }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['members', companyId] })
      setRoleTarget(null)
      const name = members.find(m => m.userId === vars.userId)?.fullName || 'Member'
      showToast(`${name}'s role updated to ${vars.role}`)
    },
    onError: () => showToast('Failed to update role'),
  })

  // DELETE /api/companies/{companyId}/members/{userId}
  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/api/companies/${companyId}/members/${userId}`),
    onSuccess: (_, userId) => {
      const name = members.find(m => m.userId === userId)?.fullName ||
                   members.find(m => m.userId === userId)?.email || 'Member'
      queryClient.invalidateQueries({ queryKey: ['members', companyId] })
      setRemoving(null)
      showToast(`${name} removed from workspace`)
    },
    onError: () => { setRemoving(null); showToast('Failed to remove member') },
  })

  const active  = members.filter(m => (m.status ?? 'Active') === 'Active').length
  const pending = members.filter(m => m.status === 'Pending').length

  const stats = [
    { label: 'Total members',   value: members.length,                               icon: '👥', fg: '#2563eb', bg: '#eff6ff' },
    { label: 'Admins',          value: members.filter(m => m.role === 'Admin' || m.role === 'Owner').length, icon: '🛡️', fg: '#1d4ed8', bg: '#dbeafe' },
    { label: 'Managers',        value: members.filter(m => m.role === 'Manager').length, icon: '⚙️', fg: '#0f766e', bg: '#f0fdfa' },
    { label: 'Pending invites', value: pending,                                       icon: '⏳', fg: '#d97706', bg: '#fffbeb' },
  ]

  const ROLES_LEGEND = Object.entries(ROLE_META).filter(([r]) => r !== 'Owner')

  return (
    <main className="flex-1 overflow-y-auto p-7 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Team members</h1>
          <p className="text-sm text-gray-500 mt-1">
            {members.length} members · {active} active · {pending} pending
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 h-10 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm"
        >
          👤 Invite member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {stats.map(s => (
          <div
            key={s.label}
            className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3.5 shadow-sm"
          >
            <span
              style={{ background: s.bg, color: s.fg }}
              className="w-10 h-10 rounded-xl grid place-items-center text-lg flex-shrink-0"
            >
              {s.icon}
            </span>
            <div>
              <div className="text-[22px] font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            Loading members…
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <span className="text-4xl">👥</span>
            <span className="text-sm">No team members yet</span>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {['Member', 'Email', 'Role', 'Status', 'Joined', ''].map(h => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold uppercase tracking-widest text-gray-400 px-[18px] py-3 border-b border-gray-100"
                    style={h === '' ? { textAlign: 'right' } : {}}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => {
                const isPending = m.status === 'Pending'
                const isRemoving = removing === m.userId
                return (
                  <tr
                    key={m.userId}
                    style={{
                      borderBottom: i < members.length - 1 ? '1px solid #f3f4f6' : 'none',
                      opacity: isRemoving ? 0 : 1,
                      transition: 'opacity .25s, background .12s',
                    }}
                    className="hover:bg-gray-50"
                  >
                    {/* Member */}
                    <td className="px-[18px] py-3.5">
                      <div className="flex items-center gap-3">
                        {isPending ? (
                          <span
                            className="w-10 h-10 rounded-full grid place-items-center flex-shrink-0 text-amber-500 text-lg"
                            style={{ background: '#fffbeb', border: '2px dashed #fcd34d' }}
                          >
                            ✉
                          </span>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-xs font-bold flex-shrink-0">
                            {initials(m.fullName || m.email)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900">
                              {m.fullName || (
                                <span className="text-gray-400 italic font-normal">Invited user</span>
                              )}
                            </span>
                            {m.isYou && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                You
                              </span>
                            )}
                          </div>
                          {m.fullName && (
                            <div className="text-xs text-gray-400 mt-0.5">{m.email}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-[18px] py-3.5">
                      <span className="text-blue-600 text-xs">{m.email}</span>
                    </td>

                    {/* Role */}
                    <td className="px-[18px] py-3.5">
                      <RoleBadge role={m.role} />
                    </td>

                    {/* Status */}
                    <td className="px-[18px] py-3.5">
                      <StatusBadge status={m.status ?? 'Active'} />
                    </td>

                    {/* Joined */}
                    <td className="px-[18px] py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {m.joinedAt
                        ? new Date(m.joinedAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-[18px] py-3.5">
                      <div className="flex gap-1.5 justify-end items-center">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => inviteMutation.mutate({ email: m.email, role: m.role })}
                              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                            >
                              ✉ Resend
                            </button>
                            <button
                              onClick={() => {
                                setRemoving(m.userId)
                                removeMutation.mutate(m.userId)
                              }}
                              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50"
                              style={{ border: '1px solid #fca5a5', background: '#fff1f2' }}
                            >
                              ✕ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              disabled={m.isYou || m.role === 'Owner'}
                              onClick={() => setRoleTarget(m)}
                              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              ✏ Change role
                            </button>
                            <button
                              disabled={m.isYou || m.role === 'Owner'}
                              onClick={() => {
                                if (confirm(`Remove ${m.fullName || m.email} from the team?`)) {
                                  setRemoving(m.userId)
                                  removeMutation.mutate(m.userId)
                                }
                              }}
                              className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold text-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{ border: '1px solid #fca5a5', background: '#fff1f2' }}
                            >
                              👤 Remove
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Permissions legend */}
      <div className="mt-4 flex gap-2.5 flex-wrap">
        {ROLES_LEGEND.map(([role, meta]) => (
          <span
            key={role}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-100 bg-white text-xs text-gray-600"
          >
            <span style={{ color: meta.fg }}>{meta.icon}</span>
            <span className="font-bold" style={{ color: meta.fg }}>{role}:</span> {meta.desc}
          </span>
        ))}
      </div>

      {/* Modals */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvite={(email, role) => inviteMutation.mutate({ email, role })}
          loading={inviteMutation.isPending}
        />
      )}
      {roleTarget && (
        <ChangeRoleModal
          member={roleTarget}
          onClose={() => setRoleTarget(null)}
          onSave={(userId, role) => changeRoleMutation.mutate({ userId, role })}
          loading={changeRoleMutation.isPending}
        />
      )}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </main>
  )
}