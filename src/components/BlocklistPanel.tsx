'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { X, Ban, Trash2, Plus, AlertTriangle } from 'lucide-react'
import { addToBlocklist, removeFromBlocklist } from '@/lib/firestore'
import type { BlocklistEntry } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

interface BlocklistPanelProps {
  entries: BlocklistEntry[]
  prefillName?: string
  prefillPhone?: string
  onClose: () => void
}

export default function BlocklistPanel({ entries, prefillName = '', prefillPhone = '', onClose }: BlocklistPanelProps) {
  const { user } = useAuth()
  const [name, setName] = useState(prefillName)
  const [phone, setPhone] = useState(prefillPhone)
  const [reason, setReason] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !reason.trim()) { setError('Name and reason are required.'); return }
    setError('')
    setAdding(true)
    try {
      await addToBlocklist({
        name: name.trim(),
        phone: phone.trim(),
        reason: reason.trim(),
        addedBy: user!.email ?? user!.uid,
      })
      setName(''); setPhone(''); setReason('')
    } catch {
      setError('Failed to add to blocklist.')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id)
    try {
      await removeFromBlocklist(id)
    } finally {
      setRemovingId(null)
    }
  }

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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Ban className="w-3.5 h-3.5" style={{ color: '#F87171' }} />
            </div>
            <div>
              <h2 className="font-bold text-sm">Blocklist</h2>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-1)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Add form */}
          <form onSubmit={handleAdd} className="rounded-xl p-4 space-y-3"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4" style={{ color: '#F87171' }} />
              Add to Blocklist
            </h3>

            {error && (
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </div>
            )}

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name *"
              className="input-field text-sm w-full"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number (optional)"
              className="input-field text-sm w-full"
            />
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for blocking *"
              className="input-field text-sm w-full"
            />
            <button
              type="submit"
              disabled={adding}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' }}
              onMouseEnter={(e) => !adding && ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.25)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)')}>
              <Ban className="w-4 h-4" />
              {adding ? 'Adding…' : 'Add to Blocklist'}
            </button>
          </form>

          {/* Entries list */}
          <div className="space-y-2">
            {entries.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-3)' }}>
                <Ban className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No blocked visitors</p>
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 rounded-xl p-3.5"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <Ban className="w-4 h-4" style={{ color: '#F87171' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{entry.name}</p>
                    {entry.phone && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{entry.phone}</p>
                    )}
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#F87171' }}>
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {entry.reason}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                      Blocked {format(entry.addedAt, 'dd MMM yyyy')} · {entry.addedBy}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(entry.id)}
                    disabled={removingId === entry.id}
                    className="p-1.5 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#F87171'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    aria-label="Remove from blocklist">
                    {removingId === entry.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
