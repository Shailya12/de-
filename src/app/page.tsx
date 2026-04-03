'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import {
  Camera, Shield, Zap, BarChart2, AlertTriangle, Download,
  CheckCircle, ChevronRight, Lock, Smartphone, Globe,
  Users, Clock, FileText, Star, ArrowRight, Building2
} from 'lucide-react'

export default function LandingPage() {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace(role === 'admin' ? '/admin' : '/checkin')
    }
  }, [user, role, loading, router])

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-1)' }} className="min-h-screen">
      <Navbar />
      <Hero />
      <LogoBar />
      <Features />
      <HowItWorks />
      <Stats />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}

/* ── Navbar ──────────────────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight">Vigil</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: 'var(--text-2)' }}>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-secondary text-sm px-4 py-2">Sign in</Link>
          <Link href="/login" className="btn-primary text-sm px-4 py-2">Get Started <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
      </div>
    </nav>
  )
}

/* ── Hero ────────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 px-4">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #3B82F6 0%, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto text-center relative">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6 animate-fade-up"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#93C5FD' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Now with real-time cloud sync
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-5 animate-fade-up animate-delay-1" style={{ lineHeight: 1.1 }}>
          Know who's in your<br />
          <span className="gradient-text">building, always.</span>
        </h1>

        <p className="text-lg max-w-xl mx-auto mb-8 animate-fade-up animate-delay-2" style={{ color: 'var(--text-2)' }}>
          Vigil gives your security team a simple mobile app to log every visitor — photo, name, phone — while admins get a real-time dashboard from anywhere.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up animate-delay-3">
          <Link href="/login" className="btn-primary px-6 py-3 text-sm">
            Start for free <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#how" className="btn-secondary px-6 py-3 text-sm">
            See how it works
          </a>
        </div>

        {/* App preview mockup */}
        <div className="mt-16 max-w-4xl mx-auto animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="rounded-2xl overflow-hidden border" style={{ border: '1px solid var(--border-hi)', background: 'var(--card)' }}>
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#EF4444' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#F59E0B' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22C55E' }} />
              <div className="flex-1 mx-3">
                <div className="max-w-xs mx-auto rounded-md px-3 py-1 text-xs text-center" style={{ background: 'var(--border)', color: 'var(--text-3)' }}>
                  vigil.app/admin
                </div>
              </div>
            </div>
            {/* Mock dashboard */}
            <div className="p-5">
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Today\'s Visitors', val: '24', color: '#3B82F6' },
                  { label: 'Currently Inside', val: '7',  color: '#22C55E' },
                  { label: 'Checked Out',      val: '17', color: '#71717A' },
                  { label: 'Flagged',          val: '1',  color: '#EF4444' },
                ].map((s) => (
                  <div key={s.label} className="card p-3">
                    <div className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{s.label}</div>
                    <div className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div className="card p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b text-sm font-medium" style={{ borderColor: 'var(--border)' }}>
                  <span>Recent Visitors</span>
                  <span className="badge badge-green">Live</span>
                </div>
                {[
                  { name: 'Ahmed Hassan',   time: '2m ago',  purpose: 'Meeting',    status: 'in' },
                  { name: 'Priya Sharma',   time: '18m ago', purpose: 'Delivery',   status: 'in' },
                  { name: 'James Wilson',   time: '34m ago', purpose: 'Guest',      status: 'out' },
                  { name: 'Sara Al-Rashid', time: '1h ago',  purpose: 'Maintenance',status: 'out' },
                ].map((v) => (
                  <div key={v.name} className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white' }}>
                      {v.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{v.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-3)' }}>{v.purpose}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs" style={{ color: 'var(--text-3)' }}>{v.time}</div>
                      <span className={`badge ${v.status === 'in' ? 'badge-green' : 'badge-gray'}`}>
                        {v.status === 'in' ? 'Inside' : 'Left'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Logo bar ────────────────────────────────────────────────────────────────── */
function LogoBar() {
  const items = ['Residential Towers', 'Corporate Offices', 'Hotels', 'Co-working Spaces', 'Hospitals', 'Schools']
  return (
    <div className="border-y py-5" style={{ borderColor: 'var(--border)' }}>
      <p className="text-center text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>
        Trusted by buildings of all types
      </p>
      <div className="flex items-center justify-center flex-wrap gap-6 px-4">
        {items.map((item) => (
          <span key={item} className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>{item}</span>
        ))}
      </div>
    </div>
  )
}

/* ── Features ────────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Camera,       title: 'Timestamped Photos',     desc: 'Every visitor photo is automatically stamped with date and time. Irrefutable proof of entry.',                color: '#3B82F6' },
  { icon: Zap,          title: 'Instant Sync',           desc: 'Check-ins appear on the admin dashboard the moment they happen. Zero delay, zero data loss.',               color: '#8B5CF6' },
  { icon: Shield,       title: 'Blocklist Alerts',       desc: 'Receive an instant warning when a flagged name or phone number attempts to enter the building.',             color: '#EF4444' },
  { icon: BarChart2,    title: 'Real-time Dashboard',    desc: 'Admins see live stats, visitor photos, check-in/out times, and purpose — from any device.',                  color: '#22C55E' },
  { icon: Smartphone,   title: 'Mobile-First Guard App', desc: 'Designed for security guards. Large buttons, fast camera, works on any Android phone — even as an APK.',    color: '#F59E0B' },
  { icon: Download,     title: 'CSV Export',             desc: 'Download complete visitor logs as a spreadsheet any time. Perfect for audits and compliance.',               color: '#06B6D4' },
  { icon: Lock,         title: 'Role-Based Access',      desc: 'Admins see everything. Guards only access the check-in screen. Two designated admins per building.',         color: '#EC4899' },
  { icon: Clock,        title: 'Check-in & Check-out',   desc: 'Track exactly when visitors arrive and leave. See who\'s currently inside the building at any moment.',      color: '#A78BFA' },
  { icon: FileText,     title: 'Detailed Records',       desc: 'Capture name, phone, purpose, host, apartment/floor, and vehicle number for every visitor.',                 color: '#34D399' },
]

function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="badge badge-blue inline-flex mb-3">Features</div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Everything you need to secure your building</h2>
          <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--text-2)' }}>
            From the guard's phone to the admin's screen — every part of the workflow is covered.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card group hover:border-zinc-600 transition-all duration-200" style={{ borderColor: 'var(--border)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 flex-shrink-0"
                style={{ background: `${f.color}18` }}>
                <f.icon className="w-4.5 h-4.5" style={{ color: f.color, width: 18, height: 18 }} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── How it works ────────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      n: '01', icon: Smartphone, title: 'Guard opens the app',
      desc: 'Your security guard opens Vigil on their phone at the gate. No training needed — the interface is built for speed.',
      detail: ['Tap camera to capture visitor photo', 'Timestamp burned into image automatically', 'Fill name, phone, purpose in seconds'],
    },
    {
      n: '02', icon: Zap, title: 'Entry is recorded instantly',
      desc: 'The moment the guard submits, the visitor record — including photo — is saved to the cloud and immediately visible.',
      detail: ['Photo uploaded to Firebase Storage', 'Record written to Firestore in real-time', 'Blocklist check runs automatically'],
    },
    {
      n: '03', icon: BarChart2, title: 'Admins see everything live',
      desc: 'Both designated admins can open the web dashboard on any browser — iPhone, laptop, tablet — and see every entry.',
      detail: ['Live updating table, no page refresh needed', 'Filter by date, status, purpose, or search by name', 'Export to CSV for audits anytime'],
    },
  ]

  return (
    <section id="how" className="py-24 px-4 border-y" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="badge badge-purple inline-flex mb-3">How it works</div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Up and running in minutes</h2>
          <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--text-2)' }}>
            Three simple steps from setup to your first check-in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-5 left-full w-full h-px z-10" style={{ background: 'linear-gradient(90deg, var(--border-hi), transparent)' }} />
              )}
              <div className="card h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl font-black" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {s.n}
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <s.icon className="w-4 h-4" style={{ color: '#818CF8' }} />
                  </div>
                </div>
                <h3 className="font-bold text-base mb-2">{s.title}</h3>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-2)' }}>{s.desc}</p>
                <ul className="space-y-1.5">
                  {s.detail.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#22C55E' }} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Stats ───────────────────────────────────────────────────────────────────── */
function Stats() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { val: '< 30s', label: 'Average check-in time' },
            { val: '100%', label: 'Cloud-backed, zero data loss' },
            { val: '2',    label: 'Taps to check out a visitor' },
            { val: '∞',    label: 'Visitor records stored' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black mb-1 gradient-text">{s.val}</div>
              <div className="text-xs" style={{ color: 'var(--text-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Pricing ─────────────────────────────────────────────────────────────────── */
const PLANS = [
  {
    name: 'Starter', price: 'Free', period: 'forever',
    desc: 'Perfect for trying Vigil.',
    highlight: false,
    features: ['Up to 200 visitors/month', '1 building', '2 admin accounts', 'Photo capture with timestamp', 'CSV export', '30-day data retention'],
    cta: 'Get started free',
  },
  {
    name: 'Pro', price: '₹999', period: '/month',
    desc: 'For buildings with daily traffic.',
    highlight: true,
    features: ['Unlimited visitors', 'Unlimited buildings', '2 admin accounts', 'Everything in Starter', 'Blocklist management', '1-year data retention', 'Priority support'],
    cta: 'Start Pro trial',
  },
  {
    name: 'Enterprise', price: 'Custom', period: '',
    desc: 'For large complexes & campuses.',
    highlight: false,
    features: ['Everything in Pro', 'Multiple guard accounts', 'Custom admin emails', 'Dedicated onboarding', 'SLA guarantee', 'Unlimited data retention'],
    cta: 'Contact sales',
  },
]

function Pricing() {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="badge badge-amber inline-flex mb-3">Pricing</div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Simple, transparent pricing</h2>
          <p className="text-base max-w-md mx-auto" style={{ color: 'var(--text-2)' }}>
            Start free. Upgrade when you're ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`card relative flex flex-col ${plan.highlight ? 'gradient-border' : ''}`}
              style={plan.highlight ? { background: 'var(--card)', borderColor: 'transparent' } : {}}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-blue px-3 py-1 text-xs">
                  Most Popular
                </div>
              )}
              <div className="mb-5">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="text-sm" style={{ color: 'var(--text-3)' }}>{plan.period}</span>
                </div>
                <div className="font-bold text-base">{plan.name}</div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{plan.desc}</div>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#22C55E' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login"
                className={plan.highlight ? 'btn-primary justify-center' : 'btn-secondary justify-center'}
                style={{ textDecoration: 'none' }}>
                {plan.cta} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── CTA ─────────────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="py-20 px-4 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-3">Ready to secure your building?</h2>
        <p className="mb-7 text-base" style={{ color: 'var(--text-2)' }}>
          Join buildings already using Vigil. Set up takes under 5 minutes.
        </p>
        <Link href="/login" className="btn-primary px-8 py-3 text-base">
          Get started for free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}

/* ── Footer ──────────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t py-10 px-4" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Shield className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-sm">Vigil</span>
          <span className="text-xs ml-2" style={{ color: 'var(--text-3)' }}>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-5 text-sm" style={{ color: 'var(--text-3)' }}>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
        </div>
      </div>
    </footer>
  )
}
