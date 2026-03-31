'use client'

import { useState } from 'react'
import PhotoCapture from './PhotoCapture'
import { addVisitor } from '@/lib/firestore'
import { uploadVisitorPhoto } from '@/lib/storage'
import type { BlocklistEntry, VisitPurpose } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

const PURPOSES: VisitPurpose[] = ['Delivery', 'Guest', 'Meeting', 'Maintenance', 'Other']

interface CheckinFormProps {
  blocklist: BlocklistEntry[]
  onSuccess: () => void
}

function matchesBlocklist(blocklist: BlocklistEntry[], name: string, phone: string): BlocklistEntry | null {
  const norm = (s: string) => s.toLowerCase().trim()
  return (
    blocklist.find(
      (b) =>
        (name && norm(b.name) === norm(name)) ||
        (phone && b.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))
    ) ?? null
  )
}

export default function CheckinForm({ blocklist, onSuccess }: CheckinFormProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [purpose, setPurpose] = useState<VisitPurpose>('Guest')
  const [hostName, setHostName] = useState('')
  const [apartmentFloor, setApartmentFloor] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [notes, setNotes] = useState('')

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [idPhotoBlob, setIdPhotoBlob] = useState<Blob | null>(null)
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const blocked = matchesBlocklist(blocklist, name, phone)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!photoBlob) { setError('Please take a photo of the visitor.'); return }
    setError('')
    setSubmitting(true)
    try {
      // Create doc first to get the ID, then upload photos
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
        checkedInByName: user!.displayName ?? user!.email ?? 'Security',
      })

      const photoUrl = await uploadVisitorPhoto(visitorId, photoBlob, 'checkin')
      let idPhotoUrl: string | undefined
      if (idPhotoBlob) {
        idPhotoUrl = await uploadVisitorPhoto(visitorId, idPhotoBlob, 'id')
      }

      // Update the doc with real URLs
      const { updateDoc, doc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase')
      await updateDoc(doc(db, 'visitors', visitorId), { photoUrl, idPhotoUrl })

      // Reset form
      setName(''); setPhone(''); setPurpose('Guest')
      setHostName(''); setApartmentFloor(''); setVehicleNumber(''); setNotes('')
      setPhotoBlob(null); setPhotoPreview(null)
      setIdPhotoBlob(null); setIdPhotoPreview(null)
      onSuccess()
    } catch (err) {
      console.error(err)
      setError('Failed to save check-in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {blocked && (
        <div className="bg-red-950 border border-red-700 rounded-xl p-4 flex gap-3">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-red-300 font-semibold text-sm">Blocklisted Visitor</p>
            <p className="text-red-400 text-xs mt-0.5">Reason: {blocked.reason}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Visitor Photo */}
      <PhotoCapture
        label="Visitor Photo *"
        previewUrl={photoPreview}
        onCapture={(b, url) => { setPhotoBlob(b); setPhotoPreview(url) }}
        onClear={() => { setPhotoBlob(null); setPhotoPreview(null) }}
      />

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
          placeholder="Visitor's full name"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number *</label>
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
          placeholder="+1 234 567 8900"
        />
      </div>

      {/* Purpose */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Purpose of Visit *</label>
        <div className="flex flex-wrap gap-2">
          {PURPOSES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPurpose(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                purpose === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Host + Apartment */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Visiting</label>
          <input
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
            placeholder="Host name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Apt / Floor</label>
          <input
            value={apartmentFloor}
            onChange={(e) => setApartmentFloor(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
            placeholder="e.g. 4B"
          />
        </div>
      </div>

      {/* Vehicle */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Vehicle Number <span className="text-gray-500 font-normal">(optional)</span></label>
        <input
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
          placeholder="e.g. ABC-1234"
        />
      </div>

      {/* ID Photo */}
      <PhotoCapture
        label="ID Document Photo (optional)"
        previewUrl={idPhotoPreview}
        onCapture={(b, url) => { setIdPhotoBlob(b); setIdPhotoPreview(url) }}
        onClear={() => { setIdPhotoBlob(null); setIdPhotoPreview(null) }}
      />

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes <span className="text-gray-500 font-normal">(optional)</span></label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 resize-none"
          placeholder="Any additional notes…"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !photoBlob}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl px-4 py-4 text-base transition-colors"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving…
          </span>
        ) : (
          'Check In Visitor'
        )}
      </button>
    </form>
  )
}
