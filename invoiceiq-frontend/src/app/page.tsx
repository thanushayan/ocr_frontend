'use client'

import Link from 'next/link'
import {
  ScanText, ArrowRight, CheckCircle, ReceiptText, Wine, Percent,
  BookOpen, ShieldCheck, Users, CloudUpload, ClipboardCheck, Zap,
  Building2, FileText, BarChart3,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const BRAND_GRADIENT = 'linear-gradient(135deg, #3B82F6, #1E3A5F)'
const HERO_GRADIENT = 'linear-gradient(150deg, #1E3A5F 0%, #284B7A 48%, #3B82F6 100%)'

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
        style={{ background: light ? 'rgba(255,255,255,.15)' : BRAND_GRADIENT }}>
        <ScanText size={18} />
      </div>
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-gray-900'}`}>
        Invoice<span className={light ? 'text-blue-300' : 'text-blue-600'}>IQ</span>
      </span>
    </div>
  )
}

const FEATURES = [
  { icon: ScanText,      title: 'OCR invoice capture',      desc: 'Drag & drop supplier invoices — vendor, dates, totals and VAT are extracted automatically and ready to review in seconds.' },
  { icon: Users,         title: 'All your shops, one login', desc: 'Manage every off-licence client from a single workspace. Switch shops in one click; every invoice, return and report stays separated per client.' },
  { icon: Wine,          title: 'Alcohol Duty',              desc: 'Quarterly duty calculated from purchase invoices across beer, wine, spirits and cider bands — with HMRC rates built in.' },
  { icon: Percent,       title: 'MTD VAT Returns',           desc: 'All nine Making Tax Digital boxes prepared per client, with a clear Draft → Ready → Submitted trail and HMRC receipt IDs.' },
  { icon: BookOpen,      title: 'Management accounts',       desc: 'Monthly P&L built for off-licences: alcohol, tobacco, grocery and lottery revenue split, margins, overheads — emailed to the shop owner in one click.' },
  { icon: ShieldCheck,   title: 'Licensing compliance',      desc: 'Premises licence expiries, DPS details and AWRS status tracked per shop, with automatic alerts before deadlines bite.' },
  { icon: ClipboardCheck,title: 'Approval workflows',        desc: 'Route invoices through review steps, catch duplicates automatically, and keep a full audit trail of every action.' },
  { icon: Zap,           title: 'Integrations',              desc: 'Two-way Xero sync, signed webhooks for your own systems, API keys, and CSV/JSON exports of everything.' },
]

const STEPS = [
  { n: '1', icon: Building2,  title: 'Add your clients',    desc: 'Set up each off-licence with its VAT number, AWRS URN and licence details in under a minute.' },
  { n: '2', icon: CloudUpload,title: 'Upload invoices',      desc: 'Drop in supplier invoices — OCR reads them, flags duplicates, and queues anything unusual for review.' },
  { n: '3', icon: FileText,   title: 'File duty & VAT',      desc: 'Alcohol duty and MTD VAT returns are computed from the same invoice data. Review the numbers and submit.' },
  { n: '4', icon: BarChart3,  title: 'Report to owners',     desc: 'Send monthly management accounts to each shop owner and watch spend trends across your whole client base.' },
]

