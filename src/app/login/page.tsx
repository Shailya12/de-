'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Eye, EyeOff, ArrowLeft, CheckCircle, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { signIn, resetPassword, user, role, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.replace(role === 'admin' ? '/admin' : '/checkin')
    }
  }, [user, role, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid') {
        setError('App configuration error. Please contact support.')
      } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes and try again.')
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Check your internet connection.')
      } else {
        setError(`Sign-in failed (${code || 'unknown error'}). Please try again.`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetError('')
    setResetSubmitting(true)
    try {
      await resetPassword(resetEmail)
      setResetSent(true)
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        setResetError('No account found with that email address.')
      } else if (code === 'auth/too-many-requests') {
        setResetError('Too many attempts. Please wait a few minutes.')
      } else {
        setResetError('Failed to send reset email. Please try again.')
      }
    } finally {
      setResetSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0D1B45 0%, #09090B 60%)' }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3B82F6, transparent 70%)' }} />
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">Vigil</span>
        </Link>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">Smart visitor management<br />for modern buildings.</h2>
          <p className="mb-8 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Trusted by security teams across residential towers, offices, and campuses.</p>
          <div className="space-y-3">
            {[
              'Timestamped visitor photos with one tap',
              'Real-time admin dashboard on any device',
              'Blocklist alerts for flagged visitors',
              'Instant check-in & check-out tracking',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#4ADE80' }} />
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} Vigil. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col items-center justify-center px-6 py-10"
        style={{ background: 'var(--bg)' }}>
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Vigil</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">

          {/* Forgot password panel */}
          {showReset ? (
            <div>
              {resetSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'rgba(74,222,128,0.12)' }}>
                    <Mail className="w-5 h-5" style={{ color: '#4ADE80' }} />
                  </div>
                  <p className="font-semibold mb-1">Check your inbox</p>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
                    We sent a reset link to <strong>{resetEmail}</strong>
                  </p>
                  <button type="button"
                    onClick={() => { setShowReset(false); setResetSent(false); setResetEmail('') }}
                    className="text-sm underline" style={{ color: 'var(--text-3)' }}>
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <button type="button" onClick={() => { setShowReset(false); setResetError('') }}
                    className="flex items-center gap-1 text-sm mb-4" style={{ color: 'var(--text-3)' }}>
                    <ArrowLeft className="w-3 h-3" /> Back to sign in
                  </button>
                  <div className="mb-6">
                    <h2 className="font-semibold text-lg mb-1">Reset your password</h2>
                    <p className="text-sm" style={{ color: 'var(--text-2)' }}>Enter your email and we&apos;ll send a reset link.</p>
                  </div>
                  {resetError && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      {resetError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email address</label>
                    <input type="email" required value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="input-field" placeholder="you@example.com" />
                  </div>
                  <button type="submit" disabled={resetSubmitting} className="btn-primary w-full justify-center py-3">
                    {resetSubmitting ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                    ) : 'Send reset link'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
                <p className="text-sm" style={{ color: 'var(--text-2)' }}>Sign in to your Vigil account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email address</label>
                  <input type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email" className="input-field" placeholder="you@example.com" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium">Password</label>
                    <button type="button"
                      onClick={() => { setShowReset(true); setResetEmail(email); setResetError('') }}
                      className="text-xs hover:underline" style={{ color: '#60A5FA' }}>
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password" className="input-field pr-10" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }}>
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3 mt-1">
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</>
                  ) : 'Sign in to Vigil'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t text-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                <p>Admin access: <span style={{ color: 'var(--text-2)' }}>Use your designated admin email</span></p>
                <p className="mt-1">Security guard: <span style={{ color: 'var(--text-2)' }}>Use the account your admin created</span></p>
              </div>
              <div className="mt-5 text-center">
                <Link href="/" className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                  <ArrowLeft className="w-3 h-3" /> Back to homepage
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
