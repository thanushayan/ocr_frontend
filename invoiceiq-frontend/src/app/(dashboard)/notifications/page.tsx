'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  CheckCheck,
  FileText,
  XCircle,
  Clock,
  ScanText,
  Settings2,
} from 'lucide-react'
import { notificationsService } from '../../../services/notifications.service'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

type Filter = 'All' | 'Unread'

const TYPE_META: Record<string, { icon: React.ReactNode; fg: string; bg: string }> = {
  InvoiceApproved: {
    icon: <CheckCheck className="w-5 h-5" />,
    fg: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  InvoiceRejected: {
    icon: <XCircle className="w-5 h-5" />,
    fg: 'text-red-500',
    bg: 'bg-red-50',
  },
  InvoiceSubmitted: {
    icon: <FileText className="w-5 h-5" />,
    fg: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  PaymentDue: {
    icon: <Clock className="w-5 h-5" />,
    fg: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  OcrComplete: {
    icon: <ScanText className="w-5 h-5" />,
    fg: 'text-violet-600',
    bg: 'bg-violet-50',
  },
}

function getMeta(type: string) {
  return TYPE_META[type] ?? {
    icon: <Bell className="w-5 h-5" />,
    fg: 'text-gray-400',
    bg: 'bg-gray-100',
  }
}

function relTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  return `${d}d ago`
}

function groupLabel(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 86400000)  return 'Today'
  if (diff < 172800000) return 'Yesterday'
  return 'Earlier'
}

function NotifIcon({ type }: { type: string }) {
  const m = getMeta(type)
  return (
    <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${m.bg} ${m.fg}`}>
      {m.icon}
    </span>
  )
}

function GroupHeader({ label }: { label: string }) {
  return (
    <div className="px-5 py-[10px] bg-gray-50 border-b border-gray-100">
      <span className="text-[11px] font-bold uppercase tracking-[.08em] text-gray-400">{label}</span>
    </div>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-[72px] px-8 gap-[14px]">
      <span className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
        <Bell className="w-8 h-8" />
      </span>
      <div className="text-center">
        <p className="text-base font-semibold text-gray-700 mb-1.5">
          {filtered ? 'No unread notifications' : "You're all caught up"}
        </p>
        <p className="text-sm text-gray-400 max-w-xs">
          {filtered
            ? 'All notifications have been read.'
            : "We'll notify you when something needs your attention."}
        </p>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>('All')
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', filter],
    queryFn: () => notificationsService.getAll(filter === 'Unread'),
  })

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) => notificationsService.markRead(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  const groups = useMemo(() => {
    const buckets: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] }
    notifications.forEach(n => buckets[groupLabel(n.createdAt)].push(n))
    return (['Today', 'Yesterday', 'Earlier'] as const)
      .map(label => ({ label, items: buckets[label] }))
      .filter(g => g.items.length > 0)
  }, [notifications])

  function handleMarkOne(n: Notification) {
    if (!n.isRead) markReadMutation.mutate([n.id])
  }

  function handleMarkAll() {
    const ids = notifications.filter(n => !n.isRead).map(n => n.id)
    if (ids.length) markReadMutation.mutate(ids)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-[14px] flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-indigo-600 text-white text-xs font-bold">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markReadMutation.isPending}
            className="inline-flex items-center gap-[7px] h-9 px-4 rounded-lg border border-gray-300 bg-white text-[13px] font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0.5 bg-gray-100 border border-gray-200 rounded-lg p-[3px] w-fit">
        {(['All', 'Unread'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`inline-flex items-center gap-[7px] px-[18px] py-[7px] rounded-md text-[13px] font-semibold transition-all ${
              filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f}
            {f === 'Unread' && unreadCount > 0 && (
              <span className={`min-w-[18px] h-[18px] px-[5px] rounded-full text-[10px] font-bold grid place-items-center ${
                filter === 'Unread'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading notifications…</p>
          </div>
        ) : groups.length === 0 ? (
          <EmptyState filtered={filter === 'Unread'} />
        ) : (
          groups.map(group => (
            <div key={group.label}>
              <GroupHeader label={group.label} />
              <div>
                {group.items.map((notif, idx) => {
                  const unread = !notif.isRead
                  return (
                    <div key={notif.id}>
                      <button
                        onClick={() => handleMarkOne(notif)}
                        className={`w-full flex items-start gap-[14px] px-5 py-4 text-left transition-colors hover:bg-gray-50 ${
                          unread ? '' : 'bg-white'
                        }`}
                        style={{
                          background: unread ? 'rgba(239,244,254,.55)' : undefined,
                          borderLeft: unread ? '3px solid #6366f1' : '3px solid transparent',
                        }}
                      >
                        <NotifIcon type={notif.type} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-[10px] flex-wrap">
                            <span className={`text-sm flex-1 min-w-0 ${unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {notif.title}
                            </span>
                            <span className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                              {relTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-[13px] text-gray-500 mt-[3px] leading-[1.55]">
                            {notif.message}
                          </p>
                        </div>

                        {unread && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-[6px]" />
                        )}
                      </button>

                      {idx < group.items.length - 1 && (
                        <div className="h-px bg-gray-100" style={{ marginLeft: 74 }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preference link */}
      {groups.length > 0 && (
        <div className="text-center">
          <a
            href="/settings"
            className="inline-flex items-center gap-[6px] text-[13px] font-semibold text-gray-400 hover:text-gray-600 transition-colors no-underline"
          >
            <Settings2 className="w-[15px] h-[15px]" />
            Manage notification preferences
          </a>
        </div>
      )}
    </div>
  )
}