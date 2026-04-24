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
import { subscribeToBlocklist, checkOutVisitor, getRecentVisitors, addVisitor, newVisitorId, getRecentCheckInsByPhone } from '@/lib/firestore'
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
  const [showExtra, setShowExtra] = useState(false)

  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([])
  const [recent, setRecent] = useState<Visitor[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successName, setSuccessName] = useState('')
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [time, setTime] = useState(new Date())
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    return subscribeToBlocklist(setBlocklist)
  }, [user])

  const refreshRecent = useCallback(() => {
    if (user) getRecentVisitors(6).then(setRecent)
  }, [user])

  useEffect(() => { refreshRecent() }, [refreshRecent])

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const blocked = matchesBlocklist(blocklist, name, phone)
  const canSubmit = !!photoBlob && !!name.trim() && !!phone.trim() && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!photoBlob || !name.trim() || !phone.trim()) return
    setError('')
    setSubmitting(true)
    try {
      // Generate ID first, upload photo before writing Firestore record
      // This prevents orphaned records if the upload fails
      const visitorId = newVisitorId()
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
        checkedInBy: user!.uid,
        checkedInByName: user!.displayName ?? user!.email ?? 'Guard',
      }, visitorId)

      setSuccessName(name.trim())
      setPhotoBlob(null); setPhotoPreview(null)
      setIdPhotoBlob(null); setIdPhotoPreview(null)
      setName(''); setPhone(''); setPurpose('Guest')
      setHostName(''); setApartmentFloor(''); setVehicleNumber('')
      setShowExtra(false); setError('')
      refreshRecent()
      setTimeout(() => setSuccessName(''), 3500)
    } catch (err) {
      console.error(err)
      setError('Failed to save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCheckout(id: string) {
    setCheckingOut(id)
    try {
      await checkOutVisitor(id)
      setRecent((prev) => prev.map((v) => v.id === id ? { ...v, status: 'checked-out', checkOutTime: new Date() } : v))
    } finally {
      setCheckingOut(null)
    }
  }

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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b"
        style={{ background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <div className="px-4 h-14 flex items-center justify-between max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm leading-none">Vigil</div>
              <div className="text-xs leading-none mt-0.5" style={{ color: 'var(--text-3)' }}>
                {format(time, 'HH:mm · dd MMM')}
              </div>
            </div>
          </div>
          <button onClick={() => signOut().then(() => router.replace('/login'))}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{ color: 'var(--text-3)', background: 'var(--surface)' }}>
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full space-y-4 pb-10">

        {/* Success */}
        {successName && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-up"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <UserCheck className="w-5 h-5 flex-shrink-0" style={{ color: '#4ADE80' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#4ADE80' }}>Checked in!</p>
              <p className="text-xs" style={{ color: 'rgba(74,222,128,0.7)' }}>{successName} has been registered</p>
            </div>
          </div>
        )}

        {/* Blocklist warning */}
        {blocked && (name || phone) && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#F87171' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#F87171' }}>⚠ Blocklisted Visitor</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(248,113,113,0.8)' }}>Reason: {blocked.reason}</p>
            </div>
          </div>
        )}

        {/* Check-in form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Photo */}
          <div className="card" style={{ padding: '1rem' }}>
            <p className="text-sm font-semibold mb-3">Visitor Photo *</p>
            <PhotoCapture
              label=""
              previewUrl={photoPreview}
              onCapture={(b, url) => { setPhotoBlob(b); setPhotoPreview(url) }}
              onClear={() => { setPhotoBlob(null); setPhotoPreview(null) }}
            />
          </div>

          {/* Name + Phone */}
          <div className="card space-y-3" style={{ padding: '1rem' }}>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                <User className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} /> Full Name *
              </label>
              <input
                required value={name} onChange={(e) => setName(e.target.value)}
                className="input-field" placeholder="Visitor's full name"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} /> Phone Number *
              </label>
              <input
                required type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setDuplicateWarning(null) }}
                onBlur={handlePhoneBlur}
                className="input-field" placeholder="+91 98765 43210"
                autoComplete="off"
              />
            </div>
          </div>

          {duplicateWarning && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', color: '#ca8a04' }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Purpose */}
          <div className="card" style={{ padding: '1rem' }}>
            <p className="text-sm font-semibold mb-3">Purpose of Visit</p>
            <div className="grid grid-cols-5 gap-2">
              {PURPOSES.map(({ id, emoji }) => (
                <button key={id} type="button" onClick={() => setPurpose(id)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={purpose === id
                    ? { background: 'linear-gradient(135deg, #2563EB22, #7C3AED22)', color: 'var(--text-1)', border: '1.5px solid #2563EB88' }
                    : { background: 'var(--surface)', color: 'var(--text-3)', border: '1.5px solid var(--border)' }
                  }>
                  <span className="text-xl">{emoji}</span>
                  <span>{id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional extras */}
          <div className="card overflow-hidden" style={{ padding: 0 }}>
            <button type="button" onClick={() => setShowExtra(!showExtra)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
              style={{ color: 'var(--text-2)' }}>
              <span>Additional details <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></span>
              {showExtra ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showExtra && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                      <User className="w-3 h-3" /> Visiting
                    </label>
                    <input value={hostName} onChange={(e) => setHostName(e.target.value)}
                      className="input-field text-sm py-2" placeholder="Host name" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                      <MapPin className="w-3 h-3" /> Apt / Floor
                    </label>
                    <input value={apartmentFloor} onChange={(e) => setApartmentFloor(e.target.value)}
                      className="input-field text-sm py-2" placeholder="e.g. 4B" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                    <Car className="w-3 h-3" /> Vehicle Number
                  </label>
                  <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)}
                    className="input-field text-sm py-2" placeholder="e.g. MH-01-AB-1234" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>ID Document (optional)</label>
                  <PhotoCapture
                    label=""
                    previewUrl={idPhotoPreview}
                    onCapture={(b, url) => { setIdPhotoBlob(b); setIdPhotoPreview(url) }}
                    onClear={() => { setIdPhotoBlob(null); setIdPhotoPreview(null) }}
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all"
            style={{
              background: canSubmit ? 'linear-gradient(135deg, #16A34A, #15803D)' : 'var(--surface)',
              color: canSubmit ? 'white' : 'var(--text-3)',
              border: canSubmit ? 'none' : '1px solid var(--border)',
              opacity: submitting ? 0.8 : 1,
            }}>
            {submitting
              ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
              : <><UserCheck className="w-5 h-5" /> Check In Visitor</>
            }
          </button>
        </form>

        {/* Recent check-ins */}
        {recent.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
              <Clock className="w-4 h-4" /> Recent Check-ins
            </h2>
            <div className="space-y-2">
              {recent.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ background: 'var(--surface)' }}>
                    {v.photoUrl && v.photoUrl !== '__pending__' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.photoUrl} alt={v.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-3)' }}>
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{v.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {v.purpose} · {format(v.checkInTime, 'HH:mm')}
                    </p>
                  </div>
                  {v.status === 'checked-in' ? (
                    <button onClick={() => handleCheckout(v.id)} disabled={checkingOut === v.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.25)' }}>
                      {checkingOut === v.id ? '…' : 'Check Out'}
                    </button>
                  ) : (
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                      Left {v.checkOutTime ? format(v.checkOutTime, 'HH:mm') : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
