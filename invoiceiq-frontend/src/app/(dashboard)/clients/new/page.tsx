'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Store } from 'lucide-react'
import { clientService } from '../../../../services/client.service'
import type { CreateClientRequest } from '../../../../types/auth.types'

function Field({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-800 bg-gray-50 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white"
      />
    </div>
  )
}

export default function AddClientPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    businessName: '', tradingName: '', ownerFullName: '', ownerEmail: '',
    ownerPhone: '', businessAddress: '', businessPostcode: '', localAuthority: '',
    vatRegistrationNumber: '', awrsUrn: '', monthlyFee: '',
  })
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.businessName.trim().length > 0

  const createMutation = useMutation({
    mutationFn: (body: CreateClientRequest) => clientService.create(body),
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success(`${c.businessName} added successfully`)
      router.push('/clients')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message ?? 'Failed to add client. Please try again.')
    },
  })

  const onSubmit = () => {
    if (!valid) return
    createMutation.mutate({
      businessName: form.businessName,
      tradingName: form.tradingName || undefined,
      ownerFullName: form.ownerFullName || undefined,
      ownerEmail: form.ownerEmail || undefined,
      ownerPhone: form.ownerPhone || undefined,
      businessAddress: form.businessAddress || undefined,
      businessPostcode: form.businessPostcode || undefined,
      localAuthority: form.localAuthority || undefined,
      vatRegistrationNumber: form.vatRegistrationNumber || undefined,
      awrsUrn: form.awrsUrn || undefined,
      monthlyFee: form.monthlyFee ? Number(form.monthlyFee) : undefined,
    })
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Add Client</h1>
        <p className="text-sm text-gray-500 mt-1">Onboard a new off-licence shop to your practice.</p>
      </div>

      {/* Form card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Store className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Business details</p>
            <p className="text-xs text-gray-400">Only the business name is required — you can fill in the rest later.</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Business name" value={form.businessName} onChange={set('businessName')} placeholder="Krishna Off Licence Ltd" required />
            <Field label="Trading name" value={form.tradingName} onChange={set('tradingName')} placeholder="Krishna Wines" />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Owner full name" value={form.ownerFullName} onChange={set('ownerFullName')} placeholder="Suresh Kumar" />
            <Field label="Owner email" value={form.ownerEmail} onChange={set('ownerEmail')} placeholder="owner@shop.co.uk" type="email" />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Owner phone" value={form.ownerPhone} onChange={set('ownerPhone')} placeholder="07700 900000" type="tel" />
            <Field label="Local authority" value={form.localAuthority} onChange={set('localAuthority')} placeholder="Brent Council" />
          </div>
          <Field label="Business address" value={form.businessAddress} onChange={set('businessAddress')} placeholder="112 High Road, Wembley" />
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Business postcode" value={form.businessPostcode} onChange={set('businessPostcode')} placeholder="HA9 6AL" />
            <Field label="VAT registration number" value={form.vatRegistrationNumber} onChange={set('vatRegistrationNumber')} placeholder="GB123456789" />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="AWRS URN" value={form.awrsUrn} onChange={set('awrsUrn')} placeholder="XAAW00000123456" />
            <Field label="Monthly fee (£)" value={form.monthlyFee} onChange={set('monthlyFee')} placeholder="150" type="number" />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => router.push('/clients')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!valid || createMutation.isPending}
            onClick={onSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save client'}
          </button>
        </div>
      </div>
    </div>
  )
}
