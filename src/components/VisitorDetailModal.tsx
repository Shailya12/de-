'use client'

import { format } from 'date-fns'
import type { Visitor } from '@/types'

interface VisitorDetailModalProps {
  visitor: Visitor
  visitCount: number
  onClose: () => void
  onCheckout: (id: string) => void
  onFlag: (id: string, flagged: boolean) => void
  onAddToBlocklist: (visitor: Visitor) => void
}

export default function VisitorDetailModal({
  visitor,
  visitCount,
  onClose,
  onCheckout,
  onFlag,
  onAddToBlocklist,
}: VisitorDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-bold text-white">Visitor Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Photo + Name */}
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
              {visitor.photoUrl && visitor.photoUrl !== '__pending__' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={visitor.photoUrl} alt={visitor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">{visitor.name}</h3>
                {visitor.flagged && (
                  <span className="bg-red-900 text-red-300 text-xs px-2 py-0.5 rounded-full font-medium">Flagged</span>
                )}
                {visitCount > 1 && (
                  <span className="bg-blue-900 text-blue-300 text-xs px-2 py-0.5 rounded-full font-medium">{visitCount} visits</span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-0.5">{visitor.phone}</p>
              <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                visitor.status === 'checked-in'
                  ? 'bg-green-900 text-green-300'
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {visitor.status === 'checked-in' ? 'Inside' : 'Left'}
              </span>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <Detail label="Purpose" value={visitor.purpose} />
            <Detail label="Check-in" value={format(visitor.checkInTime, 'dd MMM, HH:mm')} />
            {visitor.checkOutTime && <Detail label="Check-out" value={format(visitor.checkOutTime, 'dd MMM, HH:mm')} />}
            {visitor.hostName && <Detail label="Visiting" value={visitor.hostName} />}
            {visitor.apartmentFloor && <Detail label="Apt / Floor" value={visitor.apartmentFloor} />}
            {visitor.vehicleNumber && <Detail label="Vehicle" value={visitor.vehicleNumber} />}
            <Detail label="Registered by" value={visitor.checkedInByName} />
          </div>

          {visitor.notes && (
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-white">{visitor.notes}</p>
            </div>
          )}

          {/* ID Photo */}
          {visitor.idPhotoUrl && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">ID Document</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={visitor.idPhotoUrl} alt="ID document" className="w-full rounded-xl object-cover max-h-48" />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            {visitor.status === 'checked-in' && (
              <button
                onClick={() => { onCheckout(visitor.id); onClose() }}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl px-4 py-3 text-sm transition-colors"
              >
                Mark as Checked Out
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onFlag(visitor.id, !visitor.flagged)}
                className={`font-medium rounded-xl px-4 py-2.5 text-sm transition-colors ${
                  visitor.flagged
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-yellow-900 text-yellow-300 hover:bg-yellow-800'
                }`}
              >
                {visitor.flagged ? 'Unflag' : 'Flag Visitor'}
              </button>
              <button
                onClick={() => { onAddToBlocklist(visitor); onClose() }}
                className="bg-red-900 hover:bg-red-800 text-red-300 font-medium rounded-xl px-4 py-2.5 text-sm transition-colors"
              >
                Add to Blocklist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  )
}
