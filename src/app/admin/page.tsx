'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, isYesterday, startOfDay, endOfDay } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import VisitorDetailModal from '@/components/VisitorDetailModal'
import BlocklistPanel from '@/components/BlocklistPanel'
import { subscribeToVisitors, subscribeToBlocklist, checkOutVisitor, flagVisitor, getVisitorsByPhone } from '@/lib/firestore'
import type { Visitor, BlocklistEntry, VisitPurpose } from '@/types'

type StatusFilter = 'all' | 'checked-in' | 'checked-out'
type DateFilter = 'today' | 'yesterday' | 'all'

function exportCSV(visitors: Visitor[]) {
  const headers = ['Name', 'Phone', 'Purpose', 'Host', 'Apt/Floor', 'Vehicle', 'Check-in', 'Check-out', 'Status', 'Flagged', 'Notes', 'Registered By']
  const rows = visitors.map((v) => [
    v.name,
    v.phone,
    v.purpose,
    v.hostName ?? '',
    v.apartmentFloor ?? '',
    v.vehicleNumber ?? '',
    format(v.checkInTime, 'dd/MM/yyyy HH:mm'),
    v.checkOutTime ? format(v.checkOutTime, 'dd/MM/yyyy HH:mm') : '',
    v.status,
    v.flagged ? 'Yes' : 'No',
    v.notes ?? '',
    v.checkedInByName,
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `checkins-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminPage() {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()

  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([])
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  const [visitCountMap, setVisitCountMap] = useState<Record<string, number>>({})
  const [showBlocklist, setShowBlocklist] = useState(false)
  const [blocklistPrefill, setBlocklistPrefill] = useState<{ name: string; phone: string }>({ name: '', phone: '' })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [purposeFilter, setPurposeFilter] = useState<VisitPurpose | 'all'>('all')

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      router.replace(user ? '/checkin' : '/login')
    }
  }, [user, role, loading, router])

  useEffect(() => {
    if (!user || role !== 'admin') return
    const unsub1 = subscribeToVisitors(setVisitors)
    const unsub2 = subscribeToBlocklist(setBlocklist)
    return () => { unsub1(); unsub2() }
  }, [user, role])

  // Fetch visit counts when a visitor is selected
  useEffect(() => {
    if (!selectedVisitor) return
    const phone = selectedVisitor.phone
    if (visitCountMap[phone] !== undefined) return
    getVisitorsByPhone(phone).then((visits) => {
      setVisitCountMap((prev) => ({ ...prev, [phone]: visits.length }))
    })
  }, [selectedVisitor, visitCountMap])

  const filtered = useMemo(() => {
    return visitors.filter((v) => {
      if (search) {
        const q = search.toLowerCase()
        if (!v.name.toLowerCase().includes(q) && !v.phone.includes(q)) return false
      }
      if (statusFilter !== 'all' && v.status !== statusFilter) return false
      if (purposeFilter !== 'all' && v.purpose !== purposeFilter) return false
      if (dateFilter === 'today' && !isToday(v.checkInTime)) return false
      if (dateFilter === 'yesterday' && !isYesterday(v.checkInTime)) return false
      return true
    })
  }, [visitors, search, statusFilter, dateFilter, purposeFilter])

  const stats = useMemo(() => {
    const todayAll = visitors.filter((v) => isToday(v.checkInTime))
    return {
      todayTotal: todayAll.length,
      currentlyInside: todayAll.filter((v) => v.status === 'checked-in').length,
      checkedOutToday: todayAll.filter((v) => v.status === 'checked-out').length,
      flagged: visitors.filter((v) => v.flagged).length,
    }
  }, [visitors])

  async function handleCheckout(id: string) {
    await checkOutVisitor(id)
    if (selectedVisitor?.id === id) {
      setSelectedVisitor((v) => v ? { ...v, status: 'checked-out', checkOutTime: new Date() } : v)
    }
  }

  async function handleFlag(id: string, flagged: boolean) {
    await flagVisitor(id, flagged)
    if (selectedVisitor?.id === id) {
      setSelectedVisitor((v) => v ? { ...v, flagged } : v)
    }
  }

  function handleAddToBlocklist(visitor: Visitor) {
    setBlocklistPrefill({ name: visitor.name, phone: visitor.phone })
    setShowBlocklist(true)
  }

  function labelDate(d: Date): string {
    if (isToday(d)) return `Today ${format(d, 'HH:mm')}`
    if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
    return format(d, 'dd MMM, HH:mm')
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
      <header className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-sm">Admin Panel</span>
            <span className="text-xs text-gray-500 hidden sm:inline">· {user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setBlocklistPrefill({ name: '', phone: '' }); setShowBlocklist(true) }}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Blocklist {blocklist.length > 0 && `(${blocklist.length})`}
            </button>
            <button
              onClick={() => exportCSV(filtered)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => signOut().then(() => router.replace('/login'))}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Today's Visitors" value={stats.todayTotal} color="blue" />
          <StatCard label="Currently Inside" value={stats.currentlyInside} color="green" />
          <StatCard label="Checked Out" value={stats.checkedOutToday} color="gray" />
          <StatCard label="Flagged" value={stats.flagged} color="red" />
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone…"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
            />
          </div>

          {/* Filter row */}
          <div className="flex gap-2 flex-wrap">
            {/* Date */}
            {(['today', 'yesterday', 'all'] as DateFilter[]).map((d) => (
              <FilterChip key={d} label={d === 'all' ? 'All dates' : d.charAt(0).toUpperCase() + d.slice(1)} active={dateFilter === d} onClick={() => setDateFilter(d)} />
            ))}
            <div className="w-px bg-gray-700 self-stretch" />
            {/* Status */}
            {(['all', 'checked-in', 'checked-out'] as StatusFilter[]).map((s) => (
              <FilterChip key={s} label={s === 'all' ? 'Any status' : s === 'checked-in' ? 'Inside' : 'Left'} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
            ))}
            <div className="w-px bg-gray-700 self-stretch" />
            {/* Purpose */}
            {(['all', 'Delivery', 'Guest', 'Meeting', 'Maintenance', 'Other'] as Array<VisitPurpose | 'all'>).map((p) => (
              <FilterChip key={p} label={p === 'all' ? 'Any purpose' : p} active={purposeFilter === p} onClick={() => setPurposeFilter(p)} />
            ))}
          </div>

          <p className="text-xs text-gray-500">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Visitor table */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm">No visitors match your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filtered.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVisitor(v)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors text-left"
                >
                  {/* Photo */}
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 relative">
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
                    {v.flagged && (
                      <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-gray-900" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-white">{v.name}</span>
                      <PurposeBadge purpose={v.purpose} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{v.phone} {v.apartmentFloor ? `· ${v.apartmentFloor}` : ''}</p>
                  </div>

                  {/* Time + Status */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{labelDate(v.checkInTime)}</p>
                    <span className={`text-xs font-medium ${v.status === 'checked-in' ? 'text-green-400' : 'text-gray-500'}`}>
                      {v.status === 'checked-in' ? '● Inside' : '○ Left'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedVisitor && (
        <VisitorDetailModal
          visitor={selectedVisitor}
          visitCount={visitCountMap[selectedVisitor.phone] ?? 1}
          onClose={() => setSelectedVisitor(null)}
          onCheckout={handleCheckout}
          onFlag={handleFlag}
          onAddToBlocklist={handleAddToBlocklist}
        />
      )}
      {showBlocklist && (
        <BlocklistPanel
          entries={blocklist}
          prefillName={blocklistPrefill.name}
          prefillPhone={blocklistPrefill.phone}
          onClose={() => setShowBlocklist(false)}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'green' | 'gray' | 'red' }) {
  const colors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    gray: 'text-gray-400',
    red: 'text-red-400',
  }
  return (
    <div className="bg-gray-900 rounded-2xl px-4 py-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${colors[color]}`}>{value}</p>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  )
}

function PurposeBadge({ purpose }: { purpose: string }) {
  const colors: Record<string, string> = {
    Delivery: 'bg-yellow-900 text-yellow-300',
    Guest: 'bg-blue-900 text-blue-300',
    Meeting: 'bg-purple-900 text-purple-300',
    Maintenance: 'bg-orange-900 text-orange-300',
    Other: 'bg-gray-800 text-gray-400',
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${colors[purpose] ?? colors.Other}`}>
      {purpose}
    </span>
  )
}
