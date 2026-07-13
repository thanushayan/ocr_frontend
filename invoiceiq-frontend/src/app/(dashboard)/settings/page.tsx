'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../hooks/useAuth'
import { settingsService } from '../../../services/settings.service'

type TabId = 'general' | 'currency' | 'language' | 'xero' | 'notifications' | 'security'

const SETTINGS_NAV: { id: TabId; label: string; icon: string }[] = [
  { id: 'general',       label: 'General',          icon: '🏢' },
  { id: 'currency',      label: 'Currency',          icon: '💷' },
  { id: 'language',      label: 'Language & Region', icon: '🌐' },
  { id: 'xero',          label: 'Xero Integration',  icon: '🔗' },
  { id: 'notifications', label: 'Notifications',     icon: '🔔' },
  { id: 'security',      label: 'Security',          icon: '🔒' },
]

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="pb-4 mb-5 border-b border-gray-100">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {desc && <p className="text-sm text-gray-500 mt-1">{desc}</p>}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, helper }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; helper?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className={`h-10 px-3 border rounded-lg text-sm bg-white outline-none transition-shadow ${focused ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}
      />
      {helper && <span className="text-xs text-gray-400">{helper}</span>}
    </div>
  )
}

function SelectField({ label, value, onChange, helper, children }: {
  label?: string; value?: string; onChange?: (v: string) => void
  helper?: string; children: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
      <div className={`relative h-10 border rounded-lg bg-white transition-shadow ${focused ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}>
        <select value={value} onChange={e => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full h-full pl-3 pr-8 border-none outline-none bg-transparent text-sm text-gray-900 appearance-none cursor-pointer">
          {children}
        </select>
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▾</span>
      </div>
      {helper && <span className="text-xs text-gray-400">{helper}</span>}
    </div>
  )
}

function ToggleRow({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        {desc && <div className="text-xs text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-5' : 'left-1'}`} />
      </button>
    </div>
  )
}

function SaveButton({ onClick, label = 'Save changes', loading }: { onClick: () => void; label?: string; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="inline-flex items-center gap-2 h-9 px-5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60">
      {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : '💾'} {label}
    </button>
  )
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 bg-gray-900 text-white text-sm font-semibold rounded-2xl shadow-2xl whitespace-nowrap">
      <span className="text-green-400">✓</span>{msg}
    </div>
  )
}

// ── Tab 1: General — read-only (no PATCH endpoint exists) ─────────────────────

function GeneralTab({ onSave: _ }: { onSave: (msg?: string) => void }) {
  const { activeClientId: clientId } = useAuth()

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', clientId],
    queryFn: () => settingsService.getCompany(clientId!),
    enabled: !!clientId,
  })

  return (
    <div className="flex flex-col gap-7">
      <SectionHeader title="Company profile" desc="Contact support to update your company details." />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 animate-pulse">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {[
            ['Company name',        company?.name],
            ['Registration number', company?.registrationNumber],
            ['VAT number',          company?.vatNumber],
            ['Email',               company?.email],
            ['Phone',               company?.phone],
            ['Your role',           company?.userRole],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
              <span className="text-sm text-gray-900">{value || <span className="text-gray-400">—</span>}</span>
            </div>
          ))}
          {company?.address && (
            <div className="col-span-2 flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</span>
              <span className="text-sm text-gray-900">{company.address}</span>
            </div>
          )}
        </div>
      )}
      <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
        <span className="flex-shrink-0 mt-0.5">ℹ️</span>
        <span>Company details are managed by your account administrator. Contact support to make changes.</span>
      </div>
    </div>
  )
}

// ── Tab 2: Currency ───────────────────────────────────────────────────────────

