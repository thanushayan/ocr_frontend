'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import {
  ScanText, LayoutDashboard, ReceiptText, CloudUpload,
  Store, ClipboardCheck, Package, BarChart3,
  FileText, Users, Settings, Briefcase, Wine, Percent, BookOpen
} from 'lucide-react'

// பக்க வழிகாட்டல் items
const NAV = [
  { id: 'clients',    href: '/clients',    label: 'Clients',         icon: Briefcase },
  { id: 'dashboard',  href: '/dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'invoices',   href: '/invoices',   label: 'Invoices',        icon: ReceiptText },
  { id: 'upload',     href: '/upload',     label: 'Upload Invoice',  icon: CloudUpload },
  { id: 'vendors',    href: '/vendors',    label: 'Vendors',         icon: Store },
  { id: 'approvals',  href: '/approvals',  label: 'Approvals',       icon: ClipboardCheck, badge: 8 },
  { id: 'pos',        href: '/purchase-orders', label: 'Purchase Orders', icon: Package },
  { id: 'alcohol',    href: '/alcohol-duty',        label: 'Alcohol Duty',        icon: Wine },
  { id: 'vat',        href: '/vat-returns',         label: 'VAT Returns',         icon: Percent },
  { id: 'mgmt',       href: '/management-accounts', label: 'Mgmt Accounts',       icon: BookOpen },
  { id: 'analytics',  href: '/analytics',  label: 'Analytics',       icon: BarChart3 },
  { id: 'reports',    href: '/reports',    label: 'Reports',         icon: FileText },
  { id: 'team',       href: '/team',       label: 'Team',            icon: Users },
  { id: 'settings',   href: '/settings',   label: 'Settings',        icon: Settings },
]

// User initials avatar
function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)' }}>
      {initials}
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user }  = useAuth()

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-200">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)' }}>
          <ScanText size={18} />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-gray-900">
          Invoice<span className="text-blue-600">IQ</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3.5 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            // Active page check
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-blue-600" />
                )}

                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                <span className="flex-1">{item.label}</span>

                {/* Badge */}
                {item.badge && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-400 text-white text-[11px] font-extrabold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User info at bottom */}
      <div className="border-t border-gray-200 p-3.5">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <InitialsAvatar name={user?.fullName ?? 'User'} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{user?.fullName ?? 'User'}</div>
            <div className="text-xs text-gray-400 truncate capitalize">{user?.role ?? 'Member'}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}