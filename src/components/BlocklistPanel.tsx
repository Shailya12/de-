'use client'

import { useState } from 'react'
import { format } from 'date-fns'
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-bold text-white">Blocklist</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Add form */}
          <form onSubmit={handleAdd} className="bg-gray-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-200">Add to Blocklist</h3>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name *"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-500"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-500"
            />
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason *"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-500"
            />
            <button
              type="submit"
              disabled={adding}
              className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors"
            >
              {adding ? 'Adding…' : 'Add to Blocklist'}
            </button>
          </form>

          {/* Entries */}
          <div className="space-y-2">
            {entries.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-4">No entries yet</p>
            )}
            {entries.map((entry) => (
              <div key={entry.id} className="bg-gray-800 rounded-xl p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white">{entry.name}</p>
                  {entry.phone && <p className="text-xs text-gray-400">{entry.phone}</p>}
                  <p className="text-xs text-red-400 mt-0.5">{entry.reason}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Added {format(entry.addedAt, 'dd MMM yyyy')} by {entry.addedBy}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(entry.id)}
                  disabled={removingId === entry.id}
                  className="text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50 p-1 flex-shrink-0"
                  aria-label="Remove from blocklist"
                >
                  {removingId === entry.id ? (
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
