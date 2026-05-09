'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Shield, LogOut, Clock, UserCheck, AlertTriangle,
  User, Phone, MapPin, Car, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import PhotoCapture from '@/components/PhotoCapture'
import { subscribeToBlocklist, checkOutVisitor, getRecentVisitors, addVisitor, getRecentCheckInsByPhone } from '@/lib/firestore'
import { uploadVisitorPhoto } from '@/lib/storage'
import type { BlocklistEntry, Visitor, VisitPurpose } from '@/types'

const PURPOSES: { id: VisitPurpose; emoji: string }[] = [
  { id: 'Guest',       emoji: '👤' },
  { id: 'Delivery',    emoji: '📦' },
  { id: 'Meeting',     emoji: '🤝' },
  { id: 'Maintenance', emoji: '🔧' },
  { id: 'Other',       emoji: '📋' },
]

function matchesBlocklist(blocklist: BlocklistEntry[], name: string, phone: string) {
  const norm = (s: string) => s.toLowerCase().trim()
  return blocklist.find(
    (b) =>
      (name && norm(b.name) === norm(name)) ||
      (phone && b.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))
  ) ?? null
}

export default function CheckinPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [idPhotoBlob, setIdPhotoBlob] = useState<Blob | null>(null)
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [purpose, setPurpose] = useState<VisitPurpose>('Guest')
  const [hostName, setHostName] = useState('')
  const [apartmentFloor, setApartmentFloor] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [showExtra, setShowExtra] = useState(false)

  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([])
  const [recent, setRecent] = useState<Visitor[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToBlocklist(setBlocklist)
    return unsub
  }, [user])

  const refreshRecent = useCallback(async () => {
    if (!user) return
    const list = await getRecentVisitors(6)
    setRecent(list)
  }, [user])

  useEffect(() => { refreshRecent() }, [refreshRecent])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  async function handlePhoneBlur() {
    if (phone.replace(/\D/g, '').length < 7) return
    const dupes = await getRecentCheckInsByPhone(phone)
    if (dupes.length > 0) {
      const mins = Math.round((Date.now() - dupes[0].checkInTime.getTime()) / 60000)
      setDuplicateWarning(`${dupes[0].name} checked in ${mins} minute${mins !== 1 ? 's' : ''} ago — already inside?`)
    } else {
      setDuplicateWarning(null)
    }
  }

  async function handleCheckout(visitorId: string) {
    setCheckingOut(visitorId)
    try {
      await checkOutVisitor(visitorId)
      setRecent((prev) =>
        prev.map((v) => v.id === visitorId ? { ...v, status: 'checked-out' as const, checkOutTime: new Date() } : v)
      )
    } finally {
      setCheckingOut(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!photoBlob || !name.trim() || !phone.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const visitorId = crypto.randomUUID()
      const photoUrl = await uploadVisitorPhoto(visitorId, photoBlob, 'checkin')
      let idPhotoUrl: string | undefined
      if (idPhotoBlob) idPhotoUrl = await uploadVisitorPhoto(visitorId, idPhotoBlob, 'id')
      await addVisitor({
        name: name.trim(),
        phone: phone.trim(),
        photoUrl,
        idPhotoUrl,
        purpose,
        hostName: hostName.trim() || undefined,
        apartmentFloor: apartmentFloor.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        checkedInBy: user!.uid,
        checkedInByName: user!.email ?? 'Guard',
      })

      setSuccessMsg(`${name.trim()} checked in successfully!`)
      setPhotoBlob(null); setPhotoPreview(null)
      setIdPhotoBlob(null); setIdPhotoPreview(null)
      setName(''); setPhone(''); setPurpose('Guest')
      setHostName(''); setApartmentFloor(''); setVehicleNumber(''); setNotes('')
      setShowExtra(false); setDuplicateWarning(null)
      refreshRecent()
      setTimeout(() => setSuccessMsg(''), 3500)
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      setError(code ? `Check-in failed (${code}). Please try again.` : 'Check-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const blocklistMatch = matchesBlocklist(blocklist, name, phone)
  const canSubmit = !!photoBlob && !!name.trim() && !!phone.trim() && !submitting

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">Vigil</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
            <Clock className="w-3 h-3 inline mr-1" />
            {format(now, 'HH:mm')} · {format(now, 'dd MMM')}
          </span>
          <button onClick={() => signOut().then(() => router.replace('/login'))}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: 'var(--text-3)' }}>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">

        {/* Success toast */}
        {successMsg && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ADE80' }}>
            <UserCheck className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Blocklist warning */}
        {blocklistMatch && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Blocklisted Visitor</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(248,113,113,0.8)' }}>Reason: {blocklistMatch.reason}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Photo */}
          <div className="card p-4">
            <PhotoCapture
              label="Visitor Photo *"
              previewUrl={photoPreview}
              onCapture={(blob, dataUrl) => { setPhotoBlob(blob); setPhotoPreview(dataUrl) }}
              onClear={() => { setPhotoBlob(null); setPhotoPreview(null) }}
            />
          </div>

          {/* Name + Phone */}
          <div className="card p-4 space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                <User className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} /> Full Name *
              </label>
              <input
                type="text" required value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field" placeholder="Visitor's full name"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} /> Phone Number *
              </label>
              <input
                type="tel" required value={phone}
                onChange={(e) => { setPhone(e.target.value); setDuplicateWarning(null) }}
                onBlur={handlePhoneBlur}
                className="input-field" placeholder="+91 98765 43210"
              />
            </div>
            {duplicateWarning && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', color: '#ca8a04' }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{duplicateWarning}</span>
              </div>
            )}
          </div>

          {/* Purpose */}
          <div className="card p-4">
            <p className="text-sm font-medium mb-3">Purpose of Visit</p>
            <div className="grid grid-cols-5 gap-2">
              {PURPOSES.map(({ id, emoji }) => (
                <button key={id} type="button" onClick={() => setPurpose(id)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: purpose === id ? 'rgba(37,99,235,0.15)' : 'var(--surface)',
                    border: purpose === id ? '1px solid rgba(37,99,235,0.4)' : '1px solid var(--border)',
                    color: purpose === id ? '#60A5FA' : 'var(--text-2)',
                  }}>
                  <span className="text-lg">{emoji}</span>
                  <span>{id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible extra details */}
          <div className="card overflow-hidden">
            <button type="button" onClick={() => setShowExtra(!showExtra)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
              style={{ color: 'var(--text-2)' }}>
              <span>Additional details (optional)</span>
              {showExtra ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showExtra && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="pt-3">
                  <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                    <User className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} /> Visiting Person / Host
                  </label>
                  <input type="text" value={hostName} onChange={(e) => setHostName(e.target.value)}
                    className="input-field" placeholder="e.g. Mr. Sharma, Flat 402" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                    <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} /> Apartment / Floor
                  </label>
                  <input type="text" value={apartmentFloor} onChange={(e) => setApartmentFloor(e.target.value)}
                    className="input-field" placeholder="e.g. 4B, Floor 3" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                    <Car className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} /> Vehicle Number
                  </label>
                  <input type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)}
                    className="input-field" placeholder="e.g. MH 01 AB 1234" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="input-field resize-none" rows={2} placeholder="Any additional notes…" />
                </div>
                <div>
                  <PhotoCapture
                    label="ID Document (optional)"
                    previewUrl={idPhotoPreview}
                    onCapture={(blob, dataUrl) => { setIdPhotoBlob(blob); setIdPhotoPreview(dataUrl) }}
                    onClear={() => { setIdPhotoBlob(null); setIdPhotoPreview(null) }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={!canSubmit}
            className="btn-primary w-full justify-center py-4 text-base font-semibold"
            style={{ opacity: canSubmit ? 1 : 0.4 }}>
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Checking in…
              </>
            ) : 'Check In Visitor'}
          </button>
        </form>

        {/* Recent check-ins */}
        {recent.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-2)' }}>Recent Check-ins</h2>
            <div className="space-y-2">
              {recent.map((v) => (
                <div key={v.id} className="card flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    {v.photoUrl && v.photoUrl !== '__pending__' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.photoUrl} alt={v.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-sm"
                        style={{ color: 'var(--text-3)' }}>{v.name[0]?.toUpperCase()}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{v.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{v.purpose} · {format(v.checkInTime, 'HH:mm')}</p>
                  </div>
                  {v.status === 'checked-in' ? (
                    <button onClick={() => handleCheckout(v.id)} disabled={checkingOut === v.id}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0"
                      style={{ background: 'rgba(249,115,22,0.15)', color: '#FB923C', border: '1px solid rgba(249,115,22,0.3)' }}>
                      {checkingOut === v.id ? '…' : 'Check Out'}
                    </button>
                  ) : (
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                      Out {v.checkOutTime ? format(v.checkOutTime, 'HH:mm') : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
