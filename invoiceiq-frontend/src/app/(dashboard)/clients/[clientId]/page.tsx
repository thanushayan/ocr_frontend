'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft, Store, CheckCircle, MapPin, Phone, Mail, User, FileText, ShieldCheck,
  AlertCircle, StickyNote, ClipboardCheck, Users, Plus, Loader2, Circle,
} from 'lucide-react'
import { useAuth } from '../../../../hooks/useAuth'
import { clientService } from '../../../../services/client.service'
import type { Client, PremisesLicence, AwrsCompliance, ComplianceAlert } from '../../../../types/client.types'

function fmtFee(n?: number) {
  if (!n) return '—'
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n) }
  catch { return `£${n}` }
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-sm text-gray-800 mt-0.5">{value || '—'}</div>
      </div>
    </div>
  )
}

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const { activeClient, setActiveClient } = useAuth()
  const router = useRouter()

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: ['client', clientId],
    queryFn: () => clientService.get(clientId),
    enabled: !!clientId,
  })

  if (isLoading) {
    return <div className="p-10 text-sm text-gray-500 text-center">Loading client…</div>
  }
  if (!client) {
    return <div className="p-10 text-sm text-gray-500 text-center">Client not found.</div>
  }

  const isActive = activeClient?.id === client.id

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/clients')}
          className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-900 mb-3"
        >
          <ArrowLeft size={14} /> Back to clients
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)' }}>
              {client.businessName[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.businessName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {client.tradingName ? `Trading as ${client.tradingName} · ` : ''}Onboarded {fmtDate(client.onboardedAt)}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setActiveClient(client); router.push('/dashboard') }}
            className={`inline-flex items-center gap-1.5 h-9 px-3.5 text-sm font-semibold rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {isActive ? 'Currently selected — open dashboard' : 'Work on this client'}
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-2">
          <InfoRow icon={<User size={15} />}  label="Owner"          value={client.ownerFullName} />
          <InfoRow icon={<Mail size={15} />}  label="Owner email"    value={client.ownerEmail} />
          <InfoRow icon={<Phone size={15} />} label="Owner phone"    value={client.ownerPhone} />
          <InfoRow icon={<MapPin size={15} />} label="Address"
            value={[client.businessAddress, client.businessPostcode].filter(Boolean).join(', ')} />
          <InfoRow icon={<Store size={15} />} label="Local authority" value={client.localAuthority} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-2">
          <InfoRow icon={<FileText size={15} />}    label="VAT registration" value={client.vatRegistrationNumber} />
          <InfoRow icon={<ShieldCheck size={15} />} label="AWRS URN"         value={client.awrsUrn} />
          <InfoRow icon={<FileText size={15} />}    label="Client type"      value={client.clientType} />
          <InfoRow icon={<FileText size={15} />}    label="Monthly fee"      value={fmtFee(client.monthlyFee)} />
          <InfoRow icon={<CheckCircle size={15} />} label="Status"           value={client.isActive ? 'Active' : 'Inactive'} />
        </div>
      </div>

      {/* Compliance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AlertsCard clientId={client.id} />
        <ComplianceCard clientId={client.id} />
      </div>

      {/* Collaboration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <NotesCard clientId={client.id} />
        <TasksCard clientId={client.id} />
      </div>

      <PortalUsersCard clientId={client.id} />
    </div>
  )
}

// ── Compliance alerts ────────────────────────────────────────────────────────
const SEVERITY_STYLE: Record<string, string> = {
  Warning:  'bg-amber-50 border-amber-200 text-amber-700',
  Urgent:   'bg-orange-50 border-orange-200 text-orange-700',
  Critical: 'bg-red-50 border-red-200 text-red-700',
}

function SectionCard({ icon, title, action, children }: {
  icon: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-200">
        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">{icon}</span>
        <span className="text-sm font-bold text-gray-900 flex-1">{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

function AlertsCard({ clientId }: { clientId: string }) {
  const { data: alerts = [] } = useQuery<ComplianceAlert[]>({
    queryKey: ['client-alerts', clientId],
    queryFn: () => clientService.getAlerts(clientId),
  })
  const open = alerts.filter(a => !a.isResolved)

  return (
    <SectionCard icon={<AlertCircle size={16} />} title={`Compliance alerts${open.length ? ` (${open.length})` : ''}`}>
      {open.length === 0 ? (
        <div className="px-5 py-6 text-sm text-gray-400 text-center">No unresolved alerts. 🎉</div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {open.map(a => (
            <div key={a.id} className="px-5 py-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-bold border ${SEVERITY_STYLE[a.severity] ?? SEVERITY_STYLE.Warning}`}>
                  {a.severity}
                </span>
                <span className="text-sm font-semibold text-gray-900">{a.title}</span>
                {a.dueDate && <span className="ml-auto text-xs text-gray-400">Due {fmtDate(a.dueDate)}</span>}
              </div>
              <p className="text-xs text-gray-500 mt-1">{a.message}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ── Premises licence + AWRS ──────────────────────────────────────────────────