function CurrencyTab({ onSave }: { onSave: (msg?: string) => void }) {
  const { activeClientId: clientId } = useAuth()
  const [curr, setCurr] = useState('GBP')

  const { data: ratesData } = useQuery({
    queryKey: ['currency-rates', clientId],
    queryFn: () => settingsService.getCurrencyRates(clientId!),
    enabled: !!clientId,
  })

  const { data: baseData } = useQuery({
    queryKey: ['currency-base', clientId],
    queryFn: () => settingsService.getBaseCurrency(clientId!),
    enabled: !!clientId,
  })

  useEffect(() => { if (baseData?.currency) setCurr(baseData.currency) }, [baseData])

  const saveMutation = useMutation({
    mutationFn: () => settingsService.updateBaseCurrency(clientId!, curr),
    onSuccess: () => onSave('Base currency updated.'),
  })

  const rates = ratesData?.rates ?? [
    { code: 'EUR', name: 'Euro',         rate: '1.1742' },
    { code: 'USD', name: 'US Dollar',    rate: '1.2643' },
    { code: 'JPY', name: 'Japanese Yen', rate: '196.83' },
    { code: 'CHF', name: 'Swiss Franc',  rate: '1.1204' },
  ]

  return (
    <div className="flex flex-col gap-7">
      <SectionHeader title="Base currency" desc="All invoices, reports and analytics are displayed in your base currency." />
      <div className="max-w-sm">
        <SelectField label="Base currency" value={curr} onChange={setCurr} helper="Changing the base currency affects all future reports. Historical data remains unchanged.">
          {[['GBP','British Pound Sterling — £'],['EUR','Euro — €'],['USD','US Dollar — $'],['CAD','Canadian Dollar — CA$'],['AUD','Australian Dollar — A$'],['CHF','Swiss Franc — CHF'],['JPY','Japanese Yen — ¥'],['SEK','Swedish Krona — kr'],['SGD','Singapore Dollar — S$']].map(([v,l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </SelectField>
      </div>
      <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <span className="flex-shrink-0 mt-0.5">ℹ️</span>
        <span>Exchange rates are updated daily via the ECB reference rate feed. Rates shown are indicative only.</span>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Live exchange rates (base: {curr})</div>
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Currency','Name',`Rate (1 ${curr})`,'Updated'].map((h, i) => (
                  <th key={h} className={`py-2.5 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rates.map((r: any, i: number) => (
                <tr key={r.code} className={i < rates.length - 1 ? 'border-b border-gray-50' : ''}>
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{r.code}</td>
                  <td className="py-3 px-4 text-gray-500">{r.name}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">{r.rate}</td>
                  <td className="py-3 px-4 text-right text-xs text-gray-400">{r.updatedAt ? new Date(r.updatedAt).toLocaleString('en-GB') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div><SaveButton onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} label="Update currency" /></div>
    </div>
  )
}

// ── Tab 3: Language ───────────────────────────────────────────────────────────

function LanguageTab({ onSave }: { onSave: (msg?: string) => void }) {
  const { activeClientId: clientId } = useAuth()
  const [lang, setLang]             = useState('en-GB')
  const [numFmt, setNumFmt]         = useState('1,234.56')
  const [firstDay, setFirstDay]     = useState('Monday')
  const [fiscalYear, setFiscalYear] = useState('April')

  const { data: langData } = useQuery({
    queryKey: ['language', clientId],
    queryFn: () => settingsService.getLanguage(clientId!),
    enabled: !!clientId,
  })

  useEffect(() => { if (langData?.languageCode) setLang(langData.languageCode) }, [langData])

  const saveMutation = useMutation({
    mutationFn: () => settingsService.updateLanguage(clientId!, lang),
    onSuccess: () => onSave('Language preferences saved.'),
  })

  return (
    <div className="flex flex-col gap-7">
      <SectionHeader title="Language & region" desc="Control how text, numbers and dates are displayed across the platform." />
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Default language" value={lang} onChange={setLang}>
          {[['en-GB','English (UK)'],['en-US','English (US)'],['fr-FR','Français'],['de-DE','Deutsch'],['es-ES','Español'],['it-IT','Italiano'],['nl-NL','Nederlands'],['pt-BR','Português (Brasil)'],['ja-JP','日本語'],['zh-CN','中文 (简体)']].map(([v,l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </SelectField>
        <SelectField label="Number format" value={numFmt} onChange={setNumFmt} helper="Applies to amounts in tables and exports.">
          {['1,234.56','1.234,56','1 234,56'].map(o => <option key={o}>{o}</option>)}
        </SelectField>
        <SelectField label="First day of week" value={firstDay} onChange={setFirstDay}>
          {['Monday','Sunday','Saturday'].map(o => <option key={o}>{o}</option>)}
        </SelectField>
        <SelectField label="Fiscal year start" value={fiscalYear} onChange={setFiscalYear}>
          {['January','April','July','October'].map(o => <option key={o}>{o} 1</option>)}
        </SelectField>
      </div>
      <div><SaveButton onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} label="Save preferences" /></div>
    </div>
  )
}

// ── Tab 4: Xero ───────────────────────────────────────────────────────────────

function XeroTab({ onSave }: { onSave: (msg?: string) => void }) {
  const { activeClientId: clientId } = useAuth()

  const { data: xeroData, refetch } = useQuery({
    queryKey: ['xero', clientId],
    queryFn: () => settingsService.getXeroConnection(clientId!),
    enabled: !!clientId,
  })

  const connected = xeroData?.isConnected ?? false
  const lastSync  = xeroData?.lastSyncedAt ? new Date(xeroData.lastSyncedAt).toLocaleString('en-GB') : '—'

  const syncMutation = useMutation({
    mutationFn: () => settingsService.syncXero(clientId!),
    onSuccess: () => { refetch(); onSave('Xero sync complete.') },
  })

  const disconnectMutation = useMutation({
    mutationFn: () => settingsService.disconnectXero(clientId!),
    onSuccess: () => { refetch(); onSave('Xero disconnected.') },
  })

  const XeroLogo = () => (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="18" fill="#1AB4D7" />
      <path d="M11.6 18l4.2-4.2 1.4 1.4-2.8 2.8 2.8 2.8-1.4 1.4L11.6 18zm12.8 0l-4.2 4.2-1.4-1.4 2.8-2.8-2.8-2.8 1.4-1.4L24.4 18zm-8.1 3.4l1.6-6.8 1.9.4-1.6 6.8-1.9-.4z" fill="#fff" />
    </svg>
  )

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Xero Integration" desc="Connect InvoiceIQ to Xero to sync invoices, vendors, and payment data automatically." />
      <div className={`border-2 rounded-2xl overflow-hidden ${connected ? 'border-green-200' : 'border-gray-200'}`}>
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
          <XeroLogo />
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900">Xero Accounting</div>
            <div className="text-xs text-gray-400 mt-0.5">xero.com · Cloud accounting software</div>
          </div>
          <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-bold border ${connected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
            {connected ? 'Connected' : 'Not connected'}
          </span>
        </div>
        {connected ? (
          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {[['Organisation', xeroData?.organisationName ?? '—'],['Sync status','Active'],['Last synced', lastSync]].map(([k,v]) => (
                <div key={k} className="p-3.5 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">{k}</div>
                  <div className="text-sm font-semibold text-gray-900">{v}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}
                className="inline-flex items-center gap-2 h-9 px-4 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-wait">
                {syncMutation.isPending
                  ? <><span className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" /> Syncing…</>
                  : <>🔄 Sync now</>}
              </button>
              <span className="text-xs text-gray-400">Last synced: {lastSync}</span>
            </div>
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="text-sm font-bold text-gray-900 mb-1">Disconnect Xero</div>
              <div className="text-xs text-gray-500 mb-3">Disconnecting will stop automatic sync. Your existing Xero data will not be deleted.</div>
              <button onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending}
                className="inline-flex items-center gap-2 h-9 px-4 border-2 border-red-300 bg-red-50 text-red-600 text-sm font-bold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60">
                🔌 Disconnect Xero
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-7 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-gray-500 max-w-md">Connect InvoiceIQ to Xero to automatically push approved invoices, sync vendor records, and reconcile payments.</p>
            <div className="flex flex-wrap justify-center gap-5 my-1">
              {['Automatic invoice export','Two-way vendor sync','Payment reconciliation','Real-time status updates'].map(f => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">✅ {f}</span>
              ))}
            </div>
            <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/xero/${clientId}/connect`}
              className="inline-flex items-center gap-2.5 h-11 px-6 bg-[#1AB4D7] text-white text-sm font-bold rounded-lg hover:bg-[#17a0c0] transition-colors">
              <svg width="20" height="20" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="18" fill="rgba(255,255,255,.2)" />
                <path d="M11.6 18l4.2-4.2 1.4 1.4-2.8 2.8 2.8 2.8-1.4 1.4L11.6 18zm12.8 0l-4.2 4.2-1.4-1.4 2.8-2.8-2.8-2.8 1.4-1.4L24.4 18zm-8.1 3.4l1.6-6.8 1.9.4-1.6 6.8-1.9-.4z" fill="#fff" />
              </svg>
              Connect to Xero
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab 5: Notifications ──────────────────────────────────────────────────────

function NotificationsTab({ onSave }: { onSave: (msg?: string) => void }) {
  const [prefs, setPrefs] = useState({
    inv_submit: true, inv_approved: true, inv_rejected: true,
    ocr_done: false, payment: true, weekly: true, monthly: false, vendor_new: false,
  })
  const set = (k: keyof typeof prefs) => (v: boolean) => setPrefs(p => ({ ...p, [k]: v }))

  return (
    <div className="flex flex-col gap-7">
      <SectionHeader title="Notification preferences" desc="Choose which events trigger email notifications to your account." />
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Approvals &amp; invoices</div>
        <ToggleRow label="Invoice submitted for your approval" desc="Notified when an invoice enters your approval queue." checked={prefs.inv_submit}   onChange={set('inv_submit')} />
        <ToggleRow label="Invoice approved"                    desc="When an invoice you submitted is approved."          checked={prefs.inv_approved} onChange={set('inv_approved')} />
        <ToggleRow label="Invoice rejected"                    desc="When an invoice you submitted is rejected."          checked={prefs.inv_rejected} onChange={set('inv_rejected')} />
        <ToggleRow label="OCR processing complete"             desc="When an uploaded invoice has been processed."        checked={prefs.ocr_done}     onChange={set('ocr_done')} />
        <ToggleRow label="Payment recorded"                    desc="When a payment is logged against an invoice."        checked={prefs.payment}      onChange={set('payment')} />
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Digests &amp; reports</div>
        <ToggleRow label="Weekly spend summary"            desc="Every Monday at 08:00 — top vendors, invoice counts, OCR stats."  checked={prefs.weekly}     onChange={set('weekly')} />
        <ToggleRow label="Monthly reconciliation reminder" desc="First of each month — prompt to reconcile pending invoices."       checked={prefs.monthly}    onChange={set('monthly')} />
        <ToggleRow label="New vendor registered"           desc="When a team member adds a new vendor record."                      checked={prefs.vendor_new} onChange={set('vendor_new')} />
      </div>
      <div><SaveButton onClick={() => onSave('Notification preferences saved.')} label="Save preferences" /></div>
    </div>
  )
}

// ── Tab 6: Security ───────────────────────────────────────────────────────────

interface ApiKey { id: string; name: string; keyPrefix: string; createdAt: string; lastUsedAt?: string }

function SecurityTab({ onSave }: { onSave: (msg?: string) => void }) {
  const queryClient = useQueryClient()

  const [tfa, setTfa]               = useState(true)
  const [timeout, setTimeout2]      = useState('4h')
  const [minLen, setMinLen]         = useState('12')
  const [expiry, setExpiry]         = useState('90d')
  const [complexity, setComplexity] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [copied, setCopied]         = useState<string | null>(null)

  const { data: keys = [] } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: () => settingsService.getApiKeys(),
  })

  const createMutation = useMutation({
    mutationFn: () => settingsService.createApiKey(newKeyName || 'New key'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setNewKeyName('')
      onSave('API key created.')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (keyId: string) => settingsService.revokeApiKey(keyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  })

  function handleCopy(id: string) {
    setCopied(id)
    setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div className="flex flex-col gap-7">
      <SectionHeader title="Security settings" desc="Manage authentication, session policies and API access for your organisation." />
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Authentication</div>
        <ToggleRow label="Require two-factor authentication" desc="Enforce 2FA for all team members. TOTP and SMS supported." checked={tfa} onChange={setTfa} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <SelectField label="Session timeout" value={timeout} onChange={setTimeout2}>
          {[['30m','30 minutes'],['1h','1 hour'],['4h','4 hours'],['8h','8 hours'],['never','Never']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </SelectField>
        <SelectField label="Min. password length" value={minLen} onChange={setMinLen}>
          {['8','10','12','16'].map(o => <option key={o} value={o}>{o} characters</option>)}
        </SelectField>
        <SelectField label="Password expiry" value={expiry} onChange={setExpiry}>
          {[['30d','Every 30 days'],['90d','Every 90 days'],['180d','Every 180 days'],['never','Never']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </SelectField>
      </div>
      <ToggleRow label="Require uppercase, numbers & symbols" desc="Enforce strong password complexity rules." checked={complexity} onChange={setComplexity} />
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <div className="text-sm font-bold text-gray-900">API keys</div>
            <div className="text-xs text-gray-400 mt-0.5">Used to authenticate programmatic access to the InvoiceIQ API.</div>
          </div>
          <div className="flex items-center gap-2">
            <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name"
              className="h-8 px-3 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-400" />
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className="inline-flex items-center gap-1.5 h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60">
              + Create key
            </button>
          </div>
        </div>
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          {keys.map((k, i) => (
            <div key={k.id} className={`flex items-center gap-3.5 px-4 py-3.5 ${i < keys.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">🔑</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">{k.name}</div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">
                  {k.keyPrefix}… · Created {new Date(k.createdAt).toLocaleDateString('en-GB')}
                  {k.lastUsedAt ? ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString('en-GB')}` : ''}
                </div>
              </div>
              <button onClick={() => handleCopy(k.id)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition-colors ${copied === k.id ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {copied === k.id ? '✓ Copied' : '📋 Copy'}
              </button>
              <button onClick={() => revokeMutation.mutate(k.id)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-100 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors">
                🗑 Revoke
              </button>
            </div>
          ))}
          {keys.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-400">No API keys. Create one to enable programmatic access.</div>
          )}
        </div>
      </div>
      <div><SaveButton onClick={() => onSave('Security settings saved.')} label="Save security settings" /></div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab]     = useState<TabId>('general')
  const [toast, setToast] = useState<string | null>(null)

  function save(msg?: string) { setToast(msg ?? 'Settings saved.') }

  const content: Record<TabId, React.ReactNode> = {
    general:       <GeneralTab       onSave={save} />,
    currency:      <CurrencyTab      onSave={save} />,
    language:      <LanguageTab      onSave={save} />,
    xero:          <XeroTab          onSave={save} />,
    notifications: <NotificationsTab onSave={save} />,
    security:      <SecurityTab      onSave={save} />,
  }

  return (
    <div className="-m-7 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      <aside className="w-[220px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-gray-400">Settings</span>
        </div>
        <nav className="p-3 flex-1">
          {SETTINGS_NAV.map(item => {
            const active = tab === item.id
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 text-left ${active ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-500 font-medium hover:bg-gray-50 hover:text-gray-900'}`}>
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-blue-600" />}
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-9 bg-gray-50">
        <div className="max-w-[720px]">{content[tab]}</div>
      </main>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}