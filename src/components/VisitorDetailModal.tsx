'use client'

import { format } from 'date-fns'
import { X, Clock, User, Phone, MapPin, Car, FileText, Shield, AlertTriangle, LogOut, Ban } from 'lucide-react'
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
  visitor, visitCount, onClose, onCheckout, onFlag, onAddToBlocklist,
}: VisitorDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 rounded-t-2xl"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold text-sm">Visitor Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-1)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Hero row */}
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {visitor.photoUrl && visitor.photoUrl !== '__pending__' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={visitor.photoUrl} alt={visitor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                  style={{ color: 'var(--text-3)' }}>
                  {visitor.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg font-bold">{visitor.name}</h3>
                {visitor.flagged && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle className="w-3 h-3" /> Flagged
                  </span>
                )}
                {visitCount > 1 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(59,130,246,0.1)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.2)' }}>
                    {visitCount} visits
                  </span>
                )}
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--text-3)' }}>{visitor.phone}</p>
              <StatusBadge status={visitor.status} />
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <Detail icon={<Shield className="w-3.5 h-3.5" />} label="Purpose" value={visitor.purpose} />
            <Detail icon={<Clock className="w-3.5 h-3.5" />} label="Check-in" value={format(visitor.checkInTime, 'dd MMM, HH:mm')} />
            {visitor.checkOutTime && (
              <Detail icon={<Clock className="w-3.5 h-3.5" />} label="Check-out" value={format(visitor.checkOutTime, 'dd MMM, HH:mm')} />
            )}
            {visitor.hostName && (
              <Detail icon={<User className="w-3.5 h-3.5" />} label="Visiting" value={visitor.hostName} />
            )}
            {visitor.apartmentFloor && (
              <Detail icon={<MapPin className="w-3.5 h-3.5" />} label="Apt / Floor" value={visitor.apartmentFloor} />
            )}
            {visitor.vehicleNumber && (
              <Detail icon={<Car className="w-3.5 h-3.5" />} label="Vehicle" value={visitor.vehicleNumber} />
            )}
            <Detail icon={<Phone className="w-3.5 h-3.5" />} label="Registered by" value={visitor.checkedInByName} />
          </div>

          {visitor.notes && (
            <div className="rounded-xl p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                <FileText className="w-3.5 h-3.5" /> Notes
              </p>
              <p className="text-sm">{visitor.notes}</p>
            </div>
          )}

          {visitor.idPhotoUrl && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-3)' }}>ID Document</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={visitor.idPhotoUrl} alt="ID document"
                className="w-full rounded-xl object-cover max-h-48"
                style={{ border: '1px solid var(--border)' }} />
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-1">
            {visitor.status === 'checked-in' && (
              <button
                onClick={() => { onCheckout(visitor.id); onClose() }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors"
                style={{ background: 'rgba(249,115,22,0.15)', color: '#FB923C', border: '1px solid rgba(249,115,22,0.3)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(249,115,22,0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(249,115,22,0.15)')}>
                <LogOut className="w-4 h-4" /> Mark as Checked Out
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onFlag(visitor.id, !visitor.flagged)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors"
                style={{
                  background: visitor.flagged ? 'var(--card)' : 'rgba(234,179,8,0.1)',
                  color: visitor.flagged ? 'var(--text-2)' : '#FDE047',
                  border: `1px solid ${visitor.flagged ? 'var(--border)' : 'rgba(234,179,8,0.3)'}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                <AlertTriangle className="w-4 h-4" />
                {visitor.flagged ? 'Unflag' : 'Flag Visitor'}
              </button>
              <button
                onClick={() => { onAddToBlocklist(visitor); onClose() }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}>
                <Ban className="w-4 h-4" /> Blocklist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
        {icon} {label}
      </p>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const inside = status === 'checked-in'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{
        background: inside ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
        color: inside ? '#4ADE80' : '#9CA3AF',
        border: `1px solid ${inside ? 'rgba(34,197,94,0.2)' : 'rgba(107,114,128,0.2)'}`,
      }}>
      <span className={`w-1.5 h-1.5 rounded-full ${inside ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
      {inside ? 'Currently Inside' : 'Checked Out'}
    </span>
  )
}