function ComplianceCard({ clientId }: { clientId: string }) {
  const { data: licence } = useQuery<PremisesLicence | null>({
    queryKey: ['premises-licence', clientId],
    queryFn: () => clientService.getPremisesLicence(clientId).catch(() => null),
  })
  const { data: awrs } = useQuery<AwrsCompliance | null>({
    queryKey: ['awrs', clientId],
    queryFn: () => clientService.getAwrs(clientId).catch(() => null),
  })

  return (
    <SectionCard icon={<ShieldCheck size={16} />} title="Licensing & AWRS">
      <div className="px-5 py-2">
        <InfoRow icon={<FileText size={15} />} label="Premises licence"
          value={licence ? `${licence.licenceNumber}${licence.expiryDate ? ` · expires ${fmtDate(licence.expiryDate)}` : ''}` : 'Not recorded'} />
        <InfoRow icon={<User size={15} />} label="DPS"
          value={licence?.dpsFullName ? `${licence.dpsFullName}${licence.dpsPersonalLicenceNumber ? ` (${licence.dpsPersonalLicenceNumber})` : ''}` : '—'} />
        <InfoRow icon={<ShieldCheck size={15} />} label="AWRS"
          value={awrs ? `${awrs.isRegistered ? 'Registered' : 'Not registered'}${awrs.awrsUrn ? ` · ${awrs.awrsUrn}` : ''}` : 'Not recorded'} />
        <InfoRow icon={<CheckCircle size={15} />} label="Last inspection"
          value={awrs?.lastInspectionDate ? `${fmtDate(awrs.lastInspectionDate)} — ${awrs.inspectionResult ?? 'Pending'}` : '—'} />
      </div>
    </SectionCard>
  )
}

// ── Notes ────────────────────────────────────────────────────────────────────
interface ClientNote {
  id: string
  noteText: string
  noteType: string
  isPinned: boolean
  createdAt: string
}

function NotesCard({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient()
  const [text, setText] = useState('')

  const { data: notes = [] } = useQuery<ClientNote[]>({
    queryKey: ['client-notes', clientId],
    queryFn: () => clientService.getNotes(clientId),
  })

  const addMutation = useMutation({
    mutationFn: () => clientService.addNote(clientId, text.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notes', clientId] })
      setText('')
      toast.success('Note added')
    },
    onError: () => toast.error('Failed to add note'),
  })

  return (
    <SectionCard icon={<StickyNote size={16} />} title="Notes">
      <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="px-5 py-5 text-sm text-gray-400 text-center">No notes yet.</div>
        ) : notes.map(n => (
          <div key={n.id} className="px-5 py-3">
            <p className="text-sm text-gray-800">{n.noteText}</p>
            <p className="text-[11px] text-gray-400 mt-1">{n.noteType} · {fmtDate(n.createdAt)}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && text.trim()) addMutation.mutate() }}
          placeholder="Add a note…"
          className="flex-1 h-9 px-3 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
        />
        <button
          onClick={() => text.trim() && addMutation.mutate()}
          disabled={!text.trim() || addMutation.isPending}
          className="inline-flex items-center gap-1 h-9 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {addMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
        </button>
      </div>
    </SectionCard>
  )
}

