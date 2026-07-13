'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../hooks/useAuth'
import { clientService } from '../../../../services/client.service'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'

const schema = z.object({
  businessName:          z.string().min(1, 'Business name is required'),
  tradingName:           z.string().optional(),
  ownerFullName:         z.string().optional(),
  ownerEmail:            z.string().email('Invalid email').optional().or(z.literal('')),
  ownerPhone:            z.string().optional(),
  businessAddress:       z.string().optional(),
  businessPostcode:      z.string().optional(),
  localAuthority:        z.string().optional(),
  vatRegistrationNumber: z.string().optional(),
  awrsUrn:               z.string().optional(),
  monthlyFee:            z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function AddClientPage() {
  const router = useRouter()
  const { setActiveClient } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      const client = await clientService.create({
        ...data,
        clientType: 'OffLicence',
        monthlyFee: data.monthlyFee ? Number(data.monthlyFee) : 0,
      })
      setActiveClient(client)
      toast.success(`${client.businessName} added successfully!`)
      router.push('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message ?? 'Failed to add client')
    } finally {
      setIsLoading(false)
    }
  }

  // Use same input styling as existing forms
  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5"
  const errorClass = "text-red-500 text-xs mt-1"

  return (
    <div className="max-w-2xl">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Back to clients
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Client</h1>
        <p className="text-sm text-gray-500 mt-1">Add an off-licence shop to manage their accounting.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Business Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Business Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Business Name <span className="text-red-500">*</span></label>
              <input {...register('businessName')} className={inputClass} placeholder="e.g. Raj's Off-Licence" />
              {errors.businessName && <p className={errorClass}>{errors.businessName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Trading Name</label>
              <input {...register('tradingName')} className={inputClass} placeholder="If different from business name" />
            </div>
            <div>
              <label className={labelClass}>VAT Registration Number</label>
              <input {...register('vatRegistrationNumber')} className={inputClass} placeholder="GB123456789" />
            </div>
            <div>
              <label className={labelClass}>AWRS URN</label>
              <input {...register('awrsUrn')} className={inputClass} placeholder="XQAW00000123456" />
            </div>
            <div>
              <label className={labelClass}>Monthly Fee (£)</label>
              <input {...register('monthlyFee')} type="number" className={inputClass} placeholder="150" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Business Address</label>
              <input {...register('businessAddress')} className={inputClass} placeholder="Street address" />
            </div>
            <div>
              <label className={labelClass}>Postcode</label>
              <input {...register('businessPostcode')} className={inputClass} placeholder="HA9 0BT" />
            </div>
            <div>
              <label className={labelClass}>Local Authority</label>
              <input {...register('localAuthority')} className={inputClass} placeholder="e.g. Brent Council" />
            </div>
          </div>
        </div>

        {/* Owner Contact */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Owner Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Owner Full Name</label>
              <input {...register('ownerFullName')} className={inputClass} placeholder="Rajesh Kumar" />
            </div>
            <div>
              <label className={labelClass}>Owner Email</label>
              <input {...register('ownerEmail')} type="email" className={inputClass} placeholder="owner@shop.co.uk" />
              {errors.ownerEmail && <p className={errorClass}>{errors.ownerEmail.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Owner Phone</label>
              <input {...register('ownerPhone')} className={inputClass} placeholder="+44 7700 900000" />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition-colors"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #1E3A5F)' }}
          >
            {isLoading ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : 'Add Client'}
          </button>
        </div>
      </form>
    </div>
  )
}