const PLANS = [
  { name: 'Starter',   price: '£29',  period: '/month', clients: 'Up to 5 clients',  highlight: false,
    features: ['OCR invoice capture', 'MTD VAT returns', 'Alcohol duty', 'Email support'] },
  { name: 'Pro',       price: '£79',  period: '/month', clients: 'Up to 25 clients', highlight: true,
    features: ['Everything in Starter', 'Management accounts', 'Compliance alerts', 'Xero sync & webhooks', 'Priority support'] },
  { name: 'Unlimited', price: '£149', period: '/month', clients: 'Unlimited clients', highlight: false,
    features: ['Everything in Pro', 'Client portal access', 'API keys', 'Dedicated onboarding'] },
]

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  const primaryCta = isAuthenticated
    ? { href: '/clients', label: 'Open dashboard' }
    : { href: '/register', label: 'Start free trial' }

  return (
    <div className="bg-white text-gray-900">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center gap-8 px-6 h-16">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {!isAuthenticated && (
              <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                Sign in
              </Link>
            )}
            <Link href={primaryCta.href}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-white text-sm font-bold rounded-lg transition-opacity hover:opacity-90"
              style={{ background: BRAND_GRADIENT }}>
              {primaryCta.label} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: HERO_GRADIENT }}>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <span className="inline-flex items-center gap-1.5 h-7 px-3.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-blue-100 uppercase tracking-widest mb-6">
            Built for UK off-licence accountants
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight max-w-3xl mx-auto">
            Run every off-licence client&apos;s books
            <span className="text-blue-300"> from one place</span>
          </h1>
          <p className="text-blue-100/90 text-lg mt-5 max-w-2xl mx-auto leading-relaxed">
            InvoiceIQ turns supplier invoices into VAT returns, alcohol duty and monthly P&amp;L —
            automatically. You manage the shops; the OCR does the typing.
          </p>
          <div className="flex items-center justify-center gap-3 mt-9 flex-wrap">
            <Link href={primaryCta.href}
              className="inline-flex items-center gap-2 h-12 px-7 bg-white text-gray-900 text-sm font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              {primaryCta.label} <ArrowRight size={16} />
            </Link>
            <a href="#how"
              className="inline-flex items-center gap-2 h-12 px-7 border border-white/30 text-white text-sm font-bold rounded-xl hover:bg-white/10 transition-colors">
              See how it works
            </a>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-xs font-semibold text-blue-100/80 flex-wrap">
            <span className="inline-flex items-center gap-1.5"><CheckCircle size={14} /> Free trial — no card needed</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle size={14} /> Making Tax Digital ready</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle size={14} /> HMRC duty rates built in</span>
          </div>
        </div>
      </section>

      {/* ── Feature strip ── */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            ['OCR', 'Invoices read automatically'],
            ['9 boxes', 'MTD VAT prepared per client'],
            ['4 bands', 'Beer · wine · spirits · cider duty'],
            ['1 login', 'Every client, one workspace'],
          ].map(([big, small]) => (
            <div key={big as string}>
              <div className="text-xl font-extrabold text-gray-900">{big}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">{small}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">Everything an off-licence practice needs</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Purpose-built for accountants whose clients sell alcohol — not a generic bookkeeping tool with plugins.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white mb-4" style={{ background: BRAND_GRADIENT }}>
                <f.icon size={18} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">From shoebox of invoices to filed returns</h2>
            <p className="text-gray-500 mt-3">Four steps, repeated for every client — without retyping a single line.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map(s => (
              <div key={s.n} className="relative bg-white border border-gray-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mx-auto mb-4" style={{ background: BRAND_GRADIENT }}>
                  <s.icon size={20} />
                </div>
                <span className="absolute top-3 left-4 text-3xl font-extrabold text-gray-100">{s.n}</span>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">Simple pricing that scales with your practice</h2>
          <p className="text-gray-500 mt-3">Every plan includes OCR capture, unlimited invoices and a free trial.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map(p => (
            <div key={p.name}
              className={`relative bg-white rounded-2xl p-7 border ${p.highlight ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg' : 'border-gray-200'}`}>
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 px-3 rounded-full text-[11px] font-bold text-white flex items-center"
                  style={{ background: BRAND_GRADIENT }}>
                  Most popular
                </span>
              )}
              <h3 className="text-sm font-bold text-gray-900">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">{p.price}</span>
                <span className="text-sm text-gray-400 font-medium">{p.period}</span>
              </div>
              <p className="text-xs font-semibold text-blue-600 mt-1.5">{p.clients}</p>
              <ul className="mt-5 space-y-2.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className={`mt-7 w-full inline-flex items-center justify-center h-10 rounded-lg text-sm font-bold transition-colors ${
                  p.highlight ? 'text-white hover:opacity-90' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                style={p.highlight ? { background: BRAND_GRADIENT } : undefined}>
                Start free trial
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto rounded-2xl px-8 py-12 text-center" style={{ background: HERO_GRADIENT }}>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Spend your time advising clients — not retyping invoices
          </h2>
          <p className="text-blue-100/90 mt-3">Set up your first off-licence client in minutes.</p>
          <Link href={primaryCta.href}
            className="inline-flex items-center gap-2 h-12 px-7 mt-7 bg-white text-gray-900 text-sm font-bold rounded-xl hover:bg-blue-50 transition-colors">
            {primaryCta.label} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center gap-4 justify-between">
          <Logo />
          <div className="flex items-center gap-6 text-xs font-semibold text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-gray-900 transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-gray-900 transition-colors">Register</Link>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} InvoiceIQ · Smart invoice processing for UK off-licences</p>
        </div>
      </footer>
    </div>
  )
}
