'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import CheckinForm from '@/components/CheckinForm'
import { subscribeToBlocklist, checkOutVisitor, getRecentVisitors } from '@/lib/firestore'
import type { BlocklistEntry, Visitor } from '@/types'

export default function CheckinPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([])
  const [recent, setRecent] = useState<Visitor[]>([])
  const [showForm, setShowForm] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToBlocklist(setBlocklist)
    return unsub
  }, [user])

  useEffect(() => {
    if (!user) return
    getRecentVisitors(10).then(setRecent)
  }, [user, successMsg])

  async function handleCheckout(visitorId: string) {
    setCheckingOut(visitorId)
    try {
      await checkOutVisitor(visitorId)
      setRecent((prev) =>
        prev.map((v) =>
          v.id === visitorId ? { ...v, status: 'checked-out', checkOutTime: new Date() } : v
        )
      )
    } finally {
      setCheckingOut(null)
    }
  }

  function handleSuccess() {
    setSuccessMsg('Visitor checked in successfully!')
    setShowForm(false)
    setTimeout(() => {
      setSuccessMsg('')
      setShowForm(true)
    }, 2500)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
            </svg>
          </div>
          <span className="font-bold text-sm">Gate Check-in</span>
        </div>
        <button
          onClick={() => signOut().then(() => router.replace('/login'))}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </header>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-6">
        {/* Success banner */}
        {successMsg && (
          <div className="bg-green-950 border border-green-700 text-green-300 rounded-xl px-4 py-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* New check-in form */}
        {showForm && (
          <section>
            <h2 className="text-lg font-bold mb-4">New Check-in</h2>
            <CheckinForm blocklist={blocklist} onSuccess={handleSuccess} />
          </section>
        )}

        {/* Recent check-ins */}
        {recent.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-gray-300 mb-3">Recent Check-ins</h2>
            <div className="space-y-2">
              {recent.map((v) => (
                <div
                  key={v.id}
                  className="bg-gray-900 rounded-xl p-3 flex items-center gap-3"
                >
                  {/* Photo */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                    {v.photoUrl && v.photoUrl !== '__pending__' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.photoUrl} alt={v.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{v.name}</p>
                    <p className="text-xs text-gray-400">{v.purpose} · {format(v.checkInTime, 'HH:mm')}</p>
                    {v.apartmentFloor && <p className="text-xs text-gray-500">{v.apartmentFloor}</p>}
                  </div>
                  {/* Status / Action */}
                  {v.status === 'checked-in' ? (
                    <button
                      onClick={() => handleCheckout(v.id)}
                      disabled={checkingOut === v.id}
                      className="text-xs bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0"
                    >
                      {checkingOut === v.id ? '…' : 'Check Out'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 flex-shrink-0">Out {v.checkOutTime ? format(v.checkOutTime, 'HH:mm') : ''}</span>
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
