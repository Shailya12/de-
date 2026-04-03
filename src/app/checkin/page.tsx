'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Camera, User, FileText, CheckCircle, LogOut,
  Clock, ChevronRight, AlertTriangle, Phone, MapPin,
  Car, StickyNote, ArrowLeft, Shield, UserCheck
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import PhotoCapture from '@/components/PhotoCapture'
import { subscribeToBlocklist, checkOutVisitor, getRecentVisitors, addVisitor } from '@/lib/firestore'
import { uploadVisitorPhoto } from '@/lib/storage'
import type { BlocklistEntry, Visitor, VisitPurpose } from '@/types'

const PURPOSES: VisitPurpose[] = ['Guest', 'Delivery', 'Meeting', 'Maintenance', 'Other']
const PURPOSE_ICONS: Record<VisitPurpose, string> = {
  Guest: '👤', Delivery: '📦', Meeting: '🤝', Maintenance: '🔧', Other: '📋'
}

type Step = 'photo' | 'details' | 'confirm'

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

  // Form state
  const [step, setStep] = useState<Step>('photo')
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

  // App state
  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([])
  const [recent, setRecent] = useState<Visitor[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successName, setSuccessName] = useState('')
  const [checkingOut, setCheckingOut] = useState<string | null>(null)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToBlocklist(setBlocklist)
    return unsub
  }, [user])

  const refreshRecent = useCallback(() => {
    if (user) getRecentVisitors(8).then(setRecent)
  }, [user])

  useEffect(() => { refreshRecent() }, [refreshRecent])

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const blocked = matchesBlocklist(blocklist, name, phone)

  async function handleSubmit() {
    if (!photoBlob) return
    setError('')
    setSubmitting(true)
    try {
      const visitorId = await addVisitor({
        name: name.trim(),
        phone: phone.trim(),
        photoUrl: '__pending__',
        purpose,
        hostName: hostName.trim() || undefined,
        apartmentFloor: apartmentFloor.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        checkedInBy: user!.uid,
        checkedInByName: user!.displayName ?? user!.email ?? 'Guard',
      })
      const photoUrl = await uploadVisitorPhoto(visitorId, photoBlob, 'checkin')
      let idPhotoUrl: string | undefined
      if (idPhotoBlob) idPhotoUrl = await uploadVisitorPhoto(visitorId, idPhotoBlob, 'id')

      const { updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      await updateDoc(doc(db, 'visitors', visitorId), { photoUrl, idPhotoUrl })

      setSuccessName(name.trim())
      resetForm()
      refreshRecent()
    } catch (err) {
      console.error(err)
      setError('Failed to save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setStep('photo')
    setPhotoBlob(null); setPhotoPreview(null)
    setIdPhotoBlob(null); setIdPhotoPreview(null)
    setName(''); setPhone(''); setPurpose('Guest')
    setHostName(''); setApartmentFloor(''); setVehicleNumber(''); setNotes('')
    setError('')
    setTimeout(() => setSuccessName(''), 3500)
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
      <header className="sticky top-0 z-20 border-b" style={{ background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <div className="px-4 h-14 flex items-center justify-between max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm leading-none">Vigil</div>
              <div className="text-xs leading-none mt-0.5" style={{ color: 'var(--text-3)' }}>{format(time, 'HH:mm · dd MMM')}</div>
            </div>
          </div>
          <button
            onClick={() => signOut().then(() => router.replace('/login'))}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-3)', background: 'var(--surface)' }}>
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full space-y-5 pb-10">
        {/* Success banner */}
        {successName && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-up"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <UserCheck className="w-5 h-5 flex-shrink-0" style={{ color: '#4ADE80' }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#4ADE80' }}>Checked in successfully</p>
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

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Step content */}
        <div className="card" style={{ padding: '1.25rem' }}>
          {step === 'photo' && (
            <PhotoStep
              photoPreview={photoPreview}
              idPhotoPreview={idPhotoPreview}
              onPhoto={(b, url) => { setPhotoBlob(b); setPhotoPreview(url) }}
              onClearPhoto={() => { setPhotoBlob(null); setPhotoPreview(null) }}
              onIdPhoto={(b, url) => { setIdPhotoBlob(b); setIdPhotoPreview(url) }}
              onClearId={() => { setIdPhotoBlob(null); setIdPhotoPreview(null) }}
              onNext={() => setStep('details')}
              hasPhoto={!!photoBlob}
            />
          )}
          {step === 'details' && (
            <DetailsStep
              name={name} setName={setName}
              phone={phone} setPhone={setPhone}
              purpose={purpose} setPurpose={setPurpose}
              hostName={hostName} setHostName={setHostName}
              apartmentFloor={apartmentFloor} setApartmentFloor={setApartmentFloor}
              vehicleNumber={vehicleNumber} setVehicleNumber={setVehicleNumber}
              notes={notes} setNotes={setNotes}
              onBack={() => setStep('photo')}
              onNext={() => setStep('confirm')}
            />
          )}
          {step === 'confirm' && (
            <ConfirmStep
              photoPreview={photoPreview}
              name={name} phone={phone} purpose={purpose}
              hostName={hostName} apartmentFloor={apartmentFloor}
              vehicleNumber={vehicleNumber} notes={notes}
              submitting={submitting} error={error}
              onBack={() => setStep('details')}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {/* Recent check-ins */}
        {recent.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
              <Clock className="w-4 h-4" />
              Recent Check-ins
            </h2>
            <div className="space-y-2">
              {recent.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
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
                      {PURPOSE_ICONS[v.purpose]} {v.purpose} · {format(v.checkInTime, 'HH:mm')}
                    </p>
                  </div>
                  {v.status === 'checked-in' ? (
                    <button
                      onClick={() => handleCheckout(v.id)}
                      disabled={checkingOut === v.id}
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

/* ── Step indicator ───────────────────────────────────────────────────────────── */
function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'photo',   label: 'Photo',   icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'details', label: 'Details', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'confirm', label: 'Confirm', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  ]
  const idx = steps.findIndex((s) => s.id === current)
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= idx ? '' : ''}`}
              style={i < idx
                ? { background: '#22C55E', color: 'white' }
                : i === idx
                  ? { background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white' }
                  : { background: 'var(--border)', color: 'var(--text-3)' }
              }>
              {i < idx ? <CheckCircle className="w-4 h-4" /> : s.icon}
            </div>
            <span className="text-xs mt-1 font-medium" style={{ color: i <= idx ? 'var(--text-1)' : 'var(--text-3)' }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="h-px flex-1 mb-5 transition-all" style={{ background: i < idx ? '#22C55E' : 'var(--border)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Step 1: Photo ───────────────────────────────────────────────────────────── */
function PhotoStep({ photoPreview, idPhotoPreview, onPhoto, onClearPhoto, onIdPhoto, onClearId, onNext, hasPhoto }: {
  photoPreview: string | null; idPhotoPreview: string | null
  onPhoto: (b: Blob, url: string) => void; onClearPhoto: () => void
  onIdPhoto: (b: Blob, url: string) => void; onClearId: () => void
  onNext: () => void; hasPhoto: boolean
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold text-base mb-0.5">Capture visitor photo</h3>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>A timestamp will be automatically added to the image.</p>
      </div>
      <PhotoCapture label="Visitor Photo *" previewUrl={photoPreview} onCapture={onPhoto} onClear={onClearPhoto} />
      <PhotoCapture label="ID Document (optional)" previewUrl={idPhotoPreview} onCapture={onIdPhoto} onClear={onClearId} />
      <button onClick={onNext} disabled={!hasPhoto} className="btn-primary w-full justify-center py-3">
        Continue <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

/* ── Step 2: Details ─────────────────────────────────────────────────────────── */
function DetailsStep({ name, setName, phone, setPhone, purpose, setPurpose, hostName, setHostName, apartmentFloor, setApartmentFloor, vehicleNumber, setVehicleNumber, notes, setNotes, onBack, onNext }: {
  name: string; setName: (v: string) => void
  phone: string; setPhone: (v: string) => void
  purpose: VisitPurpose; setPurpose: (v: VisitPurpose) => void
  hostName: string; setHostName: (v: string) => void
  apartmentFloor: string; setApartmentFloor: (v: string) => void
  vehicleNumber: string; setVehicleNumber: (v: string) => void
  notes: string; setNotes: (v: string) => void
  onBack: () => void; onNext: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-base mb-0.5">Visitor details</h3>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Fill in the information about who's entering.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} /> Full Name *
        </label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Visitor's full name" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-3)' }} /> Phone Number *
        </label>
        <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" placeholder="+1 234 567 8900" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Purpose of Visit *</label>
        <div className="grid grid-cols-3 gap-2">
          {(['Guest','Delivery','Meeting','Maintenance','Other'] as VisitPurpose[]).map((p) => (
            <button key={p} type="button" onClick={() => setPurpose(p)}
              className="py-2 px-2 rounded-xl text-xs font-medium transition-all border"
              style={purpose === p
                ? { background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white', border: '1px solid transparent' }
                : { background: 'var(--surface)', color: 'var(--text-2)', borderColor: 'var(--border-hi)' }
              }>
              <span className="block text-base mb-0.5">{PURPOSE_ICONS[p]}</span>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1.5 flex items-center gap-1">
            <User className="w-3 h-3" style={{ color: 'var(--text-3)' }} /> Visiting
          </label>
          <input value={hostName} onChange={(e) => setHostName(e.target.value)} className="input-field text-sm py-2.5" placeholder="Host name" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" style={{ color: 'var(--text-3)' }} /> Apt / Floor
          </label>
          <input value={apartmentFloor} onChange={(e) => setApartmentFloor(e.target.value)} className="input-field text-sm py-2.5" placeholder="e.g. 4B" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5 flex items-center gap-1">
          <Car className="w-3 h-3" style={{ color: 'var(--text-3)' }} /> Vehicle Number <span style={{ color: 'var(--text-3)' }}>(optional)</span>
        </label>
        <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className="input-field text-sm py-2.5" placeholder="e.g. MH-01-AB-1234" />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5 flex items-center gap-1">
          <StickyNote className="w-3 h-3" style={{ color: 'var(--text-3)' }} /> Notes <span style={{ color: 'var(--text-3)' }}>(optional)</span>
        </label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="input-field resize-none text-sm" placeholder="Any additional notes…" />
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onBack} className="btn-secondary flex-1 justify-center py-3">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} disabled={!name.trim() || !phone.trim()} className="btn-primary flex-1 justify-center py-3">
          Review <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/* ── Step 3: Confirm ─────────────────────────────────────────────────────────── */
function ConfirmStep({ photoPreview, name, phone, purpose, hostName, apartmentFloor, vehicleNumber, notes, submitting, error, onBack, onSubmit }: {
  photoPreview: string | null; name: string; phone: string; purpose: string
  hostName: string; apartmentFloor: string; vehicleNumber: string; notes: string
  submitting: boolean; error: string; onBack: () => void; onSubmit: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-base mb-0.5">Confirm check-in</h3>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Review the details before submitting.</p>
      </div>

      <div className="flex gap-4 p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--border)' }}>
          {photoPreview
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photoPreview} alt="Visitor" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-3)' }}><User className="w-6 h-6" /></div>
          }
        </div>
        <div className="flex-1">
          <p className="font-bold">{name}</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{phone}</p>
          <span className="badge badge-blue mt-1">{purpose}</span>
        </div>
      </div>

      {(hostName || apartmentFloor || vehicleNumber || notes) && (
        <div className="space-y-2">
          {hostName      && <Row label="Visiting"   value={hostName} />}
          {apartmentFloor && <Row label="Apt/Floor"  value={apartmentFloor} />}
          {vehicleNumber  && <Row label="Vehicle"    value={vehicleNumber} />}
          {notes          && <Row label="Notes"      value={notes} />}
        </div>
      )}

      {error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button onClick={onBack} className="btn-secondary flex-1 justify-center py-3">
          <ArrowLeft className="w-4 h-4" /> Edit
        </button>
        <button onClick={onSubmit} disabled={submitting} className="btn-primary flex-1 justify-center py-3"
          style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}>
          {submitting
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
            : <><CheckCircle className="w-4 h-4" /> Check In</>
          }
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: 'var(--text-3)' }}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
