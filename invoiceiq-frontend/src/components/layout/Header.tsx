'use client'

import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  // User initials
  const initials = (user?.fullName ?? 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center gap-4 px-6">

      {/* Company name */}
      <button className="flex items-center gap-2.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-extrabold shrink-0"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)' }}>
          {(user?.fullName ?? 'C')[0].toUpperCase()}
        </div>
        <span className="text-sm font-bold text-gray-900">
          {user ? 'My Company' : 'InvoiceIQ'}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">

        {/* Notification bell */}
        <div className="relative">
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <Bell size={20} />
          </button>
          {/* Notification badge */}
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center">
            5
          </span>
        </div>

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

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              {/* Click outside to close */}
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