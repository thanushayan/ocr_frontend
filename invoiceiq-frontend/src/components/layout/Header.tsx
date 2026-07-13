'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import ClientSelector from './ClientSelector'
import { Bell, ChevronDown, LogOut, User, Settings, CheckCheck, X, FileText, XCircle, Clock, ScanText } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { notificationsService } from '../../services/notifications.service'

// ── Type config ──
const TYPE_META: Record<string, { icon: React.ReactNode; fg: string; bg: string }> = {
  InvoiceApproved:  { icon: <CheckCheck className="w-4 h-4" />, fg: 'text-emerald-600', bg: 'bg-emerald-50' },
  InvoiceRejected:  { icon: <XCircle className="w-4 h-4" />,   fg: 'text-red-500',     bg: 'bg-red-50'     },
  InvoiceSubmitted: { icon: <FileText className="w-4 h-4" />,  fg: 'text-indigo-600',  bg: 'bg-indigo-50'  },
  PaymentDue:       { icon: <Clock className="w-4 h-4" />,     fg: 'text-amber-500',   bg: 'bg-amber-50'   },
  OcrComplete:      { icon: <ScanText className="w-4 h-4" />,  fg: 'text-violet-600',  bg: 'bg-violet-50'  },
}

function getMeta(type: string) {
  return TYPE_META[type] ?? { icon: <Bell className="w-4 h-4" />, fg: 'text-gray-400', bg: 'bg-gray-100' }
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

// ── Notification Bell Dropdown ──
function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['notifications', 'All'],
    queryFn: () => notificationsService.getAll(false),
  })

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) => notificationsService.markRead(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const preview = notifications.slice(0, 6)

  function handleMarkOne(n: any) {
    if (!n.isRead) markReadMutation.mutate([n.id])
  }

  function handleMarkAll() {
    const ids = notifications.filter(n => !n.isRead).map(n => n.id)
    if (ids.length) markReadMutation.mutate(ids)
  }

  return (
    <div ref={ref} className="relative">

      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-[380px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="h-5 px-2 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {preview.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="w-7 h-7 text-gray-300" />
                <p className="text-sm text-gray-400">You're all caught up</p>
              </div>
            ) : (
              preview.map((n: any, idx: number) => {
                const unread = !n.isRead
                const m = getMeta(n.type)
                return (
                  <div key={n.id}>
                    <button
                      onClick={() => { handleMarkOne(n); setOpen(false) }}
                      className="w-full flex items-start gap-[14px] px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      style={{
                        background: unread ? 'rgba(239,244,254,.55)' : undefined,
                        borderLeft: unread ? '3px solid #6366f1' : '3px solid transparent',
                      }}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.bg} ${m.fg}`}>
                        {m.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={`text-sm truncate ${unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {n.title}
                          </span>
                          <span className="text-[11px] text-gray-400 flex-shrink-0">{relTime(n.createdAt)}</span>
                        </div>
                        <p className="text-[13px] text-gray-500 mt-0.5 line-clamp-2 leading-[1.45]">{n.message}</p>
                      </div>
                      {unread && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-[6px]" />}
                    </button>
                    {idx < preview.length - 1 && (
                      <div className="h-px bg-gray-100" style={{ marginLeft: 66 }} />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              onClick={() => { setOpen(false); router.push('/notifications') }}
              className="w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-1"
            >
              View all notifications →
            </button>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Main Header ──
export default function Header() {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const initials = (user?.fullName ?? 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center gap-4 px-6">

      {/* Active client (off-licence shop) selector */}
      <ClientSelector />

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">

        {/* Notification bell with dropdown */}
        <NotificationBell />

        {/* User avatar + dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-1.5 py-1 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)' }}>
              {initials}
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b border-gray-100">
                  <div className="text-sm font-bold text-gray-900">{user?.fullName}</div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
                <a href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User size={15} /> Profile
                </a>
                <a href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings size={15} /> Settings
                </a>
                <div className="border-t border-gray-100 mt-1">
                  <button
                    onClick={() => { setShowUserMenu(false); logout() }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}