// ── Tasks ────────────────────────────────────────────────────────────────────
interface ClientTask {
  id: string
  title: string
  description?: string
  priority: string
  status: string
  dueDate?: string
}

function TasksCard({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')

  const { data: tasks = [] } = useQuery<ClientTask[]>({
    queryKey: ['client-tasks', clientId],
    queryFn: () => clientService.getTasks(clientId),
  })

  const addMutation = useMutation({
    mutationFn: () => clientService.createTask(clientId, { title: title.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-tasks', clientId] })
      setTitle('')
      toast.success('Task created')
    },
    onError: () => toast.error('Failed to create task'),
  })

  const completeMutation = useMutation({
    mutationFn: (taskId: string) => clientService.updateTask(clientId, taskId, { status: 'Completed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-tasks', clientId] }),
    onError: () => toast.error('Failed to update task'),
  })

  return (
    <SectionCard icon={<ClipboardCheck size={16} />} title="Tasks">
      <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="px-5 py-5 text-sm text-gray-400 text-center">No tasks yet.</div>
        ) : tasks.map(t => {
          const done = t.status === 'Completed'
          return (
            <div key={t.id} className="flex items-center gap-3 px-5 py-3">
              <button
                onClick={() => !done && completeMutation.mutate(t.id)}
                className={done ? 'text-emerald-500' : 'text-gray-300 hover:text-blue-500 transition-colors'}
              >
                {done ? <CheckCircle size={17} /> : <Circle size={17} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'}`}>{t.title}</p>
                <p className="text-[11px] text-gray-400">{t.priority}{t.dueDate ? ` · due ${fmtDate(t.dueDate)}` : ''}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && title.trim()) addMutation.mutate() }}
          placeholder="Add a task…"
          className="flex-1 h-9 px-3 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
        />
        <button
          onClick={() => title.trim() && addMutation.mutate()}
          disabled={!title.trim() || addMutation.isPending}
          className="inline-flex items-center gap-1 h-9 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {addMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
        </button>
      </div>
    </SectionCard>
  )
}

// ── Portal users (shop owner access) ─────────────────────────────────────────
interface PortalUser {
  id: string
  fullName: string
  email: string
  isActive: boolean
  lastLoginAt?: string
}

function PortalUsersCard({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })

  const { data: users = [] } = useQuery<PortalUser[]>({
    queryKey: ['portal-users', clientId],
    queryFn: () => clientService.getPortalUsers(clientId),
  })

  const inviteMutation = useMutation({
    mutationFn: () => clientService.invitePortalUser(clientId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-users', clientId] })
      setForm({ fullName: '', email: '', password: '' })
      setShowForm(false)
      toast.success('Portal user invited')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message ?? 'Failed to invite portal user')
    },
  })

  const valid = form.fullName.trim() && form.email.trim() && form.password.length >= 8

  return (
    <SectionCard
      icon={<Users size={16} />}
      title="Portal users (shop owner access)"
      action={
        <button
          onClick={() => setShowForm(s => !s)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <Plus size={14} /> Invite
        </button>
      }
    >
      {showForm && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
          <input
            value={form.fullName}
            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            placeholder="Full name"
            className="h-9 px-3 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <input
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            type="email"
            className="h-9 px-3 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <div className="flex gap-2">
            <input
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Temp password (8+ chars)"
              type="password"
              className="flex-1 h-9 px-3 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              onClick={() => valid && inviteMutation.mutate()}
              disabled={!valid || inviteMutation.isPending}
              className="h-9 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {inviteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Send'}
            </button>
          </div>
        </div>
      )}
      {users.length === 0 ? (
        <div className="px-5 py-5 text-sm text-gray-400 text-center">No portal users yet. Invite the shop owner to give them access.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)' }}>
                {u.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{u.fullName}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <span className={`inline-flex items-center h-6 px-2 rounded-full text-xs font-bold border ${
                u.isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-400'
              }`}>
                {u.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
